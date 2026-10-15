import ExpoModulesCore
import HealthKit

private final class PressurePair {
  private let lock = NSLock()
  private var systolicSample: HKQuantitySample?
  private var diastolicSample: HKQuantitySample?
  func setSystolic(_ sample: HKQuantitySample?) { lock.lock(); systolicSample = sample; lock.unlock() }
  func setDiastolic(_ sample: HKQuantitySample?) { lock.lock(); diastolicSample = sample; lock.unlock() }
  var systolic: HKQuantitySample? { lock.lock(); defer { lock.unlock() }; return systolicSample }
  var diastolic: HKQuantitySample? { lock.lock(); defer { lock.unlock() }; return diastolicSample }
}

public class AppleHealthModule: Module {
  private let store = HKHealthStore()

  public func definition() -> ModuleDefinition {
    Name("AppleHealth")

    AsyncFunction("readLatestVitals") { (promise: Promise) in
      self.readLatestVitals(promise)
    }
  }

  private func readLatestVitals(_ promise: Promise) {
    guard HKHealthStore.isHealthDataAvailable() else {
      promise.resolve(["available": false, "samples": []])
      return
    }
    let readTypes = Set(Self.readTypes.compactMap { $0 })
    store.requestAuthorization(toShare: [], read: readTypes) { _, error in
      if let error {
        promise.reject("ERR_APPLE_HEALTH", error.localizedDescription)
        return
      }
      self.collectSamples(promise)
    }
  }

  private func collectSamples(_ promise: Promise) {
    let group = DispatchGroup()
    let lock = NSLock()
    var samples: [[String: Any]] = []
    let now = Date()
    let recent = Calendar.current.date(byAdding: .day, value: -30, to: now) ?? now
    let sleepStart = Calendar.current.date(byAdding: .hour, value: -36, to: now) ?? now

    func add(_ sample: [String: Any]?) {
      guard let sample else { return }
      lock.lock()
      samples.append(sample)
      lock.unlock()
    }

    func latestQuantity(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, metric: String, places: Int, scale: Double = 1) {
      guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { return }
      group.enter()
      let query = HKSampleQuery(
        sampleType: type,
        predicate: HKQuery.predicateForSamples(withStart: recent, end: now, options: .strictEndDate),
        limit: 1,
        sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
      ) { _, results, _ in
        if let sample = results?.first as? HKQuantitySample {
          let value = self.rounded(sample.quantity.doubleValue(for: unit) * scale, places: places)
          add(self.sample(metric: metric, value: value, unit: Self.units[metric], observedAt: sample.endDate, recordId: sample.uuid.uuidString, deviceName: self.deviceName(sample)))
        }
        group.leave()
      }
      store.execute(query)
    }

    latestQuantity(.heartRate, unit: HKUnit.count().unitDivided(by: .minute()), metric: "heart_rate", places: 0)
    latestQuantity(.respiratoryRate, unit: HKUnit.count().unitDivided(by: .minute()), metric: "respiratory_rate", places: 0)
    latestQuantity(.oxygenSaturation, unit: .percent(), metric: "oxygen_saturation", places: 0, scale: 100)
    latestQuantity(.bodyTemperature, unit: .degreeCelsius(), metric: "body_temperature", places: 1)
    latestQuantity(.bodyMass, unit: .gramUnit(with: .kilo), metric: "weight", places: 2)
    latestQuantity(.bloodGlucose, unit: HKUnit.gramUnit(with: .milli).unitDivided(by: .literUnit(with: .deci)), metric: "blood_glucose", places: 0)

    group.enter()
    readBloodPressure(since: recent, until: now) { add($0); group.leave() }
    group.enter()
    readDailySum(.stepCount, unit: .count(), metric: "steps", places: 0, now: now) { add($0); group.leave() }
    group.enter()
    readDailySum(.activeEnergyBurned, unit: .kilocalorie(), metric: "active_energy", places: 0, now: now) { add($0); group.leave() }
    group.enter()
    readSleep(since: sleepStart, until: now) { add($0); group.leave() }
    group.enter()
    readWorkout(since: recent, until: now) { add($0); group.leave() }

    group.notify(queue: .main) {
      promise.resolve(["available": true, "samples": samples])
    }
  }

  private func readBloodPressure(since: Date, until: Date, done: @escaping ([String: Any]?) -> Void) {
    guard
      let systolicType = HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic),
      let diastolicType = HKQuantityType.quantityType(forIdentifier: .bloodPressureDiastolic)
    else { done(nil); return }
    let predicate = HKQuery.predicateForSamples(withStart: since, end: until, options: .strictEndDate)
    let sort = [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
    let pair = PressurePair()
    let group = DispatchGroup()
    group.enter()
    store.execute(HKSampleQuery(sampleType: systolicType, predicate: predicate, limit: 1, sortDescriptors: sort) { _, results, _ in
      pair.setSystolic(results?.first as? HKQuantitySample)
      group.leave()
    })
    group.enter()
    store.execute(HKSampleQuery(sampleType: diastolicType, predicate: predicate, limit: 1, sortDescriptors: sort) { _, results, _ in
      pair.setDiastolic(results?.first as? HKQuantitySample)
      group.leave()
    })
    group.notify(queue: .main) {
      guard let systolic = pair.systolic, let diastolic = pair.diastolic else { done(nil); return }
      let gap = abs(systolic.endDate.timeIntervalSince(diastolic.endDate))
      guard gap <= 10 * 60 else { done(nil); return }
      let unit = HKUnit.millimeterOfMercury()
      done(self.sample(
        metric: "blood_pressure",
        value: self.rounded(systolic.quantity.doubleValue(for: unit), places: 0),
        secondaryValue: self.rounded(diastolic.quantity.doubleValue(for: unit), places: 0),
        unit: "mmHg",
        observedAt: max(systolic.endDate, diastolic.endDate),
        recordId: systolic.uuid.uuidString,
        deviceName: self.deviceName(systolic)
      ))
    }
  }

  private func readDailySum(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, metric: String, places: Int, now: Date, done: @escaping ([String: Any]?) -> Void) {
    guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { done(nil); return }
    let start = Calendar.current.startOfDay(for: now)
    let predicate = HKQuery.predicateForSamples(withStart: start, end: now, options: .strictStartDate)
    let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
      let value = self.rounded(result?.sumQuantity()?.doubleValue(for: unit) ?? 0, places: places)
      guard value > 0 else { done(nil); return }
      let day = Self.dayStamp(start)
      done(self.sample(metric: metric, value: value, unit: Self.units[metric], observedAt: start, recordId: "\(metric)-\(day)", deviceName: "Apple Health"))
    }
    store.execute(query)
  }

  private func readSleep(since: Date, until: Date, done: @escaping ([String: Any]?) -> Void) {
    guard let type = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else { done(nil); return }
    let predicate = HKQuery.predicateForSamples(withStart: since, end: until, options: .strictEndDate)
    let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, results, _ in
      let asleep = Self.asleepValues
      let intervals = (results as? [HKCategorySample] ?? [])
        .filter { asleep.contains($0.value) }
        .map { ($0.startDate, $0.endDate) }
        .sorted { $0.0 < $1.0 }
      var merged: [(Date, Date)] = []
      for interval in intervals {
        if let last = merged.last, interval.0 <= last.1 {
          merged[merged.count - 1].1 = max(last.1, interval.1)
        } else {
          merged.append(interval)
        }
      }
      let seconds = merged.reduce(0.0) { $0 + $1.1.timeIntervalSince($1.0) }
      let minutes = self.rounded(seconds / 60, places: 0)
      guard minutes > 0, let end = merged.map(\.1).max() else { done(nil); return }
      done(self.sample(metric: "sleep_duration", value: minutes, unit: "min", observedAt: end, recordId: "sleep-\(Self.timeStamp(end))", deviceName: "Apple Health"))
    }
    store.execute(query)
  }

  private func readWorkout(since: Date, until: Date, done: @escaping ([String: Any]?) -> Void) {
    let predicate = HKQuery.predicateForSamples(withStart: since, end: until, options: .strictEndDate)
    let query = HKSampleQuery(
      sampleType: HKWorkoutType.workoutType(),
      predicate: predicate,
      limit: 1,
      sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
    ) { _, results, _ in
      guard let workout = results?.first as? HKWorkout else { done(nil); return }
      let minutes = self.rounded(workout.duration / 60, places: 0)
      guard minutes > 0 else { done(nil); return }
      done(self.sample(metric: "workout_duration", value: minutes, unit: "min", observedAt: workout.endDate, recordId: workout.uuid.uuidString, deviceName: workout.device?.name ?? workout.sourceRevision.source.name))
    }
    store.execute(query)
  }

  private func sample(metric: String, value: Double, secondaryValue: Double? = nil, unit: String?, observedAt: Date, recordId: String, deviceName: String?) -> [String: Any]? {
    guard value.isFinite, let unit else { return nil }
    var item: [String: Any] = [
      "metric": metric,
      "value": value,
      "unit": unit,
      "observedAt": Self.timeStamp(observedAt),
      "sourceRecordId": String(recordId.prefix(240)),
    ]
    if let secondaryValue, secondaryValue.isFinite {
      item["secondaryValue"] = secondaryValue
    }
    if let deviceName {
      let name = deviceName.trimmingCharacters(in: .whitespacesAndNewlines)
      if !name.isEmpty { item["deviceName"] = String(name.prefix(160)) }
    }
    return item
  }

  private func deviceName(_ sample: HKQuantitySample) -> String? {
    sample.device?.name ?? sample.sourceRevision.source.name
  }

  private func rounded(_ value: Double, places: Int) -> Double {
    let scale = pow(10.0, Double(places))
    return (value * scale).rounded() / scale
  }

  private static let units = [
    "heart_rate": "bpm",
    "respiratory_rate": "breaths/min",
    "oxygen_saturation": "%",
    "body_temperature": "Cel",
    "weight": "kg",
    "blood_glucose": "mg/dL",
    "steps": "count",
    "active_energy": "kcal",
  ]

  private static var asleepValues: Set<Int> {
    if #available(iOS 16.0, *) {
      return [
        HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
        HKCategoryValueSleepAnalysis.asleepCore.rawValue,
        HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
        HKCategoryValueSleepAnalysis.asleepREM.rawValue,
      ]
    }
    return [HKCategoryValueSleepAnalysis.asleep.rawValue]
  }

  private static var readTypes: [HKObjectType?] {
    [
      HKQuantityType.quantityType(forIdentifier: .heartRate),
      HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic),
      HKQuantityType.quantityType(forIdentifier: .bloodPressureDiastolic),
      HKQuantityType.quantityType(forIdentifier: .respiratoryRate),
      HKQuantityType.quantityType(forIdentifier: .oxygenSaturation),
      HKQuantityType.quantityType(forIdentifier: .bodyTemperature),
      HKQuantityType.quantityType(forIdentifier: .bodyMass),
      HKQuantityType.quantityType(forIdentifier: .bloodGlucose),
      HKQuantityType.quantityType(forIdentifier: .stepCount),
      HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
      HKCategoryType.categoryType(forIdentifier: .sleepAnalysis),
      HKWorkoutType.workoutType(),
    ]
  }
}

private extension AppleHealthModule {
  static func timeStamp(_ date: Date) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    return formatter.string(from: date)
  }

  static func dayStamp(_ date: Date) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withFullDate]
    return formatter.string(from: date)
  }
}

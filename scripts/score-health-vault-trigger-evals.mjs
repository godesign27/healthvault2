import fs from "node:fs";
import path from "node:path";

const evalPath = process.argv[2];
const trialsRoot = process.argv[3];
if (!evalPath || !trialsRoot) throw new Error("Pass trigger eval path and trials directory.");

const expected = JSON.parse(fs.readFileSync(evalPath, "utf8"));
const configurations = ["current", "candidate"];
const summary = Object.fromEntries(configurations.map((name) => [name, { correct: 0, total: 0, false_positives: 0, false_negatives: 0 }]));
const trials = [];

for (const trialNumber of [1, 2, 3]) {
  const results = JSON.parse(fs.readFileSync(path.join(trialsRoot, `trial-${trialNumber}`, "results.json"), "utf8"));
  const scored = { trial: trialNumber };
  for (const configuration of configurations) {
    const rows = results[configuration];
    if (!Array.isArray(rows) || rows.length !== expected.length) throw new Error(`Invalid ${configuration} trial ${trialNumber}`);
    let correct = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    rows.forEach((row, index) => {
      const target = expected[index].should_trigger;
      if (row.trigger === target) correct += 1;
      else if (row.trigger) falsePositives += 1;
      else falseNegatives += 1;
    });
    scored[configuration] = { correct, total: expected.length, accuracy: correct / expected.length, false_positives: falsePositives, false_negatives: falseNegatives };
    summary[configuration].correct += correct;
    summary[configuration].total += expected.length;
    summary[configuration].false_positives += falsePositives;
    summary[configuration].false_negatives += falseNegatives;
  }
  trials.push(scored);
}

for (const configuration of configurations) summary[configuration].accuracy = summary[configuration].correct / summary[configuration].total;
const report = { trials, summary, selected: summary.candidate.accuracy >= summary.current.accuracy ? "candidate" : "current" };
fs.writeFileSync(path.join(trialsRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));

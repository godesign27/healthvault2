Pod::Spec.new do |s|
  s.name           = 'AppleHealth'
  s.version        = '1.0.0'
  s.summary        = 'Reads Apple Health measurements for Health Vault review'
  s.description    = s.summary
  s.license        = { :type => 'UNLICENSED' }
  s.author         = 'Health Vault'
  s.homepage       = 'https://healthvault.me'
  s.platforms      = { :ios => '15.0' }
  s.swift_version  = '5.4'
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'HealthKit'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  s.source_files = '**/*.{h,m,swift}'
end

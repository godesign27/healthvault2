/**
 * react-native-css-interop@0.2.3 references react-native-worklets/plugin (Reanimated 4+).
 * Expo SDK 51 / RN 0.74 uses Reanimated 3 — that package is not installed. Strip the plugin
 * from every copy of react-native-css-interop after npm install.
 *
 * NativeWind 4 can npm-install optional peer Reanimated 4 + worklets under
 * node_modules/nativewind/node_modules/, which pulls @react-native/metro-config@0.85 and
 * metro@0.84 — incompatible with Expo SDK 51. The app uses Reanimated 3 from the workspace;
 * remove those stray installs after every npm install.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function walkDir(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    if (e.name === 'react-native-css-interop') {
      const babelPath = path.join(p, 'babel.js');
      if (fs.existsSync(babelPath)) acc.push(babelPath);
      continue;
    }
    walkDir(p, acc);
  }
}

const acc = [];
for (const nm of [
  path.join(root, 'node_modules'),
  path.join(root, 'apps', 'mobile', 'node_modules'),
]) {
  walkDir(nm, acc);
}

const unique = [...new Set(acc)];
const needle = '"react-native-worklets/plugin"';
let patched = 0;
for (const file of unique) {
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes(needle)) continue;
  s = s.replace(
    /\s*\/\/ Use this plugin in reanimated 4 and later\s*\n\s*"react-native-worklets\/plugin",/,
    ''
  );
  fs.writeFileSync(file, s);
  patched += 1;
}

if (patched) {
  console.log(`[patch-react-native-css-interop] Patched ${patched} babel.js file(s).`);
}

const nativewindNested = path.join(root, 'node_modules', 'nativewind', 'node_modules');
const pruneRel = ['react-native-reanimated', 'react-native-worklets', '@react-native'];
let pruned = 0;
for (const rel of pruneRel) {
  const target = path.join(nativewindNested, rel);
  try {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      pruned += 1;
    }
  } catch (e) {
    console.warn(`[patch-react-native-css-interop] Could not remove ${rel}:`, e.message);
  }
}
if (pruned) {
  console.log(
    `[patch-react-native-css-interop] Pruned ${pruned} stray nativewind/node_modules entr(y/ies) (Reanimated 4 / metro 0.84 peer tree).`
  );
}

const orphanRnMetroCfg = path.join(root, 'node_modules', '@react-native', 'metro-config', 'package.json');
try {
  if (fs.existsSync(orphanRnMetroCfg)) {
    const { version } = JSON.parse(fs.readFileSync(orphanRnMetroCfg, 'utf8'));
    const [maj, min] = version.split('.').map(Number);
    if (maj === 0 && min >= 84) {
      fs.rmSync(path.join(root, 'node_modules', '@react-native', 'metro-config'), {
        recursive: true,
        force: true,
      });
      console.log(
        `[patch-react-native-css-interop] Removed extraneous @react-native/metro-config@${version} (SDK 51 uses metro 0.80.x).`
      );
    }
  }
} catch (e) {
  console.warn('[patch-react-native-css-interop] metro-config cleanup:', e.message);
}

// expo-dev-menu: Swift cannot see TARGET_IPHONE_SIMULATOR (breaks Xcode 16+ builds).
const devMenuSwiftRel = path.join('node_modules', 'expo-dev-menu', 'ios', 'DevMenuViewController.swift');
const devMenuSwiftPaths = [
  path.join(root, devMenuSwiftRel),
  path.join(root, 'apps', 'mobile', devMenuSwiftRel),
];
const devMenuNeedle = 'let isSimulator = TARGET_IPHONE_SIMULATOR > 0';
const devMenuReplacement = `#if targetEnvironment(simulator)
    let isSimulator = true
    #else
    let isSimulator = false
    #endif`;
for (const devMenuSwift of devMenuSwiftPaths) {
  try {
    if (!fs.existsSync(devMenuSwift)) continue;
    let s = fs.readFileSync(devMenuSwift, 'utf8');
    if (!s.includes(devMenuNeedle)) continue;
    s = s.replace(devMenuNeedle, devMenuReplacement);
    fs.writeFileSync(devMenuSwift, s);
    console.log(
      `[patch-react-native-css-interop] Patched expo-dev-menu DevMenuViewController.swift (${path.relative(root, devMenuSwift)}).`
    );
  } catch (e) {
    console.warn('[patch-react-native-css-interop] expo-dev-menu Swift patch:', e.message);
  }
}

const expoDevMenuPodspec = path.join(root, 'node_modules', 'expo-dev-menu', 'expo-dev-menu.podspec');
try {
  if (fs.existsSync(expoDevMenuPodspec)) {
    let spec = fs.readFileSync(expoDevMenuPodspec, 'utf8');
    const podspecNeedle = `  s.subspec 'ReactNativeCompatibles' do |ss|
    if reactNativeTargetVersion >= 74
      ss.source_files = 'ios/ReactNativeCompatibles/ReactNative/**/*'
    end
    ss.compiler_flags = compiler_flags`;
    const podspecReplacement = `  s.subspec 'ReactNativeCompatibles' do |ss|
    ss.source_files = 'ios/ReactNativeCompatibles/ReactNative/**/*'
    ss.compiler_flags = compiler_flags`;
    if (spec.includes('if reactNativeTargetVersion >= 74')) {
      spec = spec.replace(podspecNeedle, podspecReplacement);
      fs.writeFileSync(expoDevMenuPodspec, spec);
      console.log(
        '[patch-react-native-css-interop] Patched expo-dev-menu.podspec (ReactNativeCompatibles source_files unconditional).'
      );
    }
  }
} catch (e) {
  console.warn('[patch-react-native-css-interop] expo-dev-menu podspec patch:', e.message);
}

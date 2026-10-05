// Expo SDK 51 imports tar through a default-export wrapper; tar 7 exposes named exports.
// Fail closed when Expo changes so an SDK upgrade triggers a fresh compatibility review.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const req = createRequire(path.join(root, 'apps/mobile/package.json'));
const expoRequire = createRequire(req.resolve('expo/package.json'));
const cliRoot = path.dirname(expoRequire.resolve('@expo/cli/package.json'));
const version = JSON.parse(fs.readFileSync(path.join(cliRoot, 'package.json'))).version;
if (version !== '0.18.31') throw Error(`Review tar compatibility for Expo CLI ${version}`);
const before = '_interopRequireDefault(require("tar"))';
const after = '{ default: require("tar") }';
for (const name of ['tar.js', 'npm.js']) {
  const file = path.join(cliRoot, 'build/src/utils', name);
  const source = fs.readFileSync(file, 'utf8');
  if (source.includes(after)) continue;
  if (source.split(before).length !== 2) throw Error(`Unexpected Expo tar import in ${name}`);
  fs.writeFileSync(file, source.replace(before, after));
}
console.log('Expo CLI tar named-export compatibility applied.');

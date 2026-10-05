// Metro 0.80 expects the image-size 1 callable export; v2 uses a named export.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../apps/mobile/package.json'));
const root = path.dirname(req.resolve('metro/package.json'));
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version;
if (version !== '0.80.12') throw Error(`Review image-size compatibility for Metro ${version}`);
const file = path.join(root, 'src/Assets.js');
const before = 'const getImageSize = require("image-size");';
const previous = 'const { imageSize: getImageSize } = require("image-size");';
const after = 'const getImageSize = input => require("image-size").imageSize(typeof input === "string" ? fs.readFileSync(input) : input);';
const source = fs.readFileSync(file, 'utf8').replace(previous, before);
if (!source.includes(after)) {
  if (source.split(before).length !== 2) throw Error('Unexpected Metro image-size import');
  fs.writeFileSync(file, source.replace(before, after));
}
console.log('Metro image-size named-export compatibility applied.');

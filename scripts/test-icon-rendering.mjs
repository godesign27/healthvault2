import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url), m = {exports: {}};
const code = ts.transpileModule(fs.readFileSync('src/components/ui/Icon.tsx', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
}).outputText;
new Function('require', 'module', 'exports', code)(require, m, m.exports);
const {renderToStaticMarkup} = require('react-dom/server');
assert.match(renderToStaticMarkup(m.exports.Icon({name: 'Heart'})), /<svg/);
for (const name of ['missing', 'createLucideIcon', '__proto__', 'toString']) {
  assert.equal(m.exports.Icon({name}), null);
}
console.log('PASS dynamic icon rendering and unknown/non-icon rejection');

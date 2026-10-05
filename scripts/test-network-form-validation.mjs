import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const compile = source => ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
const schemas = {exports: {}};
new Function('require', 'exports', compile(fs.readFileSync('src/schemas/network.ts', 'utf8')))(require, schemas.exports);
for (const kind of ['Provider', 'Pharmacy']) {
  const file = `src/components/network/Add${kind}Drawer.tsx`;
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'handleSubmit') handler = node.initializer.getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(handler);
  for (const name of ['', '   ', '  Synthetic name  ']) {
    let errors, saved, notice;
    const bindings = {
      formData: {name},
      [`Add${kind}InputZ`]: schemas.exports[`Add${kind}InputZ`],
      setErrors: value => errors = value,
      setSaving() {},
      [`add${kind}`]: async value => saved = value,
      setToast: value => notice = value,
      setTimeout() {},
    };
    const m = {exports: {}};
    new Function(...Object.keys(bindings), 'exports', compile(`export const submit = ${handler};`))(...Object.values(bindings), m.exports);
    await m.exports.submit();
    if (name.trim()) {
      assert.equal(saved.name, name.trim());
      assert.equal(notice.type, 'success');
    } else {
      assert.ok(errors.name);
      assert.equal(saved, undefined, 'Invalid input must not write');
      assert.equal(notice, undefined, 'Invalid input must not claim success');
    }
  }
}
console.log('PASS real network submit handlers reject empty/whitespace names without writes and save trimmed valid names');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = ts.createSourceFile('DashboardPage.tsx', fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const elements = [];
function visit(node) { if (ts.isJsxElement(node)) elements.push(node); ts.forEachChild(node, visit); }
visit(source);
const attribute = (node, name) => node.openingElement.attributes.properties.find(a => a.name?.getText(source) === name)?.initializer?.text;
const main = elements.find(n => n.openingElement.tagName.getText(source) === 'main' && attribute(n, 'data-steel-chrome') === 'main');
assert.ok(main);
const shell = main.parent;
assert.ok(ts.isJsxElement(shell));
const header = shell.children.find(n => ts.isJsxElement(n) && attribute(n, 'className')?.includes('lg:hidden'));
assert.ok(header, 'Top bar must be a sibling before the scrolling main, not an overlay inside it');
assert.ok(shell.children.indexOf(header) < shell.children.indexOf(main));
for (const token of ['flex-col', 'lg:flex-row', 'min-h-0']) assert.ok(attribute(shell, 'className').split(' ').includes(token));
assert.ok(attribute(header, 'className').includes('shrink-0'));
assert.ok(!attribute(header, 'className').split(' ').includes('fixed'));
assert.ok(attribute(main, 'className').includes('overflow-y-auto'));
assert.ok(attribute(main, 'className').includes('min-h-0'));
for (const name of ['DashboardPage','MedicalFormsPage','MedicalProfilePage','NetworkPage','HealthRecordsPage','WellnessPage','VitalsPage','InsurancePage']) {
  assert.ok(!fs.readFileSync(`src/pages/${name}.tsx`, 'utf8').includes('pt-20'), `${name} must not add its own top-bar clearance`);
}
console.log('PASS shared header reserves flow space outside scrolling pages; page-specific header offsets removed');

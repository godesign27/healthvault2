import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {renderToStaticMarkup} = require('react-dom/server');
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;
  const m = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => name.startsWith('.')
    ? load(['.ts', '.tsx'].map(ext => path.resolve(path.dirname(file), name + ext)).find(candidate => fs.existsSync(candidate))) : require(name), m, m.exports);
  return m.exports;
}
const {AccordionItem} = load('src/components/ui/Accordion.tsx');
let toggles = 0;
const props = {title: 'Review', isExpanded: true, children: 'Saved details', onToggle: () => toggles++};
assert.match(renderToStaticMarkup(AccordionItem(props)), /Saved details/);
assert.doesNotMatch(renderToStaticMarkup(AccordionItem({...props, isExpanded: false})), /Saved details/);
assert.match(renderToStaticMarkup(AccordionItem({...props, content: 'Explicit content'})), /Explicit content/);
const target = {};
function keyEvent(key, nested = false) {return {key, target: nested ? {} : target, currentTarget: target, preventDefault() {}};}
const header = AccordionItem(props).props.children[0];
header.props.onKeyDown(keyEvent(' '));
header.props.onKeyDown(keyEvent('Enter'));
header.props.onKeyDown(keyEvent('Enter', true));
assert.equal(toggles, 2, 'Nested controls must not toggle their parent');
AccordionItem({...props, state: 'disabled'}).props.children[0].props.onKeyDown(keyEvent(' '));
assert.equal(toggles, 2);
const {SegmentedControl} = load('src/components/ui/SegmentedControl.tsx');
const markup = renderToStaticMarkup(SegmentedControl({options: ['Day', 'Week', 'Month'], value: 'Week'}));
assert.equal((markup.match(/aria-pressed="true"/g) || []).length, 1);
assert.equal((markup.match(/aria-pressed="false"/g) || []).length, 2);
const {WizardStep} = load('src/components/ui/wizard_process_flow.tsx');
const wizard = renderToStaticMarkup(WizardStep({label: 'Review', subtext: 'Check your entries', isActive: true}));
assert.match(wizard, /Check your entries/);
assert.match(wizard, /aria-current="step"/);
assert.doesNotMatch(renderToStaticMarkup(WizardStep({label: 'Done', isCompleted: true})), /background-color:indigo/);
console.log('PASS accordion body/state/keyboard, segmented selection semantics and wizard description/current-step');

const {SegmentedControlPage} = load('src/pages/SegmentedControlPage.tsx');
const gallery = renderToStaticMarkup(SegmentedControlPage());
assert.doesNotMatch(gallery, />Label<\/button>/);
assert.equal((gallery.match(/aria-pressed="true"/g) || []).length, 8, 'Every selected example must select exactly one existing option');
console.log('PASS gallery selected examples use distinct, existing options');

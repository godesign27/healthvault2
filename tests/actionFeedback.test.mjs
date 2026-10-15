import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/hooks/useActionFeedback.tsx', import.meta.url), 'utf8');
function mountFeedback() {
  let index = 0;
  const slots = [], cleanups = [];
  const jsx = (type, props) => ({ type, props });
  const react = {
    useState(initial) { const slot = index++; if (!(slot in slots)) slots[slot] = initial; return [slots[slot], (value) => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }]; },
    useRef(initial) { const slot = index++; return slots[slot] ??= { current: initial }; },
    useCallback: (callback) => callback,
    useEffect(callback) { cleanups.push(callback()); },
  };
  const module = { exports: {} };
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
  vm.runInNewContext(outputText, { module, exports: module.exports, document: { body: {} }, require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === 'react-dom') return { createPortal: (child) => child };
    if (name.endsWith('/Toast')) return { Toast: 'Toast' };
    if (name.endsWith('/Dialog')) return { Dialog: 'Dialog' };
    throw new Error(name);
  } });
  const render = () => { index = 0; return module.exports.useActionFeedback(); };
  const dialog = () => render().feedback.props.children.find((item) => item?.type === 'Dialog');
  const answer = (confirmed) => dialog().props.footerContent.props.children[confirmed ? 1 : 0].props.onClick();
  return { render, dialog, answer, unmount: () => cleanups.forEach((cleanup) => cleanup?.()) };
}

test('Cancel closes the dialog and performs no mutation', async () => {
  const view = mountFeedback(); let writes = 0;
  const action = view.render().runConfirmed('Remove synthetic item?', async () => { writes++; });
  assert.equal(view.dialog().props.isOpen, true); assert.equal(writes, 0);
  view.answer(false); await action;
  assert.equal(writes, 0); assert.equal(view.dialog().props.isOpen, false);
});

test('Confirm writes once and repeat requests stay blocked until completion', async () => {
  const view = mountFeedback(); let writes = 0, finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const action = view.render().runConfirmed('Remove?', async () => { writes++; await pending; });
  await view.render().runConfirmed('Duplicate while asking?', async () => { writes++; });
  view.answer(true); await Promise.resolve(); assert.equal(writes, 1);
  await view.render().runConfirmed('Duplicate while saving?', async () => { writes++; });
  assert.equal(writes, 1); finish(); await action;
  const next = view.render().runConfirmed('Next action?', async () => { writes++; });
  view.answer(true); await next; assert.equal(writes, 2);
});

test('Rejected action releases the confirmation lock', async () => {
  const view = mountFeedback();
  const action = view.render().runConfirmed('Remove?', async () => { throw new Error('offline'); });
  view.answer(true); await assert.rejects(action, /offline/);
  let writes = 0;
  const retry = view.render().runConfirmed('Retry?', async () => { writes++; });
  view.answer(true); await retry; assert.equal(writes, 1);
});

test('Unmount cancels pending confirmation without mutation', async () => {
  const view = mountFeedback(); let writes = 0;
  const action = view.render().runConfirmed('Remove?', async () => { writes++; });
  view.unmount(); await action; assert.equal(writes, 0);
});

test('Result renders the existing Toast in a dismissible live region', () => {
  const view = mountFeedback(); view.render().notify('Unable to save.', 'error');
  const notice = view.render().feedback.props.children[0];
  assert.equal(notice.props.role, 'alert');
  assert.equal(notice.props.children.type, 'Toast');
  assert.equal(notice.props.children.props.message, 'Unable to save.');
  notice.props.children.props.onClose();
  assert.equal(view.render().feedback.props.children[0], null);
});

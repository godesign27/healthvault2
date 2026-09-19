import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { DIET_CONFIRMATION_WIDGET_HTML } from './diet-confirmation-widget.ts';
import { previewDietLog } from './wellness.ts';

const preview = { preview: { entries: [{ mealType: 'lunch', items: [{ name: 'Test meal' }] }] } };
const success = { structuredContent: { confirmationState: 'confirmed', wellness: { diet: { loggedEntries: 1 } } } };
function host(callTool?: any) {
  const listeners = new Map();
  const elements = new Map();
  const sent: any[] = [];
  let html = '';
  let renders = 0;
  const app = { get innerHTML() { return html; }, set innerHTML(value) {
    html = value; renders++;
    elements.clear();
    for (const [, id] of value.matchAll(/id="([^"]+)"/g)) {
      const element: any = { innerHTML: '', addEventListener: (name, callback) => element[name] = callback };
      elements.set(id, element);
    }
  } };
  const parent = { postMessage: (message) => sent.push(message) };
  const window = { parent, openai: callTool ? { toolOutput: preview, callTool } : undefined, addEventListener: (name, callback) => listeners.set(name, callback) };
  vm.runInNewContext(DIET_CONFIRMATION_WIDGET_HTML.match(/<script>([\s\S]*?)<\/script>/)![1], {
    window, document: { getElementById: (id) => id === 'app' ? app : elements.get(id) }, setTimeout, clearTimeout,
  });
  const message = (data, source = parent) => listeners.get('message')({ source, data: { jsonrpc: '2.0', ...data } });
  return { app, elements, sent, message, renders: () => renders, globals: (globals) => listeners.get('openai:set_globals')({ detail: { globals } }) };
}

test('legacy click saves exact preview once and incidental updates preserve the button', async () => {
  const calls: any[] = [];
  let resolve;
  const h = host((...args) => { calls.push(args); return new Promise(r => resolve = r); });
  const button = h.elements.get('confirm');
  h.globals({ theme: 'dark' });
  h.globals({ toolOutput: preview });
  assert.equal(h.elements.get('confirm'), button);
  assert.equal(calls.length, 0);
  const save = button.click();
  await button.click();
  h.globals({ toolOutput: preview });
  assert.equal(calls.length, 1);
  assert.equal(JSON.stringify(calls[0]), JSON.stringify(['log_diet_entries', { entries: preview.preview.entries, confirmed: true }]));
  resolve(success); await save;
  h.globals({ toolOutput: preview });
  assert.match(h.app.innerHTML, /Diet log updated/);
});

test('standard bridge initializes and completes a button save without window.openai', async () => {
  const h = host();
  h.message({ id: 'diet-init', result: {} });
  h.message({ method: 'ui/notifications/tool-result', params: { structuredContent: preview } }, {});
  assert.equal(h.elements.has('confirm'), false);
  h.message({ method: 'ui/notifications/tool-result', params: { structuredContent: preview } });
  const save = h.elements.get('confirm').click();
  assert.equal(h.sent.at(-1).method, 'tools/call');
  h.message({ id: 'diet-save', result: success });
  await save;
  assert.match(h.app.innerHTML, /Diet log updated/);
});

test('ambiguous save failure is visible and cannot dispatch duplicate writes', async () => {
  let calls = 0;
  const h = host(async () => { calls++; return { isError: true, content: [{ type: 'text', text: 'Connection lost' }] }; });
  const button = h.elements.get('confirm');
  await button.click(); await button.click();
  assert.equal(calls, 1);
  assert.equal(button.disabled, true);
  assert.match(h.elements.get('error').innerHTML, /Connection lost.*check whether these entries were saved/);
  assert.doesNotMatch(h.app.innerHTML, /Diet log updated/);
});

test('unavailable bridge permits retry without dispatching a write', async () => {
  const h = host();
  h.globals({ toolOutput: preview });
  const button = h.elements.get('confirm');
  await button.click();
  assert.equal(button.disabled, false);
  assert.match(h.elements.get('error').innerHTML, /connection is not ready/);
  assert.equal(h.sent.some(m => m.method === 'tools/call'), false);
});

test('real server previews with null fields become valid save inputs in both bridges', async () => {
  const inputs = [
    { mealType: 'breakfast' as const, consumedAt: '2026-09-19T13:00:00Z', items: [{ name: 'Test eggs', amount: '3' }] },
    { mealType: 'drink' as const, consumedAt: '2026-09-19T13:00:00Z', items: [{ name: 'Test coffee' }], waterMl: 0 },
  ];
  const actualPreview = { preview: { entries: inputs.map(previewDietLog) } };
  assert.equal(actualPreview.preview.entries[0].waterMl, null);
  assert.equal(actualPreview.preview.entries[0].items[0].notes, null);
  for (const legacy of [true, false]) {
    let received;
    const h = host(legacy ? async (_name, args) => { received = args; return success; } : undefined);
    h.globals({ toolOutput: actualPreview });
    h.message({ id: 'diet-init', result: {} });
    const save = h.elements.get('confirm').click();
    if (!legacy) {
      received = h.sent.at(-1).params.arguments;
      h.message({ id: 'diet-save', result: success });
    }
    await save;
    assert.deepEqual(JSON.parse(JSON.stringify(received)), { entries: inputs, confirmed: true });
    assert.match(h.app.innerHTML, /Diet log updated/);
  }
});

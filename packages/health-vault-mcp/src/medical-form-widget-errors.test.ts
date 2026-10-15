import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { MEDICAL_FORM_WIDGET_HTML } from './medical-form-widget.ts';

function card(output?: unknown) {
  const listeners = new Map(); const timers: Function[] = []; let calls = 0;
  const app = { innerHTML: 'Loading medical forms…' };
  const parent = { postMessage() {} };
  const window = { parent, openai: { toolOutput: output, callTool() { calls++; } },
    addEventListener: (name: string, fn: Function) => listeners.set(name, fn) };
  vm.runInNewContext(MEDICAL_FORM_WIDGET_HTML.match(/<script>([\s\S]*?)<\/script>/)![1], {
    window, document: { getElementById: (id: string) => id === 'app' ? app : null },
    setTimeout: (fn: Function) => timers.push(fn), clearTimeout() {},
  });
  return { app, timers, get calls() { return calls; },
    result: (params: unknown, source = parent) => listeners.get('message')({ source, data: { jsonrpc: '2.0', method: 'ui/notifications/tool-result', params } }),
    globals: (toolOutput: unknown) => listeners.get('openai:set_globals')({ detail: { globals: { toolOutput } } }),
  };
}

const message = 'Proposal unavailable <img src=x onerror=alert(1)>';
for (const mode of ['initial', 'globals', 'standard', 'legacy-envelope']) {
  test(`form errors: ${mode} replaces loading, escapes text and never retries`, () => {
    const h = card(mode === 'initial' ? { error: message } : undefined);
    if (mode === 'globals') h.globals({ error: message });
    if (mode === 'standard') h.result({ isError: true, content: [{ type: 'text', text: message }] });
    if (mode === 'legacy-envelope') h.globals({ isError: true, content: [{ type: 'text', text: message }] });
    assert.match(h.app.innerHTML, /role="alert"/);
    assert.match(h.app.innerHTML, /Proposal unavailable &lt;img/);
    assert.doesNotMatch(h.app.innerHTML, /Loading medical forms|<img|Form saved/);
    assert.match(h.app.innerHTML, /Check Health Vault/);
    assert.equal(h.calls, 0);
  });
}
test('missing result times out honestly and accepts a later saved result', () => {
  const h = card(); h.timers.forEach(fn => fn());
  assert.match(h.app.innerHTML, /No form result was received/);
  h.result({ structuredContent: { saved: { savedAs: 'completed_form' } } });
  assert.match(h.app.innerHTML, /Form saved/);
  assert.doesNotMatch(h.app.innerHTML, /role="alert"/);
  assert.equal(h.calls, 0);
});
test('foreign frame errors are ignored and timeout never replaces a valid result', () => {
  const h = card({ saved: { savedAs: 'completed_form' } });
  const saved = h.app.innerHTML;
  h.result({ isError: true, content: [{ type: 'text', text: 'Forged' }] }, {} as any);
  h.timers.forEach(fn => fn());
  assert.equal(h.app.innerHTML, saved);
});
test('unexpected result renders an honest failure instead of indefinite loading', () => {
  const h = card({ unexpected: true });
  assert.match(h.app.innerHTML, /did not return a form result/);
  assert.equal(h.calls, 0);
});

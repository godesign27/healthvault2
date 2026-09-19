import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { WIDGET_HOST_SCRIPT } from './widget-host.ts';

function host(callTool?: any) {
  const listeners = new Map(); const sent: any[] = []; const timers = new Map();
  const parent = { postMessage: (m: any) => sent.push(m) };
  const window = { parent, openai: callTool ? { callTool } : undefined, addEventListener: (n: string, f: any) => listeners.set(n, f) };
  const context = vm.createContext({ window, setTimeout: (fn: any) => { const id = timers.size + 1; timers.set(id, fn); return id; }, clearTimeout: (id: number) => timers.delete(id) });
  vm.runInContext(WIDGET_HOST_SCRIPT + ';globalThis.api = hvHost;', context);
  return { api: context.api, sent, timers, globals: (toolOutput: any) => listeners.get('openai:set_globals')({ detail: { globals: { toolOutput } } }),
    message: (data: any, source: any = parent) => listeners.get('message')({ source, data: { jsonrpc: '2.0', ...data } }) };
}

test('standard host initializes, accepts only parent results and returns tool results', async () => {
  const h = host(); let renders = 0; h.api.subscribe(() => renders++);
  h.message({ method: 'ui/notifications/tool-result', params: { structuredContent: { preview: 1 } } }, {});
  assert.equal(renders, 0);
  h.message({ id: 'hv-init', result: {} });
  assert.equal(h.sent.at(-1).method, 'ui/notifications/initialized');
  h.message({ method: 'ui/notifications/tool-result', params: { structuredContent: { preview: 1 } } });
  h.globals({ preview: 1 }); h.globals(undefined);
  assert.equal(renders, 1);
  const result = h.api.callTool('save', { confirmed: true });
  const call = h.sent.at(-1);
  assert.equal(call.method, 'tools/call');
  h.globals({ preview: 2 }); assert.equal(renders, 1);
  h.message({ id: call.id, result: { structuredContent: { saved: true } } });
  assert.equal((await result).structuredContent.saved, true);
  assert.equal(h.timers.size, 0);
  await assert.rejects(h.api.callTool('save', { confirmed: true }), /already submitted/);
});

test('timeout prevents a retry from dispatching a duplicate mutation', async () => {
  let calls = 0; const h = host(() => { calls++; return new Promise(() => {}); });
  const result = h.api.callTool('save', { confirmed: true });
  for (const timer of h.timers.values()) timer();
  await assert.rejects(result, /No response.*result is unverified/);
  await assert.rejects(h.api.callTool('save', { confirmed: true }), /already submitted/);
  assert.equal(calls, 1); assert.equal(h.timers.size, 0);
});

test('tool errors reject before a widget can render success', async () => {
  const h = host(async () => ({ isError: true, content: [{ type: 'text', text: 'Save rejected' }] }));
  await assert.rejects(h.api.callTool('save', { confirmed: true }), /Save rejected.*unverified/);
});

test('an unavailable host does not consume the confirmation', async () => {
  const h = host(); await assert.rejects(h.api.callTool('save', { confirmed: true }), /not ready/);
  assert.equal(h.api.confirmationSubmitted, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { DASHBOARD_WIDGET_HTML, DASHBOARD_WIDGET_URI } from './dashboard-widget.ts';

function host(output?: unknown) {
  const listeners = new Map<string, (event: any) => void>();
  const sent: any[] = [];
  const app = { innerHTML: 'Loading' };
  const parent = { postMessage: (message: unknown) => sent.push(message) };
  const window = {
    parent,
    openai: output ? { toolOutput: output } : undefined,
    addEventListener: (name: string, callback: (event: any) => void) => listeners.set(name, callback),
  };
  const document = {
    getElementById: (id: string) => id === 'app' ? app : null,
    querySelectorAll: () => [],
    querySelector: () => null,
  };
  const script = DASHBOARD_WIDGET_HTML.match(/<script>([\s\S]*?)<\/script>/)![1];
  vm.runInNewContext(script, { window, document });
  return { app, sent, parent, emit: (name: string, event: any) => listeners.get(name)!(event) };
}

const output = { summary: { patientName: 'Test <Patient>', activeConditions: 2, activeMedications: 1, allergies: 0, healthRecords: 3 } };

test('dashboard renders an initial legacy result with escaped content', () => {
  const h = host(output);
  assert.match(h.app.innerHTML, /Test &lt;Patient&gt;/);
});

test('dashboard renders late legacy globals without requiring window.openai mutation', () => {
  const h = host();
  h.emit('openai:set_globals', { detail: { globals: { toolOutput: output } } });
  assert.match(h.app.innerHTML, /Test &lt;Patient&gt;/);
});

test('standard host handshake and late results work without the legacy bridge', () => {
  const h = host();
  assert.equal(h.sent[0].method, 'ui/initialize');
  h.emit('message', { source: h.parent, data: { jsonrpc: '2.0', id: 'dashboard-init', result: {} } });
  assert.equal(h.sent[1].method, 'ui/notifications/initialized');
  h.emit('message', { source: h.parent, data: { jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: { structuredContent: output } } });
  assert.match(h.app.innerHTML, /Test &lt;Patient&gt;/);
  h.emit('message', { source: h.parent, data: { jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: { isError: true } } });
  assert.match(h.app.innerHTML, /Unable to load/);
  assert.doesNotMatch(h.app.innerHTML, /Test &lt;Patient&gt;/);
});

test('dashboard ignores results from unrelated windows', () => {
  const h = host();
  h.emit('message', { source: {}, data: { jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: { structuredContent: output } } });
  assert.equal(h.app.innerHTML, 'Loading');
});

test('both server entrypoints link the dashboard to a current MCP Apps resource', () => {
  for (const file of ['./server.ts', '../../../supabase/functions/health-vault-mcp/index.ts']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    const start = source.indexOf('"health-vault-dashboard",');
    const resource = source.slice(start, source.indexOf('server.registerResource(', start));
    assert.match(resource, /text\/html;profile=mcp-app/);
    assert.match(resource, /resourceDomains:/);
    assert.match(source, /ui: \{ resourceUri: DASHBOARD_WIDGET_URI \}/);
  }
  assert.match(DASHBOARD_WIDGET_URI, /-v2\.html$/);
});

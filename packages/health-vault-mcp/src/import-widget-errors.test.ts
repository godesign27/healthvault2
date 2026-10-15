import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { HEALTH_IMPORT_WIDGET_HTML } from './health-import-widget.ts';
import { CLINICAL_IMPORT_WIDGET_HTML } from './clinical-import-widget.ts';

for (const [name, html, button] of [
  ['vitals', HEALTH_IMPORT_WIDGET_HTML, 'confirm'],
  ['clinical', CLINICAL_IMPORT_WIDGET_HTML, 'save'],
] as const) for (const mode of ['empty', 'tool-error', 'timeout']) {
  test(`${name}: ${mode} never reports success or resubmits`, async () => {
    const elements = new Map();
    const listeners = new Map();
    const element = id => {
      if (!elements.has(id)) {
        const e: any = { innerHTML: '', textContent: '', disabled: false, addEventListener: (type, fn) => e[type] = fn };
        elements.set(id, e);
      }
      return elements.get(id);
    };
    const output = { preview: { proposalId: 'fixture', items: [{ metric: 'steps', value: 3, unit: 'count', title: 'Test' }] } };
    let calls = 0;
    const window = { parent: { postMessage() {} }, addEventListener: (name, fn) => listeners.set(name, fn),
      openai: { toolOutput: output, callTool: async () => {
        calls++;
        const pendingMarkup = element('app').innerHTML;
        listeners.get('openai:set_globals')({ detail: { globals: { toolOutput: { ...output, incidental: true } } } });
        assert.equal(element('app').innerHTML, pendingMarkup, 'pending card was redrawn');
        if (mode === 'timeout') return new Promise(() => {});
        return mode === 'tool-error' ? { isError: true, content: [{ type: 'text', text: 'Rejected' }] } : {};
      } } };
    vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)![1], {
      window, document: { getElementById: element },
      setTimeout: fn => { queueMicrotask(fn); return 1; }, clearTimeout() {},
    });
    await element(button).click();
    assert.equal(element(button).disabled, true);
    assert.equal(element(button).textContent, 'Check Health Vault');
    assert.doesNotMatch(element('app').innerHTML, /Import complete/);
    assert.match(element('error').innerHTML, /could not be verified|unverified/);
    await element(button).click();
    assert.equal(calls, 1);
  });
}

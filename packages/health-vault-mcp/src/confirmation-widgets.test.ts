import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { LIFE_SIGNAL_WIDGET_HTML } from './life-signal-widget.ts';
import { SHARE_WIDGET_HTML } from './share-widget.ts';
import { MEDICAL_FORM_REVIEW_WIDGET_HTML } from './medical-form-review-widget.ts';
import { MEDICAL_FORM_WIDGET_HTML } from './medical-form-widget.ts';
import { MEDICAL_FORM_SHARE_WIDGET_HTML } from './medical-form-share-widget.ts';

const preview = { proposalId: 'fixture', templateId: 'patient-reg', templateTitle: 'Test form', willComplete: true, reviewFields: [] };
const share = { templateId: 'patient-reg', templateTitle: 'Test form', recipientName: 'Test recipient', recipientEmail: 'test@example.invalid', expiresInHours: 24, categories: ['conditions'], expiresInDays: 7 };
const cases = [
  ['Life Signal', LIFE_SIGNAL_WIDGET_HTML, {}, 'log', { saved: { id: 'fixture' } }],
  ['health share', SHARE_WIDGET_HTML, { preview: share }, 'confirm-share', { share: { id: 'fixture', shareUrl: 'https://example.invalid' } }],
  ['form review', MEDICAL_FORM_REVIEW_WIDGET_HTML, { preview }, 'confirm', { saved: { savedAs: 'completed_form' } }],
  ['form interview', MEDICAL_FORM_WIDGET_HTML, { preview }, 'confirm', { saved: { savedAs: 'completed_form' } }],
  ['email share', MEDICAL_FORM_SHARE_WIDGET_HTML, { share }, 'confirm', { share: { ...share, confirmationState: 'confirmed' } }],
] as const;

for (const [name, html, output, buttonId, saved] of cases) {
  for (const legacy of [true, false]) test(`${name}: ${legacy ? 'legacy' : 'standard'} button dispatches once and retains success`, async () => {
    const elements = new Map(); const listeners = new Map(); const sent: any[] = []; const calls: any[] = [];
    let renders = 0;
    const element = (id: string) => {
      if (!elements.has(id)) {
        let markup = '';
        const value: any = { value: id === 'note' ? '' : '3', dataset: {}, textContent: '', disabled: false,
          get innerHTML() { return markup; }, set innerHTML(v) { markup = v; renders++; },
          addEventListener: (n, fn) => value[n] = fn, querySelector: () => null, insertAdjacentHTML: () => {},
        }; elements.set(id, value);
      }
      return elements.get(id);
    };
    const parent = { postMessage: m => sent.push(m) };
    const window = { parent, openai: legacy ? { toolOutput: output, callTool: async (...args) => { calls.push(args); return { structuredContent: saved }; } } : undefined,
      addEventListener: (n, fn) => listeners.set(n, fn) };
    vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)![1], { window, document: { getElementById: element, querySelectorAll: () => [], querySelector: element }, setTimeout, clearTimeout });
    const message = data => listeners.get('message')({ source: parent, data: { jsonrpc: '2.0', ...data } });
    if (!legacy) {
      message({ id: 'hv-init', result: {} });
      message({ method: 'ui/notifications/tool-result', params: { structuredContent: output } });
    }
    assert.equal(calls.length, 0);
    const action = element(buttonId).click();
    if (!legacy) {
      const request = sent.at(-1); assert.equal(request.method, 'tools/call');
      assert.equal(request.params.arguments.confirmed, true);
      message({ id: request.id, result: { structuredContent: saved } });
    }
    await action;
    const renderCount = renders;
    listeners.get('openai:set_globals')({ detail: { globals: { toolOutput: output } } });
    assert.equal(renders, renderCount, 'old preview must not erase success');
    if (legacy) { assert.equal(calls.length, 1); assert.equal(calls[0][1].confirmed, true); }
    else assert.equal(sent.filter(m => m.method === 'tools/call').length, 1);
  });
}

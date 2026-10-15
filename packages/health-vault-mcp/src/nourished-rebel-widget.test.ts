import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { NOURISHED_REBEL_WIDGET_HTML } from './nourished-rebel.ts';

function harness(mode = 'legacy', behavior = 'success', active = true) {
  const elements = new Map();
  const listeners = new Map();
  const calls: any[] = [];
  const state = { checkIn: { answers: {}, skipped_questions: [], answered_count: 0 }, enrollment: { active } };
  const el = id => {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', value: '', disabled: false });
    return elements.get(id);
  };
  const respond = (name, args) => {
    calls.push({ name, args });
    if (behavior === 'empty') return {};
    if (behavior === 'error') return { isError: true, content: [{ type: 'text', text: 'Rejected' }] };
    if (name === 'start_nourished_rebel_check_in') state.enrollment.active = true;
    else {
      if (args.skipped) state.checkIn.skipped_questions.push(args.questionKey);
      else state.checkIn.answers[args.questionKey] = args.answer;
      state.checkIn.answered_count = Object.keys(state.checkIn.answers).length;
    }
    return { structuredContent: { state: structuredClone(state) } };
  };
  const parent = { postMessage(message) {
    if (message.method === 'tools/call') queueMicrotask(() => listeners.get('message')({
      source: parent, data: { jsonrpc: '2.0', id: message.id, result: respond(message.params.name, message.params.arguments) },
    }));
  } };
  const window = { parent, addEventListener: (name, fn) => listeners.set(name, fn),
    openai: mode === 'legacy' ? { toolOutput: structuredClone(state), callTool: async (name, args) => respond(name, args) } : undefined };
  vm.runInNewContext(NOURISHED_REBEL_WIDGET_HTML.match(/<script>([\s\S]*?)<\/script>/)![1], {
    window, document: { getElementById: el }, setTimeout, clearTimeout,
  });
  const output = value => mode === 'legacy'
    ? listeners.get('openai:set_globals')({ detail: { globals: { toolOutput: value } } })
    : listeners.get('message')({ source: parent, data: { jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: { structuredContent: value } } });
  if (mode !== 'legacy') {
    listeners.get('message')({ source: parent, data: { jsonrpc: '2.0', id: 'hv-init', result: {} } });
    output(structuredClone(state));
  }
  return { el, calls, output, state };
}
for (const mode of ['legacy', 'standard']) {
  test(mode + ': sequential answers, double clicks, and completion', async () => {
    const h = harness(mode, 'success', false);
    for (let i = 0; i < 6; i++) {
      h.el('start').onclick();
      h.el('answer').value = 'Test answer ' + i;
      const pending = h.el('save').onclick();
      assert.equal(h.el('save').disabled, true);
      await h.el('skip').onclick();
      await pending;
    }
    assert.equal(h.calls.length, 7);
    assert.equal(h.calls.filter(c => c.name.startsWith('start_')).length, 1);
    assert.ok(h.calls.every(c => c.args.confirmed === true));
    assert.match(h.el('app').innerHTML, /Check-in complete/);
    h.output({ ...h.state, checkIn: { answers: {} } });
    assert.match(h.el('app').innerHTML, /Check-in complete/);
  });
  test(mode + ': empty answer never enrolls and output never erases editing', async () => {
    const h = harness(mode, 'success', false);
    h.el('start').onclick();
    const markup = h.el('app').innerHTML;
    h.output({ ...h.state, incidental: true });
    assert.equal(h.el('app').innerHTML, markup);
    await h.el('save').onclick();
    assert.equal(h.calls.length, 0);
    assert.match(h.el('err').textContent, /Enter an answer/);
    await h.el('skip').onclick();
    assert.equal(h.calls.length, 2);
  });
  for (const behavior of ['empty', 'error']) test(mode + ': ' + behavior + ' does not succeed or retry', async () => {
    const h = harness(mode, behavior);
    h.el('start').onclick();
    h.el('answer').value = 'Test answer';
    await h.el('save').onclick();
    assert.equal(h.el('save').textContent, 'Check Health Vault');
    assert.equal(h.el('save').disabled, true);
    assert.match(h.el('err').textContent, /verif/);
    await h.el('save').onclick();
    assert.equal(h.calls.length, 1);
  });
}

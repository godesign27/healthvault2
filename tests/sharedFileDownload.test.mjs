import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/downloadSharedFile.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
function load(fetch) {
  const events = [], module = { exports: {} };
  const link = { click() { events.push('click'); }, remove() { events.push('remove'); } };
  vm.runInNewContext(outputText, { module, exports: module.exports, fetch,
    URL: { createObjectURL() { events.push('create'); return 'blob:synthetic'; }, revokeObjectURL(value) { events.push(`revoke:${value}`); } },
    document: { createElement() { return link; }, body: { appendChild() { events.push('append'); } } },
    window: { setTimeout(callback) { callback(); } },
  });
  return { download: module.exports.downloadSharedFile, events, link };
}
test('download validates HTTP success before creating a blob link', async () => {
  let requested;
  const fake = load(async (url, options) => { requested = { url, cache: options.cache }; return { ok: true, blob: async () => new Blob(['synthetic']) }; });
  await fake.download('https://synthetic.invalid/authorized.pdf', 'forms.pdf');
  assert.deepEqual(requested, { url: 'https://synthetic.invalid/authorized.pdf', cache: 'no-store' });
  assert.equal(fake.link.download, 'forms.pdf');
  assert.deepEqual(fake.events, ['create', 'append', 'click', 'remove', 'revoke:blob:synthetic']);
});
test('HTTP failure rejects without starting a download', async () => {
  const fake = load(async () => ({ ok: false, status: 410 }));
  await assert.rejects(fake.download('synthetic', 'forms.pdf'), /410/);
  assert.deepEqual(fake.events, []);
});
test('network failure rejects without claiming a download', async () => {
  const fake = load(async () => { throw new Error('offline'); });
  await assert.rejects(fake.download('synthetic', 'forms.pdf'), /offline/);
  assert.deepEqual(fake.events, []);
});

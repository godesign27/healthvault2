import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

for (const [name, path] of [
  ['provider admin', new URL('./index.ts', import.meta.url)],
  ['provider invitation', new URL('../provider-invitation-api/index.ts', import.meta.url)],
] as const) {
  test(`${name} function allows all Supabase browser client preflight headers`, () => {
    const source = readFileSync(path, 'utf8').toLowerCase();
    for (const header of ['authorization', 'x-client-info', 'apikey', 'content-type', 'x-request-id']) {
      assert.match(source, new RegExp(`access-control-allow-headers[^\\n]+${header}`));
    }
  });
}

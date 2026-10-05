import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
let owner = 'signed-in-owner';
const writes = [];
const supabase = {
  auth: {getSession: async () => ({data: {session: owner ? {user: {id: owner}} : null}})},
  from(table) {return {insert(row) {
    writes.push({table, row});
    return {select: () => ({single: async () => ({data: {id: 'new-row', ...row}})})};
  }};},
};
const react = {...require('react'), useState: value => [value, () => {}], useCallback: fn => fn, useEffect: () => {}};
const code = ts.transpileModule(fs.readFileSync('src/lib/stores/network-store.tsx', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
}).outputText;
const m = {exports: {}};
new Function('require', 'module', 'exports', code)(name => name === 'react' ? react : name === '../supabase' ? {supabase} : require(name), m, m.exports);
const store = m.exports.NetworkProvider({children: null}).props.value;
for (const method of ['addProvider', 'addPharmacy']) {
  const result = await store[method]({name: 'Synthetic', userId: 'injected-owner'});
  assert.equal(result.userId, owner, 'Even untyped caller input cannot override the session owner');
  assert.equal(writes.at(-1).row.user_id, owner);
}
owner = null;
for (const method of ['addProvider', 'addPharmacy']) await assert.rejects(store[method]({name: 'Synthetic'}), /Not authenticated/);
assert.equal(writes.length, 2, 'No unauthenticated inserts');
console.log('PASS network create ownership ignores caller IDs and rejects absent sessions');

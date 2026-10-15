import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('apps/mobile/src/lib/account-data.js', 'utf8');
const {
  accountExportFileName,
  fetchAccountExport,
  isOpenDeletionRequest,
  loadLatestDeletionRequest,
  presentAccountExport,
  submitDeletionRequest,
} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

const owner = '11111111-1111-4111-8111-111111111111';
const exportPayload = { format: 'health-vault-personal-data', accountId: owner, tables: { medications: [] } };

function query(result) {
  const filters = [];
  const q = {
    filters,
    select() { return q; },
    eq(...args) { filters.push(args); return q; },
    in(...args) { filters.push(['in', ...args]); return q; },
    order() { return q; },
    limit() { return Promise.resolve(result.list); },
    single() { return Promise.resolve(result.single); },
    insert(row) { result.inserts.push(row); return Promise.resolve({ error: result.insertError }); },
  };
  return q;
}

function client(result) {
  return {
    auth: { getUser: async () => result.user },
    functions: { invoke: async (name, options) => { result.invokes.push({ name, options }); return result.invoke; } },
    from(table) { result.tables.push(table); return query(result); },
  };
}

function base(overrides = {}) {
  return {
    user: { data: { user: { id: owner } } },
    list: { data: [], error: null },
    single: { data: null, error: null },
    insertError: null,
    inserts: [],
    invoke: { data: exportPayload, error: null },
    invokes: [],
    tables: [],
    ...overrides,
  };
}

const loaded = await loadLatestDeletionRequest(client(base({ list: { data: [{ id: 'req-1', status: 'reviewing' }], error: null } })));
assert.equal(loaded.id, 'req-1');
assert.equal(isOpenDeletionRequest(loaded), true);
assert.equal(isOpenDeletionRequest({ status: 'completed' }), false);
await assert.rejects(loadLatestDeletionRequest(client(base({ user: { data: { user: null }, error: null } }))), /Sign in/);
await assert.rejects(loadLatestDeletionRequest(client(base({ list: { data: null, error: { message: 'denied' } } }))), /Unable to check deletion requests/);

const exported = await fetchAccountExport(client(base()));
assert.equal(exported.accountId, owner);
const denied = base({
  invoke: { data: null, error: { context: { json: async () => ({ error: 'Account is blocked.' }) } } },
});
await assert.rejects(fetchAccountExport(client(denied)), /Account is blocked/);
const changed = base();
changed.user = { data: { user: { id: '22222222-2222-4222-8222-222222222222' } } };
await assert.rejects(fetchAccountExport(client(changed)), /No download was created/);
await assert.rejects(fetchAccountExport(client(base({ invoke: { data: { format: 'health-vault-personal-data', accountId: owner }, error: null } }))), /No download was created/);

await assert.rejects(submitDeletionRequest(client(base()), 'delete'), /Type DELETE/);
const duplicate = base({ insertError: { code: '23505' }, single: { data: { id: 'req-2', status: 'requested' }, error: null } });
const receipt = await submitDeletionRequest(client(duplicate), 'DELETE');
assert.equal(receipt.id, 'req-2');
assert.deepEqual(duplicate.inserts, [{ user_id: owner, confirmed: true }]);
const failedInsert = base({ insertError: { code: '42501' } });
await assert.rejects(submitDeletionRequest(client(failedInsert), 'DELETE'), /Unable to confirm your request/);
assert.equal(failedInsert.tables.filter((table) => table === 'account_deletion_requests').length, 1);
await assert.rejects(submitDeletionRequest(client(base({ single: { data: null, error: { message: 'missing' } } })), 'DELETE'), /may have been received/);

const writes = [];
const saved = await presentAccountExport({
  platform: 'ios',
  payload: exportPayload,
  now: new Date('2026-10-12T15:00:00.000Z'),
  fileSystem: {
    documentDirectory: 'file:///vault/',
    EncodingType: { UTF8: 'utf8' },
    writeAsStringAsync: async (uri, body, options) => writes.push({ uri, body, options }),
  },
  share: { share: async (item) => writes.push({ shared: item.url }) },
});
assert.equal(accountExportFileName(new Date('2026-10-12T15:00:00.000Z')), 'health-vault-data-2026-10-12.json');
assert.equal(saved.uri, 'file:///vault/health-vault-data-2026-10-12.json');
assert.equal(writes[1].shared, saved.uri);
assert.match(writes[0].body, /health-vault-personal-data/);

const androidWrites = [];
const android = await presentAccountExport({
  platform: 'android',
  payload: exportPayload,
  fileSystem: {
    StorageAccessFramework: {
      requestDirectoryPermissionsAsync: async () => ({ granted: true, directoryUri: 'content://folder' }),
      createFileAsync: async (directory, name, type) => { androidWrites.push({ directory, name, type }); return 'content://folder/export.json'; },
    },
    writeAsStringAsync: async (uri, body) => androidWrites.push({ uri, body }),
  },
  share: { share: async () => { throw new Error('Share should not run on Android.'); } },
});
assert.equal(android.uri, 'content://folder/export.json');
assert.equal(androidWrites[0].directory, 'content://folder');
assert.equal(androidWrites[0].type, 'application/json');
await assert.rejects(presentAccountExport({
  platform: 'android',
  payload: exportPayload,
  fileSystem: { StorageAccessFramework: { requestDirectoryPermissionsAsync: async () => ({ granted: false }) } },
  share: { share: async () => {} },
}), /Choose a folder/);

const screen = readFileSync('apps/mobile/src/screens/ProfileSettingsScreen.js', 'utf8');
const controls = readFileSync('apps/mobile/src/components/account/AccountDataControls.js', 'utf8');
assert.match(screen, /AccountDataControls/);
assert.match(controls, /Download My Data/);
assert.match(controls, /Request Account Deletion/);
assert.match(controls, /Type DELETE to request review/);
assert.doesNotMatch(controls, /deleteUser|auth\.admin|functions\.invoke\('account-erasure'/);

console.log('PASS account data: owner export, incomplete export rejected, DELETE receipt, duplicate request reused, files saved without erasure');

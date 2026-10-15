import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

async function handler(file, start, end, name, dependencies) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const body = source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
  const { outputText } = ts.transpileModule(body + `\nglobalThis.handler = ${name};`, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const context = { ...dependencies, Error };
  vm.runInNewContext(outputText, context);
  return context.handler;
}

test('withdrawal rejected by SDK reports Toast and releases busy state', async () => {
  const notices = [], busy = [];
  const withdraw = await handler('src/pages/ConnectedProvidersPage.tsx', '  async function withdraw(', '\n  if (signedIn', 'withdraw', {
    busyId: '', runConfirmed: async (_, action) => action(),
    setBusyId: (value) => busy.push(value), setError() {},
    supabase: { functions: { invoke: async () => { throw new Error('Synthetic network failure'); } } },
    notify: (...notice) => notices.push(notice), load: async () => { throw new Error('Unexpected load'); },
  });
  await withdraw({ providerDisplayName: 'Synthetic provider', providerPatientIdentityId: 'synthetic-id' });
  assert.deepEqual(busy, ['synthetic-id', '']);
  assert.deepEqual(notices, [['Synthetic network failure', 'error']]);
});

test('provider enrollment SDK rejection reports Toast and releases busy state', async () => {
  const notices = [], busyStates = [];
  const enroll = await handler('src/pages/ProviderWorkspacePage.tsx', '  async function startEnrollment()', '\n  async function verifyCode', 'startEnrollment', {
    busy: false, setBusy: (value) => busyStates.push(value), setError() {},
    supabase: { auth: { mfa: { enroll: async () => { throw new Error('Synthetic enrollment failure'); } } } },
    notify: (...notice) => notices.push(notice), setEnrollment() { throw new Error('Should not enroll'); },
  });
  await enroll();
  assert.deepEqual(busyStates, [true, false]);
  assert.deepEqual(notices, [['Synthetic enrollment failure', 'error']]);
});

test('authenticator code format remains inline and sends no request', async () => {
  const hints = [], notices = [];
  const verify = await handler('src/pages/ProviderWorkspacePage.tsx', '  async function verifyCode(', '\n  async function switchProviderAccount', 'verifyCode', {
    busy: false, code: 'x', setError: (value) => hints.push(value),
    notify: (...notice) => notices.push(notice),
    supabase: { auth: { mfa: { challengeAndVerify() { throw new Error('Should not send'); } } } },
  });
  await verify('synthetic-factor');
  assert.equal(hints.length, 1); assert.match(hints[0], /six-digit/); assert.deepEqual(notices, []);
});

test('authenticator service rejection reports Toast and releases busy state', async () => {
  const notices = [], busyStates = [];
  const verify = await handler('src/pages/ProviderWorkspacePage.tsx', '  async function verifyCode(', '\n  async function switchProviderAccount', 'verifyCode', {
    busy: false, code: '123456', setBusy: (value) => busyStates.push(value), setError() {},
    supabase: { auth: { mfa: { challengeAndVerify: async () => { throw new Error('Synthetic verification failure'); } } } },
    notify: (...notice) => notices.push(notice),
  });
  await verify('synthetic-factor');
  assert.deepEqual(busyStates, [true, false]);
  assert.deepEqual(notices, [['Synthetic verification failure', 'error']]);
});

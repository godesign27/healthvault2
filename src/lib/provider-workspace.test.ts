import assert from 'node:assert/strict';
import test from 'node:test';

import { filterProviderRoster, getProviderWorkspaceStep } from './provider-workspace.ts';

test('provider workspace security gates fail closed in order', () => {
  assert.equal(getProviderWorkspaceStep({ loading: true, signedIn: false, emailVerified: false, hasVerifiedTotp: false, currentAal: null, workspaceLoaded: false }), 'loading');
  assert.equal(getProviderWorkspaceStep({ loading: false, signedIn: false, emailVerified: false, hasVerifiedTotp: false, currentAal: null, workspaceLoaded: false }), 'sign_in');
  assert.equal(getProviderWorkspaceStep({ loading: false, signedIn: true, emailVerified: false, hasVerifiedTotp: false, currentAal: 'aal1', workspaceLoaded: false }), 'verify_email');
  assert.equal(getProviderWorkspaceStep({ loading: false, signedIn: true, emailVerified: true, hasVerifiedTotp: false, currentAal: 'aal1', workspaceLoaded: false }), 'enroll_mfa');
  assert.equal(getProviderWorkspaceStep({ loading: false, signedIn: true, emailVerified: true, hasVerifiedTotp: true, currentAal: 'aal1', workspaceLoaded: false }), 'challenge_mfa');
  assert.equal(getProviderWorkspaceStep({ loading: false, signedIn: true, emailVerified: true, hasVerifiedTotp: true, currentAal: 'aal2', workspaceLoaded: false }), 'load_workspace');
  assert.equal(getProviderWorkspaceStep({ loading: false, signedIn: true, emailVerified: true, hasVerifiedTotp: true, currentAal: 'aal2', workspaceLoaded: true }), 'ready');
});

test('provider roster search matches roster identifiers and demographics', () => {
  const roster = [
    { id: '1', externalPatientId: 'synthea-a', organizationPatientNumber: 'HV-DEMO-0001', givenName: 'Ana', familyName: 'Nguyen', birthDate: '1985-03-04', administrativeSex: 'female', city: 'Denver', state: 'CO' },
    { id: '2', externalPatientId: 'synthea-b', organizationPatientNumber: 'HV-DEMO-0002', givenName: 'Marco', familyName: 'Ruiz', birthDate: '1972-09-10', administrativeSex: 'male', city: 'Boulder', state: 'CO' },
  ];
  assert.deepEqual(filterProviderRoster(roster, 'ana'), [roster[0]]);
  assert.deepEqual(filterProviderRoster(roster, '0002'), [roster[1]]);
  assert.deepEqual(filterProviderRoster(roster, 'missing'), []);
  assert.deepEqual(filterProviderRoster(roster, '  '), roster);
});

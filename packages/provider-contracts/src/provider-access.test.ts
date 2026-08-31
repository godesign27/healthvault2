import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  PROVIDER_ROLE_PERMISSIONS,
  canAccessProviderPatient,
  canPerformProviderAction,
  type ProviderAuthorizationContext,
} from './index.js';

const activePractitioner: ProviderAuthorizationContext = {
  principalId: 'user-1',
  providerAccountId: 'provider-1',
  accountStatus: 'active',
  membershipStatus: 'active',
  roles: ['practitioner'],
  permissions: PROVIDER_ROLE_PERMISSIONS.practitioner,
};

test('active members can use only permissions granted by their provider role', () => {
  assert.equal(canPerformProviderAction(activePractitioner, 'patients.read_assigned'), true);
  assert.equal(canPerformProviderAction(activePractitioner, 'patients.read_all'), false);
  assert.equal(canPerformProviderAction(activePractitioner, 'members.manage'), false);
});

test('suspended providers and memberships fail closed', () => {
  assert.equal(
    canPerformProviderAction({ ...activePractitioner, accountStatus: 'suspended' }, 'patients.read_assigned'),
    false,
  );
  assert.equal(
    canPerformProviderAction({ ...activePractitioner, membershipStatus: 'suspended' }, 'patients.read_assigned'),
    false,
  );
});

test('organization administration never implies practitioner patient access', () => {
  const providerAdmin: ProviderAuthorizationContext = {
    ...activePractitioner,
    roles: ['provider_admin'],
    permissions: PROVIDER_ROLE_PERMISSIONS.provider_admin,
  };

  assert.equal(
    canAccessProviderPatient(providerAdmin, {
      assignmentStatus: null,
      accessGrantStatus: 'active',
      grantExpiresAt: null,
    }),
    false,
  );

  const owner = { ...providerAdmin, roles: ['organization_owner'] as const, permissions: PROVIDER_ROLE_PERMISSIONS.organization_owner };
  assert.equal(canPerformProviderAction(owner, 'patients.read_assigned'), false);
});

test('practitioner patient access requires an active assignment and access grant', () => {
  assert.equal(
    canAccessProviderPatient(activePractitioner, {
      assignmentStatus: 'active',
      accessGrantStatus: 'active',
      grantExpiresAt: null,
    }),
    true,
  );
  assert.equal(
    canAccessProviderPatient(activePractitioner, {
      assignmentStatus: null,
      accessGrantStatus: 'active',
      grantExpiresAt: null,
    }),
    false,
  );
  assert.equal(
    canAccessProviderPatient(activePractitioner, {
      assignmentStatus: 'active',
      accessGrantStatus: 'revoked',
      grantExpiresAt: null,
    }),
    false,
  );
});

test('expired access grants deny practitioner patient access', () => {
  assert.equal(
    canAccessProviderPatient(activePractitioner, {
      assignmentStatus: 'active',
      accessGrantStatus: 'active',
      grantExpiresAt: '2025-01-01T00:00:00.000Z',
    }, new Date('2026-01-01T00:00:00.000Z')),
    false,
  );
});

test('the M1 migration enforces patient access server-side and makes audit events immutable', async () => {
  const migrationUrl = new URL(
    '../../../supabase/migrations/20260829182110_create_provider_security_foundation.sql',
    import.meta.url,
  );
  const migration = await readFile(migrationUrl, 'utf8');

  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.can_practitioner_access_provider_patient/);
  assert.match(migration, /SECURITY DEFINER/);
  assert.match(migration, /CREATE TRIGGER prevent_admin_audit_event_mutation/);
  assert.match(migration, /BEFORE UPDATE OR DELETE ON public\.admin_audit_events/);
});

test('invitation acceptance is atomic and rechecks verified email, TOTP, and AAL2 in the database', async () => {
  const migrationUrl = new URL(
    '../../../supabase/migrations/20260829182118_accept_provider_membership_invitations.sql',
    import.meta.url,
  );
  const migration = await readFile(migrationUrl, 'utf8');

  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.accept_provider_membership_invitation/);
  assert.match(migration, /email_confirmed_at/);
  assert.match(migration, /factor_type = 'totp' AND status = 'verified'/);
  assert.match(migration, /auth\.jwt\(\) ->> 'aal'.*'aal2'/);
  assert.match(migration, /WHERE id = p_invitation_id FOR UPDATE/);
  assert.match(migration, /INSERT INTO public\.provider_memberships/);
  assert.match(migration, /SET status = 'accepted', accepted_by = current_user_id/);
  assert.match(migration, /INSERT INTO public\.admin_audit_events/);
});

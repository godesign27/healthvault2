import assert from 'node:assert/strict';
import test from 'node:test';

import {
  authorizeMemberRoleChange,
  authorizeMembershipStatusChange,
  authorizeWorkspaceAccess,
  hasRecentAal2,
  permissionsForRoles,
} from './authorization.js';

test('read-only workspace access accepts AAL2 while mutations require recent AAL2', () => {
  const base = { accountStatus: 'active', membershipStatus: 'active', permissions: ['organization.read', 'imports.read'], hasAal2: true, hasRecentAal2: false };
  assert.equal(authorizeWorkspaceAccess(base, 'organization.read').allowed, true);
  assert.equal(authorizeWorkspaceAccess(base, 'organization.read', { requireRecentAal2: true }).allowed, false);
  assert.equal(authorizeWorkspaceAccess({ ...base, hasAal2: false }, 'organization.read').allowed, false);
  assert.equal(authorizeWorkspaceAccess({ ...base, membershipStatus: 'suspended' }, 'organization.read').allowed, false);
  assert.equal(authorizeWorkspaceAccess(base, 'members.manage').allowed, false);
});

test('role templates are server-owned and deduplicate permissions', () => {
  const permissions = permissionsForRoles(['practitioner', 'operations_staff']);
  assert.equal(permissions.includes('patients.read_assigned'), true);
  assert.equal(permissions.includes('members.manage'), false);
  assert.equal(new Set(permissions).size, permissions.length);
});

test('provider admins may delegate operational roles but not owner or auditor authority', () => {
  assert.deepEqual(
    authorizeMemberRoleChange({ actorId: 'a', targetId: 'b', actorRoles: ['provider_admin'], requestedRoles: ['practitioner'] }),
    { allowed: true },
  );
  assert.equal(
    authorizeMemberRoleChange({ actorId: 'a', targetId: 'b', actorRoles: ['provider_admin'], requestedRoles: ['organization_owner'] }).allowed,
    false,
  );
  assert.equal(
    authorizeMemberRoleChange({ actorId: 'a', targetId: 'b', actorRoles: ['provider_admin'], requestedRoles: ['privacy_auditor'] }).allowed,
    false,
  );
});

test('owners can delegate canonical roles but cannot alter their own assignment through this endpoint', () => {
  assert.equal(
    authorizeMemberRoleChange({ actorId: 'a', targetId: 'b', actorRoles: ['organization_owner'], requestedRoles: ['provider_admin', 'privacy_auditor'] }).allowed,
    true,
  );
  assert.equal(
    authorizeMemberRoleChange({ actorId: 'a', targetId: 'a', actorRoles: ['organization_owner'], requestedRoles: ['provider_admin'] }).allowed,
    false,
  );
});

test('empty, unknown, and non-manager role changes fail closed', () => {
  assert.equal(authorizeMemberRoleChange({ actorId: 'a', targetId: 'b', actorRoles: ['practitioner'], requestedRoles: ['practitioner'] }).allowed, false);
  assert.equal(authorizeMemberRoleChange({ actorId: 'a', targetId: 'b', actorRoles: ['organization_owner'], requestedRoles: [] }).allowed, false);
  assert.equal(authorizeMemberRoleChange({ actorId: 'a', targetId: 'b', actorRoles: ['organization_owner'], requestedRoles: ['root'] }).allowed, false);
});

test('high-risk membership changes require recent AAL2 authentication', () => {
  const now = new Date('2026-08-29T18:00:00.000Z');
  assert.equal(hasRecentAal2({ aal: 'aal2', authenticatedAt: '2026-08-29T17:55:00.000Z' }, now), true);
  assert.equal(hasRecentAal2({ aal: 'aal1', authenticatedAt: '2026-08-29T17:59:00.000Z' }, now), false);
  assert.equal(hasRecentAal2({ aal: 'aal2', authenticatedAt: '2026-08-28T19:00:00.000Z' }, now), true);
  assert.equal(hasRecentAal2({ aal: 'aal2', authenticatedAt: '2026-08-28T17:59:59.000Z' }, now), false);
});

test('last active owner cannot be suspended or removed', () => {
  const decision = authorizeMembershipStatusChange({
    actorId: 'owner-a', targetId: 'owner-b', actorRoles: ['organization_owner'],
    targetRoles: ['organization_owner'], requestedStatus: 'suspended', activeOwnerCount: 1,
    hasRecentAal2: true,
  });
  assert.equal(decision.allowed, false);
});

test('provider admins may suspend operational members but not owners or themselves', () => {
  assert.equal(authorizeMembershipStatusChange({
    actorId: 'admin', targetId: 'practitioner', actorRoles: ['provider_admin'],
    targetRoles: ['practitioner'], requestedStatus: 'suspended', activeOwnerCount: 1,
    hasRecentAal2: true,
  }).allowed, true);
  assert.equal(authorizeMembershipStatusChange({
    actorId: 'admin', targetId: 'owner', actorRoles: ['provider_admin'],
    targetRoles: ['organization_owner'], requestedStatus: 'suspended', activeOwnerCount: 2,
    hasRecentAal2: true,
  }).allowed, false);
  assert.equal(authorizeMembershipStatusChange({
    actorId: 'admin', targetId: 'admin', actorRoles: ['provider_admin'],
    targetRoles: ['provider_admin'], requestedStatus: 'suspended', activeOwnerCount: 1,
    hasRecentAal2: true,
  }).allowed, false);
});

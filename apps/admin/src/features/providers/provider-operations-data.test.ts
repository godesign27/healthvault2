import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PROVIDER_DIRECTORY_FIXTURES,
  PROVIDER_MEMBERSHIP_FIXTURES,
  filterProviderDirectory,
  getMembershipSummary,
  getProviderDirectorySummary,
  mergeProviderMemberships,
  filterProviderImports,
  getProviderImportSummary,
  filterPractitionerReviews,
  getPractitionerReviewSummary,
  filterPatientConnections,
  getPatientConnectionSummary,
} from './provider-operations-data.js';

test('provider directory summary separates active, attention, and onboarding accounts', () => {
  assert.deepEqual(getProviderDirectorySummary(PROVIDER_DIRECTORY_FIXTURES), {
    total: 4,
    active: 2,
    needsAttention: 1,
    onboarding: 1,
  });
});

test('provider directory search matches name, slug, and provider type', () => {
  assert.deepEqual(
    filterProviderDirectory(PROVIDER_DIRECTORY_FIXTURES, { query: 'pediatrics', status: 'all' }).map((provider) => provider.id),
    ['provider-clearwater'],
  );
  assert.deepEqual(
    filterProviderDirectory(PROVIDER_DIRECTORY_FIXTURES, { query: 'pine-ridge', status: 'all' }).map((provider) => provider.id),
    ['provider-pine-ridge'],
  );
});

test('provider directory status filter combines with search and returns an empty result safely', () => {
  assert.deepEqual(
    filterProviderDirectory(PROVIDER_DIRECTORY_FIXTURES, { query: 'health', status: 'degraded' }).map((provider) => provider.id),
    ['provider-mesa'],
  );
  assert.deepEqual(filterProviderDirectory(PROVIDER_DIRECTORY_FIXTURES, { query: 'missing', status: 'active' }), []);
});

test('membership summary keeps invitations distinct from active and suspended access', () => {
  assert.deepEqual(getMembershipSummary(PROVIDER_MEMBERSHIP_FIXTURES), {
    total: 6,
    active: 4,
    invited: 1,
    suspended: 1,
  });
});

test('live members and pending invitations share one safe lifecycle model', () => {
  const entries = mergeProviderMemberships('provider-1', [
    { id: 'member-1', email: 'owner@example.test', roles: ['organization_owner'], status: 'active', lastActiveAt: '2026-08-29T19:00:00Z', invitedAt: null },
  ], [
    { id: 'invite-1', email: 'new@example.test', roles: ['operations_staff'], invited_at: '2026-08-29T18:00:00Z', last_delivery_at: null },
  ]);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].name, 'owner');
  assert.equal(entries[1].status, 'invited');
  assert.equal(entries[1].lastActiveAt, null);
});

const imports = [
  { id: 'job-1', providerAccountId: 'provider-1', providerName: 'Demo Clinic', sourceName: 'synthea.csv', sourceSystem: 'synthea', synthetic: true, schemaVersion: 'health_vault_roster_csv_v1', status: 'committed' as const, rowCount: 100, validRowCount: 100, invalidRowCount: 0, exceptionCount: 0, insertedCount: 100, unchangedCount: 0, createdAt: '2026-08-29T18:00:00Z', committedAt: '2026-08-29T18:01:00Z', rolledBackAt: null },
  { id: 'job-2', providerAccountId: 'provider-1', providerName: 'Demo Clinic', sourceName: 'bad.csv', sourceSystem: 'manual_roster_csv_v1', synthetic: false, schemaVersion: 'health_vault_roster_csv_v1', status: 'rejected' as const, rowCount: 5, validRowCount: 3, invalidRowCount: 2, exceptionCount: 2, insertedCount: 0, unchangedCount: 0, createdAt: '2026-08-29T19:00:00Z', committedAt: null, rolledBackAt: null },
];

test('import summary separates committed, attention, and staged work without patient rows', () => {
  assert.deepEqual(getProviderImportSummary(imports), { total: 2, committed: 1, needsAttention: 1, processedRows: 105 });
  assert.equal(Object.keys(imports[0]).some((key) => key.includes('patient')), false);
});

test('import filters combine provider, status, and source search', () => {
  assert.deepEqual(filterProviderImports(imports, { providerId: 'provider-1', status: 'committed', query: 'synthea' }).map((job) => job.id), ['job-1']);
  assert.deepEqual(filterProviderImports(imports, { providerId: 'all', status: 'validated', query: '' }), []);
});

const practitioners = [
  { id: 'p1', display_name: 'Avery Chen', email: 'avery@example.test', specialty: 'Cardiology', provider_name: 'Demo Clinic', credential_status: 'pending' as const, professional_identifier_type: 'NPI', professional_identifier_value: '1000000001' },
  { id: 'p2', display_name: 'Morgan Lee', email: 'morgan@example.test', specialty: null, provider_name: 'North Clinic', credential_status: 'verified' as const, professional_identifier_type: null, professional_identifier_value: null },
  { id: 'p3', display_name: 'Riley Davis', email: null, specialty: 'Family medicine', provider_name: 'Demo Clinic', credential_status: 'expired' as const, professional_identifier_type: 'NPI', professional_identifier_value: '1000000003' },
];

test('practitioner review filters search identity, organization, specialty, and identifiers', () => {
  assert.deepEqual(filterPractitionerReviews(practitioners, { query: 'cardiology', status: 'all' }).map((entry) => entry.id), ['p1']);
  assert.deepEqual(filterPractitionerReviews(practitioners, { query: '1000000003', status: 'expired' }).map((entry) => entry.id), ['p3']);
  assert.deepEqual(filterPractitionerReviews(practitioners, { query: 'demo clinic', status: 'verified' }), []);
  assert.deepEqual(filterPractitionerReviews(practitioners, { query: '', status: 'needs_review' }).map((entry) => entry.id), ['p1']);
  assert.deepEqual(filterPractitionerReviews(practitioners, { query: '', status: 'attention' }).map((entry) => entry.id), ['p3']);
});

test('practitioner review summary separates queue, verified, and attention states', () => {
  assert.deepEqual(getPractitionerReviewSummary(practitioners), { total: 3, needsReview: 1, verified: 1, attention: 1 });
});

const patientConnections = [
  { providerPatientIdentityId: 'identity-1', providerName: 'Demo Clinic', patientName: 'Avery Chen', organizationPatientNumber: 'HV-1001', email: 'avery@example.test', status: 'active', scope: ['roster_demographics', 'clinical_records'], purpose: 'care_coordination', consentVersion: 'consent-v3', consentReceiptId: 'receipt-1', consentEvidenceType: 'verified_email_invitation' },
  { providerPatientIdentityId: 'identity-2', providerName: 'North Clinic', patientName: 'Morgan Lee', organizationPatientNumber: 'HV-1002', email: null, status: 'expired', scope: ['roster_demographics'], purpose: 'care_coordination', consentVersion: 'consent-v2', consentReceiptId: 'receipt-2', consentEvidenceType: 'verified_email_invitation' },
  { providerPatientIdentityId: 'identity-3', providerName: 'Demo Clinic', patientName: 'Riley Davis', organizationPatientNumber: null, email: 'riley@example.test', status: 'revoked', scope: ['roster_demographics'], purpose: null, consentVersion: null, consentReceiptId: null, consentEvidenceType: null },
];

test('patient connection filters combine lifecycle status with identity, provider, and consent evidence search', () => {
  assert.deepEqual(filterPatientConnections(patientConnections, { query: 'clinical records', status: 'active' }).map((entry) => entry.providerPatientIdentityId), ['identity-1']);
  assert.deepEqual(filterPatientConnections(patientConnections, { query: 'receipt-2', status: 'expired' }).map((entry) => entry.providerPatientIdentityId), ['identity-2']);
  assert.deepEqual(filterPatientConnections(patientConnections, { query: 'demo clinic', status: 'expired' }), []);
});

test('patient connection summary separates active, expired, and revoked lifecycle states', () => {
  assert.deepEqual(getPatientConnectionSummary(patientConnections), { total: 3, active: 1, expired: 1, revoked: 1 });
});

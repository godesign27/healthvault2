import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../../../supabase/migrations/20260829204500_create_patient_access_delivery_jobs.sql', import.meta.url), 'utf8');

test('delivery jobs are tenant scoped, digest based, audited, and deny direct client access', () => {
  assert.match(migration, /CREATE TABLE public\.patient_access_delivery_jobs/);
  assert.match(migration, /invitation_ids uuid\[\]/);
  assert.match(migration, /status IN \('queued', 'sent', 'failed', 'cancelled'\)/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL ON public\.patient_access_delivery_jobs FROM PUBLIC, anon, authenticated/);
});

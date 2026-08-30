import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../../../supabase/migrations/20260829221000_bootstrap_patient_profile_on_invitation_acceptance.sql', import.meta.url), 'utf8');

test('verified invitation links bootstrap only missing patient profiles', () => {
  assert.match(sql, /NEW\.match_method <> 'verified_invitation'/);
  assert.match(sql, /IF EXISTS \(SELECT 1 FROM public\.user_profiles WHERE user_id = NEW\.consumer_principal_id::text\)[\s\S]*RETURN NEW/);
  assert.match(sql, /ON CONFLICT \(user_id\) DO NOTHING/);
  assert.doesNotMatch(sql, /ON CONFLICT[\s\S]*DO UPDATE/);
});

test('profile bootstrap is not directly executable by browser roles', () => {
  assert.match(sql, /SECURITY DEFINER[\s\S]*SET search_path = ''/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.bootstrap_patient_profile_from_provider_identity\(\) FROM PUBLIC, anon, authenticated/);
});

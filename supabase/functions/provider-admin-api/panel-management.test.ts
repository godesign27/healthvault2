import assert from "node:assert/strict";
import test from "node:test";

import { canAssignToPanel, validateBulkPanelAssignments, validatePanelAssignmentInput } from "./panel-management.ts";

const practitionerProfileId = "11111111-1111-4111-8111-111111111111";
const patientIdentityId = "22222222-2222-4222-8222-222222222222";

test("normalizes an allowed panel assignment without consent or clinical fields", () => {
  const result = validatePanelAssignmentInput({ practitionerProfileId, patientIdentityId, relationshipType: "primary_care" });
  assert.deepEqual(result, { practitionerProfileId, patientIdentityId, relationshipType: "primary_care" });
  assert.equal("grant" in result, false);
  assert.equal("scope" in result, false);
});

test("rejects malformed identifiers and unsupported relationships", () => {
  assert.throws(() => validatePanelAssignmentInput({ practitionerProfileId: "bad", patientIdentityId, relationshipType: "care_team" }), /practitionerProfileId/);
  assert.throws(() => validatePanelAssignmentInput({ practitionerProfileId, patientIdentityId, relationshipType: "friend" }), /relationshipType/);
});

test("requires an active, verified same-provider practitioner and active patient", () => {
  assert.equal(canAssignToPanel({ sameProvider: true, profileStatus: "active", credentialStatus: "verified", patientStatus: "active" }).allowed, true);
  assert.match(canAssignToPanel({ sameProvider: true, profileStatus: "active", credentialStatus: "unverified", patientStatus: "active" }).reason ?? "", /verified/);
  assert.match(canAssignToPanel({ sameProvider: false, profileStatus: "active", credentialStatus: "verified", patientStatus: "active" }).reason ?? "", /provider/);
  assert.match(canAssignToPanel({ sameProvider: true, profileStatus: "active", credentialStatus: "verified", patientStatus: "inactive" }).reason ?? "", /patient/);
});

test("bulk panel assignments normalize exact tenant lookup keys without granting access", () => {
  const rows = validateBulkPanelAssignments([{ practitionerEmail: " Doctor@Example.com ", patientNumber: "HV-100", relationshipType: "care_team" }]);
  assert.deepEqual(rows, [{ practitionerEmail: "doctor@example.com", patientNumber: "HV-100", relationshipType: "care_team" }]);
  assert.equal("grant" in rows[0], false);
  assert.throws(() => validateBulkPanelAssignments([{ practitionerEmail: "bad", patientNumber: "HV-100", relationshipType: "care_team" }]), /practitionerEmail/);
  assert.throws(() => validateBulkPanelAssignments(Array.from({ length: 2001 }, () => ({}))), /2,000/);
});

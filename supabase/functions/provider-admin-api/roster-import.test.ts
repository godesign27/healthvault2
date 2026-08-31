import assert from "node:assert/strict";
import test from "node:test";
import { validateRosterImportPayload } from "./roster-import.js";

const validRow = {
  external_patient_id: "demo-001",
  organization_patient_number: "MRN-001",
  given_name: "Ada",
  family_name: "Lovelace",
  birth_date: "1980-12-10",
  administrative_sex: "female",
  email: "ADA@example.test",
  phone: "",
  address_line_1: "1 Demo Way",
  address_line_2: "",
  city: "Denver",
  state: "CO",
  postal_code: "80202",
  country: "us",
};

test("accepts and normalizes a roster-only payload", () => {
  const result = validateRosterImportPayload([validRow]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows[0].email, "ada@example.test");
  assert.equal(result.rows[0].country, "US");
  assert.equal(result.rows[0].row_number, 2);
});

test("rejects unknown fields so clinical data cannot enter roster staging", () => {
  const result = validateRosterImportPayload([{ ...validRow, diagnosis: "example" }]);
  assert.deepEqual(result.rows, []);
  assert.deepEqual(result.errors[0], { rowNumber: 2, field: "diagnosis", message: "diagnosis is not allowed in roster CSV v1" });
});

test("rejects duplicate external patient ids", () => {
  const result = validateRosterImportPayload([validRow, { ...validRow }]);
  assert.equal(result.rows.length, 1);
  assert.equal(result.errors.some((error) => error.message.includes("duplicated")), true);
});

test("caps an interactive import at 500 rows", () => {
  const result = validateRosterImportPayload(Array.from({ length: 501 }, (_, index) => ({ ...validRow, external_patient_id: `demo-${index}` })));
  assert.deepEqual(result.rows, []);
  assert.equal(result.errors[0].field, "rows");
});

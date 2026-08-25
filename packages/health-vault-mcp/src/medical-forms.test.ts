import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { MEDICAL_FORM_REVIEW_WIDGET_HTML } from "./medical-form-review-widget.ts";
import { MEDICAL_FORM_SHARE_WIDGET_HTML } from "./medical-form-share-widget.ts";
import { previewMedicalFormShare } from "./medical-form-sharing.ts";
import { GPT_MEDICAL_FORMS } from "./medical-forms.ts";

test("Patient Registration exposes 13 required safe fields and no restricted fields", () => {
  const registration = GPT_MEDICAL_FORMS.find(({ id }) => id === "patient-reg");
  assert.ok(registration);

  const required = registration.fields.filter(({ required }) => required !== false);
  assert.equal(required.length, 13);

  const keys = new Set(registration.fields.map(({ key }) => key));
  for (const restricted of ["ssn", "social_security_number", "signature", "legal_consent", "payment_information"]) {
    assert.equal(keys.has(restricted), false);
  }
});

test("new-form proposal schema defaults an omitted response timestamp to null", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );

  assert.match(
    edgeIndex,
    /expectedUpdatedAt:\s*z\.string\(\)\.datetime\(\{ offset: true \}\)\.nullable\(\)\.optional\(\)\.default\(null\)/,
  );
});

test("confirmation card reports tool errors and retains the post-save secure-share offer", () => {
  assert.match(MEDICAL_FORM_REVIEW_WIDGET_HTML, /result\?\.isError/);
  assert.match(MEDICAL_FORM_REVIEW_WIDGET_HTML, /prepare a secure share/);
  assert.match(MEDICAL_FORM_REVIEW_WIDGET_HTML, /confirmed:true/);
});

test("secure-share preview widget emits executable JavaScript", () => {
  const script = MEDICAL_FORM_SHARE_WIDGET_HTML.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(() => new Function(script));
});

test("a newly saved complete answer set is immediately shareable", async () => {
  const registration = GPT_MEDICAL_FORMS.find(({ id }) => id === "patient-reg");
  assert.ok(registration);
  const answers = Object.fromEntries(
    registration.fields
      .filter(({ required }) => required !== false)
      .map(({ key }) => [key, "confirmed value"]),
  );
  const rows: Record<string, unknown> = {
    patient_profiles: { id: "patient-1" },
    form_responses: {
      id: "response-1",
      status: "incomplete",
      answers_json: answers,
      updated_at: "2026-08-25T00:00:00.000Z",
    },
  };
  const supabase = {
    from(table: string) {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({ data: rows[table] ?? null, error: null }),
      };
      return query;
    },
  };

  const preview = await previewMedicalFormShare(supabase as never, "user-1", {
    templateId: "patient-reg",
    recipientName: "Dr. Rivera",
    expiresInHours: 24,
  });

  assert.equal(preview.responseId, "response-1");
  assert.equal(preview.confirmationState, "pending");
});

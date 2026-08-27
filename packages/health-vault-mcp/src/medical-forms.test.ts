import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { MEDICAL_FORM_REVIEW_WIDGET_HTML } from "./medical-form-review-widget.ts";
import { MEDICAL_FORM_SHARE_WIDGET_HTML, MEDICAL_FORM_SHARE_WIDGET_URI } from "./medical-form-share-widget.ts";
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

test("secure-share widget does not rewrite the loading DOM while polling", () => {
  const script = MEDICAL_FORM_SHARE_WIDGET_HTML.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);

  let writes = 0;
  let markup = '<section class="card loading">Loading secure share review…</section>';
  const polls: Array<() => void> = [];
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  const parent = { postMessage() {} };
  const app = {
    dataset: { state: "loading" },
    get innerHTML() { return markup; },
    set innerHTML(value: string) { writes += 1; markup = value; },
  };
  const document = {
    getElementById(id: string) { return id === "app" ? app : null; },
  };
  const window = {
    parent,
    openai: undefined,
    addEventListener(name: string, handler: (event: Record<string, unknown>) => void) {
      listeners.set(name, handler);
    },
  };

  new Function("window", "document", "setInterval", "clearInterval", script)(
    window,
    document,
    (callback: () => void) => { polls.push(callback); return 1; },
    () => {},
  );

  assert.equal(writes, 0);
  polls[0]?.();
  polls[0]?.();
  assert.equal(writes, 0);

  listeners.get("message")?.({
    source: parent,
    data: {
      jsonrpc: "2.0",
      method: "ui/notifications/tool-result",
      params: {
        structuredContent: {
          share: {
            templateId: "patient-reg",
            templateTitle: "Patient Registration",
            recipientName: "Dr. Rivera",
            recipientEmail: "rivera@clinic.example",
            expiresInHours: 72,
            confirmationState: "pending",
          },
        },
      },
    },
  });

  assert.equal(writes, 1);
  assert.match(markup, /Patient Registration/);
  assert.match(markup, /Confirm & Email Secure Share/);
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
    recipientEmail: "rivera@clinic.example",
    expiresInHours: 24,
  });

  assert.equal(preview.responseId, "response-1");
  assert.equal(preview.confirmationState, "pending");
  assert.equal(preview.recipientEmail, "rivera@clinic.example");
  assert.equal(preview.sendPatientCopy, false);
});

test("secure-share widget confirms the exact email and optional patient receipt", () => {
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Confirm & Email Secure Share/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /recipientEmail:output\.recipientEmail/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /sendPatientCopy:Boolean\(output\.sendPatientCopy\)/);
});

test("secure-share preview rejects an invalid recipient email before reading health data", async () => {
  await assert.rejects(
    previewMedicalFormShare({ from: () => { throw new Error("should not query"); } } as never, "user-1", {
      templateId: "patient-reg",
      recipientName: "Dr. Rivera",
      recipientEmail: "not-an-email",
      expiresInHours: 24,
    }),
    /valid recipient email/,
  );
});

test("secure-share widget avoids rendering an empty confirmation card", () => {
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /if\(!output\.templateId\|\|!output\.recipientEmail\)/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Loading secure share review/);
});

test("MCP instructions require one compact share preview without unrelated cards", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  assert.match(edgeIndex, /call preview_medical_form_email_share exactly once/);
  assert.match(edgeIndex, /Do not call onboarding, dashboard, form-progress, or recipient-resolution tools/);
  assert.match(edgeIndex, /Do not repeat the card as a prose checklist/);
  assert.match(edgeIndex, /Do not ask for a typed confirmation when the card has a confirmation button/);
});

test("medical form share preview permits its widget to call the confirmed save tool", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  const previewRegistration = edgeIndex.slice(
    edgeIndex.indexOf('"preview_medical_form_email_share"'),
    edgeIndex.indexOf('"create_medical_form_email_share"'),
  );
  assert.match(previewRegistration, /"openai\/widgetAccessible": true/);
});

test("typed share confirmation reuses the preview without extra reads or verbose PII", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  assert.match(edgeIndex, /When the user types confirmation after a medical-form share preview, call create_medical_form_email_share exactly once/);
  assert.match(edgeIndex, /Do not call any read or preview tool again/);
  assert.match(edgeIndex, /Never repeat patient details, recipient details, share IDs, or expiration details in prose/);
  assert.match(edgeIndex, /Secure share result is shown in the card\./);
});

test("medical-form email widget uses a versioned resource and contains no legacy non-email CTA", async () => {
  assert.match(MEDICAL_FORM_SHARE_WIDGET_URI, /-v9\.html$/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Confirm & Email Secure Share/);
  assert.doesNotMatch(MEDICAL_FORM_SHARE_WIDGET_HTML, /Nothing is sent automatically|>Confirm Secure Share</);

  const legacyEdgeWidget = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/medical-form-share-widget.ts", import.meta.url)),
    "utf8",
  );
  assert.doesNotMatch(legacyEdgeWidget, /Nothing is sent automatically|>Confirm Secure Share</);
});

test("medical-form share widget waits for late ChatGPT tool output without becoming blank", () => {
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /globals\.toolOutput\|\|detail\.toolOutput/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Loading secure share review/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /setInterval/);
  assert.doesNotMatch(MEDICAL_FORM_SHARE_WIDGET_HTML, /setInterval\(function\(\)\{render\(\)/);
  assert.doesNotMatch(MEDICAL_FORM_SHARE_WIDGET_HTML, /document\.body\.hidden=true/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /ui\/notifications\/tool-result/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /request\('tools\/call'/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /\(function\(\)\{/);
});

test("medical-form share uses the current MCP Apps resource contract", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  const resourceRegistration = edgeIndex.slice(
    edgeIndex.indexOf('"health-vault-medical-form-share"'),
    edgeIndex.indexOf('server.registerTool(', edgeIndex.indexOf('"health-vault-medical-form-share"')),
  );
  assert.match(resourceRegistration, /text\/html;profile=mcp-app/);
  assert.match(resourceRegistration, /ui:\s*\{\s*prefersBorder:\s*true/);

  const previewTool = edgeIndex.slice(
    edgeIndex.indexOf('"preview_medical_form_email_share"'),
    edgeIndex.indexOf('"create_medical_form_email_share"'),
  );
  assert.match(previewTool, /ui:\s*\{\s*resourceUri:\s*MEDICAL_FORM_SHARE_WIDGET_URI/);
});

test("medical-form sharing uses Health Vault delivery without Gmail or another email plugin", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  assert.match(edgeIndex, /Never invoke, suggest, or install Gmail or another email plugin/);
  assert.match(edgeIndex, /Health Vault sends both emails server-side through its configured delivery service/);
});

test("medical-form result card reports patient receipt acceptance or failure", () => {
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Patient receipt accepted for delivery/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Patient receipt email failed/);
});

test("public secure-share page links back to the authenticated Health Vault profile", async () => {
  const landingPage = await readFile(
    fileURLToPath(new URL("../../../src/pages/SecureShareLanding.tsx", import.meta.url)),
    "utf8",
  );
  assert.match(landingPage, /href="\/"/);
  assert.match(landingPage, /Back to my Health Vault/);
});

test("medical-form share card is the complete minimal final review", () => {
  for (const text of [
    "FINAL REVIEW",
    "Completed fields",
    "Recipient email",
    "Secure, read-only link",
    "Expiration",
    "Note",
    "Patient receipt",
  ]) {
    assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, new RegExp(text));
  }
  assert.doesNotMatch(MEDICAL_FORM_SHARE_WIDGET_HTML, /Date of birth|Address:|Phone:|Emergency contact/);
});

test("versioned medical-form email tools replace the stale legacy tool names", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  assert.match(edgeIndex, /"preview_medical_form_email_share"/);
  assert.match(edgeIndex, /"create_medical_form_email_share"/);
  assert.doesNotMatch(edgeIndex, /registerTool\(\s*"preview_medical_form_share"/);
  assert.doesNotMatch(edgeIndex, /registerTool\(\s*"create_medical_form_share"/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /callTool\('create_medical_form_email_share'/);
});

/* Historical branch-only test harness retained by Git during consolidation.
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDICAL_FORM_WIDGET_HTML } from "./medical-form-widget.ts";
import {
  computeFormProgress,
  computeNextGroup,
  confirmFormAnswers,
  getMedicalForm,
  getMedicalFormProgress,
  GPT_MEDICAL_FORMS,
  normalizeFormAnswers,
  proposeFormAnswers,
} from "./medical-forms.ts";

type Row = Record<string, unknown>;

const USER_ID = "11111111-1111-1111-1111-111111111111";
const PATIENT_ID = "22222222-2222-2222-2222-222222222222";

const PREFILL_NINE = {
  first_name: "Ada",
  last_name: "Lovelace",
  date_of_birth: "1815-12-10",
  phone_number: "555-0100",
  email_address: "ada@example.com",
  street_address: "12 Analytical Engine Rd",
  city: "London",
  state: "IL",
  zip_code: "60601",
};

const EMERGENCY = {
  emergency_contact_name: "William Lovelace",
  emergency_contact_relationship: "Spouse",
  emergency_contact_phone: "555-0199",
};

class Query {
  private filters: Array<{ op: string; col: string; val: unknown }> = [];
  private action: "select" | "insert" | "update" | "upsert" = "select";
  private payload: Row | null = null;
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;

  constructor(private readonly db: Record<string, Row[]>, private readonly table: string) {
    this.db[table] ??= [];
  }

  select() { return this; }
  insert(row: Row) { this.action = "insert"; this.payload = row; return this; }
  update(row: Row) { this.action = "update"; this.payload = row; return this; }
  upsert(row: Row) { this.action = "upsert"; this.payload = row; return this; }
  eq(col: string, val: unknown) { this.filters.push({ op: "eq", col, val }); return this; }
  is(col: string, val: unknown) { this.filters.push({ op: "is", col, val }); return this; }
  gt(col: string, val: unknown) { this.filters.push({ op: "gt", col, val }); return this; }
  in(col: string, val: unknown) { this.filters.push({ op: "in", col, val }); return this; }
  order(col: string, options?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = options?.ascending !== false;
    return this;
  }
  limit(count: number) { this.limitN = count; return this; }

  private matches(row: Row) {
    return this.filters.every(({ op, col, val }) => {
      const actual = row[col];
      if (op === "eq") return actual === val;
      if (op === "is") return actual == val;
      if (op === "gt") return String(actual ?? "") > String(val ?? "");
      if (op === "in") return Array.isArray(val) && val.includes(actual);
      return true;
    });
  }

  private rows() {
    let rows = (this.db[this.table] ?? []).filter((row) => this.matches(row));
    if (this.orderCol) {
      const col = this.orderCol;
      rows = [...rows].sort((left, right) => {
        const comparison = String(left[col] ?? "").localeCompare(String(right[col] ?? ""));
        return this.orderAsc ? comparison : -comparison;
      });
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    return rows;
  }

  private execute() {
    const table = this.db[this.table] ?? [];
    if (this.action === "select") return { data: this.rows(), error: null };
    if (this.action === "insert") {
      const row = {
        id: randomUUID(),
        created_at: new Date().toISOString(),
        confirmed_at: null,
        ...this.payload,
      };
      table.push(row);
      return { data: row, error: null };
    }
    if (this.action === "update") {
      const matched = table.filter((row) => this.matches(row));
      for (const row of matched) Object.assign(row, this.payload);
      return { data: matched.length <= 1 ? (matched[0] ?? null) : matched, error: null };
    }
    const payload = this.payload ?? {};
    const existing = table.find((row) => row.patient_id === payload.patient_id && row.template_id === payload.template_id);
    if (existing) {
      Object.assign(existing, payload);
      return { data: existing, error: null };
    }
    const row = { id: randomUUID(), created_at: new Date().toISOString(), ...payload };
    table.push(row);
    return { data: row, error: null };
  }

  maybeSingle() {
    const { data, error } = this.execute();
    const row = Array.isArray(data) ? (data[0] ?? null) : data;
    return Promise.resolve({ data: row, error });
  }

  single() {
    const { data, error } = this.execute();
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return Promise.resolve({ data: null, error: error ?? { message: "not found" } });
    return Promise.resolve({ data: row, error });
  }

  then<TResult1 = unknown, TResult2 = never>(
    resolve?: ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.execute()).then(resolve ?? undefined, reject ?? undefined);
  }
}

function createFakeSupabase(profile: Record<string, string> = {
  first_name: "Ada",
  last_name: "Lovelace",
  date_of_birth: "1815-12-10",
  phone: "555-0100",
  email: "ada@example.com",
  address_line1: "12 Analytical Engine Rd",
  city: "London",
  state: "IL",
  postal_code: "60601",
}) {
  const db: Record<string, Row[]> = {
    patient_profiles: [{ id: PATIENT_ID, user_id: USER_ID, name: "Ada Lovelace" }],
    user_profiles: [{ user_id: USER_ID, ...profile }],
    form_responses: [],
    form_answer_proposals: [],
    form_templates: [{ id: "patient-reg", title: "Patient Registration", description: "", category: "Identification", version: "2025.01" }],
    conditions: [],
    medications: [],
    allergies: [],
  };
  const supabase = {
    from(table: string) {
      return new Query(db, table);
    },
  } as unknown as SupabaseClient;
  return { supabase, db };
}

const definition = GPT_MEDICAL_FORMS.find((form) => form.id === "patient-reg");
if (!definition) throw new Error("Patient Registration definition is missing");

describe("Patient Registration interview", () => {
  it("counts 9/13 when profile suggestions omit gender and emergency contact", async () => {
    const { supabase } = createFakeSupabase();
    const form = await getMedicalForm(supabase, USER_ID, "patient-reg");
    assert.equal(form.progress.completedFields, 9);
    assert.equal(form.progress.totalFields, 13);
    assert.equal(form.nextQuestion?.key, "gender");
    assert.equal(form.nextGroup?.id, "gender");
  });

  it("persists Gender and advances 9/13 to 10/13 without resetting", async () => {
    const { supabase } = createFakeSupabase();
    const started = await getMedicalForm(supabase, USER_ID, "patient-reg");
    assert.equal(started.progress.completedFields, 9);

    const progressed = await getMedicalFormProgress(supabase, USER_ID, "patient-reg", { Gender: "male" });
    assert.equal(progressed.progress.completedFields, 10);
    assert.equal(progressed.progress.totalFields, 13);
    assert.equal(progressed.form.interviewAnswers.gender, "Male");
    assert.equal(progressed.nextGroup?.id, "emergency");
    assert.deepEqual(progressed.nextGroup?.fields.map((field) => field.key), [
      "emergency_contact_name",
      "emergency_contact_relationship",
      "emergency_contact_phone",
    ]);

    const resumed = await getMedicalForm(supabase, USER_ID, "patient-reg");
    assert.equal(resumed.progress.completedFields, 10);
    assert.equal(resumed.nextQuestion?.key, "emergency_contact_name");
    assert.equal(resumed.nextGroup?.id, "emergency");
  });

  it("keeps 10/13 after a continue/refresh get_medical_form call", async () => {
    const { supabase } = createFakeSupabase();
    await getMedicalFormProgress(supabase, USER_ID, "patient-reg", { gender: "Male" });
    const first = await getMedicalForm(supabase, USER_ID, "patient-reg");
    const second = await getMedicalForm(supabase, USER_ID, "patient-reg");
    assert.equal(first.progress.completedFields, 10);
    assert.equal(second.progress.completedFields, 10);
    assert.equal(second.interviewId, first.interviewId);
  });

  it("returns a complete final-review card at 13/13", async () => {
    const { supabase } = createFakeSupabase();
    await getMedicalFormProgress(supabase, USER_ID, "patient-reg", { gender: "Male" });
    const result = await getMedicalFormProgress(supabase, USER_ID, "patient-reg", EMERGENCY);
    assert.equal(result.progress.completedFields, 13);
    assert.equal(result.progress.remainingFields, 0);
    assert.equal(result.view, "review");
    assert.ok(result.preview);
    assert.equal(result.preview.willComplete, true);
    assert.equal(result.preview.confirmLabel, "Confirm & Save");
    assert.ok(result.preview.reviewFields.some((field) => field.key === "gender" && field.value === "Male"));
    assert.ok(result.preview.reviewFields.some((field) => field.key === "first_name"));
    assert.equal(result.nextGroup, null);
  });

  it("does not write form_responses until explicit Confirm & Save", async () => {
    const { supabase, db } = createFakeSupabase();
    await getMedicalFormProgress(supabase, USER_ID, "patient-reg", { gender: "Male", zip_code: 60601, ...EMERGENCY });
    const preview = await proposeFormAnswers(supabase, USER_ID, "patient-reg");
    assert.equal(db.form_responses.length, 0);
    assert.equal(preview.willComplete, true);

    const saved = await confirmFormAnswers(supabase, USER_ID, preview.proposalId);
    assert.equal(saved.savedAs, "completed_form");
    assert.equal(db.form_responses.length, 1);
    assert.equal(db.form_responses[0]?.status, "complete");
    assert.equal((db.form_responses[0]?.answers_json as Record<string, string>).gender, "Male");
    assert.equal(saved.shareOffer.available, true);
    assert.match(saved.shareOffer.prompt, /secure share/i);
  });

  it("reuses one active Patient Registration interview instead of duplicating sessions", async () => {
    const { supabase, db } = createFakeSupabase();
    await getMedicalFormProgress(supabase, USER_ID, "patient-reg", { gender: "Male" });
    await getMedicalFormProgress(supabase, USER_ID, "patient-reg", { emergency_contact_name: "William Lovelace" });
    const active = db.form_answer_proposals.filter((row) => !row.confirmed_at && String(row.expires_at) > new Date().toISOString());
    assert.equal(active.length, 1);
    assert.equal((active[0]?.proposed_answers as Record<string, string>).gender, "Male");
    assert.equal((active[0]?.proposed_answers as Record<string, string>).emergency_contact_name, "William Lovelace");
  });

  it("normalizes labeled keys and select casing without requesting restricted fields", () => {
    const answers = normalizeFormAnswers(definition, { Gender: "male" });
    assert.equal(answers.gender, "Male");
    assert.equal(computeFormProgress(definition, { ...PREFILL_NINE, gender: "Male" }).completedFields, 10);
    assert.equal(computeNextGroup(definition, { ...PREFILL_NINE, gender: "Male" })?.id, "emergency");
    assert.equal(definition.fields.some((field) => /ssn|social security|signature|payment/i.test(`${field.key} ${field.label}`)), false);
    assert.match(MEDICAL_FORM_WIDGET_HTML, /will not request Social Security numbers/);
    assert.match(MEDICAL_FORM_WIDGET_HTML, /Confirm &amp; Save/);
    assert.match(MEDICAL_FORM_WIDGET_HTML, /Review prefilled answers/);
    assert.match(MEDICAL_FORM_WIDGET_HTML, /Create a secure share/);
  });
*/

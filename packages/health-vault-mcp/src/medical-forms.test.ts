import assert from "node:assert/strict";
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
});

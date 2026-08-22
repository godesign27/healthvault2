import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";

export type MedicalFormField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
};

export type MedicalFormDefinition = {
  id: string;
  title: string;
  description: string;
  category: string;
  version: string;
  fields: MedicalFormField[];
};

const MEDICAL_HISTORY_FIELDS: MedicalFormField[] = [
  { key: "reason_for_visit", label: "Reason for Visit", type: "textarea" },
  { key: "current_medical_conditions", label: "Current Medical Conditions", type: "textarea" },
  { key: "diabetes", label: "Diabetes", type: "select", options: ["No", "Yes - Type 1", "Yes - Type 2", "Prediabetes"] },
  { key: "high_blood_pressure", label: "High Blood Pressure", type: "select", options: ["No", "Yes", "Borderline"] },
  { key: "heart_disease", label: "Heart Disease", type: "select", options: ["No", "Yes"] },
  { key: "cancer_history", label: "Cancer History", type: "select", options: ["No", "Yes"] },
  { key: "cancer_details", label: "Cancer Details", type: "textarea" },
  { key: "family_history_heart_disease", label: "Family History - Heart Disease", type: "textarea" },
  { key: "family_history_diabetes", label: "Family History - Diabetes", type: "textarea" },
  { key: "family_history_cancer", label: "Family History - Cancer", type: "textarea" },
  { key: "known_allergies", label: "Known Allergies", type: "textarea" },
  { key: "current_medications", label: "Current Medications", type: "textarea" },
  { key: "previous_surgeries", label: "Previous Surgeries", type: "textarea" },
  { key: "past_hospitalizations", label: "Past Hospitalizations", type: "textarea" },
  { key: "occupation", label: "Occupation", type: "text" },
  { key: "smoking_status", label: "Smoking Status", type: "select", options: ["Never smoker", "Current daily smoker", "Current some-day smoker", "Former smoker", "Former smoker - status unknown"] },
  { key: "alcohol_use", label: "Alcohol Use", type: "textarea" },
  { key: "other_relevant_information", label: "Other Relevant Information", type: "textarea" },
];

export const GPT_MEDICAL_FORMS: MedicalFormDefinition[] = [{
  id: "medical-history",
  title: "Medical History",
  description: "Past conditions, surgeries, hospitalizations, family history, and current health context.",
  category: "Identification",
  version: "2025.01",
  fields: MEDICAL_HISTORY_FIELDS,
}];

type FormResponse = {
  id: string;
  answers_json: Record<string, string> | null;
  status: string;
  updated_at: string | null;
};

async function getPatientProfileId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.from("patient_profiles").select("id").maybeSingle();
  if (error) throw new Error(`Unable to find the Health Vault profile: ${error.message}`);
  if (!data?.id) throw new Error("Complete your Health Vault profile before working on medical forms.");
  return data.id;
}

function definitionFor(templateId: string): MedicalFormDefinition {
  const definition = GPT_MEDICAL_FORMS.find(({ id }) => id === templateId);
  if (!definition) throw new Error("This form is not available in the ChatGPT Medical Forms MVP.");
  return definition;
}

function validateAnswers(definition: MedicalFormDefinition, answers: Record<string, string>) {
  if (!Object.keys(answers).length) throw new Error("Add at least one answer before preparing a form update.");
  const fields = new Map(definition.fields.map((field) => [field.key, field]));
  const clean: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(answers)) {
    const field = fields.get(key);
    if (!field) throw new Error(`Unknown field: ${key}`);
    const value = rawValue.trim();
    if (!value) throw new Error(`${field.label} cannot be blank.`);
    if (value.length > 4_000) throw new Error(`${field.label} is too long.`);
    if (field.options && !field.options.includes(value)) {
      throw new Error(`${field.label} must be one of: ${field.options.join(", ")}.`);
    }
    clean[key] = value;
  }
  return clean;
}

async function getResponse(supabase: SupabaseClient, patientId: string, templateId: string) {
  const { data, error } = await supabase.from("form_responses")
    .select("id, answers_json, status, updated_at")
    .eq("patient_id", patientId)
    .eq("template_id", templateId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load the medical form: ${error.message}`);
  return data as FormResponse | null;
}

async function suggestedMedicalHistory(supabase: SupabaseClient) {
  const [conditions, medications, allergies] = await Promise.all([
    supabase.from("conditions").select("name, status, diagnosed_on, notes").order("diagnosed_on", { ascending: false, nullsFirst: false }).limit(25),
    supabase.from("medications").select("name, dosage, frequency, end_date").order("created_at", { ascending: false }).limit(25),
    supabase.from("allergies").select("allergen, reaction, severity").order("created_at", { ascending: false }).limit(25),
  ]);
  if (conditions.error) throw new Error(`Unable to read conditions: ${conditions.error.message}`);
  if (medications.error) throw new Error(`Unable to read medications: ${medications.error.message}`);
  if (allergies.error) throw new Error(`Unable to read allergies: ${allergies.error.message}`);
  const conditionText = (conditions.data ?? []).map((row) => [row.name, row.status, row.diagnosed_on, row.notes].filter(Boolean).join(" — ")).join("\n");
  const medicationText = (medications.data ?? []).filter((row) => !row.end_date || row.end_date >= new Date().toISOString().slice(0, 10)).map((row) => [row.name, row.dosage, row.frequency].filter(Boolean).join(" — ")).join("\n");
  const allergyText = (allergies.data ?? []).map((row) => [row.allergen, row.reaction, row.severity].filter(Boolean).join(" — ")).join("\n");
  return {
    ...(conditionText ? { current_medical_conditions: conditionText } : {}),
    ...(medicationText ? { current_medications: medicationText } : {}),
    ...(allergyText ? { known_allergies: allergyText } : {}),
  };
}

export async function listMedicalForms(supabase: SupabaseClient) {
  const patientId = await getPatientProfileId(supabase);
  const { data, error } = await supabase.from("form_responses")
    .select("template_id, status, updated_at")
    .eq("patient_id", patientId)
    .in("template_id", GPT_MEDICAL_FORMS.map(({ id }) => id));
  if (error) throw new Error(`Unable to list medical forms: ${error.message}`);
  const responses = new Map((data ?? []).map((row) => [row.template_id, row]));
  return GPT_MEDICAL_FORMS.map((form) => ({
    id: form.id,
    title: form.title,
    description: form.description,
    category: form.category,
    version: form.version,
    status: responses.get(form.id)?.status ?? "not_started",
    updatedAt: responses.get(form.id)?.updated_at ?? null,
    resumeUrl: `https://healthvault27.com/?app=medical-forms&form=${encodeURIComponent(form.id)}&source=chatgpt`,
  }));
}

export async function getMedicalForm(supabase: SupabaseClient, templateId: string) {
  const definition = definitionFor(templateId);
  const patientId = await getPatientProfileId(supabase);
  const response = await getResponse(supabase, patientId, templateId);
  const savedAnswers = response?.answers_json ?? {};
  const suggestions = templateId === "medical-history" ? await suggestedMedicalHistory(supabase) : {};
  const suggestedAnswers = Object.fromEntries(Object.entries(suggestions).filter(([key]) => !savedAnswers[key]));
  return {
    definition,
    responseId: response?.id ?? null,
    status: response?.status ?? "not_started",
    savedAnswers,
    suggestedAnswers,
    missingFields: definition.fields.filter(({ key }) => !savedAnswers[key]).map(({ key, label }) => ({ key, label })),
    expectedUpdatedAt: response?.updated_at ?? null,
    resumeUrl: `https://healthvault27.com/?app=medical-forms&form=${encodeURIComponent(templateId)}&source=chatgpt`,
  };
}

export async function proposeFormAnswers(
  supabase: SupabaseClient,
  userId: string,
  templateId: string,
  answers: Record<string, string>,
  expectedUpdatedAt?: string | null,
) {
  const definition = definitionFor(templateId);
  const cleanAnswers = validateAnswers(definition, answers);
  const patientId = await getPatientProfileId(supabase);
  const response = await getResponse(supabase, patientId, templateId);
  const actualUpdatedAt = response?.updated_at ?? null;
  if ((expectedUpdatedAt ?? null) !== actualUpdatedAt) {
    throw new Error("This form changed after it was loaded. Reopen the form before preparing new answers.");
  }
  const expiresAt = new Date(Date.now() + 30 * 60 * 1_000).toISOString();
  const { data, error } = await supabase.from("form_answer_proposals").insert({
    user_id: userId,
    patient_id: patientId,
    response_id: response?.id ?? null,
    template_id: templateId,
    template_version: definition.version,
    proposed_answers: cleanAnswers,
    expected_response_updated_at: actualUpdatedAt,
    expires_at: expiresAt,
  }).select("id").single();
  if (error) throw new Error(`Unable to prepare the form review: ${error.message}`);
  return {
    proposalId: data.id,
    templateId,
    templateTitle: definition.title,
    templateVersion: definition.version,
    proposedAnswers: cleanAnswers,
    reviewFields: Object.entries(cleanAnswers).map(([key, value]) => ({ key, label: definition.fields.find((field) => field.key === key)?.label ?? key, value })),
    resultingAnswers: { ...(response?.answers_json ?? {}), ...cleanAnswers },
    expiresAt,
    confirmationState: "pending",
    safeSummary: `${Object.keys(cleanAnswers).length} Medical History answer${Object.keys(cleanAnswers).length === 1 ? "" : "s"} ready for review. Nothing has been saved.`,
  };
}

export async function confirmFormAnswers(supabase: SupabaseClient, userId: string, proposalId: string) {
  const { data: proposal, error } = await supabase.from("form_answer_proposals")
    .select("id, user_id, patient_id, response_id, template_id, template_version, proposed_answers, expected_response_updated_at, expires_at, confirmed_at")
    .eq("id", proposalId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load the form proposal: ${error.message}`);
  if (!proposal) throw new Error("This form proposal was not found or does not belong to you.");
  if (proposal.confirmed_at) {
    const existing = await getResponse(supabase, proposal.patient_id, proposal.template_id);
    if (!existing) throw new Error("This proposal was confirmed, but its saved draft could not be found.");
    return {
      response: existing,
      confirmationState: "confirmed",
      savedAs: "draft",
      resumeUrl: `https://healthvault27.com/?app=medical-forms&form=${encodeURIComponent(proposal.template_id)}&source=chatgpt`,
      safeSummary: "This Medical History proposal was already saved. Nothing was added twice.",
    };
  }
  if (new Date(proposal.expires_at).getTime() <= Date.now()) throw new Error("This form proposal expired. Prepare the answers again.");
  const definition = definitionFor(proposal.template_id);
  if (definition.version !== proposal.template_version) throw new Error("This form version changed. Reopen it before saving.");
  const cleanAnswers = validateAnswers(definition, proposal.proposed_answers as Record<string, string>);
  const current = await getResponse(supabase, proposal.patient_id, proposal.template_id);
  if ((current?.updated_at ?? null) !== (proposal.expected_response_updated_at ?? null)) {
    throw new Error("This form changed after the review was prepared. Reopen it to avoid overwriting newer answers.");
  }
  const updatedAt = new Date().toISOString();
  const { data: response, error: saveError } = await supabase.from("form_responses").upsert({
    patient_id: proposal.patient_id,
    template_id: proposal.template_id,
    answers_json: { ...(current?.answers_json ?? {}), ...cleanAnswers },
    status: "incomplete",
    signed_at: null,
    updated_at: updatedAt,
  }, { onConflict: "patient_id,template_id" }).select("id, template_id, answers_json, status, updated_at").single();
  if (saveError) throw new Error(`Unable to save the form draft: ${saveError.message}`);
  const { error: confirmError } = await supabase.from("form_answer_proposals").update({ confirmed_at: updatedAt }).eq("id", proposalId).is("confirmed_at", null);
  if (confirmError) throw new Error(`The draft was saved, but its confirmation receipt could not be updated: ${confirmError.message}`);
  return {
    response,
    confirmationState: "confirmed",
    savedAs: "draft",
    resumeUrl: `https://healthvault27.com/?app=medical-forms&form=${encodeURIComponent(proposal.template_id)}&source=chatgpt`,
    safeSummary: `${definition.title} draft updated with ${Object.keys(cleanAnswers).length} confirmed answer${Object.keys(cleanAnswers).length === 1 ? "" : "s"}.`,
  };
}

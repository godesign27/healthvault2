import type { SupabaseClient } from "@supabase/supabase-js";

export type MedicalFormField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  required?: boolean;
};

export type MedicalFormDefinition = {
  id: string;
  title: string;
  description: string;
  category: string;
  version: string;
  fields: MedicalFormField[];
};

export type InterviewGroup = {
  id: string;
  title: string;
  prompt: string;
  keys: string[];
};

export type InterviewGroupView = InterviewGroup & {
  fields: MedicalFormField[];
};

// Chat intentionally omits SSN, signatures, legal consent, and payment fields.
// Those fields must never be requested or returned by the MCP server.
const PATIENT_REGISTRATION_FIELDS: MedicalFormField[] = [
  { key: "first_name", label: "First Name", type: "text" },
  { key: "middle_name", label: "Middle Name", type: "text", required: false },
  { key: "last_name", label: "Last Name", type: "text" },
  { key: "date_of_birth", label: "Date of Birth", type: "text" },
  { key: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other", "Prefer not to say"] },
  { key: "phone_number", label: "Phone Number", type: "text" },
  { key: "email_address", label: "Email Address", type: "text" },
  { key: "street_address", label: "Street Address", type: "text" },
  { key: "city", label: "City", type: "text" },
  { key: "state", label: "State", type: "text" },
  { key: "zip_code", label: "ZIP Code", type: "text" },
  { key: "emergency_contact_name", label: "Emergency Contact Name", type: "text" },
  { key: "emergency_contact_relationship", label: "Emergency Contact Relationship", type: "text" },
  { key: "emergency_contact_phone", label: "Emergency Contact Phone", type: "text" },
];

const MEDICAL_HISTORY_FIELDS: MedicalFormField[] = [
  { key: "reason_for_visit", label: "Reason for Visit", type: "textarea" },
  { key: "current_medical_conditions", label: "Current Medical Conditions", type: "textarea" },
  { key: "diabetes", label: "Diabetes", type: "select", options: ["No", "Yes - Type 1", "Yes - Type 2", "Prediabetes"] },
  { key: "high_blood_pressure", label: "High Blood Pressure", type: "select", options: ["No", "Yes", "Borderline"] },
  { key: "heart_disease", label: "Heart Disease", type: "select", options: ["No", "Yes"] },
  { key: "cancer_history", label: "Cancer History", type: "select", options: ["No", "Yes"] },
  { key: "cancer_details", label: "Cancer Details", type: "textarea", required: false },
  { key: "family_history_heart_disease", label: "Family History - Heart Disease", type: "textarea", required: false },
  { key: "family_history_diabetes", label: "Family History - Diabetes", type: "textarea", required: false },
  { key: "family_history_cancer", label: "Family History - Cancer", type: "textarea", required: false },
  { key: "known_allergies", label: "Known Allergies", type: "textarea" },
  { key: "current_medications", label: "Current Medications", type: "textarea" },
  { key: "previous_surgeries", label: "Previous Surgeries", type: "textarea", required: false },
  { key: "past_hospitalizations", label: "Past Hospitalizations", type: "textarea", required: false },
  { key: "occupation", label: "Occupation", type: "text", required: false },
  { key: "smoking_status", label: "Smoking Status", type: "select", options: ["Never smoker", "Current daily smoker", "Current some-day smoker", "Former smoker", "Former smoker - status unknown"] },
  { key: "alcohol_use", label: "Alcohol Use", type: "textarea", required: false },
  { key: "other_relevant_information", label: "Other Relevant Information", type: "textarea", required: false },
];

const MEDICAL_ID_FIELDS: MedicalFormField[] = [
  { key: "blood_type", label: "Blood Type", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
  { key: "primary_language", label: "Primary Language", type: "text" },
  { key: "preferred_pharmacy", label: "Preferred Pharmacy", type: "text" },
  { key: "pharmacy_phone", label: "Pharmacy Phone", type: "text", required: false },
  { key: "primary_care_physician", label: "Primary Care Physician", type: "text" },
  { key: "physician_phone", label: "Physician Phone", type: "text", required: false },
  { key: "known_allergies", label: "Known Allergies", type: "textarea" },
  { key: "current_medications", label: "Current Medications", type: "textarea" },
];

const EMERGENCY_CONTACT_FIELDS: MedicalFormField[] = [
  { key: "primary_contact_name", label: "Primary Contact Name", type: "text" },
  { key: "relationship", label: "Relationship", type: "text" },
  { key: "phone_number", label: "Phone Number", type: "text" },
  { key: "email", label: "Email", type: "text", required: false },
  { key: "secondary_contact_name", label: "Secondary Contact Name", type: "text", required: false },
  { key: "secondary_relationship", label: "Secondary Relationship", type: "text", required: false },
  { key: "secondary_phone", label: "Secondary Phone", type: "text", required: false },
  { key: "secondary_email", label: "Secondary Email", type: "text", required: false },
];

const CURRENT_MEDICATION_FIELDS: MedicalFormField[] = [
  { key: "medication_1_name", label: "Medication 1 Name", type: "text" },
  { key: "medication_1_dosage", label: "Medication 1 Dosage", type: "text" },
  { key: "medication_1_prescriber", label: "Medication 1 Prescriber", type: "text", required: false },
  { key: "medication_2_name", label: "Medication 2 Name", type: "text", required: false },
  { key: "medication_2_dosage", label: "Medication 2 Dosage", type: "text", required: false },
  { key: "medication_2_prescriber", label: "Medication 2 Prescriber", type: "text", required: false },
  { key: "medication_3_name", label: "Medication 3 Name", type: "text", required: false },
  { key: "medication_3_dosage", label: "Medication 3 Dosage", type: "text", required: false },
  { key: "medication_3_prescriber", label: "Medication 3 Prescriber", type: "text", required: false },
  { key: "over_the_counter_medications", label: "Over-the-Counter Medications", type: "textarea", required: false },
  { key: "supplements", label: "Supplements", type: "textarea", required: false },
];

const ALLERGY_FIELDS: MedicalFormField[] = [
  { key: "drug_allergies", label: "Drug Allergies", type: "textarea" },
  { key: "food_allergies", label: "Food Allergies", type: "textarea" },
  { key: "environmental_allergies", label: "Environmental Allergies", type: "textarea" },
  { key: "latex_allergy", label: "Latex Allergy", type: "select", options: ["Yes", "No", "Unknown"] },
  { key: "other_allergies", label: "Other Allergies", type: "textarea", required: false },
  { key: "allergy_reactions", label: "Allergy Reactions", type: "textarea" },
  { key: "carries_epipen", label: "Carries EpiPen", type: "select", options: ["Yes", "No"] },
];

export const GPT_MEDICAL_FORMS: MedicalFormDefinition[] = [
  {
    id: "patient-reg",
    title: "Patient Registration",
    description: "Basic demographics, contact details, and emergency contact information. Restricted identity fields stay outside chat.",
    category: "Identification",
    version: "2025.01",
    fields: PATIENT_REGISTRATION_FIELDS,
  },
  {
    id: "medical-history",
    title: "Medical History",
    description: "Past conditions, surgeries, hospitalizations, family history, and current health context.",
    category: "Identification",
    version: "2025.01",
    fields: MEDICAL_HISTORY_FIELDS,
  },
  {
    id: "medical-id",
    title: "Medical ID Information",
    description: "Blood type, pharmacy, primary physician, allergies, and medications.",
    category: "Identification",
    version: "2025.01",
    fields: MEDICAL_ID_FIELDS,
  },
  {
    id: "emergency-contact",
    title: "Emergency Contact Information",
    description: "People to contact in case of a medical emergency.",
    category: "Care Preferences",
    version: "2025.01",
    fields: EMERGENCY_CONTACT_FIELDS,
  },
  {
    id: "current-medications",
    title: "Current Medications",
    description: "Current prescriptions, over-the-counter medications, and supplements.",
    category: "Health & Lifestyle",
    version: "2025.01",
    fields: CURRENT_MEDICATION_FIELDS,
  },
  {
    id: "allergy-info",
    title: "Allergy Information",
    description: "Medication, food, environmental, latex, and other allergies and reactions.",
    category: "Health & Lifestyle",
    version: "2025.01",
    fields: ALLERGY_FIELDS,
  },
];

const COMMON_FORM_IDS = [
  "patient-reg",
  "medical-history",
  "medical-id",
  "current-medications",
  "allergy-info",
  "emergency-contact",
] as const;

export const GPT_MEDICAL_FORM_IDS = GPT_MEDICAL_FORMS.map(({ id }) => id);

const INTERVIEW_GROUPS: Record<string, InterviewGroup[]> = {
  "patient-reg": [
    { id: "name", title: "Your name", prompt: "What is your first, middle, and last name?", keys: ["first_name", "middle_name", "last_name"] },
    { id: "birth", title: "Date of birth", prompt: "What is your date of birth?", keys: ["date_of_birth"] },
    { id: "gender", title: "Gender", prompt: "What is your gender?", keys: ["gender"] },
    { id: "contact", title: "Contact details", prompt: "What phone number and email should we use?", keys: ["phone_number", "email_address"] },
    { id: "address", title: "Home address", prompt: "What is your street address, city, state, and ZIP code?", keys: ["street_address", "city", "state", "zip_code"] },
    { id: "emergency", title: "Emergency contact", prompt: "Who is your emergency contact, their relationship to you, and their phone number?", keys: ["emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone"] },
  ],
  "emergency-contact": [
    { id: "primary", title: "Primary emergency contact", prompt: "Who is your primary emergency contact, including relationship, phone, and email?", keys: ["primary_contact_name", "relationship", "phone_number", "email"] },
    { id: "secondary", title: "Secondary emergency contact", prompt: "If you have a secondary emergency contact, what is their name, relationship, phone, and email?", keys: ["secondary_contact_name", "secondary_relationship", "secondary_phone", "secondary_email"] },
  ],
  "medical-id": [
    { id: "identity", title: "Medical ID basics", prompt: "What is your blood type and primary language?", keys: ["blood_type", "primary_language"] },
    { id: "care-team", title: "Pharmacy and physician", prompt: "What is your preferred pharmacy and primary care physician, including phone numbers if you have them?", keys: ["preferred_pharmacy", "pharmacy_phone", "primary_care_physician", "physician_phone"] },
    { id: "clinical", title: "Allergies and medications", prompt: "What allergies and current medications should appear on your Medical ID?", keys: ["known_allergies", "current_medications"] },
  ],
};

type FormResponse = {
  id: string;
  answers_json: Record<string, string> | null;
  status: string;
  updated_at: string | null;
};

export async function getPatientProfileId(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("patient_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Unable to find the Health Vault profile: ${error.message}`);
  if (!data?.id) throw new Error("Complete your Health Vault profile before working on medical forms.");
  return data.id;
}

function definitionFor(templateId: string): MedicalFormDefinition {
  const definition = GPT_MEDICAL_FORMS.find(({ id }) => id === templateId);
  if (!definition) throw new Error("This form is not available in the ChatGPT Medical Forms MVP.");
  return definition;
}

const INTERVIEW_TTL_MS = 30 * 60 * 1_000;

type FormProposal = {
  id: string;
  user_id: string;
  patient_id: string;
  response_id: string | null;
  template_id: string;
  template_version: string;
  proposed_answers: Record<string, string> | null;
  expected_response_updated_at: string | null;
  expires_at: string;
  confirmed_at: string | null;
};

export function hasAnswer(value: unknown) {
  return typeof value === "string" ? Boolean(value.trim()) : value !== null && value !== undefined && String(value).trim() !== "";
}

export function computeFormProgress(definition: MedicalFormDefinition, answers: Record<string, string>) {
  const requiredFields = definition.fields.filter(({ required }) => required !== false);
  const missingFields = requiredFields
    .filter(({ key }) => !hasAnswer(answers[key]))
    .map(({ key, label, type, options }) => ({ key, label, type, options }));
  const completedFields = requiredFields.length - missingFields.length;
  return {
    totalFields: requiredFields.length,
    completedFields,
    remainingFields: missingFields.length,
    percentReady: requiredFields.length ? Math.round((completedFields / requiredFields.length) * 100) : 100,
    missingFields,
  };
}

function formProgress(definition: MedicalFormDefinition, answers: Record<string, string>) {
  return computeFormProgress(definition, answers);
}

function groupsFor(definition: MedicalFormDefinition): InterviewGroup[] {
  return INTERVIEW_GROUPS[definition.id] ?? definition.fields.map((field) => ({
    id: field.key,
    title: field.label,
    prompt: `What is your ${field.label.toLowerCase()}?`,
    keys: [field.key],
  }));
}

function groupIsComplete(group: InterviewGroup, definition: MedicalFormDefinition, answers: Record<string, string>) {
  return group.keys.every((key) => {
    const field = definition.fields.find((candidate) => candidate.key === key);
    if (!field || field.required === false) return true;
    return hasAnswer(answers[key]);
  });
}

export function computeNextGroup(
  definition: MedicalFormDefinition,
  answers: Record<string, string>,
): InterviewGroupView | null {
  const current = groupsFor(definition).find((group) => !groupIsComplete(group, definition, answers));
  if (!current) return null;
  const fields = current.keys.flatMap((key) => {
    const field = definition.fields.find((candidate) => candidate.key === key);
    if (!field || hasAnswer(answers[key])) return [];
    return [field];
  });
  return { ...current, fields };
}

function sameTimestamp(left: string | null | undefined, right: string | null | undefined) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();
  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return left === right;
  return leftTime === rightTime;
}

function interviewExpiry() {
  return new Date(Date.now() + INTERVIEW_TTL_MS).toISOString();
}

export function normalizeFormAnswers(definition: MedicalFormDefinition, answers: Record<string, unknown>) {
  const fields = new Map(definition.fields.map((field) => [field.key, field]));
  const byLabel = new Map(definition.fields.map((field) => [field.label.toLowerCase(), field]));
  const clean: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(answers)) {
    const field = fields.get(rawKey) ?? byLabel.get(rawKey.trim().toLowerCase());
    if (!field) throw new Error(`Unknown field: ${rawKey}`);
    if (rawValue == null) continue;
    const value = String(rawValue).trim();
    if (!value) throw new Error(`${field.label} cannot be blank.`);
    if (value.length > 4_000) throw new Error(`${field.label} is too long.`);
    if (field.options) {
      const match = field.options.find((option) => option.toLowerCase() === value.toLowerCase());
      if (!match) throw new Error(`${field.label} must be one of: ${field.options.join(", ")}.`);
      clean[field.key] = match;
    } else {
      clean[field.key] = value;
    }
  }
  return clean;
}

function validateAnswers(definition: MedicalFormDefinition, answers: Record<string, string>) {
  const clean = normalizeFormAnswers(definition, answers);
  if (!Object.keys(clean).length) throw new Error("Add at least one answer before preparing a form update.");
  return clean;
}

function canonicalizeSuggestion(definition: MedicalFormDefinition, key: string, value: string) {
  const field = definition.fields.find((candidate) => candidate.key === key);
  if (!field) return "";
  if (!field.options) return value.trim();
  return field.options.find((option) => option.toLowerCase() === value.trim().toLowerCase()) ?? "";
}

async function getResponse(supabase: SupabaseClient, patientId: string, templateId: string) {
  const { data, error } = await supabase.from("form_responses")
    .select("id, answers_json, status, updated_at")
    .eq("patient_id", patientId)
    .eq("template_id", templateId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Unable to load the medical form: ${error.message}`);
  return data as FormResponse | null;
}

async function getActiveInterviews(supabase: SupabaseClient, userId: string, templateId: string) {
  const { data, error } = await supabase.from("form_answer_proposals")
    .select("id, user_id, patient_id, response_id, template_id, template_version, proposed_answers, expected_response_updated_at, expires_at, confirmed_at, created_at")
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .is("confirmed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load the form interview: ${error.message}`);
  return (data ?? []) as FormProposal[];
}

async function expireDuplicateInterviews(supabase: SupabaseClient, keepId: string, duplicates: FormProposal[]) {
  const extraIds = duplicates.filter((row) => row.id !== keepId).map((row) => row.id);
  if (!extraIds.length) return;
  const expiredAt = new Date().toISOString();
  const { error } = await supabase.from("form_answer_proposals")
    .update({ expires_at: expiredAt })
    .in("id", extraIds)
    .is("confirmed_at", null);
  if (error) throw new Error(`Unable to collapse duplicate form interviews: ${error.message}`);
}

async function persistInterviewAnswers(
  supabase: SupabaseClient,
  userId: string,
  patientId: string,
  definition: MedicalFormDefinition,
  response: FormResponse | null,
  answers: Record<string, string>,
) {
  const active = await getActiveInterviews(supabase, userId, definition.id);
  const current = active[0] ?? null;
  const merged = { ...(current?.proposed_answers ?? {}), ...answers };
  if (!Object.keys(merged).length) {
    return current;
  }
  const expiresAt = interviewExpiry();
  const expectedUpdatedAt = response?.updated_at ?? null;
  if (current) {
    await expireDuplicateInterviews(supabase, current.id, active);
    const { data, error } = await supabase.from("form_answer_proposals")
      .update({
        proposed_answers: merged,
        expected_response_updated_at: expectedUpdatedAt,
        expires_at: expiresAt,
        response_id: response?.id ?? current.response_id,
        template_version: definition.version,
      })
      .eq("id", current.id)
      .eq("user_id", userId)
      .is("confirmed_at", null)
      .select("id, user_id, patient_id, response_id, template_id, template_version, proposed_answers, expected_response_updated_at, expires_at, confirmed_at")
      .single();
    if (error) throw new Error(`Unable to update the form interview: ${error.message}`);
    return data as FormProposal;
  }
  const { data, error } = await supabase.from("form_answer_proposals").insert({
    user_id: userId,
    patient_id: patientId,
    response_id: response?.id ?? null,
    template_id: definition.id,
    template_version: definition.version,
    proposed_answers: merged,
    expected_response_updated_at: expectedUpdatedAt,
    expires_at: expiresAt,
  }).select("id, user_id, patient_id, response_id, template_id, template_version, proposed_answers, expected_response_updated_at, expires_at, confirmed_at").single();
  if (error) throw new Error(`Unable to start the form interview: ${error.message}`);
  return data as FormProposal;
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

function value(row: Record<string, unknown> | null | undefined, ...keys: string[]) {
  for (const key of keys) {
    const candidate = row?.[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "";
}

function compactAnswers(entries: Array<[string, string | undefined]>) {
  return Object.fromEntries(entries.filter((entry): entry is [string, string] => Boolean(entry[1]?.trim())));
}

async function suggestedProfileAnswers(supabase: SupabaseClient, userId: string, templateId: string) {
  if (templateId === "medical-history") return suggestedMedicalHistory(supabase);
  const [{ data: userProfile, error: userError }, { data: patientProfile, error: patientError }] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("patient_profiles").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (userError) throw new Error(`Unable to read profile details: ${userError.message}`);
  if (patientError) throw new Error(`Unable to read medical profile details: ${patientError.message}`);
  const user = (userProfile ?? {}) as Record<string, unknown>;
  const patient = (patientProfile ?? {}) as Record<string, unknown>;
  const emergency = (user.emergency_contact && typeof user.emergency_contact === "object" ? user.emergency_contact : {}) as Record<string, unknown>;

  if (templateId === "patient-reg") {
    const definition = definitionFor(templateId);
    const fullName = value(patient, "name").split(/\s+/);
    return compactAnswers([
      ["first_name", value(user, "first_name") || fullName[0]],
      ["middle_name", value(user, "middle_name")],
      ["last_name", value(user, "last_name") || (fullName.length > 1 ? fullName.at(-1) : "")],
      ["date_of_birth", value(user, "date_of_birth") || value(patient, "birth_date")],
      ["gender", canonicalizeSuggestion(definition, "gender", value(user, "gender"))],
      ["phone_number", value(user, "phone") || value(patient, "contact_phone")],
      ["email_address", value(user, "email") || value(patient, "contact_email")],
      ["street_address", value(user, "address_line1", "street_address")],
      ["city", value(user, "city")],
      ["state", canonicalizeSuggestion(definition, "state", value(user, "state")) || value(user, "state")],
      ["zip_code", value(user, "postal_code", "zip_code")],
      ["emergency_contact_name", value(emergency, "name") || value(patient, "emergency_contact_name")],
      ["emergency_contact_relationship", value(emergency, "relationship") || value(patient, "emergency_contact_relationship")],
      ["emergency_contact_phone", value(emergency, "phone") || value(patient, "emergency_contact_phone")],
    ]);
  }
  if (templateId === "emergency-contact") {
    return compactAnswers([
      ["primary_contact_name", value(emergency, "name") || value(patient, "emergency_contact_name")],
      ["relationship", value(emergency, "relationship") || value(patient, "emergency_contact_relationship")],
      ["phone_number", value(emergency, "phone") || value(patient, "emergency_contact_phone")],
      ["email", value(emergency, "email") || value(patient, "emergency_contact_email")],
    ]);
  }
  if (templateId === "medical-id") {
    const clinical = await suggestedMedicalHistory(supabase);
    return compactAnswers([
      ["blood_type", value(patient, "blood_type")],
      ["primary_language", value(user, "preferred_language", "language")],
      ["preferred_pharmacy", value(patient, "preferred_pharmacy")],
      ["pharmacy_phone", value(patient, "pharmacy_phone")],
      ["primary_care_physician", value(patient, "primary_care_physician")],
      ["physician_phone", value(patient, "physician_phone")],
      ["known_allergies", clinical.known_allergies],
      ["current_medications", clinical.current_medications],
    ]);
  }
  return {};
}

export async function listMedicalForms(supabase: SupabaseClient, userId: string) {
  const patientId = await getPatientProfileId(supabase, userId);
  const [{ data: templates, error: templateError }, { data, error }] = await Promise.all([
    supabase.from("form_templates")
      .select("id, title, description, category, version")
      .in("id", [...COMMON_FORM_IDS]),
    supabase.from("form_responses")
    .select("template_id, status, updated_at")
    .eq("patient_id", patientId)
    .in("template_id", [...COMMON_FORM_IDS]),
  ]);
  if (templateError) throw new Error(`Unable to load the medical form catalog: ${templateError.message}`);
  if (error) throw new Error(`Unable to list medical forms: ${error.message}`);
  const responses = new Map((data ?? []).map((row) => [row.template_id, row]));
  const templateMap = new Map((templates ?? []).map((template) => [template.id, template]));
  const forms = COMMON_FORM_IDS.flatMap((id) => {
    const form = templateMap.get(id);
    return form ? [form] : [];
  }).map((form) => ({
    id: form.id,
    title: form.title,
    description: form.description,
    category: form.category,
    version: form.version,
    status: responses.get(form.id)?.status ?? "not_started",
    updatedAt: responses.get(form.id)?.updated_at ?? null,
    chatEditable: GPT_MEDICAL_FORM_IDS.includes(form.id),
    resumeUrl: `https://healthvault.me/?app=medical-forms&form=${encodeURIComponent(form.id)}&source=chatgpt`,
  }));
  const completedCount = forms.filter(({ status }) => status === "complete" || status === "completed").length;
  return {
    forms,
    completedCount,
    uploadUrl: "https://healthvault.me/?app=medical-forms&action=upload&source=chatgpt",
    allFormsUrl: "https://healthvault.me/?app=medical-forms&source=chatgpt",
  };
}

function buildReview(
  definition: MedicalFormDefinition,
  proposalId: string,
  proposedAnswers: Record<string, string>,
  resultingAnswers: Record<string, string>,
  expiresAt: string,
) {
  const progress = formProgress(definition, resultingAnswers);
  const reviewFields = definition.fields
    .filter(({ key }) => hasAnswer(resultingAnswers[key]))
    .map(({ key, label }) => ({ key, label, value: resultingAnswers[key] }));
  return {
    proposalId,
    templateId: definition.id,
    templateTitle: definition.title,
    templateVersion: definition.version,
    proposedAnswers,
    reviewFields,
    resultingAnswers,
    progress,
    willComplete: progress.remainingFields === 0,
    expiresAt,
    confirmationState: "pending" as const,
    confirmLabel: "Confirm & Save",
    safeSummary: progress.remainingFields === 0
      ? `Review these ${definition.title} answers before completing your private form. Nothing has been saved.`
      : `Review these ${definition.title} answers before saving your private draft. ${progress.remainingFields} required answer${progress.remainingFields === 1 ? " remains" : "s remain"}. Nothing has been saved.`,
  };
}

function shareOffer(templateId: string, templateTitle: string, available: boolean) {
  return {
    available,
    templateId,
    templateTitle,
    prompt: `Create a secure share of my completed ${templateTitle} form.`,
    safeSummary: available
      ? `${templateTitle} is complete and private. You can now create a secure share.`
      : `${templateTitle} is still a private draft and cannot be shared until it is complete.`,
  };
}

async function loadFormSnapshot(supabase: SupabaseClient, userId: string, templateId: string) {
  const definition = definitionFor(templateId);
  const patientId = await getPatientProfileId(supabase, userId);
  const response = await getResponse(supabase, patientId, templateId);
  const interviews = await getActiveInterviews(supabase, userId, templateId);
  if (interviews[0]) await expireDuplicateInterviews(supabase, interviews[0].id, interviews);
  const interview = interviews[0] ?? null;
  const savedAnswers = response?.answers_json ?? {};
  const suggestions = await suggestedProfileAnswers(supabase, userId, templateId);
  const interviewAnswers = interview?.proposed_answers ?? {};
  const suggestedAnswers = Object.fromEntries(
    Object.entries(suggestions).filter(([key]) => !savedAnswers[key] && !interviewAnswers[key]),
  );
  const savedKeys = definition.fields.filter(({ key }) => Boolean(savedAnswers[key])).map(({ key }) => key);
  const suggestedKeys = definition.fields.filter(({ key }) => Boolean(suggestedAnswers[key])).map(({ key }) => key);
  const combinedAnswers = { ...suggestedAnswers, ...savedAnswers, ...interviewAnswers };
  const progress = formProgress(definition, combinedAnswers);
  const missingFields = progress.missingFields;
  const nextGroup = computeNextGroup(definition, combinedAnswers);
  const suggestionsToReview = definition.fields
    .filter(({ key }) => suggestedKeys.includes(key))
    .map(({ key, label }) => ({ key, label, value: suggestedAnswers[key] }));
  return {
    definition,
    patientId,
    response,
    interview,
    interviewId: interview?.id ?? null,
    savedAnswers,
    suggestedAnswers,
    interviewAnswers,
    combinedAnswers,
    missingFields,
    suggestionsToReview,
    nextQuestion: missingFields[0] ?? null,
    nextGroup,
    progress: {
      ...progress,
      savedFields: savedKeys.length,
      suggestedFields: suggestedKeys.length,
      interviewFields: Object.keys(interviewAnswers).length,
      readyFields: progress.completedFields,
    },
    expectedUpdatedAt: response?.updated_at ?? null,
    resumeUrl: `https://healthvault.me/?app=medical-forms&form=${encodeURIComponent(templateId)}&source=chatgpt`,
  };
}

function formPayload(snapshot: Awaited<ReturnType<typeof loadFormSnapshot>>) {
  return {
    definition: snapshot.definition,
    responseId: snapshot.response?.id ?? null,
    interviewId: snapshot.interviewId,
    status: snapshot.progress.remainingFields === 0 ? "ready_to_save" : (snapshot.response?.status ?? "not_started"),
    savedAnswers: snapshot.savedAnswers,
    suggestedAnswers: snapshot.suggestedAnswers,
    interviewAnswers: snapshot.interviewAnswers,
    missingFields: snapshot.missingFields,
    suggestionsToReview: snapshot.suggestionsToReview,
    nextQuestion: snapshot.nextQuestion,
    nextGroup: snapshot.nextGroup,
    progress: snapshot.progress,
    expectedUpdatedAt: snapshot.expectedUpdatedAt,
    resumeUrl: snapshot.resumeUrl,
  };
}

export async function getMedicalForm(supabase: SupabaseClient, userId: string, templateId: string) {
  const snapshot = await loadFormSnapshot(supabase, userId, templateId);
  return formPayload(snapshot);
}

export async function getMedicalFormProgress(
  supabase: SupabaseClient,
  userId: string,
  templateId: string,
  answers: Record<string, unknown> = {},
  options: { acceptSuggestions?: boolean } = {},
) {
  const definition = definitionFor(templateId);
  const incoming = Object.keys(answers).length ? normalizeFormAnswers(definition, answers) : {};
  const before = await loadFormSnapshot(supabase, userId, templateId);
  if (Object.keys(incoming).length || options.acceptSuggestions) {
    const accepted = { ...before.suggestedAnswers, ...incoming };
    await persistInterviewAnswers(supabase, userId, before.patientId, definition, before.response, accepted);
  }
  let snapshot = await loadFormSnapshot(supabase, userId, templateId);
  if (snapshot.progress.remainingFields === 0 && !snapshot.interview && Object.keys(snapshot.combinedAnswers).length) {
    await persistInterviewAnswers(supabase, userId, snapshot.patientId, definition, snapshot.response, snapshot.combinedAnswers);
    snapshot = await loadFormSnapshot(supabase, userId, templateId);
  }
  const form = formPayload(snapshot);
  const readyForReview = snapshot.progress.remainingFields === 0;
  const preview = readyForReview && snapshot.interview
    ? buildReview(
      definition,
      snapshot.interview.id,
      snapshot.interviewAnswers,
      snapshot.combinedAnswers,
      snapshot.interview.expires_at,
    )
    : null;
  return {
    view: options.acceptSuggestions && !readyForReview ? "prefill" : (readyForReview ? "review" : "interview"),
    templateId,
    templateTitle: definition.title,
    status: readyForReview ? "ready_to_save" : "in_progress",
    formProgress: snapshot.progress,
    progress: snapshot.progress,
    nextQuestion: snapshot.nextQuestion,
    nextGroup: snapshot.nextGroup,
    form,
    preview,
  };
}

export async function proposeFormAnswers(
  supabase: SupabaseClient,
  userId: string,
  templateId: string,
  answers: Record<string, unknown> = {},
  expectedUpdatedAt?: string | null,
) {
  const definition = definitionFor(templateId);
  const patientId = await getPatientProfileId(supabase, userId);
  const response = await getResponse(supabase, patientId, templateId);
  const actualUpdatedAt = response?.updated_at ?? null;
  if (expectedUpdatedAt != null && expectedUpdatedAt !== "" && !sameTimestamp(expectedUpdatedAt, actualUpdatedAt)) {
    throw new Error("This form changed after it was loaded. Reopen the form before preparing new answers.");
  }
  const incoming = Object.keys(answers).length ? normalizeFormAnswers(definition, answers) : {};
  const proposal = await persistInterviewAnswers(supabase, userId, patientId, definition, response, incoming);
  if (!proposal) throw new Error("Add at least one answer before preparing a form review.");
  const snapshot = await loadFormSnapshot(supabase, userId, templateId);
  return buildReview(
    definition,
    proposal.id,
    snapshot.interviewAnswers,
    snapshot.combinedAnswers,
    proposal.expires_at,
  );
}

export async function confirmFormAnswers(supabase: SupabaseClient, userId: string, proposalId: string) {
  const { data: proposal, error } = await supabase.from("form_answer_proposals")
    .select("id, user_id, patient_id, response_id, template_id, template_version, proposed_answers, expected_response_updated_at, expires_at, confirmed_at")
    .eq("id", proposalId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load the form proposal: ${error.message}`);
  if (!proposal) throw new Error("This form proposal was not found or does not belong to you.");
  const definition = definitionFor(proposal.template_id);
  if (proposal.confirmed_at) {
    const existing = await getResponse(supabase, proposal.patient_id, proposal.template_id);
    if (!existing) throw new Error("This proposal was confirmed, but its saved draft could not be found.");
    const progress = formProgress(definition, existing.answers_json ?? {});
    const completed = progress.remainingFields === 0;
    return {
      response: existing,
      confirmationState: "confirmed",
      savedAs: completed ? "completed_form" : "draft",
      progress,
      resumeUrl: `https://healthvault.me/?app=medical-forms&form=${encodeURIComponent(proposal.template_id)}&source=chatgpt`,
      shareOffer: shareOffer(definition.id, definition.title, completed),
      safeSummary: `This ${definition.title} proposal was already saved. Nothing was added twice.`,
    };
  }
  if (new Date(proposal.expires_at).getTime() <= Date.now()) throw new Error("This form proposal expired. Prepare the answers again.");
  if (definition.version !== proposal.template_version) throw new Error("This form version changed. Reopen it before saving.");
  const cleanAnswers = validateAnswers(definition, (proposal.proposed_answers ?? {}) as Record<string, string>);
  const current = await getResponse(supabase, proposal.patient_id, proposal.template_id);
  if (!sameTimestamp(current?.updated_at, proposal.expected_response_updated_at)) {
    throw new Error("This form changed after the review was prepared. Reopen it to avoid overwriting newer answers.");
  }
  const updatedAt = new Date().toISOString();
  const resultingAnswers = { ...(current?.answers_json ?? {}), ...cleanAnswers };
  const progress = formProgress(definition, resultingAnswers);
  const completed = progress.remainingFields === 0;
  const { data: response, error: saveError } = await supabase.from("form_responses").upsert({
    patient_id: proposal.patient_id,
    template_id: proposal.template_id,
    answers_json: resultingAnswers,
    status: completed ? "complete" : "incomplete",
    signed_at: null,
    updated_at: updatedAt,
  }, { onConflict: "patient_id,template_id" }).select("id, template_id, answers_json, status, updated_at").single();
  if (saveError) throw new Error(`Unable to save the form: ${saveError.message}`);
  const { error: confirmError } = await supabase.from("form_answer_proposals").update({ confirmed_at: updatedAt }).eq("id", proposalId).is("confirmed_at", null);
  if (confirmError) throw new Error(`The form was saved, but its confirmation receipt could not be updated: ${confirmError.message}`);
  return {
    response,
    confirmationState: "confirmed",
    savedAs: completed ? "completed_form" : "draft",
    progress,
    resumeUrl: `https://healthvault.me/?app=medical-forms&form=${encodeURIComponent(proposal.template_id)}&source=chatgpt`,
    shareOffer: shareOffer(definition.id, definition.title, completed),
    safeSummary: completed
      ? `${definition.title} completed with your confirmed answers.`
      : `${definition.title} draft updated. ${progress.remainingFields} required answer${progress.remainingFields === 1 ? " remains" : "s remain"}.`,
  };
}

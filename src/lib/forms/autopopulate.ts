import { supabase } from '../supabase';
import { FormTemplateDef, getTemplate } from './catalog';

/** Cached profile + clinical data used to pre-fill form fields. */
export interface FormAutofillContext {
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  gender: string;
  ssnMasked: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  billingAddress: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  secondaryEmergencyName: string;
  secondaryEmergencyPhone: string;
  bloodType: string;
  language: string;
  pharmacyName: string;
  pharmacyPhone: string;
  pcpName: string;
  pcpPhone: string;
  allergiesText: string;
  medicationsText: string;
  conditionsText: string;
  conditionNames: string[];
  surgeriesText: string;
  immunizations: Record<string, string>;
  insuranceProvider: string;
  insuranceMemberId: string;
  insuranceGroup: string;
  insurancePlan: string;
}

const EMPTY_CONTEXT = (userId: string): FormAutofillContext => ({
  userId,
  firstName: '',
  lastName: '',
  fullName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  gender: '',
  ssnMasked: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  billingAddress: '',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  secondaryEmergencyName: '',
  secondaryEmergencyPhone: '',
  bloodType: '',
  language: 'English',
  pharmacyName: '',
  pharmacyPhone: '',
  pcpName: '',
  pcpPhone: '',
  allergiesText: '',
  medicationsText: '',
  conditionsText: '',
  conditionNames: [],
  surgeriesText: '',
  immunizations: {},
  insuranceProvider: '',
  insuranceMemberId: '',
  insuranceGroup: '',
  insurancePlan: '',
});

function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  const d = iso.split('T')[0];
  if (!d) return '';
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return iso;
  return `${m}/${day}/${y}`;
}

function todayFormatted(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${m}/${d}/${now.getFullYear()}`;
}

function oneYearFromToday(): string {
  const now = new Date();
  now.setFullYear(now.getFullYear() + 1);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${m}/${d}/${now.getFullYear()}`;
}

function listMedications(rows: any[]): string {
  const today = new Date().toISOString().split('T')[0];
  const active = rows.filter((m) => !m.end_date || m.end_date >= today);
  if (active.length === 0) return rows.length ? rows.map(formatMed).join(', ') : '';
  return active.map(formatMed).join(', ');
}

function formatMed(m: any): string {
  const parts = [m.name];
  if (m.dosage) parts.push(m.dosage);
  if (m.frequency) parts.push(m.frequency);
  return parts.join(' — ');
}

function listAllergies(rows: any[]): string {
  if (!rows.length) return '';
  return rows
    .map((a) => {
      const parts = [a.allergen];
      if (a.reaction) parts.push(`(${a.reaction})`);
      return parts.join(' ');
    })
    .join(', ');
}

function listConditions(rows: any[]): string {
  const active = rows.filter((c) => !c.status || c.status === 'Active');
  const list = active.length ? active : rows;
  return list
    .map((c) => {
      const parts = [c.name];
      if (c.diagnosed_on) parts.push(`since ${fmtDate(c.diagnosed_on)}`);
      return parts.join(' ');
    })
    .join('; ');
}

function conditionYesNo(names: string[], keywords: string[]): string {
  const hit = names.some((n) => keywords.some((kw) => n.includes(kw)));
  return hit ? 'Yes' : 'No';
}

function immunizationMap(rows: any[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    const name = (row.vaccine || '').toLowerCase();
    const val = row.administered_on
      ? `${row.vaccine}${row.provider ? ` — ${row.provider}` : ''} (${fmtDate(row.administered_on)})`
      : row.vaccine || '';
    if (name.includes('covid')) map.covid_19_vaccine = val;
    else if (name.includes('flu') || name.includes('influenza')) map.influenza = val;
    else if (name.includes('tdap') || name.includes('tetanus')) map.tetanus_diphtheria_pertussis_tdap = val;
    else if (name.includes('mmr') || name.includes('measles')) map.mmr_measles_mumps_rubella = val;
    else if (name.includes('varicella') || name.includes('chicken')) map.varicella_chickenpox = val;
    else if (name.includes('hepatitis a')) map.hepatitis_a = val;
    else if (name.includes('hepatitis b')) map.hepatitis_b = val;
    else if (name.includes('pneum')) map.pneumococcal = val;
    else if (name.includes('shingles') || name.includes('zoster')) map.shingles_zoster = val;
  }
  return map;
}

/** Load everything we might need to pre-fill any form for this user. */
export async function loadFormAutofillContext(userId: string): Promise<FormAutofillContext> {
  const ctx = EMPTY_CONTEXT(userId);
  if (!userId) return ctx;

  try {
    const [
      userRes,
      patientRes,
      medsRes,
      allergiesRes,
      conditionsRes,
      immunizationsRes,
      insuranceRes,
      providersRes,
      pharmaciesRes,
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('patient_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('medications').select('name, dosage, frequency, prescribed_by, start_date, end_date').eq('user_id', userId).order('name'),
      supabase.from('allergies').select('allergen, reaction, severity').eq('user_id', userId).order('allergen'),
      supabase.from('conditions').select('name, status, diagnosed_on, notes').eq('user_id', userId).order('name'),
      supabase.from('immunizations').select('vaccine, administered_on, provider').eq('user_id', userId).order('administered_on', { ascending: false }),
      supabase
        .from('insurance_coverages')
        .select('plan_name, member_id_hash, group_number, insurance_providers(name)')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .maybeSingle(),
      supabase.from('providers').select('name, phone, relationship, specialty').eq('user_id', userId).order('name'),
      supabase.from('pharmacies').select('name, phone, preferred').eq('user_id', userId).order('preferred', { ascending: false }),
    ]);

    const user = userRes.data;
    const patient = patientRes.data;

    if (user) {
      ctx.firstName = user.first_name || '';
      ctx.lastName = user.last_name || '';
      ctx.fullName = `${ctx.firstName} ${ctx.lastName}`.trim();
      ctx.dateOfBirth = fmtDate(user.date_of_birth);
      ctx.email = user.email || '';
      ctx.phone = user.phone || '';
      ctx.gender = user.gender || '';
      if (user.last4_ssn) ctx.ssnMasked = `***-**-${user.last4_ssn}`;
      ctx.street = user.address_line1 || user.address?.street || '';
      ctx.city = user.city || user.address?.city || '';
      ctx.state = user.state || user.address?.state || '';
      ctx.zipCode = user.postal_code || user.address?.zip_code || '';
      const ec = user.emergency_contact;
      if (ec && typeof ec === 'object') {
        ctx.emergencyName = ec.name || ctx.emergencyName;
        ctx.emergencyRelationship = ec.relationship || ctx.emergencyRelationship;
        ctx.emergencyPhone = ec.phone || ctx.emergencyPhone;
      }
    }

    if (patient) {
      ctx.bloodType = patient.blood_type || ctx.bloodType;
      ctx.emergencyName = patient.emergency_contact_name || ctx.emergencyName;
      ctx.emergencyRelationship = patient.emergency_contact_relationship || ctx.emergencyRelationship;
      ctx.emergencyPhone = patient.emergency_contact_phone || ctx.emergencyPhone;
      ctx.phone = ctx.phone || patient.contact_phone || '';
      ctx.email = ctx.email || patient.contact_email || '';
      if (!ctx.fullName && patient.name) ctx.fullName = patient.name;
      if (!ctx.dateOfBirth && patient.birth_date) ctx.dateOfBirth = fmtDate(patient.birth_date);
    }

    ctx.billingAddress = [ctx.street, ctx.city, ctx.state, ctx.zipCode].filter(Boolean).join(', ');

    const meds = medsRes.data || [];
    const allergies = allergiesRes.data || [];
    const conditions = conditionsRes.data || [];
    ctx.medicationsText = listMedications(meds);
    ctx.allergiesText = listAllergies(allergies);
    ctx.conditionsText = listConditions(conditions);
    ctx.conditionNames = conditions.map((c) => (c.name || '').toLowerCase());
    ctx.immunizations = immunizationMap(immunizationsRes.data || []);

    const providers = providersRes.data || [];
    const pcp =
      providers.find((p) => p.relationship === 'Primary') ||
      providers.find((p) => (p.specialty || '').toLowerCase().includes('primary')) ||
      providers[0];
    if (pcp) {
      ctx.pcpName = pcp.name || '';
      ctx.pcpPhone = pcp.phone || '';
    }

    const pharmacies = pharmaciesRes.data || [];
    const preferred = pharmacies.find((p) => p.preferred) || pharmacies[0];
    if (preferred) {
      ctx.pharmacyName = preferred.name || '';
      ctx.pharmacyPhone = preferred.phone || '';
    }

    const ins = insuranceRes.data as any;
    if (ins) {
      ctx.insuranceProvider = ins.insurance_providers?.name || ins.plan_name || '';
      ctx.insuranceMemberId = ins.member_id_hash || '';
      ctx.insuranceGroup = ins.group_number || '';
      ctx.insurancePlan = ins.plan_name || '';
    }

    return ctx;
  } catch (err) {
    console.error('Failed to load form autofill context:', err);
    return ctx;
  }
}

/** Map a catalog field key → value from the user's profile/clinical data. */
function valueForFieldKey(key: string, ctx: FormAutofillContext, templateId: string): string {
  const k = key.toLowerCase();
  const today = todayFormatted();

  // Demographics & contact (shared across many forms)
  const direct: Record<string, string | undefined> = {
    first_name: ctx.firstName,
    middle_name: '',
    last_name: ctx.lastName,
    patient_name: ctx.fullName,
    responsible_party_name: ctx.fullName,
    date_of_birth: ctx.dateOfBirth,
    policy_holder_date_of_birth: ctx.dateOfBirth,
    gender: ctx.gender,
    social_security_number: ctx.ssnMasked,
    phone_number: ctx.phone,
    phone_number_for_calls: ctx.phone,
    text_message_number: ctx.phone,
    email_address: ctx.email,
    street_address: ctx.street,
    billing_address_line_1: ctx.street,
    city: ctx.city,
    state: ctx.state,
    zip_code: ctx.zipCode,
    billing_address: ctx.billingAddress,
    emergency_contact_name: ctx.emergencyName,
    primary_contact_name: ctx.emergencyName,
    emergency_contact_relationship: ctx.emergencyRelationship,
    relationship: ctx.emergencyRelationship,
    emergency_contact_phone: ctx.emergencyPhone,
    phone_number_2: ctx.emergencyPhone,
    secondary_contact_name: ctx.secondaryEmergencyName,
    secondary_phone: ctx.secondaryEmergencyPhone,
    secondary_email: '',
    blood_type: ctx.bloodType,
    primary_language: ctx.language,
    preferred_language: ctx.language,
    language_preference: ctx.language,
    preferred_pharmacy: ctx.pharmacyName,
    pharmacy_phone: ctx.pharmacyPhone,
    primary_care_physician: ctx.pcpName,
    pcp_phone_number: ctx.pcpPhone,
    physician_phone: ctx.pcpPhone,
    known_allergies: ctx.allergiesText,
    drug_allergies: ctx.allergiesText,
    food_allergies: ctx.allergiesText,
    environmental_allergies: ctx.allergiesText,
    current_medications: ctx.medicationsText,
    current_medical_conditions: ctx.conditionsText,
    over_the_counter_medications: ctx.medicationsText,
    primary_insurance_provider: ctx.insuranceProvider,
    policy_number: ctx.insuranceMemberId,
    group_number: ctx.insuranceGroup,
    policy_holder_name: ctx.fullName,
    relationship_to_patient: 'Self',
    secondary_insurance_provider: '',
    secondary_policy_number: '',
    patient_signature: ctx.fullName,
    signature: ctx.fullName,
    authorization_date: today,
    signature_date: today,
    notice_received_date: today,
    agreement: 'I agree to pay for all services rendered',
    acknowledgment: 'I acknowledge that I have received the Notice of Privacy Practices',
    consent_given_for: 'General medical treatment, diagnostic procedures, and routine care',
    understood_risks: 'I understand that all medical treatments carry some risk',
    right_to_refuse: 'I understand I have the right to refuse treatment',
    types_of_information_to_share: 'All medical records, test results, and treatment information',
    purpose_of_disclosure: 'Continuity of care, emergency situations',
    expiration_date: oneYearFromToday(),
    preferred_contact_method: ctx.email ? 'Email' : ctx.phone ? 'Phone' : '',
    appointment_reminder_preference: ctx.email ? 'Email and text' : 'Phone call',
  };

  if (direct[k]) return direct[k]!;

  // Immunization-specific fields
  if (ctx.immunizations[k]) return ctx.immunizations[k];

  // Medication slots 1–3
  if (k.startsWith('medication_') && k.endsWith('_name')) {
    const idx = parseInt(k.replace(/\D/g, ''), 10) - 1;
    const parts = ctx.medicationsText.split(', ');
    return parts[idx]?.split(' — ')[0] || '';
  }
  if (k.startsWith('medication_') && k.endsWith('_dosage')) {
    const idx = parseInt(k.replace(/\D/g, ''), 10) - 1;
    const parts = ctx.medicationsText.split(', ');
    const seg = parts[idx];
    return seg?.includes(' — ') ? seg.split(' — ').slice(1).join(' — ') : '';
  }
  if (k.startsWith('medication_') && k.endsWith('_prescriber')) {
    return ctx.pcpName;
  }

  // Condition yes/no fields on medical-history
  if (templateId === 'medical-history') {
    if (k === 'diabetes') return conditionYesNo(ctx.conditionNames, ['diabetes']);
    if (k === 'high_blood_pressure') return conditionYesNo(ctx.conditionNames, ['hypertension', 'blood pressure']);
    if (k === 'heart_disease') return conditionYesNo(ctx.conditionNames, ['heart', 'cardiac', 'coronary']);
    if (k === 'cancer_history') return conditionYesNo(ctx.conditionNames, ['cancer', 'malignant', 'tumor']);
  }

  return '';
}

/** Build autofill answers for a template from profile/clinical data. */
export function buildAutofillAnswers(
  template: FormTemplateDef,
  ctx: FormAutofillContext,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of template.fields) {
    const val = valueForFieldKey(field.key, ctx, template.id);
    if (val) out[field.key] = val;
  }
  return out;
}

/** Saved answers win; autofill fills any empty/missing fields. */
export function mergeFormAnswers(
  saved: Record<string, string> | null | undefined,
  autofill: Record<string, string>,
): Record<string, string> {
  const merged = { ...autofill };
  if (saved) {
    for (const [key, val] of Object.entries(saved)) {
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        merged[key] = String(val);
      }
    }
  }
  return merged;
}

/** Convenience: autofill for a template id. */
export function autofillForTemplate(
  templateId: string,
  ctx: FormAutofillContext,
  saved?: Record<string, string> | null,
): Record<string, string> {
  const template = getTemplate(templateId);
  if (!template) return saved ? { ...saved } : {};
  return mergeFormAnswers(saved, buildAutofillAnswers(template, ctx));
}

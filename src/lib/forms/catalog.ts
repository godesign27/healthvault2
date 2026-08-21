// Single source of truth for the Medical Forms catalog (structure only).
// Field *values* live in `form_responses.answers_json` in Supabase, keyed by `field.key`.
// `field.key` is the slugified label, which the `share` Edge Function humanizes back into
// a readable label when rendering the PDF packet.

export type FormFieldType = 'text' | 'textarea' | 'select' | 'date' | 'tel' | 'email';

export interface FormFieldDef {
  key: string;
  label: string;
  type: FormFieldType;
  options?: string[];
  placeholder?: string;
}

export interface FormTemplateDef {
  id: string;
  title: string;
  description: string;
  category: string;
  fields: FormFieldDef[];
}

export function fieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Helper to declare fields tersely; computes a stable key from the label.
function f(
  label: string,
  type: FormFieldType = 'text',
  extra?: { options?: string[]; placeholder?: string },
): FormFieldDef {
  return { key: fieldKey(label), label, type, ...extra };
}

export const FORM_TEMPLATES: FormTemplateDef[] = [
  {
    id: 'patient-reg',
    title: 'Patient Registration',
    description: 'Basic demographics, contact, and emergency contacts.',
    category: 'Identification',
    fields: [
      f('First Name'),
      f('Middle Name'),
      f('Last Name'),
      f('Date of Birth', 'date'),
      f('Gender', 'select', { options: ['Male', 'Female', 'Other', 'Prefer not to say'] }),
      f('Social Security Number'),
      f('Phone Number', 'tel'),
      f('Email Address', 'email'),
      f('Street Address'),
      f('City'),
      f('State', 'select', { options: ['Illinois', 'California', 'New York', 'Texas'] }),
      f('ZIP Code'),
      f('Emergency Contact Name'),
      f('Emergency Contact Relationship'),
      f('Emergency Contact Phone', 'tel'),
    ],
  },
  {
    id: 'medical-id',
    title: 'Medical ID Information',
    description: 'Allergies, meds, providers, pharmacy, and blood type.',
    category: 'Identification',
    fields: [
      f('Blood Type', 'select', { options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }),
      f('Primary Language', 'select', { options: ['English', 'Spanish', 'Chinese', 'Other'] }),
      f('Preferred Pharmacy'),
      f('Pharmacy Phone', 'tel'),
      f('Primary Care Physician'),
      f('Physician Phone', 'tel'),
      f('Known Allergies', 'textarea'),
      f('Current Medications', 'textarea'),
    ],
  },
  {
    id: 'medical-history',
    title: 'Medical History',
    description: 'Past conditions, surgeries, hospitalizations, family history.',
    category: 'Identification',
    fields: [
      f('Reason for Visit', 'textarea', { placeholder: 'Describe your chief complaint or reason for this visit' }),
      f('Current Medical Conditions', 'textarea', { placeholder: 'List all current medical conditions with year started' }),
      f('Diabetes', 'select', { options: ['No', 'Yes - Type 1', 'Yes - Type 2', 'Prediabetes'] }),
      f('High Blood Pressure', 'select', { options: ['No', 'Yes', 'Borderline'] }),
      f('Heart Disease', 'select', { options: ['No', 'Yes'] }),
      f('Cancer History', 'select', { options: ['No', 'Yes'] }),
      f('Cancer Details', 'textarea', { placeholder: 'If yes, specify type and year' }),
      f('Family History - Heart Disease', 'textarea', { placeholder: 'List family members and their age of diagnosis' }),
      f('Family History - Diabetes', 'textarea', { placeholder: 'List family members and their age of diagnosis' }),
      f('Family History - Cancer', 'textarea', { placeholder: 'List family members, type of cancer, and age of diagnosis' }),
      f('Known Allergies', 'textarea', { placeholder: 'List allergens and reactions' }),
      f('Current Medications', 'textarea', { placeholder: 'Include medication name and dosage' }),
      f('Previous Surgeries', 'textarea', { placeholder: 'List surgical procedures and dates' }),
      f('Past Hospitalizations', 'textarea', { placeholder: 'List hospitalizations and dates' }),
      f('Occupation'),
      f('Smoking Status', 'select', { options: ['Never smoker', 'Current daily smoker', 'Current some-day smoker', 'Former smoker', 'Former smoker - status unknown'] }),
      f('Alcohol Use', 'textarea', { placeholder: 'Frequency and amount' }),
      f('Other Relevant Information', 'textarea', { placeholder: 'Any other information we should know?' }),
    ],
  },
  {
    id: 'hipaa',
    title: 'HIPAA Authorization & Privacy',
    description: 'Consent to use/disclose health info per HIPAA.',
    category: 'Legal & Consent',
    fields: [
      f('Authorization Date', 'date'),
      f('Authorized Individuals', 'textarea'),
      f('Types of Information to Share', 'textarea'),
      f('Purpose of Disclosure', 'textarea'),
      f('Expiration Date', 'date'),
      f('Patient Signature'),
      f('Signature Date', 'date'),
    ],
  },
  {
    id: 'consent-treat',
    title: 'Consent to Treat',
    description: 'General consent for medical treatment and procedures.',
    category: 'Legal & Consent',
    fields: [
      f('Patient Name'),
      f('Date of Birth', 'date'),
      f('Consent Given For', 'textarea'),
      f('Understood Risks', 'textarea'),
      f('Right to Refuse', 'textarea'),
      f('Patient Signature'),
      f('Signature Date', 'date'),
    ],
  },
  {
    id: 'privacy-practices',
    title: 'Notice of Privacy Practices',
    description: 'Acknowledgment of receipt of privacy notice.',
    category: 'Legal & Consent',
    fields: [
      f('Notice Received Date', 'date'),
      f('Patient Name'),
      f('Acknowledgment', 'textarea', { placeholder: 'I acknowledge that I have received the Notice of Privacy Practices' }),
      f('Patient Signature'),
      f('Signature Date', 'date'),
    ],
  },
  {
    id: 'release-info',
    title: 'Release of Information',
    description: 'Authorization to release medical records to third parties.',
    category: 'Legal & Consent',
    fields: [
      f('Patient Name'),
      f('Date of Birth', 'date'),
      f('Release Information To', 'text', { placeholder: 'Name of organization or individual' }),
      f('Address', 'textarea'),
      f('Phone Number', 'tel'),
      f('Information to Release', 'textarea', { placeholder: 'Specify records to be released' }),
      f('Purpose of Release', 'textarea'),
      f('Expiration Date', 'date'),
    ],
  },
  {
    id: 'advance-directives',
    title: 'Advance Directives',
    description: 'Living will, healthcare proxy, and end-of-life wishes.',
    category: 'Care Preferences',
    fields: [
      f('Patient Name'),
      f('Healthcare Proxy', 'text', { placeholder: 'Name of designated healthcare agent' }),
      f('Proxy Phone Number', 'tel'),
      f('Alternate Proxy'),
      f('Life-Sustaining Treatment Preferences', 'textarea'),
      f('Organ Donation Wishes', 'select', { options: ['Yes, all organs', 'Yes, specific organs', 'No', 'Not decided'] }),
      f('DNR Order', 'select', { options: ['Yes', 'No', 'Not decided'] }),
      f('Additional Instructions', 'textarea'),
    ],
  },
  {
    id: 'emergency-contact',
    title: 'Emergency Contact Information',
    description: 'People to contact in case of medical emergency.',
    category: 'Care Preferences',
    fields: [
      f('Primary Contact Name'),
      f('Relationship'),
      f('Phone Number', 'tel'),
      f('Email', 'email'),
      f('Secondary Contact Name'),
      f('Secondary Relationship'),
      f('Secondary Phone', 'tel'),
      f('Secondary Email', 'email'),
    ],
  },
  {
    id: 'communication-prefs',
    title: 'Communication Preferences',
    description: 'Preferred methods and times for contact.',
    category: 'Care Preferences',
    fields: [
      f('Preferred Contact Method', 'select', { options: ['Phone', 'Email', 'Text Message', 'Mail'] }),
      f('Best Time to Contact', 'select', { options: ['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Weekends', 'Anytime'] }),
      f('Phone Number for Calls', 'tel'),
      f('Email Address', 'email'),
      f('Text Message Number', 'tel'),
      f('Appointment Reminder Preference', 'select', { options: ['Phone call', 'Email', 'Text message', 'Email and text', 'No reminders'] }),
      f('Language Preference', 'select', { options: ['English', 'Spanish', 'Chinese', 'Other'] }),
    ],
  },
  {
    id: 'cultural-accessibility',
    title: 'Cultural & Accessibility Preferences',
    description: 'Cultural, religious, and accessibility considerations.',
    category: 'Care Preferences',
    fields: [
      f('Preferred Language', 'select', { options: ['English', 'Spanish', 'Chinese', 'Other'] }),
      f('Need Interpreter', 'select', { options: ['Yes', 'No'] }),
      f('Religious Considerations', 'textarea', { placeholder: 'Any religious or spiritual preferences for care' }),
      f('Cultural Considerations', 'textarea', { placeholder: 'Any cultural preferences or practices' }),
      f('Dietary Restrictions', 'textarea'),
      f('Mobility Assistance Needed', 'select', { options: ['None', 'Wheelchair', 'Walker', 'Cane', 'Other'] }),
      f('Visual Assistance Needed', 'select', { options: ['None', 'Large print', 'Screen reader', 'Other'] }),
      f('Hearing Assistance Needed', 'select', { options: ['None', 'Sign language interpreter', 'Hearing aids', 'Other'] }),
    ],
  },
  {
    id: 'insurance-info',
    title: 'Insurance Information',
    description: 'Primary/secondary insurance and card uploads.',
    category: 'Insurance & Billing',
    fields: [
      f('Primary Insurance Provider'),
      f('Policy Number'),
      f('Group Number'),
      f('Policy Holder Name'),
      f('Policy Holder Date of Birth', 'date'),
      f('Relationship to Patient', 'select', { options: ['Self', 'Spouse', 'Parent', 'Child', 'Other'] }),
      f('Secondary Insurance Provider'),
      f('Secondary Policy Number'),
    ],
  },
  {
    id: 'financial-responsibility',
    title: 'Financial Responsibility Agreement',
    description: 'Agreement for payment of services rendered.',
    category: 'Insurance & Billing',
    fields: [
      f('Patient Name'),
      f('Date of Birth', 'date'),
      f('Responsible Party Name'),
      f('Relationship to Patient', 'select', { options: ['Self', 'Spouse', 'Parent', 'Guardian', 'Other'] }),
      f('Billing Address', 'textarea'),
      f('Phone Number', 'tel'),
      f('Agreement', 'textarea'),
      f('Signature'),
      f('Signature Date', 'date'),
    ],
  },
  {
    id: 'payment-info',
    title: 'Payment Information',
    description: 'Billing address and payment method details.',
    category: 'Insurance & Billing',
    fields: [
      f('Billing Address Line 1'),
      f('Billing Address Line 2'),
      f('City'),
      f('State', 'select', { options: ['Illinois', 'California', 'New York', 'Texas'] }),
      f('ZIP Code'),
      f('Payment Method', 'select', { options: ['Credit Card', 'Debit Card', 'Check', 'Cash', 'Insurance'] }),
      f('Card Last 4 Digits', 'text', { placeholder: 'Last 4 digits only' }),
    ],
  },
  {
    id: 'social-history',
    title: 'Social History',
    description: 'Smoking, alcohol, exercise, and social habits.',
    category: 'Health & Lifestyle',
    fields: [
      f('Tobacco Use', 'select', { options: ['Never', 'Former', 'Current'] }),
      f('If Former/Current, Details', 'textarea'),
      f('Alcohol Use', 'select', { options: ['Never', 'Occasional', 'Regular', 'Heavy'] }),
      f('Alcohol Details', 'textarea'),
      f('Exercise Frequency', 'select', { options: ['Never', '1-2 times/week', '3-4 times/week', '5+ times/week', 'Daily'] }),
      f('Exercise Type', 'textarea'),
      f('Occupation'),
      f('Living Situation', 'select', { options: ['Lives alone', 'Lives with spouse', 'Lives with family', 'Assisted living', 'Other'] }),
      f('Diet Type', 'select', { options: ['Regular', 'Vegetarian', 'Vegan', 'Low sodium', 'Diabetic', 'Other'] }),
    ],
  },
  {
    id: 'current-medications',
    title: 'Current Medications',
    description: 'List of all current medications and supplements.',
    category: 'Health & Lifestyle',
    fields: [
      f('Medication 1 Name'),
      f('Medication 1 Dosage'),
      f('Medication 1 Prescriber'),
      f('Medication 2 Name'),
      f('Medication 2 Dosage'),
      f('Medication 2 Prescriber'),
      f('Medication 3 Name'),
      f('Medication 3 Dosage'),
      f('Medication 3 Prescriber'),
      f('Over-the-Counter Medications', 'textarea'),
      f('Supplements', 'textarea'),
    ],
  },
  {
    id: 'allergy-info',
    title: 'Allergy Information',
    description: 'Known allergies to medications, foods, and substances.',
    category: 'Health & Lifestyle',
    fields: [
      f('Drug Allergies', 'textarea'),
      f('Food Allergies', 'textarea'),
      f('Environmental Allergies', 'textarea'),
      f('Latex Allergy', 'select', { options: ['Yes', 'No', 'Unknown'] }),
      f('Other Allergies', 'textarea'),
      f('Allergy Reactions', 'textarea', { placeholder: 'Describe typical reactions' }),
      f('Carries EpiPen', 'select', { options: ['Yes', 'No'] }),
    ],
  },
  {
    id: 'immunization-record',
    title: 'Immunization Record',
    description: 'Vaccination history and immunization records.',
    category: 'Health & Lifestyle',
    fields: [
      f('COVID-19 Vaccine'),
      f('Influenza'),
      f('Tetanus/Diphtheria/Pertussis (Tdap)'),
      f('MMR (Measles, Mumps, Rubella)'),
      f('Varicella (Chickenpox)'),
      f('Hepatitis A'),
      f('Hepatitis B'),
      f('Pneumococcal'),
      f('Shingles (Zoster)'),
    ],
  },
];

// Stable category order for rendering the list.
export const FORM_CATEGORY_ORDER = [
  'Identification',
  'Legal & Consent',
  'Care Preferences',
  'Insurance & Billing',
  'Health & Lifestyle',
];

export const FORM_TEMPLATE_VERSION = '2025.01';

export function getTemplate(id: string): FormTemplateDef | undefined {
  return FORM_TEMPLATES.find((t) => t.id === id);
}

export function getTemplateTitle(id: string): string {
  return getTemplate(id)?.title ?? id;
}

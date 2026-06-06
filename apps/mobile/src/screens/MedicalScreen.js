import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Steel palette — match RecordsScreen / CareScreen */
const STEEL = {
  canvas: 'transparent',
  surface: '#FFFFFF',
  border: '#D1D5E0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#4F46E5',
  accentBg: '#EEF2FF',
  success: '#10B981',
  successDark: '#059669',
  orange: '#EA580C',
  orangeBg: '#FFF7ED',
  navy: '#0F172A',
  coral: '#E53935',
  danger: '#EF4444',
};

const mockStats = {
  completed: 4,
  incomplete: 14,
  completionPct: 22,
  sharedWith: 15,
  total: 18,
};

const mockFormGroupsSeed = [
  {
    id: 'identification',
    title: 'Identification',
    completed: 2,
    total: 3,
    forms: [
      {
        id: 'patient-reg',
        name: 'Patient Registration',
        desc: 'Basic demographics, contact, and emergency contacts.',
        status: 'complete',
        version: 'v1.0',
        signedAt: '5/12/2026, 8:35:22 PM',
      },
      {
        id: 'medical-id',
        name: 'Medical ID Information',
        desc: 'Allergies, meds, providers, pharmacy, and blood type.',
        status: 'complete',
        version: 'v1.0',
        signedAt: '5/12/2026, 8:35:22 PM',
      },
      {
        id: 'medical-history',
        name: 'Medical History',
        desc: 'Past conditions, surgeries, hospitalizations, family history.',
        status: 'incomplete',
      },
    ],
  },
  {
    id: 'legal',
    title: 'Legal & Consent',
    completed: 1,
    total: 4,
    forms: [
      {
        id: 'hipaa',
        name: 'HIPAA Authorization & Privacy',
        desc: 'Consent to use/disclose health info per HIPAA.',
        status: 'complete',
      },
      {
        id: 'consent-treat',
        name: 'Consent to Treat',
        desc: 'Authorization for medical treatment.',
        status: 'incomplete',
      },
      {
        id: 'advance-directive',
        name: 'Advance Directive',
        desc: 'Living will and healthcare power of attorney.',
        status: 'incomplete',
      },
      {
        id: 'research',
        name: 'Research & Data Sharing',
        desc: 'Optional consent for research participation.',
        status: 'incomplete',
      },
    ],
  },
  {
    id: 'insurance',
    title: 'Insurance & Billing',
    completed: 1,
    total: 3,
    forms: [
      {
        id: 'insurance-info',
        name: 'Insurance Information',
        desc: 'Primary/secondary insurance and card uploads.',
        status: 'complete',
      },
      {
        id: 'financial-resp',
        name: 'Financial Responsibility Agreement',
        desc: 'Agreement for payment of services rendered.',
        status: 'incomplete',
      },
      {
        id: 'payment-info',
        name: 'Payment Information',
        desc: 'Billing address and payment method details.',
        status: 'incomplete',
      },
    ],
  },
  {
    id: 'health-lifestyle',
    title: 'Health & Lifestyle',
    completed: 0,
    total: 4,
    forms: [
      {
        id: 'social-history',
        name: 'Social History',
        desc: 'Smoking, alcohol, exercise, and social habits.',
        status: 'incomplete',
      },
      {
        id: 'nutrition',
        name: 'Nutrition & Diet',
        desc: 'Dietary preferences, restrictions, and habits.',
        status: 'incomplete',
      },
      {
        id: 'mental-health',
        name: 'Mental Health History',
        desc: 'Mental health conditions and treatment history.',
        status: 'incomplete',
      },
      {
        id: 'substance-use',
        name: 'Substance Use History',
        desc: 'Tobacco, alcohol, and substance use history.',
        status: 'incomplete',
      },
    ],
  },
  {
    id: 'preventive',
    title: 'Preventive Care',
    completed: 0,
    total: 2,
    forms: [
      {
        id: 'immunization',
        name: 'Immunization Records',
        desc: 'Vaccination history and upcoming immunizations.',
        status: 'incomplete',
      },
      {
        id: 'screening',
        name: 'Screening History',
        desc: 'Cancer screenings, vision, dental check history.',
        status: 'incomplete',
      },
    ],
  },
  {
    id: 'emergency',
    title: 'Emergency',
    completed: 0,
    total: 2,
    forms: [
      {
        id: 'emergency-contacts',
        name: 'Emergency Contacts',
        desc: 'Primary and secondary emergency contact info.',
        status: 'incomplete',
      },
      {
        id: 'dnr',
        name: 'Do Not Resuscitate (DNR)',
        desc: 'DNR orders and end-of-life preferences.',
        status: 'incomplete',
      },
    ],
  },
];

const mockMedicalIDData = {
  bloodType: 'O+',
  primaryLanguage: 'English',
  preferredPharmacy: 'Walgreens',
  pharmacyPhone: '773-724-0473',
  primaryCarePhysician: 'Dr. Sarah Johnson',
  physicianPhone: '(555) 234-5678',
  knownAllergies: 'None',
  currentMedications: 'Albuterol Inhaler, Fluticasone Propionate, Montelukast',
};

const BLOOD_CODES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function bloodCodeToLabel(code) {
  const map = {
    'A+': 'A Positive',
    'A-': 'A Negative',
    'B+': 'B Positive',
    'B-': 'B Negative',
    'O+': 'O Positive',
    'O-': 'O Negative',
    'AB+': 'AB Positive',
    'AB-': 'AB Negative',
  };
  return map[code] || code;
}

/** Static completed-form defaults (from desktop FormDrawer). Incomplete forms use blanks at runtime. */
const COMPLETE_DEFAULTS = {
  'patient-reg': {
    'First Name': 'Timothy',
    'Middle Name': 'James',
    'Last Name': 'McGuire',
    'Date of Birth': '10/12/1967',
    Gender: 'Male',
    'Social Security Number': '***-**-4532',
    'Phone Number': '(555) 123-4567',
    'Email Address': 'godesigngo@gmail.com',
    'Street Address': '123 Main Street',
    City: 'Chicago',
    State: 'Illinois',
    'ZIP Code': '60601',
    'Emergency Contact Name': 'Jane McGuire',
    'Emergency Contact Relationship': 'Spouse',
    'Emergency Contact Phone': '(555) 987-6543',
  },
  'medical-id': {
    'Blood Type': 'O+',
    'Primary Language': 'English',
    'Preferred Pharmacy': 'Walgreens',
    'Pharmacy Phone': '773-724-0473',
    'Primary Care Physician': 'Dr. Sarah Johnson',
    'Physician Phone': '(555) 234-5678',
    'Known Allergies': 'None',
    'Current Medications': 'Albuterol Inhaler, Fluticasone Propionate, Montelukast',
  },
  hipaa: {
    'Authorization Date': '01/15/2024',
    'Authorized Individuals': 'Jane McGuire (Spouse)',
    'Types of Information to Share': 'All medical records, test results, treatment information',
    'Purpose of Disclosure': 'Continuity of care, Emergency situations',
    'Expiration Date': '01/15/2025',
    'Patient Signature': 'Timothy McGuire',
    'Signature Date': '01/15/2024',
  },
  'insurance-info': {
    'Primary Insurance Provider': 'Blue Cross Blue Shield',
    'Policy Number': 'BC123456789',
    'Group Number': 'GRP987654',
    'Policy Holder Name': 'Timothy McGuire',
    'Policy Holder Date of Birth': '10/12/1967',
    'Relationship to Patient': 'Self',
    'Secondary Insurance Provider': '',
    'Secondary Policy Number': '',
  },
};

/** Field templates: label, type, options?, placeholder? — mirrors src/components/FormDrawer.tsx */
function getFieldDefs(formId) {
  const defs = {
    'patient-reg': [
      { label: 'First Name', type: 'text' },
      { label: 'Middle Name', type: 'text' },
      { label: 'Last Name', type: 'text' },
      { label: 'Date of Birth', type: 'text' },
      { label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
      { label: 'Social Security Number', type: 'text' },
      { label: 'Phone Number', type: 'tel' },
      { label: 'Email Address', type: 'email' },
      { label: 'Street Address', type: 'text' },
      { label: 'City', type: 'text' },
      { label: 'State', type: 'select', options: ['Illinois', 'California', 'New York', 'Texas'] },
      { label: 'ZIP Code', type: 'text' },
      { label: 'Emergency Contact Name', type: 'text' },
      { label: 'Emergency Contact Relationship', type: 'text' },
      { label: 'Emergency Contact Phone', type: 'tel' },
    ],
    'medical-id': [
      { label: 'Blood Type', type: 'select', options: BLOOD_CODES },
      { label: 'Primary Language', type: 'text' },
      { label: 'Preferred Pharmacy', type: 'text' },
      { label: 'Pharmacy Phone', type: 'tel' },
      { label: 'Primary Care Physician', type: 'text' },
      { label: 'Physician Phone', type: 'tel' },
      { label: 'Known Allergies', type: 'textarea' },
      { label: 'Current Medications', type: 'textarea' },
    ],
    'medical-history': [
      { label: 'Reason for Visit', type: 'textarea', placeholder: 'Chief complaint or reason for visit' },
      { label: 'Current Medical Conditions', type: 'textarea', placeholder: 'List conditions with year started' },
      { label: 'Previous Surgeries', type: 'textarea', placeholder: 'Procedures and dates' },
      { label: 'Past Hospitalizations', type: 'textarea' },
      { label: 'Family History', type: 'textarea', placeholder: 'Significant family history' },
      { label: 'Known Allergies', type: 'textarea' },
      { label: 'Current Medications', type: 'textarea' },
    ],
    hipaa: [
      { label: 'Authorization Date', type: 'text' },
      { label: 'Authorized Individuals', type: 'textarea' },
      { label: 'Types of Information to Share', type: 'textarea' },
      { label: 'Purpose of Disclosure', type: 'textarea' },
      { label: 'Expiration Date', type: 'text' },
      { label: 'Patient Signature', type: 'text' },
      { label: 'Signature Date', type: 'text' },
    ],
    'consent-treat': [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'text' },
      { label: 'Consent Given For', type: 'textarea' },
      { label: 'Understood Risks', type: 'textarea' },
      { label: 'Right to Refuse', type: 'textarea' },
      { label: 'Patient Signature', type: 'text' },
      { label: 'Signature Date', type: 'text' },
    ],
    'advance-directive': [
      { label: 'Patient Name', type: 'text' },
      { label: 'Healthcare Proxy', type: 'text', placeholder: 'Designated healthcare agent' },
      { label: 'Proxy Phone Number', type: 'tel' },
      { label: 'Alternate Proxy', type: 'text' },
      { label: 'Life-Sustaining Treatment Preferences', type: 'textarea' },
      { label: 'Organ Donation Wishes', type: 'select', options: ['Yes, all organs', 'Yes, specific organs', 'No', 'Not decided'] },
      { label: 'DNR Order', type: 'select', options: ['Yes', 'No', 'Not decided'] },
      { label: 'Additional Instructions', type: 'textarea' },
    ],
    research: [
      { label: 'Participate in Research', type: 'select', options: ['Yes', 'No', 'Contact me first'] },
      { label: 'Data Sharing Scope', type: 'textarea', placeholder: 'Optional: describe what you consent to share' },
      { label: 'Patient Signature', type: 'text' },
      { label: 'Signature Date', type: 'text' },
    ],
    'insurance-info': [
      { label: 'Primary Insurance Provider', type: 'text' },
      { label: 'Policy Number', type: 'text' },
      { label: 'Group Number', type: 'text' },
      { label: 'Policy Holder Name', type: 'text' },
      { label: 'Policy Holder Date of Birth', type: 'text' },
      { label: 'Relationship to Patient', type: 'select', options: ['Self', 'Spouse', 'Parent', 'Child', 'Other'] },
      { label: 'Secondary Insurance Provider', type: 'text' },
      { label: 'Secondary Policy Number', type: 'text' },
    ],
    'financial-resp': [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'text' },
      { label: 'Responsible Party Name', type: 'text' },
      { label: 'Relationship to Patient', type: 'select', options: ['Self', 'Spouse', 'Parent', 'Guardian', 'Other'] },
      { label: 'Billing Address', type: 'textarea' },
      { label: 'Phone Number', type: 'tel' },
      { label: 'Agreement', type: 'textarea' },
      { label: 'Signature', type: 'text' },
      { label: 'Signature Date', type: 'text' },
    ],
    'payment-info': [
      { label: 'Billing Address Line 1', type: 'text' },
      { label: 'Billing Address Line 2', type: 'text' },
      { label: 'City', type: 'text' },
      { label: 'State', type: 'select', options: ['Illinois', 'California', 'New York', 'Texas'] },
      { label: 'ZIP Code', type: 'text' },
      { label: 'Payment Method', type: 'select', options: ['Credit Card', 'Debit Card', 'Check', 'Cash', 'Insurance'] },
      { label: 'Card Last 4 Digits', type: 'text', placeholder: 'Last 4 digits only' },
    ],
    'social-history': [
      { label: 'Tobacco Use', type: 'select', options: ['Never', 'Former', 'Current'] },
      { label: 'If Former/Current, Details', type: 'textarea' },
      { label: 'Alcohol Use', type: 'select', options: ['Never', 'Occasional', 'Regular', 'Heavy'] },
      { label: 'Alcohol Details', type: 'textarea' },
      { label: 'Exercise Frequency', type: 'select', options: ['Never', '1-2 times/week', '3-4 times/week', '5+ times/week', 'Daily'] },
      { label: 'Exercise Type', type: 'textarea' },
      { label: 'Occupation', type: 'text' },
      { label: 'Living Situation', type: 'select', options: ['Lives alone', 'Lives with spouse', 'Lives with family', 'Assisted living', 'Other'] },
      { label: 'Diet Type', type: 'select', options: ['Regular', 'Vegetarian', 'Vegan', 'Low sodium', 'Diabetic', 'Other'] },
    ],
    nutrition: [
      { label: 'Dietary Preferences', type: 'textarea' },
      { label: 'Restrictions / Allergies (food)', type: 'textarea' },
      { label: 'Meals Per Day', type: 'text' },
      { label: 'Fluid Intake (approx.)', type: 'text' },
    ],
    'mental-health': [
      { label: 'Conditions (if any)', type: 'textarea' },
      { label: 'Current Treatment', type: 'textarea' },
      { label: 'Medications (mental health)', type: 'textarea' },
      { label: 'Hospitalizations', type: 'textarea' },
    ],
    'substance-use': [
      { label: 'Tobacco', type: 'textarea' },
      { label: 'Alcohol', type: 'textarea' },
      { label: 'Other Substances', type: 'textarea' },
      { label: 'Treatment / Recovery', type: 'textarea' },
    ],
    immunization: [
      { label: 'COVID-19 Vaccine', type: 'text' },
      { label: 'Influenza', type: 'text' },
      { label: 'Tdap', type: 'text' },
      { label: 'MMR', type: 'text' },
      { label: 'Other / Notes', type: 'textarea' },
    ],
    screening: [
      { label: 'Cancer Screenings', type: 'textarea' },
      { label: 'Vision', type: 'text' },
      { label: 'Dental', type: 'text' },
      { label: 'Other Preventive Visits', type: 'textarea' },
    ],
    'emergency-contacts': [
      { label: 'Primary Contact Name', type: 'text' },
      { label: 'Relationship', type: 'text' },
      { label: 'Phone Number', type: 'tel' },
      { label: 'Email', type: 'email' },
      { label: 'Secondary Contact Name', type: 'text' },
      { label: 'Secondary Relationship', type: 'text' },
      { label: 'Secondary Phone', type: 'tel' },
      { label: 'Secondary Email', type: 'email' },
    ],
    dnr: [
      { label: 'Patient Name', type: 'text' },
      { label: 'DNR on file', type: 'select', options: ['Yes', 'No', 'Discussing with physician'] },
      { label: 'Physician / Facility', type: 'text' },
      { label: 'Order Date', type: 'text' },
      { label: 'Additional wishes', type: 'textarea' },
    ],
  };
  return defs[formId] || [{ label: 'Notes', type: 'textarea', placeholder: 'Enter details for this form.' }];
}

function buildInitialValues(formId, status) {
  const defs = getFieldDefs(formId);
  const out = {};
  const defaults = COMPLETE_DEFAULTS[formId] || {};
  const med = formId === 'medical-id' ? mockMedicalIDData : null;

  defs.forEach((f) => {
    if (status === 'incomplete') {
      out[f.label] = '';
      return;
    }
    if (med && f.label === 'Blood Type') out[f.label] = med.bloodType;
    else if (med && f.label === 'Primary Language') out[f.label] = med.primaryLanguage;
    else if (med && f.label === 'Preferred Pharmacy') out[f.label] = med.preferredPharmacy;
    else if (med && f.label === 'Pharmacy Phone') out[f.label] = med.pharmacyPhone;
    else if (med && f.label === 'Primary Care Physician') out[f.label] = med.primaryCarePhysician;
    else if (med && f.label === 'Physician Phone') out[f.label] = med.physicianPhone;
    else if (med && f.label === 'Known Allergies') out[f.label] = med.knownAllergies;
    else if (med && f.label === 'Current Medications') out[f.label] = med.currentMedications;
    else out[f.label] = defaults[f.label] ?? '';
  });
  return out;
}

function formatDisplayValue(label, raw, type) {
  if (raw === '' || raw == null) return '—';
  if (label === 'Blood Type' && BLOOD_CODES.includes(String(raw))) return bloodCodeToLabel(raw);
  return raw;
}

const mockSharedEventsSeed = [
  {
    id: 's1',
    formTitle: 'HIPAA Authorization & Privacy',
    recipientName: 'Dr. Jane Smith',
    recipientEmail: 'jane.smith@clinic.org',
    sharedDate: 'May 2, 2026',
    status: 'opened',
    method: 'SecureLink',
  },
  {
    id: 's2',
    formTitle: '2 forms',
    recipientName: 'Midwest Imaging',
    recipientEmail: 'records@midwest.example',
    sharedDate: 'Apr 18, 2026',
    status: 'sent',
    method: 'FHIR',
  },
];

function cloneGroups(seed) {
  return seed.map((g) => ({
    ...g,
    forms: g.forms.map((f) => ({ ...f, selected: false })),
  }));
}

export default function MedicalScreen({ omitShellTitle = false, scrollFabProps = {} }) {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState(() => cloneGroups(mockFormGroupsSeed));
  const [valueOverrides, setValueOverrides] = useState({});
  const [sharedEvents, setSharedEvents] = useState(() => mockSharedEventsSeed.map((e) => ({ ...e })));

  const [detailForm, setDetailForm] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareName, setShareName] = useState('');
  const [shareOrg, setShareOrg] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareAgree, setShareAgree] = useState(false);
  const [shareSending, setShareSending] = useState(false);
  const [shareAck, setShareAck] = useState(null);

  const [showSharedWith, setShowSharedWith] = useState(false);

  const [picker, setPicker] = useState(null);

  const selectedCount = useMemo(
    () => groups.reduce((n, g) => n + g.forms.filter((f) => f.selected).length, 0),
    [groups]
  );

  const selectedFormsList = useMemo(() => {
    const list = [];
    groups.forEach((g) => {
      g.forms.forEach((f) => {
        if (f.selected) list.push(f);
      });
    });
    return list;
  }, [groups]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shareEmail.trim());
  const canSendShare = emailOk && shareAgree && selectedFormsList.length > 0 && !shareSending;

  const openForm = useCallback(
    (form) => {
      const base = { ...buildInitialValues(form.id, form.status), ...(valueOverrides[form.id] || {}) };
      setDetailForm(form);
      setEditValues(base);
      setIsEditing(false);
      setShowFormModal(true);
    },
    [valueOverrides]
  );

  const closeForm = () => {
    setShowFormModal(false);
    setDetailForm(null);
    setIsEditing(false);
  };

  const saveEdits = () => {
    if (!detailForm) return;
    setValueOverrides((prev) => ({ ...prev, [detailForm.id]: { ...editValues } }));
    setIsEditing(false);
    if (detailForm.status === 'incomplete') {
      const signedAt = new Date().toLocaleString();
      setGroups((prev) =>
        prev.map((g) => {
          if (!g.forms.some((f) => f.id === detailForm.id)) return g;
          const forms = g.forms.map((f) =>
            f.id === detailForm.id ? { ...f, status: 'complete', version: 'v1.0', signedAt } : f
          );
          const completed = forms.filter((f) => f.status === 'complete').length;
          return { ...g, completed, forms };
        })
      );
      setDetailForm((f) => (f ? { ...f, status: 'complete', version: 'v1.0', signedAt } : null));
    }
  };

  const toggleSelect = (groupId, formId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              forms: g.forms.map((f) => (f.id === formId ? { ...f, selected: !f.selected } : f)),
            }
      )
    );
  };

  const openShareFromRow = (groupId, formId) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        forms: g.forms.map((f) => {
          if (g.id === groupId && f.id === formId) return { ...f, selected: true };
          return f;
        }),
      }))
    );
    setShareAck(null);
    setShowShareModal(true);
  };

  const openShareHeader = () => {
    setShareAck(null);
    setShowShareModal(true);
  };

  const sendShare = () => {
    setShareSending(true);
    setShareAck(null);
    setTimeout(() => {
      setShareSending(false);
      setShareAck('Forms shared successfully (mock).');
      setSharedEvents((prev) => [
        {
          id: `s-${Date.now()}`,
          formTitle: selectedFormsList.length === 1 ? selectedFormsList[0].name : `${selectedFormsList.length} forms`,
          recipientName: shareName.trim() || 'Recipient',
          recipientEmail: shareEmail.trim(),
          sharedDate: new Date().toLocaleDateString(),
          status: 'sent',
          method: 'SecureLink',
        },
        ...prev,
      ]);
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          forms: g.forms.map((f) => ({ ...f, selected: false })),
        }))
      );
      setShareName('');
      setShareOrg('');
      setShareEmail('');
      setShareMessage('');
      setShareAgree(false);
    }, 600);
  };

  const revokeShare = (id) => {
    setSharedEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const fieldDefs = detailForm ? getFieldDefs(detailForm.id) : [];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad} keyboardShouldPersistTaps="handled" {...scrollFabProps}>
        <View style={[styles.headerRow, omitShellTitle && { justifyContent: 'flex-end' }]}>
          {!omitShellTitle ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.nowViewing}>NOW VIEWING</Text>
              <Text style={styles.pageTitle}>Medical</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.shareHeaderBtn, selectedCount === 0 && styles.shareHeaderBtnDisabled]}
            disabled={selectedCount === 0}
            onPress={openShareHeader}
            activeOpacity={0.85}
          >
            <Ionicons name="share-outline" size={18} color={selectedCount === 0 ? STEEL.textMuted : '#fff'} />
            <Text style={[styles.shareHeaderBtnText, selectedCount === 0 && { color: STEEL.textMuted }]}>
              Share {selectedCount} Selected
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Completed</Text>
              <View style={styles.statIconBox}>
                <Ionicons name="checkmark-circle-outline" size={20} color={STEEL.textSecondary} />
              </View>
            </View>
            <Text style={styles.statNum}>{mockStats.completed}</Text>
            <Text style={styles.statSub}>of {mockStats.total} total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Incomplete</Text>
              <View style={styles.statIconBox}>
                <Ionicons name="time-outline" size={20} color={STEEL.textSecondary} />
              </View>
            </View>
            <Text style={styles.statNum}>{mockStats.incomplete}</Text>
            <Text style={styles.statSub}>of {mockStats.total} total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Completion</Text>
              <View style={styles.statIconBox}>
                <Ionicons name="document-text-outline" size={20} color={STEEL.textSecondary} />
              </View>
            </View>
            <Text style={styles.statNum}>{mockStats.completionPct}%</Text>
            <Text style={styles.statSub}> </Text>
          </View>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={() => setShowSharedWith(true)}>
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Shared With</Text>
              <View style={[styles.statIconBox, { backgroundColor: STEEL.accentBg }]}>
                <Ionicons name="people-outline" size={20} color={STEEL.accent} />
              </View>
            </View>
            <Text style={styles.statNum}>{mockStats.sharedWith}</Text>
            <Text style={styles.statSub}>recipients</Text>
          </TouchableOpacity>
        </View>

        {groups.map((group) => {
          const pct = group.total ? Math.round((group.completed / group.total) * 100) : 0;
          return (
            <View key={group.id} style={styles.groupBlock}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <View style={styles.groupProgressCol}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.groupProgressText}>
                    {group.completed} of {group.total} completed ({pct}%)
                  </Text>
                </View>
              </View>

              {group.forms.map((form) => (
                <TouchableOpacity
                  key={form.id}
                  style={styles.formRow}
                  activeOpacity={0.88}
                  onPress={() => openForm(form)}
                >
                  <Pressable
                    style={styles.checkboxHit}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      toggleSelect(group.id, form.id);
                    }}
                  >
                    <Ionicons
                      name={form.selected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={form.selected ? STEEL.accent : STEEL.border}
                    />
                  </Pressable>
                  <View style={styles.docIconWrap}>
                    <Ionicons name="document-text" size={20} color={STEEL.accent} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.formName}>{form.name}</Text>
                    <Text style={styles.formDesc}>{form.desc}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    {form.status === 'complete' ? (
                      <View style={styles.badgeComplete}>
                        <Ionicons name="checkmark-circle" size={14} color="#fff" />
                        <Text style={styles.badgeCompleteText}>Complete</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeIncomplete}>
                        <Ionicons name="time" size={14} color="#fff" />
                        <Text style={styles.badgeIncompleteText}>⏱ Incomplete</Text>
                      </View>
                    )}
                    {form.status === 'complete' ? (
                      <TouchableOpacity
                        style={styles.shareIconBtn}
                        hitSlop={8}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          openShareFromRow(group.id, form.id);
                        }}
                      >
                        <Ionicons name="share-outline" size={20} color={STEEL.accent} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {/* Form detail / edit modal */}
      <Modal visible={showFormModal} animationType="slide" onRequestClose={closeForm}>
        <KeyboardAvoidingView style={styles.modalFlex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.formModalHeader, { paddingTop: insets.top + 8 }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.formTitleRow}>
                <Text style={styles.formModalTitle} numberOfLines={2}>
                  {detailForm?.name}
                </Text>
                {detailForm?.status === 'complete' ? (
                  <View style={styles.badgeCompleteSm}>
                    <Text style={styles.badgeCompleteSmText}>Complete</Text>
                  </View>
                ) : (
                  <View style={styles.badgeIncompleteSm}>
                    <Text style={styles.badgeIncompleteSmText}>⏱ Incomplete</Text>
                  </View>
                )}
              </View>
              <Text style={styles.formModalDesc}>{detailForm?.desc}</Text>
            </View>
            {!isEditing ? (
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 64 }} />
            )}
            <TouchableOpacity onPress={closeForm} hitSlop={12}>
              <Text style={styles.closeX}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formModalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {fieldDefs.map((field) => (
              <View key={field.label} style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {isEditing ? (
                  field.type === 'textarea' ? (
                    <TextInput
                      style={styles.inputMultiline}
                      value={editValues[field.label] ?? ''}
                      onChangeText={(t) => setEditValues((v) => ({ ...v, [field.label]: t }))}
                      placeholder={field.placeholder || ' '}
                      placeholderTextColor={STEEL.textMuted}
                      multiline
                    />
                  ) : field.type === 'select' ? (
                    <TouchableOpacity
                      style={styles.selectInput}
                      onPress={() => setPicker({ label: field.label, options: field.options })}
                    >
                      <Text style={editValues[field.label] ? styles.selectInputText : styles.selectPlaceholder}>
                        {field.label === 'Blood Type' && editValues[field.label]
                          ? bloodCodeToLabel(editValues[field.label])
                          : editValues[field.label] || 'Select…'}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={STEEL.textMuted} />
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      style={styles.input}
                      value={editValues[field.label] ?? ''}
                      onChangeText={(t) => setEditValues((v) => ({ ...v, [field.label]: t }))}
                      placeholder={field.placeholder || ' '}
                      placeholderTextColor={STEEL.textMuted}
                      keyboardType={
                        field.type === 'tel' ? 'phone-pad' : field.type === 'email' ? 'email-address' : 'default'
                      }
                    />
                  )
                ) : (
                  <Text style={styles.fieldValue}>
                    {formatDisplayValue(field.label, editValues[field.label], field.type)}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.formModalFooter, { paddingBottom: insets.bottom + 12 }]}>
            {isEditing ? (
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.btnOutlineWide}
                  onPress={() => {
                    setIsEditing(false);
                    if (detailForm) {
                      const base = { ...buildInitialValues(detailForm.id, detailForm.status), ...(valueOverrides[detailForm.id] || {}) };
                      setEditValues(base);
                    }
                  }}
                >
                  <Text style={styles.btnOutlineText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnIndigoFlex} onPress={saveEdits}>
                  <Text style={styles.btnIndigoText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.btnOutlineFull} onPress={closeForm}>
                  <Text style={styles.btnOutlineText}>Close</Text>
                </TouchableOpacity>
                {detailForm?.status === 'complete' ? (
                  <TouchableOpacity
                    style={styles.btnIndigoFull}
                    onPress={() => {
                      closeForm();
                      openShareHeader();
                    }}
                  >
                    <Ionicons name="share-outline" size={18} color="#fff" />
                    <Text style={styles.btnIndigoText}>Share</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Option picker */}
      <Modal visible={!!picker} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={() => setPicker(null)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>{picker?.label}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {(picker?.options || []).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerRow}
                  onPress={() => {
                    setEditValues((v) => ({ ...v, [picker.label]: opt }));
                    setPicker(null);
                  }}
                >
                  <Text style={styles.pickerRowText}>{picker?.label === 'Blood Type' ? bloodCodeToLabel(opt) : opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Share selected */}
      <Modal visible={showShareModal} animationType="slide" onRequestClose={() => setShowShareModal(false)}>
        <View style={[styles.modalFlex, { paddingTop: insets.top }]}>
          <View style={styles.shareModalHeader}>
            <Text style={styles.shareModalTitle}>Share selected forms</Text>
            <TouchableOpacity
              onPress={() => {
                setShowShareModal(false);
                setShareAck(null);
              }}
            >
              <Text style={styles.closeX}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabelUpper}>PATIENT</Text>
            <Text style={styles.medIdLabel}>MEDICAL ID CARD</Text>
            <View style={styles.medIdCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>TM</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientNameBold}>Timothy McGuire</Text>
                <View style={styles.medIdRow}>
                  <Text style={styles.medIdKey}>DOB:</Text>
                  <Text style={styles.medIdVal}>Oct 12, 1967</Text>
                </View>
                <View style={styles.medIdRow}>
                  <Text style={styles.medIdKey}>Emergency:</Text>
                  <Text style={styles.medIdVal}>Not on file</Text>
                </View>
                <View style={styles.medIdRow}>
                  <Text style={styles.medIdKey}>Blood Type:</Text>
                  <Text style={styles.medIdVal}>Unknown</Text>
                </View>
                <View style={styles.medIdRow}>
                  <Text style={styles.medIdKey}>Allergies:</Text>
                  <Text style={styles.medIdVal}>Penicillin, Penicillin</Text>
                </View>
                <View style={styles.medIdRow}>
                  <Text style={styles.medIdKey}>Conditions:</Text>
                  <Text style={styles.medIdVal}>Asthma, History of appendectomy</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionLabelUpper, { marginTop: 20 }]}>INCLUDED FORMS</Text>
            {selectedFormsList.length === 0 ? (
              <Text style={styles.emptyShare}>Select forms from the list (checkboxes).</Text>
            ) : (
              selectedFormsList.map((f) => (
                <View key={f.id} style={styles.includedRow}>
                  <View style={styles.docIconWrapSm}>
                    <Ionicons name="document-text-outline" size={18} color={STEEL.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.includedName}>{f.name}</Text>
                    <Text style={styles.includedMeta}>
                      {f.version || 'v1.0'}
                      {f.signedAt ? ` • signed ${f.signedAt}` : ''}
                    </Text>
                  </View>
                  <View style={styles.pdfBadge}>
                    <Text style={styles.pdfBadgeText}>PDF + FHIR</Text>
                  </View>
                </View>
              ))
            )}

            <Text style={[styles.sectionLabelUpper, { marginTop: 20 }]}>RECIPIENT</Text>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Dr. Jane Smith"
              placeholderTextColor={STEEL.textMuted}
              value={shareName}
              onChangeText={setShareName}
            />
            <Text style={styles.fieldLabel}>Organization (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Bay Clinic"
              placeholderTextColor={STEEL.textMuted}
              value={shareOrg}
              onChangeText={setShareOrg}
            />
            <Text style={styles.fieldLabel}>Recipient email</Text>
            <TextInput
              style={styles.input}
              placeholder="jane.smith@clinic.org"
              placeholderTextColor={STEEL.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={shareEmail}
              onChangeText={setShareEmail}
            />
            <Text style={styles.fieldLabel}>Message (optional)</Text>
            <TextInput
              style={styles.inputMultiline}
              placeholder="Short note to the provider"
              placeholderTextColor={STEEL.textMuted}
              multiline
              value={shareMessage}
              onChangeText={setShareMessage}
            />
            <Text style={styles.attachCaption}>Attachments: PDF packet + FHIR Bundle (JSON).</Text>

            <TouchableOpacity style={styles.authRow} onPress={() => setShareAgree(!shareAgree)} activeOpacity={0.85}>
              <Ionicons name={shareAgree ? 'checkbox' : 'square-outline'} size={22} color={STEEL.accent} />
              <Text style={styles.authText}>
                {
                  "I authorize sharing the selected forms for treatment purposes. I understand I can revoke link access later in the 'Shared With' tab."
                }
              </Text>
            </TouchableOpacity>

            {shareAck ? (
              <View style={styles.ackBox}>
                <Ionicons name="checkmark-circle" size={18} color={STEEL.success} />
                <Text style={styles.ackText}>{shareAck}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.shareFooter, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={styles.btnOutlineFlex}
              onPress={() => {
                setShowShareModal(false);
                setShareAck(null);
              }}
            >
              <Text style={styles.btnOutlineText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnIndigoFlex, !canSendShare && styles.btnDisabled]}
              disabled={!canSendShare}
              onPress={sendShare}
            >
              <Text style={styles.btnIndigoText}>{shareSending ? 'Sending…' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Shared With */}
      <Modal visible={showSharedWith} animationType="slide" onRequestClose={() => setShowSharedWith(false)}>
        <View style={[styles.modalFlex, { paddingTop: insets.top }]}>
          <View style={styles.shareModalHeader}>
            <Text style={styles.shareModalTitle}>Shared With</Text>
            <TouchableOpacity onPress={() => setShowSharedWith(false)}>
              <Text style={styles.closeX}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.sharedSub}>
              {mockStats.sharedWith} recipients (demo total). Below: recent share events (mock).
            </Text>
            {sharedEvents.length === 0 ? (
              <Text style={styles.emptyShare}>No forms have been shared yet.</Text>
            ) : (
              sharedEvents.map((ev) => (
                <View key={ev.id} style={styles.sharedCard}>
                  <View style={styles.sharedCardTop}>
                    <Ionicons name="document-text-outline" size={20} color={STEEL.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sharedFormTitle}>{ev.formTitle}</Text>
                      <Text style={styles.sharedMeta}>
                        {ev.recipientName} · {ev.sharedDate}
                      </Text>
                      <Text style={styles.sharedEmail}>{ev.recipientEmail}</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{ev.status}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.revokeBtn} onPress={() => revokeShare(ev.id)}>
                    <Text style={styles.revokeBtnText}>Revoke access</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: STEEL.canvas },
  scrollPad: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  nowViewing: {
    fontSize: 11,
    fontWeight: '700',
    color: STEEL.coral,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pageTitle: { fontSize: 28, fontWeight: '800', color: STEEL.textPrimary },
  shareHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: STEEL.accent,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareHeaderBtnDisabled: { backgroundColor: '#C7D2FE' },
  shareHeaderBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: STEEL.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STEEL.border,
    padding: 14,
    minWidth: '47%',
  },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statLabel: { fontSize: 12, fontWeight: '600', color: STEEL.textSecondary },
  statIconBox: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  statNum: { fontSize: 26, fontWeight: '800', color: STEEL.textPrimary },
  statSub: { fontSize: 12, color: STEEL.textSecondary, marginTop: 2 },
  groupBlock: { marginBottom: 22 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  groupTitle: { fontSize: 17, fontWeight: '700', color: STEEL.textPrimary, flexShrink: 1 },
  groupProgressCol: { alignItems: 'flex-end', minWidth: 120 },
  progressTrack: {
    width: 140,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: STEEL.accent, borderRadius: 3 },
  groupProgressText: { fontSize: 11, color: STEEL.textSecondary, marginTop: 4 },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STEEL.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STEEL.border,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  checkboxHit: { padding: 4 },
  docIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: STEEL.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconWrapSm: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formName: { fontSize: 15, fontWeight: '700', color: STEEL.textPrimary },
  formDesc: { fontSize: 12, color: STEEL.textSecondary, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEEL.successDark,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeCompleteText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  badgeIncomplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEEL.orange,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeIncompleteText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  shareIconBtn: { padding: 6 },
  modalFlex: { flex: 1, backgroundColor: STEEL.surface },
  formModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: STEEL.border,
    gap: 8,
  },
  formTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 },
  formModalTitle: { fontSize: 20, fontWeight: '800', color: STEEL.textPrimary, flexShrink: 1 },
  formModalDesc: { fontSize: 13, color: STEEL.textSecondary, lineHeight: 18 },
  badgeCompleteSm: { backgroundColor: STEEL.successDark, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeCompleteSmText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  badgeIncompleteSm: { backgroundColor: STEEL.orange, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeIncompleteSmText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  editBtn: {
    borderWidth: 1,
    borderColor: STEEL.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: { fontWeight: '600', fontSize: 13, color: STEEL.textPrimary },
  closeX: { fontSize: 28, color: STEEL.textMuted, lineHeight: 32 },
  formModalBody: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  fieldBlock: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: STEEL.textPrimary, marginBottom: 6 },
  fieldValue: { fontSize: 15, color: STEEL.textPrimary, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: STEEL.textPrimary,
    backgroundColor: '#FAFAFA',
  },
  inputMultiline: {
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: STEEL.textPrimary,
    minHeight: 88,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  selectInputText: { fontSize: 15, color: STEEL.textPrimary },
  selectPlaceholder: { fontSize: 15, color: STEEL.textMuted },
  formModalFooter: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: STEEL.border, gap: 10 },
  footerRow: { flexDirection: 'row', gap: 10 },
  btnOutlineWide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEEL.border,
  },
  btnOutlineFull: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEEL.border,
  },
  btnOutlineFlex: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEEL.border,
  },
  btnOutlineText: { fontWeight: '700', fontSize: 15, color: STEEL.textPrimary },
  btnIndigoFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEEL.accent,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnIndigoFlex: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STEEL.accent,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnIndigoText: { fontWeight: '700', fontSize: 15, color: '#fff' },
  btnDisabled: { opacity: 0.45 },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: STEEL.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: STEEL.textPrimary },
  pickerRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: STEEL.border },
  pickerRowText: { fontSize: 16, color: STEEL.textPrimary },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: STEEL.border,
  },
  shareModalTitle: { fontSize: 18, fontWeight: '800', color: STEEL.textPrimary },
  sectionLabelUpper: { fontSize: 11, fontWeight: '800', color: STEEL.textSecondary, letterSpacing: 1, marginBottom: 8 },
  medIdLabel: { fontSize: 10, fontWeight: '800', color: STEEL.textSecondary, letterSpacing: 1, marginBottom: 8 },
  medIdCard: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: STEEL.textPrimary },
  patientNameBold: { fontSize: 16, fontWeight: '800', color: STEEL.textPrimary, marginBottom: 8 },
  medIdRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  medIdKey: { fontSize: 12, color: STEEL.textSecondary },
  medIdVal: { fontSize: 12, fontWeight: '600', color: STEEL.textPrimary, maxWidth: '62%', textAlign: 'right' },
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: STEEL.surface,
  },
  includedName: { fontSize: 14, fontWeight: '700', color: STEEL.textPrimary },
  includedMeta: { fontSize: 11, color: STEEL.textSecondary, marginTop: 2 },
  pdfBadge: { borderWidth: 1, borderColor: STEEL.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pdfBadgeText: { fontSize: 10, fontWeight: '700', color: STEEL.textPrimary },
  attachCaption: { fontSize: 12, color: STEEL.textSecondary, marginTop: 6 },
  authRow: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'flex-start' },
  authText: { flex: 1, fontSize: 13, color: STEEL.textSecondary, lineHeight: 20 },
  ackBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ackText: { flex: 1, fontSize: 13, color: STEEL.successDark, fontWeight: '600' },
  shareFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: STEEL.border },
  emptyShare: { fontSize: 14, color: STEEL.textMuted, fontStyle: 'italic' },
  sharedSub: { fontSize: 13, color: STEEL.textSecondary, marginBottom: 12 },
  sharedCard: {
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  sharedCardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  sharedFormTitle: { fontSize: 15, fontWeight: '700', color: STEEL.textPrimary },
  sharedMeta: { fontSize: 12, color: STEEL.textSecondary, marginTop: 4 },
  sharedEmail: { fontSize: 12, color: STEEL.accent, marginTop: 2 },
  statusPill: { backgroundColor: STEEL.accentBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusPillText: { fontSize: 10, fontWeight: '700', color: STEEL.accent },
  revokeBtn: { marginTop: 10, alignSelf: 'flex-start' },
  revokeBtnText: { fontSize: 13, fontWeight: '700', color: STEEL.danger },
});

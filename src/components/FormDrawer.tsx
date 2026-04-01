import { X, CreditCard as Edit, Share2, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';

interface FormField {
  label: string;
  value: string;
  type?: 'text' | 'textarea' | 'select' | 'date' | 'tel' | 'email';
  options?: string[];
  placeholder?: string;
}

interface FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
  formDescription: string;
  formStatus: 'complete' | 'incomplete';
  darkMode?: boolean;
  onShareClick?: () => void;
}

export function FormDrawer({
  isOpen,
  onClose,
  formId,
  formTitle,
  formDescription,
  formStatus,
  darkMode = false,
  onShareClick
}: FormDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const getFormFields = (id: string): FormField[] => {
    const formFields: Record<string, FormField[]> = {
      'patient-reg': [
        { label: 'First Name', value: 'Timothy', type: 'text' },
        { label: 'Middle Name', value: 'James', type: 'text' },
        { label: 'Last Name', value: 'McGuire', type: 'text' },
        { label: 'Date of Birth', value: '10/12/1967', type: 'date' },
        { label: 'Gender', value: 'Male', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
        { label: 'Social Security Number', value: '***-**-4532', type: 'text' },
        { label: 'Phone Number', value: '(555) 123-4567', type: 'tel' },
        { label: 'Email Address', value: 'godesigngo@gmail.com', type: 'email' },
        { label: 'Street Address', value: '123 Main Street', type: 'text' },
        { label: 'City', value: 'Chicago', type: 'text' },
        { label: 'State', value: 'Illinois', type: 'select', options: ['Illinois', 'California', 'New York', 'Texas'] },
        { label: 'ZIP Code', value: '60601', type: 'text' },
        { label: 'Emergency Contact Name', value: 'Jane McGuire', type: 'text' },
        { label: 'Emergency Contact Relationship', value: 'Spouse', type: 'text' },
        { label: 'Emergency Contact Phone', value: '(555) 987-6543', type: 'tel' }
      ],
      'medical-id': [
        { label: 'Blood Type', value: 'O Positive', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
        { label: 'Primary Language', value: 'English', type: 'select', options: ['English', 'Spanish', 'Chinese', 'Other'] },
        { label: 'Preferred Pharmacy', value: 'Walgreens', type: 'text' },
        { label: 'Pharmacy Phone', value: '773-724-0473', type: 'tel' },
        { label: 'Primary Care Physician', value: 'Dr. Sarah Johnson', type: 'text' },
        { label: 'Physician Phone', value: '(555) 234-5678', type: 'tel' },
        { label: 'Known Allergies', value: 'None', type: 'textarea' },
        { label: 'Current Medications', value: 'Albuterol Inhaler, Fluticasone Propionate, Montelukast', type: 'textarea' }
      ],
      'medical-history': [
        { label: 'Reason for Visit', value: 'Annual physical examination', type: 'textarea', placeholder: 'Describe your chief complaint or reason for this visit' },
        { label: 'Body Parts Involved', value: '', type: 'textarea', placeholder: 'Which body parts are affected?' },
        { label: 'Pain Onset Timeline', value: '', type: 'textarea', placeholder: 'When did this problem start?' },
        { label: 'Previous Similar Problems', value: '', type: 'textarea', placeholder: 'Have you experienced this before?' },
        { label: 'Injury Circumstances', value: '', type: 'textarea', placeholder: 'How did this injury occur? (accident, work, sports, etc.)' },
        { label: 'Onset Type', value: '', type: 'select', options: ['Gradual', 'Sudden', 'Not applicable'] },
        { label: 'Current Medical Conditions', value: 'Asthma (diagnosed 2015)', type: 'textarea', placeholder: 'List all current medical conditions with year started' },
        { label: 'Diabetes', value: 'No', type: 'select', options: ['No', 'Yes - Type 1', 'Yes - Type 2', 'Prediabetes'] },
        { label: 'High Blood Pressure', value: 'No', type: 'select', options: ['No', 'Yes', 'Borderline'] },
        { label: 'Heart Disease', value: 'No', type: 'select', options: ['No', 'Yes'] },
        { label: 'Cancer History', value: 'No', type: 'select', options: ['No', 'Yes'] },
        { label: 'Cancer Details', value: '', type: 'textarea', placeholder: 'If yes, specify type and year' },
        { label: 'Family History - Heart Disease', value: 'Father - Age 65', type: 'textarea', placeholder: 'List family members and their age of diagnosis' },
        { label: 'Family History - Diabetes', value: 'Mother - Age 70', type: 'textarea', placeholder: 'List family members and their age of diagnosis' },
        { label: 'Family History - Cancer', value: 'None reported', type: 'textarea', placeholder: 'List family members, type of cancer, and age of diagnosis' },
        { label: 'Family History - Other Conditions', value: '', type: 'textarea', placeholder: 'Other significant family medical history' },
        { label: 'Known Allergies', value: 'None', type: 'textarea', placeholder: 'List allergens and reactions' },
        { label: 'Current Medications', value: 'Albuterol Inhaler, Fluticasone Propionate, Montelukast', type: 'textarea', placeholder: 'Include medication name and dosage' },
        { label: 'Previous Surgeries', value: 'Appendectomy (2010)', type: 'textarea', placeholder: 'List surgical procedures and dates' },
        { label: 'Past Hospitalizations', value: 'Pneumonia treatment (2018)', type: 'textarea', placeholder: 'List hospitalizations and dates' },
        { label: 'Previous Surgery in Same Area', value: '', type: 'textarea', placeholder: 'If applicable, describe previous surgeries in affected area' },
        { label: 'Occupation', value: 'Designer', type: 'text' },
        { label: 'Work Status', value: 'Currently working full-time', type: 'textarea', placeholder: 'Are you currently working? Full-time, part-time, or not working?' },
        { label: 'Last Regular Work Date', value: 'Currently working', type: 'text', placeholder: 'If not working, when did you last work?' },
        { label: '6-Month Work Outlook', value: '', type: 'textarea', placeholder: 'Do you expect to return to work in the next 6 months?' },
        { label: 'Benefits Status', value: '', type: 'textarea', placeholder: 'Are you receiving disability, worker\'s comp, or other benefits?' },
        { label: 'Pain Severity (1-10)', value: '', type: 'select', options: ['N/A', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
        { label: 'Pain Quality', value: '', type: 'textarea', placeholder: 'Describe the pain (sharp, dull, burning, aching, etc.)' },
        { label: 'Symptom Trajectory', value: '', type: 'select', options: ['N/A', 'Improving', 'Staying the same', 'Getting worse', 'Fluctuating'] },
        { label: 'Pain Pattern', value: '', type: 'select', options: ['N/A', 'Constant', 'Intermittent', 'Occasional'] },
        { label: 'Sleep Disruption', value: 'No', type: 'select', options: ['No', 'Yes - occasionally', 'Yes - frequently', 'Yes - every night'] },
        { label: 'Associated Symptoms', value: '', type: 'textarea', placeholder: 'Swelling, numbness, tingling, weakness, etc.' },
        { label: 'Symptom Triggers', value: '', type: 'textarea', placeholder: 'What makes your symptoms worse?' },
        { label: 'Relief Methods', value: '', type: 'textarea', placeholder: 'What makes your symptoms better?' },
        { label: 'Previous Treatments', value: '', type: 'textarea', placeholder: 'Physical therapy, medications, injections, etc.' },
        { label: 'ER Visits for This Condition', value: 'No', type: 'textarea', placeholder: 'Have you been to the ER for this condition?' },
        { label: 'Imaging/Tests Performed', value: '', type: 'textarea', placeholder: 'X-rays, MRI, CT scans, blood work, etc.' },
        { label: 'ER Referral Status', value: '', type: 'textarea', placeholder: 'Were you referred from the ER?' },
        { label: 'Other Joint Problems', value: '', type: 'textarea', placeholder: 'Arthritis, osteoporosis, previous fractures, etc.' },
        { label: 'HIV Status', value: 'Prefer not to answer', type: 'select', options: ['Negative', 'Positive', 'Unknown', 'Prefer not to answer'] },
        { label: 'NSAID Tolerance', value: 'Yes', type: 'select', options: ['Yes - no problems', 'Yes - with food only', 'No - stomach issues', 'No - allergic', 'Unknown'] },
        { label: 'Marital Status', value: 'Married', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Domestic Partnership'] },
        { label: 'Household Composition', value: 'Lives with spouse', type: 'textarea', placeholder: 'Who do you live with?' },
        { label: 'Smoking Status', value: 'Never smoker', type: 'select', options: ['Never smoker', 'Current daily smoker', 'Current some-day smoker', 'Former smoker', 'Smoker - status unknown', 'Unknown if ever smoked', 'Heavy tobacco smoker'] },
        { label: 'Smoking Details', value: '', type: 'textarea', placeholder: 'Packs per day, years smoked, quit date if former' },
        { label: 'Alcohol Use', value: 'Occasional - 1-2 drinks per week', type: 'textarea', placeholder: 'Frequency and amount' },
        { label: 'Primary Care Physician', value: 'Dr. Sarah Johnson', type: 'text' },
        { label: 'PCP Phone Number', value: '(555) 234-5678', type: 'tel' },
        { label: 'Share Records with PCP', value: 'Yes', type: 'select', options: ['Yes', 'No', 'Will provide contact info later'] },
        { label: 'Other Relevant Information', value: '', type: 'textarea', placeholder: 'Any other information we should know?' }
      ],
      'hipaa': [
        { label: 'Authorization Date', value: '01/15/2024', type: 'date' },
        { label: 'Authorized Individuals', value: 'Jane McGuire (Spouse)', type: 'textarea' },
        { label: 'Types of Information to Share', value: 'All medical records, test results, treatment information', type: 'textarea' },
        { label: 'Purpose of Disclosure', value: 'Continuity of care, Emergency situations', type: 'textarea' },
        { label: 'Expiration Date', value: '01/15/2025', type: 'date' },
        { label: 'Patient Signature', value: 'Timothy McGuire', type: 'text' },
        { label: 'Signature Date', value: '01/15/2024', type: 'date' }
      ],
      'consent-treat': [
        { label: 'Patient Name', value: 'Timothy McGuire', type: 'text' },
        { label: 'Date of Birth', value: '10/12/1967', type: 'date' },
        { label: 'Consent Given For', value: 'General medical treatment, diagnostic procedures, and routine care', type: 'textarea' },
        { label: 'Understood Risks', value: 'I understand that all medical treatments carry some risk', type: 'textarea' },
        { label: 'Right to Refuse', value: 'I understand I have the right to refuse treatment', type: 'textarea' },
        { label: 'Patient Signature', value: '', type: 'text' },
        { label: 'Signature Date', value: '', type: 'date' }
      ],
      'privacy-practices': [
        { label: 'Notice Received Date', value: '', type: 'date' },
        { label: 'Patient Name', value: 'Timothy McGuire', type: 'text' },
        { label: 'Acknowledgment', value: '', type: 'textarea', placeholder: 'I acknowledge that I have received the Notice of Privacy Practices' },
        { label: 'Patient Signature', value: '', type: 'text' },
        { label: 'Signature Date', value: '', type: 'date' }
      ],
      'release-info': [
        { label: 'Patient Name', value: 'Timothy McGuire', type: 'text' },
        { label: 'Date of Birth', value: '10/12/1967', type: 'date' },
        { label: 'Release Information To', value: '', type: 'text', placeholder: 'Name of organization or individual' },
        { label: 'Address', value: '', type: 'textarea' },
        { label: 'Phone Number', value: '', type: 'tel' },
        { label: 'Information to Release', value: '', type: 'textarea', placeholder: 'Specify records to be released' },
        { label: 'Purpose of Release', value: '', type: 'textarea' },
        { label: 'Expiration Date', value: '', type: 'date' }
      ],
      'advance-directives': [
        { label: 'Patient Name', value: 'Timothy McGuire', type: 'text' },
        { label: 'Healthcare Proxy', value: '', type: 'text', placeholder: 'Name of designated healthcare agent' },
        { label: 'Proxy Phone Number', value: '', type: 'tel' },
        { label: 'Alternate Proxy', value: '', type: 'text' },
        { label: 'Life-Sustaining Treatment Preferences', value: '', type: 'textarea' },
        { label: 'Organ Donation Wishes', value: '', type: 'select', options: ['Yes, all organs', 'Yes, specific organs', 'No', 'Not decided'] },
        { label: 'DNR Order', value: '', type: 'select', options: ['Yes', 'No', 'Not decided'] },
        { label: 'Additional Instructions', value: '', type: 'textarea' }
      ],
      'emergency-contact': [
        { label: 'Primary Contact Name', value: 'Jane McGuire', type: 'text' },
        { label: 'Relationship', value: 'Spouse', type: 'text' },
        { label: 'Phone Number', value: '(555) 987-6543', type: 'tel' },
        { label: 'Email', value: 'jane.mcguire@email.com', type: 'email' },
        { label: 'Secondary Contact Name', value: '', type: 'text' },
        { label: 'Secondary Relationship', value: '', type: 'text' },
        { label: 'Secondary Phone', value: '', type: 'tel' },
        { label: 'Secondary Email', value: '', type: 'email' }
      ],
      'communication-prefs': [
        { label: 'Preferred Contact Method', value: 'Email', type: 'select', options: ['Phone', 'Email', 'Text Message', 'Mail'] },
        { label: 'Best Time to Contact', value: 'Weekday mornings', type: 'select', options: ['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Weekends', 'Anytime'] },
        { label: 'Phone Number for Calls', value: '(555) 123-4567', type: 'tel' },
        { label: 'Email Address', value: 'godesigngo@gmail.com', type: 'email' },
        { label: 'Text Message Number', value: '(555) 123-4567', type: 'tel' },
        { label: 'Appointment Reminder Preference', value: 'Email and text', type: 'select', options: ['Phone call', 'Email', 'Text message', 'Email and text', 'No reminders'] },
        { label: 'Language Preference', value: 'English', type: 'select', options: ['English', 'Spanish', 'Chinese', 'Other'] }
      ],
      'cultural-accessibility': [
        { label: 'Preferred Language', value: 'English', type: 'select', options: ['English', 'Spanish', 'Chinese', 'Other'] },
        { label: 'Need Interpreter', value: 'No', type: 'select', options: ['Yes', 'No'] },
        { label: 'Religious Considerations', value: '', type: 'textarea', placeholder: 'Any religious or spiritual preferences for care' },
        { label: 'Cultural Considerations', value: '', type: 'textarea', placeholder: 'Any cultural preferences or practices' },
        { label: 'Dietary Restrictions', value: '', type: 'textarea' },
        { label: 'Mobility Assistance Needed', value: '', type: 'select', options: ['None', 'Wheelchair', 'Walker', 'Cane', 'Other'] },
        { label: 'Visual Assistance Needed', value: '', type: 'select', options: ['None', 'Large print', 'Screen reader', 'Other'] },
        { label: 'Hearing Assistance Needed', value: '', type: 'select', options: ['None', 'Sign language interpreter', 'Hearing aids', 'Other'] }
      ],
      'insurance-info': [
        { label: 'Primary Insurance Provider', value: 'Blue Cross Blue Shield', type: 'text' },
        { label: 'Policy Number', value: 'BC123456789', type: 'text' },
        { label: 'Group Number', value: 'GRP987654', type: 'text' },
        { label: 'Policy Holder Name', value: 'Timothy McGuire', type: 'text' },
        { label: 'Policy Holder Date of Birth', value: '10/12/1967', type: 'date' },
        { label: 'Relationship to Patient', value: 'Self', type: 'select', options: ['Self', 'Spouse', 'Parent', 'Child', 'Other'] },
        { label: 'Secondary Insurance Provider', value: '', type: 'text' },
        { label: 'Secondary Policy Number', value: '', type: 'text' }
      ],
      'financial-responsibility': [
        { label: 'Patient Name', value: 'Timothy McGuire', type: 'text' },
        { label: 'Date of Birth', value: '10/12/1967', type: 'date' },
        { label: 'Responsible Party Name', value: 'Timothy McGuire', type: 'text' },
        { label: 'Relationship to Patient', value: 'Self', type: 'select', options: ['Self', 'Spouse', 'Parent', 'Guardian', 'Other'] },
        { label: 'Billing Address', value: '123 Main Street, Chicago, IL 60601', type: 'textarea' },
        { label: 'Phone Number', value: '(555) 123-4567', type: 'tel' },
        { label: 'Agreement', value: 'I agree to pay for all services rendered', type: 'textarea' },
        { label: 'Signature', value: '', type: 'text' },
        { label: 'Signature Date', value: '', type: 'date' }
      ],
      'payment-info': [
        { label: 'Billing Address Line 1', value: '123 Main Street', type: 'text' },
        { label: 'Billing Address Line 2', value: '', type: 'text' },
        { label: 'City', value: 'Chicago', type: 'text' },
        { label: 'State', value: 'Illinois', type: 'select', options: ['Illinois', 'California', 'New York', 'Texas'] },
        { label: 'ZIP Code', value: '60601', type: 'text' },
        { label: 'Payment Method', value: 'Credit Card', type: 'select', options: ['Credit Card', 'Debit Card', 'Check', 'Cash', 'Insurance'] },
        { label: 'Card Last 4 Digits', value: '****', type: 'text', placeholder: 'Last 4 digits only' }
      ],
      'social-history': [
        { label: 'Tobacco Use', value: 'Never', type: 'select', options: ['Never', 'Former', 'Current'] },
        { label: 'If Former/Current, Details', value: '', type: 'textarea' },
        { label: 'Alcohol Use', value: 'Occasional', type: 'select', options: ['Never', 'Occasional', 'Regular', 'Heavy'] },
        { label: 'Alcohol Details', value: '1-2 drinks per week', type: 'textarea' },
        { label: 'Exercise Frequency', value: '3-4 times per week', type: 'select', options: ['Never', '1-2 times/week', '3-4 times/week', '5+ times/week', 'Daily'] },
        { label: 'Exercise Type', value: 'Walking, cycling', type: 'textarea' },
        { label: 'Occupation', value: 'Designer', type: 'text' },
        { label: 'Living Situation', value: 'Lives with spouse', type: 'select', options: ['Lives alone', 'Lives with spouse', 'Lives with family', 'Assisted living', 'Other'] },
        { label: 'Diet Type', value: 'Regular', type: 'select', options: ['Regular', 'Vegetarian', 'Vegan', 'Low sodium', 'Diabetic', 'Other'] }
      ],
      'current-medications': [
        { label: 'Medication 1 Name', value: 'Albuterol Inhaler', type: 'text' },
        { label: 'Medication 1 Dosage', value: '90 mcg, 2 puffs every 4-6 hours as needed', type: 'text' },
        { label: 'Medication 1 Prescriber', value: 'Dr. Sarah Johnson', type: 'text' },
        { label: 'Medication 2 Name', value: 'Fluticasone Propionate', type: 'text' },
        { label: 'Medication 2 Dosage', value: '110 mcg, 2 puffs twice daily', type: 'text' },
        { label: 'Medication 2 Prescriber', value: 'Dr. Sarah Johnson', type: 'text' },
        { label: 'Medication 3 Name', value: 'Montelukast', type: 'text' },
        { label: 'Medication 3 Dosage', value: '10 mg once daily at bedtime', type: 'text' },
        { label: 'Medication 3 Prescriber', value: 'Dr. Sarah Johnson', type: 'text' },
        { label: 'Over-the-Counter Medications', value: 'Multivitamin daily', type: 'textarea' },
        { label: 'Supplements', value: 'Vitamin D 2000 IU daily', type: 'textarea' }
      ],
      'allergy-info': [
        { label: 'Drug Allergies', value: 'None known', type: 'textarea' },
        { label: 'Food Allergies', value: 'None known', type: 'textarea' },
        { label: 'Environmental Allergies', value: 'Seasonal pollen', type: 'textarea' },
        { label: 'Latex Allergy', value: 'No', type: 'select', options: ['Yes', 'No', 'Unknown'] },
        { label: 'Other Allergies', value: '', type: 'textarea' },
        { label: 'Allergy Reactions', value: 'Mild sneezing with pollen', type: 'textarea', placeholder: 'Describe typical reactions' },
        { label: 'Carries EpiPen', value: 'No', type: 'select', options: ['Yes', 'No'] }
      ],
      'immunization-record': [
        { label: 'COVID-19 Vaccine', value: 'Pfizer - 3 doses (Last: 12/2023)', type: 'text' },
        { label: 'Influenza', value: 'Annual - Last: 10/2024', type: 'text' },
        { label: 'Tetanus/Diphtheria/Pertussis (Tdap)', value: 'Last: 2020', type: 'text' },
        { label: 'MMR (Measles, Mumps, Rubella)', value: 'Childhood - Complete', type: 'text' },
        { label: 'Varicella (Chickenpox)', value: 'Had disease - 1972', type: 'text' },
        { label: 'Hepatitis A', value: 'Complete series - 2015', type: 'text' },
        { label: 'Hepatitis B', value: 'Complete series - 1990', type: 'text' },
        { label: 'Pneumococcal', value: 'Not received', type: 'text' },
        { label: 'Shingles (Zoster)', value: 'Not received', type: 'text' }
      ]
    };

    return formFields[id] || [];
  };

  const fields = getFormFields(formId);

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-full max-w-2xl z-50 shadow-2xl transform transition-transform ${
        darkMode ? 'bg-stone-900' : 'bg-white'
      }`}>
        <div className="flex flex-col h-full">
          <div className={`px-6 py-4 border-b flex items-start justify-between ${
            darkMode ? 'border-stone-800' : 'border-stone-200'
          }`}>
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <h2 className={`text-xl font-semibold ${
                  darkMode ? 'text-white' : 'text-stone-900'
                }`}>{formTitle}</h2>
                {formStatus === 'complete' ? (
                  <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Incomplete
                  </span>
                )}
              </div>
              <p className={`text-sm ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>{formDescription}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'border-stone-700 text-stone-300 hover:bg-stone-800'
                      : 'border-stone-300 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'hover:bg-stone-800 text-stone-400'
                    : 'hover:bg-stone-100 text-stone-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={index}>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-stone-300' : 'text-stone-900'
                  }`}>
                    {field.label}
                  </label>
                  {isEditing ? (
                    field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.label] !== undefined ? formData[field.label] : field.value}
                        onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={3}
                        className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                          darkMode
                            ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500'
                            : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'
                        }`}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.label] !== undefined ? formData[field.label] : field.value}
                        onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                          darkMode
                            ? 'bg-stone-800 border-stone-700 text-white'
                            : 'bg-white border-stone-300 text-stone-900'
                        }`}
                      >
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={formData[field.label] !== undefined ? formData[field.label] : field.value}
                        onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                        placeholder={field.placeholder}
                        className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                          darkMode
                            ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500'
                            : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'
                        }`}
                      />
                    )
                  ) : (
                    <div className={`text-sm ${
                      darkMode ? 'text-stone-300' : 'text-stone-900'
                    }`}>
                      {field.value || <span className={darkMode ? 'text-stone-600' : 'text-stone-400'}>Not provided</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={`px-6 py-4 border-t flex items-center justify-between ${
            darkMode ? 'border-stone-800' : 'border-stone-200'
          }`}>
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'text-stone-300 hover:bg-stone-800'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'text-stone-300 hover:bg-stone-800'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Close
                </button>
                {formStatus === 'complete' && (
                  <button
                    onClick={() => {
                      if (onShareClick) {
                        onShareClick();
                      }
                    }}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

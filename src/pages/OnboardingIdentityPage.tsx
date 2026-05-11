import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingAssistantPanel, QuickAction } from '../components/OnboardingAssistantPanel';
import { supabase } from '../lib/supabase';

interface OnboardingIdentityPageProps {
  darkMode?: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingIdentityPage({ darkMode = false, onNext, onBack }: OnboardingIdentityPageProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    last4Ssn: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (formData.phone && !/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (formData.last4Ssn && formData.last4Ssn.length !== 4) {
      newErrors.last4Ssn = 'Must be 4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('No user session found. Please refresh the page and try again.');
      }

      const userId = session.user.id;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth,
          phone: formData.phone,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2 || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
          last4_ssn: formData.last4Ssn || null,
          identity_verified: true,
          onboarding_complete: false,
          email: session.user.email || ''
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('Profile error details:', profileError);
        throw profileError;
      }

      onNext();
    } catch (error: any) {
      console.error('Failed to save identity:', error);
      alert(error.message || 'Failed to save identity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoData = () => {
    setFormData({
      firstName: 'Timothy',
      lastName: 'McGuire',
      dateOfBirth: '1967-10-12',
      phone: '7737240473',
      addressLine1: '26027 West Brandt Road',
      addressLine2: '',
      city: 'Barrington',
      state: 'IL',
      postalCode: '60010',
      country: 'US',
      last4Ssn: '0726'
    });
  };

  const quickActions: QuickAction[] = [
    {
      label: "Why do you need my address?",
      onClick: () => alert("Your address helps verify your identity and ensures we can securely match your health records. It's required for HIPAA compliance.")
    },
    {
      label: "Can I change this later?",
      onClick: () => alert("Yes! You can update your identity information anytime from your Profile settings in the Dashboard.")
    },
    {
      label: "Use demo data",
      onClick: fillDemoData
    }
  ];

  const inputClass = (fieldName: string) => `w-full px-4 py-2 rounded-lg border ${
    errors[fieldName]
      ? 'border-red-500 focus:ring-red-500'
      : darkMode
        ? 'bg-surface-sunken border-stroke-default text-white focus:ring-emerald-500'
        : 'bg-white border-stroke-default text-content-primary focus:ring-emerald-500'
  } focus:outline-none focus:ring-2`;

  const labelClass = `block text-sm font-medium mb-2 ${
    darkMode ? 'text-content-primary' : 'text-content-primary'
  }`;

  return (
    <OnboardingLayout
      currentStep={2}
      darkMode={darkMode}
      onBack={onBack}
      assistant={
        <OnboardingAssistantPanel
          step="2 of 5"
          title="Identity Verification"
          message="We need to verify your identity to protect your health information and comply with HIPAA regulations. This is a one-time process that ensures your records stay secure."
          quickActions={quickActions}
          darkMode={darkMode}
        />
      }
    >
      <div className={`rounded-lg border p-8 ${
        darkMode ? 'bg-surface-raised border-stroke-subtle' : 'bg-white border-stroke-subtle'
      }`}>
        <div className="mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            Verify Your Identity
          </h2>
          <p className={`text-sm ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            All fields marked with * are required
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={inputClass('firstName')}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={inputClass('lastName')}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className={inputClass('dateOfBirth')}
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className={inputClass('phone')}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Address Line 1 *
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              placeholder="123 Main St"
              className={inputClass('addressLine1')}
            />
            {errors.addressLine1 && (
              <p className="text-red-500 text-sm mt-1">{errors.addressLine1}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              placeholder="Apt, Suite, Unit (optional)"
              className={inputClass('addressLine2')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={inputClass('city')}
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                State *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="CA"
                maxLength={2}
                className={inputClass('state')}
              />
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="94102"
                className={inputClass('postalCode')}
              />
              {errors.postalCode && (
                <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Last 4 of SSN (Optional)
            </label>
            <input
              type="text"
              value={formData.last4Ssn}
              onChange={(e) => setFormData({ ...formData, last4Ssn: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              placeholder="1234"
              maxLength={4}
              className={inputClass('last4Ssn')}
            />
            {errors.last4Ssn && (
              <p className="text-red-500 text-sm mt-1">{errors.last4Ssn}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-surface-sunken hover:bg-surface-sunken text-content-primary'
                  : 'bg-surface-sunken hover:bg-surface-overlay text-content-primary'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
}

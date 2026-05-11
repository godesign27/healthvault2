import { useState } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingAssistantPanel, QuickAction } from '../components/OnboardingAssistantPanel';
import { supabase } from '../lib/supabase';

interface OnboardingInsurancePageProps {
  darkMode?: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function OnboardingInsurancePage({ darkMode = false, onNext, onBack, onSkip }: OnboardingInsurancePageProps) {
  const [formData, setFormData] = useState({
    carrierName: '',
    memberId: '',
    groupNumber: '',
    planType: '',
    claimsPhone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardFrontFile, setCardFrontFile] = useState<File | null>(null);
  const [cardBackFile, setCardBackFile] = useState<File | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.carrierName.trim()) newErrors.carrierName = 'Carrier name is required';
    if (!formData.memberId.trim()) newErrors.memberId = 'Member ID is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadCard = async (file: File, side: 'front' | 'back', userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${side}-${Date.now()}.${fileExt}`;
      const filePath = `insurance-cards/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('No user session');
      }

      const userId = session.user.id;

      let cardFrontUrl = null;
      let cardBackUrl = null;

      if (cardFrontFile) {
        cardFrontUrl = await uploadCard(cardFrontFile, 'front', userId);
      }
      if (cardBackFile) {
        cardBackUrl = await uploadCard(cardBackFile, 'back', userId);
      }

      const { error } = await supabase
        .from('insurance_policies')
        .insert({
          user_id: userId,
          carrier_name: formData.carrierName,
          member_id: formData.memberId,
          group_number: formData.groupNumber || null,
          plan_type: formData.planType || null,
          claims_phone: formData.claimsPhone || null,
          card_front_url: cardFrontUrl,
          card_back_url: cardBackUrl,
          is_primary: true
        });

      if (error) throw error;

      onNext();
    } catch (error) {
      console.error('Failed to save insurance:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoData = () => {
    setFormData({
      carrierName: 'Blue Cross Blue Shield',
      memberId: 'ABC123456789',
      groupNumber: 'GRP-1234',
      planType: 'PPO',
      claimsPhone: '1-800-123-4567'
    });
  };

  const quickActions: QuickAction[] = [
    {
      label: "I don't have insurance",
      onClick: onSkip
    },
    {
      label: "Help me read my card",
      onClick: () => alert("Your insurance card typically shows:\n• Carrier name (Blue Cross, Aetna, etc.)\n• Member/Subscriber ID\n• Group number\n• Claims phone number\n\nYou can take photos of both sides to save for later reference.")
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
      currentStep={3}
      darkMode={darkMode}
      onBack={onBack}
      assistant={
        <OnboardingAssistantPanel
          step="3 of 5"
          title="Add Insurance (Optional)"
          message="Adding your insurance helps us verify coverage, track claims, and connect with providers. This is optional and can be done later from your Insurance page."
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
            Insurance Information
          </h2>
          <p className={`text-sm ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            This step is optional. You can skip and add insurance later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClass}>
              Insurance Carrier *
            </label>
            <input
              type="text"
              value={formData.carrierName}
              onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
              placeholder="Blue Cross Blue Shield"
              className={inputClass('carrierName')}
            />
            {errors.carrierName && (
              <p className="text-red-500 text-sm mt-1">{errors.carrierName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Member ID *
              </label>
              <input
                type="text"
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                placeholder="ABC123456789"
                className={inputClass('memberId')}
              />
              {errors.memberId && (
                <p className="text-red-500 text-sm mt-1">{errors.memberId}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Group Number
              </label>
              <input
                type="text"
                value={formData.groupNumber}
                onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
                placeholder="GRP-1234"
                className={inputClass('groupNumber')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Plan Type
              </label>
              <select
                value={formData.planType}
                onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                className={inputClass('planType')}
              >
                <option value="">Select plan type</option>
                <option value="HMO">HMO</option>
                <option value="PPO">PPO</option>
                <option value="EPO">EPO</option>
                <option value="POS">POS</option>
                <option value="HDHP">HDHP</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Claims Phone
              </label>
              <input
                type="tel"
                value={formData.claimsPhone}
                onChange={(e) => setFormData({ ...formData, claimsPhone: e.target.value })}
                placeholder="1-800-123-4567"
                className={inputClass('claimsPhone')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Card Front (Optional)
              </label>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                darkMode ? 'border-stroke-default' : 'border-stroke-default'
              }`}>
                {cardFrontFile ? (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-primary'
                    }`}>
                      {cardFrontFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCardFrontFile(null)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-content-secondary' : 'text-content-secondary'
                    }`} />
                    <span className={`text-sm ${
                      darkMode ? 'text-content-secondary' : 'text-content-secondary'
                    }`}>
                      Upload image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setCardFrontFile(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Card Back (Optional)
              </label>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                darkMode ? 'border-stroke-default' : 'border-stroke-default'
              }`}>
                {cardBackFile ? (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-primary'
                    }`}>
                      {cardBackFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCardBackFile(null)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-content-secondary' : 'text-content-secondary'
                    }`} />
                    <span className={`text-sm ${
                      darkMode ? 'text-content-secondary' : 'text-content-secondary'
                    }`}>
                      Upload image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setCardBackFile(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>
            </div>
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
              type="button"
              onClick={onSkip}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'text-content-secondary hover:text-content-primary'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Skip for now
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

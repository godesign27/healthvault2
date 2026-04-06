import { ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MedicalIDCardProps {
  darkMode?: boolean;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  profilePhoto: string | null;
  bloodType: string | null;
  organDonor: boolean | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  allergies: string[];
  conditions: string[];
}

export function MedicalIDCard({ darkMode = false }: MedicalIDCardProps) {
  const [showMore, setShowMore] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    profilePhoto: null,
    bloodType: null,
    organDonor: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    allergies: [],
    conditions: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      const userId = session.user.id;

      const [userProfileRes, patientProfileRes, allergiesRes, conditionsRes] = await Promise.all([
        supabase.from('user_profiles').select('first_name, last_name, date_of_birth, profile_image_url').eq('user_id', userId).maybeSingle(),
        supabase.from('patient_profiles').select('blood_type, organ_donor, emergency_contact_name, emergency_contact_phone').eq('user_id', userId).maybeSingle(),
        supabase.from('allergies').select('allergen').eq('user_id', userId),
        supabase.from('conditions').select('name').eq('user_id', userId),
      ]);

      const up = userProfileRes.data;
      const pp = patientProfileRes.data;

      setProfile({
        firstName: up?.first_name || '',
        lastName: up?.last_name || '',
        dateOfBirth: up?.date_of_birth || null,
        profilePhoto: up?.profile_image_url || null,
        bloodType: pp?.blood_type || null,
        organDonor: pp?.organ_donor ?? null,
        emergencyContactName: pp?.emergency_contact_name || null,
        emergencyContactPhone: pp?.emergency_contact_phone || null,
        allergies: (allergiesRes.data || []).map((a: any) => a.allergen).filter(Boolean),
        conditions: (conditionsRes.data || []).map((c: any) => c.name).filter(Boolean),
      });
      setIsLoading(false);
    };
    load().catch(() => setIsLoading(false));
  }, []);

  const displayName = profile.firstName || profile.lastName
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : null;
  const initials = displayName
    ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  const formatDob = (dob: string | null) => {
    if (!dob) return null;
    const d = new Date(dob + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const Skeleton = () => (
    <div className={`h-4 rounded animate-pulse ${darkMode ? 'bg-stone-700' : 'bg-stone-200'}`} />
  );

  return (
    <div className={`h-full rounded-xl border p-8 transition-all ${
      darkMode
        ? 'bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 border-stone-700'
        : 'bg-gradient-to-br from-white via-white to-stone-50 border-stone-200'
    }`}>
      <div className={`text-xs font-semibold uppercase tracking-wide mb-6 ${
        darkMode ? 'text-stone-400' : 'text-stone-500'
      }`}>
        Medical ID Card
      </div>

      {profile.profilePhoto ? (
        <img
          src={profile.profilePhoto}
          alt={displayName || 'Profile'}
          className="w-24 h-24 rounded-full object-cover mb-4 mx-auto ring-4 ring-stone-200 dark:ring-stone-700"
        />
      ) : (
        <div className={`flex items-center justify-center w-24 h-24 rounded-full mb-4 mx-auto ring-4 ${
          darkMode
            ? 'bg-gradient-to-br from-stone-700 to-stone-800 ring-stone-700'
            : 'bg-gradient-to-br from-stone-100 to-stone-200 ring-stone-200'
        }`}>
          <span className={`text-3xl font-bold ${
            darkMode ? 'text-stone-300' : 'text-stone-700'
          }`}>{initials}</span>
        </div>
      )}

      <div className="text-center mb-8">
        {isLoading ? (
          <div className="w-40 mx-auto"><Skeleton /></div>
        ) : (
          <h3 className={`text-xl font-bold ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>{displayName || 'Your Name'}</h3>
        )}
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Date of Birth</span>
          {isLoading ? (
            <div className="w-32"><Skeleton /></div>
          ) : (
            <span className={`font-semibold text-right ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
              {formatDob(profile.dateOfBirth) || '—'}
            </span>
          )}
        </div>
        <div className={`border-t ${darkMode ? 'border-stone-800' : 'border-stone-100'}`} />
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Allergies</span>
          {isLoading ? (
            <div className="w-20"><Skeleton /></div>
          ) : (
            <span className={`font-semibold text-right max-w-[60%] ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
              {profile.allergies.length > 0 ? profile.allergies.slice(0, 3).join(', ') + (profile.allergies.length > 3 ? ` +${profile.allergies.length - 3}` : '') : 'None on file'}
            </span>
          )}
        </div>
        <div className={`border-t ${darkMode ? 'border-stone-800' : 'border-stone-100'}`} />
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Medical Conditions</span>
          {isLoading ? (
            <div className="w-20"><Skeleton /></div>
          ) : (
            <span className={`font-semibold text-right max-w-[60%] ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
              {profile.conditions.length > 0 ? profile.conditions.slice(0, 2).join(', ') + (profile.conditions.length > 2 ? ` +${profile.conditions.length - 2}` : '') : 'None on file'}
            </span>
          )}
        </div>
        <div className={`border-t ${darkMode ? 'border-stone-800' : 'border-stone-100'}`} />
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Organ Donor</span>
          {isLoading ? (
            <div className="w-20"><Skeleton /></div>
          ) : (
            <span className={`font-semibold text-right ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
              {profile.organDonor === null ? 'Not specified' : profile.organDonor ? 'Yes' : 'No'}
            </span>
          )}
        </div>
      </div>

      {showMore && (
        <div className={`mt-6 pt-6 border-t space-y-4 text-sm ${
          darkMode ? 'border-stone-700' : 'border-stone-200'
        }`}>
          <div className="flex justify-between items-start">
            <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Blood Type</span>
            {isLoading ? (
              <div className="w-12"><Skeleton /></div>
            ) : (
              <span className={`font-semibold text-right ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
                {profile.bloodType || 'Unknown'}
              </span>
            )}
          </div>
          <div className={`border-t ${darkMode ? 'border-stone-800' : 'border-stone-100'}`} />
          <div className="flex justify-between items-start">
            <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Emergency Contact</span>
            {isLoading ? (
              <div className="w-28"><Skeleton /></div>
            ) : (
              <span className={`font-semibold text-right ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
                {profile.emergencyContactName
                  ? `${profile.emergencyContactName}${profile.emergencyContactPhone ? ` · ${profile.emergencyContactPhone}` : ''}`
                  : 'Not on file'}
              </span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowMore(!showMore)}
        className="flex items-center justify-center gap-2 w-full mt-6 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
        Show {showMore ? 'Less' : 'More'}
      </button>
    </div>
  );
}

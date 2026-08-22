import { ChevronDown, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from './ui/Card';

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
  heightCm: number | null;
  weightKg: number | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
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
    heightCm: null,
    weightKg: null,
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    allergies: [],
    conditions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '',
    bloodType: '', heightFeet: '', heightInches: '', weightPounds: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      const userId = session.user.id;

      const [userProfileRes, patientProfileRes, allergiesRes, conditionsRes] = await Promise.all([
        supabase.from('user_profiles').select('first_name, last_name, date_of_birth, profile_photo_url, address_line1, address_line2, city, state, postal_code').eq('user_id', userId).maybeSingle(),
        supabase.from('patient_profiles').select('blood_type, organ_donor, emergency_contact_name, emergency_contact_phone, height_cm, weight_kg').eq('user_id', userId).maybeSingle(),
        supabase.from('allergies').select('allergen').eq('user_id', userId),
        supabase.from('conditions').select('name').eq('user_id', userId),
      ]);

      const up = userProfileRes.data;
      const pp = patientProfileRes.data;

      const heightInches = pp?.height_cm ? Number(pp.height_cm) / 2.54 : null;
      const nextProfile = {
        firstName: up?.first_name || '',
        lastName: up?.last_name || '',
        dateOfBirth: up?.date_of_birth || null,
        profilePhoto: up?.profile_photo_url || null,
        bloodType: pp?.blood_type || null,
        organDonor: pp?.organ_donor ?? null,
        emergencyContactName: pp?.emergency_contact_name || null,
        emergencyContactPhone: pp?.emergency_contact_phone || null,
        heightCm: pp?.height_cm == null ? null : Number(pp.height_cm),
        weightKg: pp?.weight_kg == null ? null : Number(pp.weight_kg),
        addressLine1: up?.address_line1 || '',
        addressLine2: up?.address_line2 || '',
        city: up?.city || '',
        state: up?.state || '',
        postalCode: up?.postal_code || '',
        allergies: (allergiesRes.data || []).map((a: any) => a.allergen).filter(Boolean),
        conditions: (conditionsRes.data || []).map((c: any) => c.name).filter(Boolean),
      };
      setProfile(nextProfile);
      setForm({
        addressLine1: nextProfile.addressLine1,
        addressLine2: nextProfile.addressLine2,
        city: nextProfile.city,
        state: nextProfile.state,
        postalCode: nextProfile.postalCode,
        bloodType: nextProfile.bloodType || '',
        heightFeet: heightInches == null ? '' : String(Math.floor(heightInches / 12)),
        heightInches: heightInches == null ? '' : String(Math.round(heightInches % 12)),
        weightPounds: nextProfile.weightKg == null ? '' : String(Math.round(nextProfile.weightKg * 2.2046226218)),
      });
      setIsLoading(false);
    };
    load().catch(() => setIsLoading(false));
  }, []);

  const handleSaveMedicalProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Please sign in again to update your profile.');
      const userId = session.user.id;
      const feet = form.heightFeet === '' ? null : Number(form.heightFeet);
      const inches = form.heightInches === '' ? 0 : Number(form.heightInches);
      const pounds = form.weightPounds === '' ? null : Number(form.weightPounds);
      if (feet !== null && (!Number.isFinite(feet) || !Number.isFinite(inches) || inches < 0 || inches >= 12)) {
        throw new Error('Enter height as feet plus 0–11 inches.');
      }
      if (pounds !== null && (!Number.isFinite(pounds) || pounds <= 0)) {
        throw new Error('Enter a valid current weight.');
      }
      const heightCm = feet === null ? null : Number((((feet * 12) + inches) * 2.54).toFixed(2));
      const weightKg = pounds === null ? null : Number((pounds / 2.2046226218).toFixed(2));

      const { data: existingPatient, error: patientLookupError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (patientLookupError) throw patientLookupError;

      const userPromise = supabase.from('user_profiles').update({
          address_line1: form.addressLine1.trim() || null,
          address_line2: form.addressLine2.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          postal_code: form.postalCode.trim() || null,
        }).eq('user_id', userId);
      const patientValues = {
          user_id: userId,
          name: displayName || 'Health Vault member',
          blood_type: form.bloodType || null,
          height_cm: heightCm,
          weight_kg: weightKg,
        };
      const patientPromise = existingPatient
        ? supabase.from('patient_profiles').update(patientValues).eq('id', existingPatient.id)
        : supabase.from('patient_profiles').insert(patientValues);
      const [userResult, patientResult] = await Promise.all([userPromise, patientPromise]);
      if (userResult.error) throw userResult.error;
      if (patientResult.error) throw patientResult.error;
      setProfile(prev => ({
        ...prev,
        addressLine1: form.addressLine1.trim(), addressLine2: form.addressLine2.trim(),
        city: form.city.trim(), state: form.state.trim(), postalCode: form.postalCode.trim(),
        bloodType: form.bloodType || null, heightCm, weightKg,
      }));
      setSaveMessage('Medical profile updated.');
      setIsEditing(false);
      setShowMore(true);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Unable to update the medical profile.');
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className={`h-4 rounded animate-pulse ${darkMode ? 'bg-surface-sunken' : 'bg-surface-overlay'}`} />
  );

  return (
    <Card shadow="blur" className="h-full">
      <div className="flex h-full flex-col rounded-xl p-8">
      <div className={`text-xs font-semibold uppercase tracking-wide mb-6 ${
        darkMode ? 'text-content-secondary' : 'text-content-secondary'
      }`}>
        Medical ID Card
      </div>

      {profile.profilePhoto ? (
        <img
          src={profile.profilePhoto}
          alt={displayName || 'Profile'}
          className="w-24 h-24 rounded-full object-cover mb-4 mx-auto ring-4 ring-stroke-subtle dark:ring-stroke-default"
        />
      ) : (
        <div
          className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full ring-4 ${
            darkMode
              ? 'bg-surface-sunken/35 ring-stroke-default'
              : 'bg-gradient-to-br from-surface-sunken to-surface-sunken ring-stroke-subtle'
          }`}
        >
          <span className={`text-3xl font-bold ${
            darkMode ? 'text-content-primary' : 'text-content-primary'
          }`}>{initials}</span>
        </div>
      )}

      <div className="text-center mb-8">
        {isLoading ? (
          <div className="w-40 mx-auto"><Skeleton /></div>
        ) : (
          <h3 className="text-xl font-bold text-content-primary">{displayName || 'Your Name'}</h3>
        )}
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>Date of Birth</span>
          {isLoading ? (
            <div className="w-32"><Skeleton /></div>
          ) : (
            <span className={`font-semibold text-right ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
              {formatDob(profile.dateOfBirth) || '—'}
            </span>
          )}
        </div>
        <div className={`border-t ${darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'}`} />
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>Allergies</span>
          {isLoading ? (
            <div className="w-20"><Skeleton /></div>
          ) : (
            <span className={`font-semibold text-right max-w-[60%] ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
              {profile.allergies.length > 0 ? profile.allergies.slice(0, 3).join(', ') + (profile.allergies.length > 3 ? ` +${profile.allergies.length - 3}` : '') : 'None on file'}
            </span>
          )}
        </div>
        <div className={`border-t ${darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'}`} />
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>Medical Conditions</span>
          {isLoading ? (
            <div className="w-20"><Skeleton /></div>
          ) : (
            <span className={`font-semibold text-right max-w-[60%] ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
              {profile.conditions.length > 0 ? profile.conditions.slice(0, 2).join(', ') + (profile.conditions.length > 2 ? ` +${profile.conditions.length - 2}` : '') : 'None on file'}
            </span>
          )}
        </div>
        <div className={`border-t ${darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'}`} />
        <div className="flex justify-between items-start">
          <span className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>Organ Donor</span>
          {isLoading ? (
            <div className="w-20"><Skeleton /></div>
          ) : (
            <span className={`font-semibold text-right ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
              {profile.organDonor === null ? 'Not specified' : profile.organDonor ? 'Yes' : 'No'}
            </span>
          )}
        </div>
      </div>

      {showMore && (
        <div className={`mt-6 pt-6 border-t space-y-4 text-sm ${
          darkMode ? 'border-stroke-default' : 'border-stroke-subtle'
        }`}>
          <div className="flex justify-between items-start">
            <span className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>Blood Type</span>
            {isLoading ? (
              <div className="w-12"><Skeleton /></div>
            ) : (
              <span className={`font-semibold text-right ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
                {profile.bloodType || 'Unknown'}
              </span>
            )}
          </div>
          <div className={`border-t ${darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'}`} />
          <div className="flex justify-between items-start">
            <span className="text-content-secondary">Height</span>
            <span className="font-semibold text-right text-content-primary">
              {profile.heightCm == null ? 'Not on file' : `${Math.floor((profile.heightCm / 2.54) / 12)} ft ${Math.round((profile.heightCm / 2.54) % 12)} in`}
            </span>
          </div>
          <div className="border-t border-stroke-subtle" />
          <div className="flex justify-between items-start">
            <span className="text-content-secondary">Current Weight</span>
            <span className="font-semibold text-right text-content-primary">
              {profile.weightKg == null ? 'Not on file' : `${Math.round(profile.weightKg * 2.2046226218)} lb`}
            </span>
          </div>
          <div className={`border-t ${darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'}`} />
          <div className="flex justify-between items-start">
            <span className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>Emergency Contact</span>
            {isLoading ? (
              <div className="w-28"><Skeleton /></div>
            ) : (
              <span className={`font-semibold text-right ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
                {profile.emergencyContactName
                  ? `${profile.emergencyContactName}${profile.emergencyContactPhone ? ` · ${profile.emergencyContactPhone}` : ''}`
                  : 'Not on file'}
              </span>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="mt-6 rounded-xl border border-stroke-subtle bg-surface-sunken/40 p-5 text-left">
          <h4 className="text-sm font-semibold text-content-primary">Edit Medical Profile</h4>
          <p className="mt-1 text-xs text-content-secondary">Address stays private. Blood type, height, and weight appear in the expanded Medical ID card.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 text-xs font-medium text-content-primary">Street address
              <input value={form.addressLine1} onChange={e => setForm({ ...form, addressLine1: e.target.value })} className="mt-1 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-sm" />
            </label>
            <label className="sm:col-span-2 text-xs font-medium text-content-primary">Apartment, suite, or unit
              <input value={form.addressLine2} onChange={e => setForm({ ...form, addressLine2: e.target.value })} className="mt-1 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-content-primary">City
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-medium text-content-primary">State
                <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="mt-1 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-content-primary">ZIP code
                <input value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} className="mt-1 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-sm" />
              </label>
            </div>
            <label className="text-xs font-medium text-content-primary">Blood type
              <select value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })} className="mt-1 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-sm">
                <option value="">Unknown / not provided</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-content-primary">Current weight (lb)
              <input type="number" min="1" step="0.1" value={form.weightPounds} onChange={e => setForm({ ...form, weightPounds: e.target.value })} className="mt-1 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-sm" />
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-xs font-medium text-content-primary">Height</legend>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <label className="text-xs text-content-secondary"><input type="number" min="1" max="9" value={form.heightFeet} onChange={e => setForm({ ...form, heightFeet: e.target.value })} className="mr-2 w-20 rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-sm" />feet</label>
                <label className="text-xs text-content-secondary"><input type="number" min="0" max="11" value={form.heightInches} onChange={e => setForm({ ...form, heightInches: e.target.value })} className="mr-2 w-20 rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-sm" />inches</label>
              </div>
            </fieldset>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg border border-stroke-default px-4 py-2 text-sm font-medium text-content-primary">Cancel</button>
            <button type="button" onClick={handleSaveMedicalProfile} disabled={isSaving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{isSaving ? 'Saving…' : 'Save profile'}</button>
          </div>
        </div>
      )}

      {saveMessage && <p className="mt-3 text-center text-xs text-content-secondary" role="status">{saveMessage}</p>}

      <button
        type="button"
        onClick={() => { setIsEditing(true); setSaveMessage(null); }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
      >
        <Pencil className="h-4 w-4" /> Edit Medical Profile
      </button>

      <button
        onClick={() => setShowMore(!showMore)}
        className="flex items-center justify-center gap-2 w-full mt-6 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
        Show {showMore ? 'Less' : 'More'}
      </button>
      </div>
    </Card>
  );
}

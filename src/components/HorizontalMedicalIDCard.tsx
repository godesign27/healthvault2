import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface HorizontalMedicalIDCardProps {
  darkMode?: boolean;
}

export function HorizontalMedicalIDCard({ darkMode = false }: HorizontalMedicalIDCardProps) {
  const [data, setData] = useState<{
    name: string;
    initials: string;
    dob: string;
    bloodType: string;
    allergies: string;
    emergency: string;
    conditions: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const userId = session.user.id;

      const [upRes, ppRes, allergiesRes, conditionsRes] = await Promise.all([
        supabase.from('user_profiles').select('first_name, last_name, date_of_birth').eq('user_id', userId).maybeSingle(),
        supabase.from('patient_profiles').select('blood_type, emergency_contact_name, emergency_contact_phone').eq('user_id', userId).maybeSingle(),
        supabase.from('allergies').select('allergen').eq('user_id', userId),
        supabase.from('conditions').select('name').eq('user_id', userId),
      ]);

      const up = upRes.data;
      const pp = ppRes.data;
      const fn = up?.first_name || '';
      const ln = up?.last_name || '';
      const dobRaw = up?.date_of_birth;
      const dobFormatted = dobRaw
        ? new Date(dobRaw + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

      const allergyList = (allergiesRes.data || []).map((a: any) => a.allergen).filter(Boolean);
      const conditionList = (conditionsRes.data || []).map((c: any) => c.name).filter(Boolean);

      setData({
        name: `${fn} ${ln}`.trim() || 'Unknown',
        initials: `${fn[0] || ''}${ln[0] || ''}`.toUpperCase() || '?',
        dob: dobFormatted,
        bloodType: pp?.blood_type || 'Unknown',
        allergies: allergyList.length > 0 ? allergyList.slice(0, 2).join(', ') : 'None',
        emergency: pp?.emergency_contact_name
          ? `${pp.emergency_contact_name}${pp.emergency_contact_phone ? ` · ${pp.emergency_contact_phone}` : ''}`
          : 'Not on file',
        conditions: conditionList.length > 0 ? conditionList.slice(0, 2).join(', ') : 'None',
      });
    };
    load().catch(() => {});
  }, []);

  return (
    <div className={`rounded-lg border p-4 ${
      darkMode ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'
    }`}>
      <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
        darkMode ? 'text-stone-400' : 'text-stone-500'
      }`}>
        Medical ID Card
      </div>

      <div className="flex items-start gap-4">
        <div className={`flex items-center justify-center w-16 h-16 rounded-full flex-shrink-0 ${
          darkMode ? 'bg-stone-700' : 'bg-stone-100'
        }`}>
          <span className={`text-xl font-bold ${
            darkMode ? 'text-stone-300' : 'text-stone-700'
          }`}>{data?.initials || '?'}</span>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          <div>
            <div className={`font-bold mb-2 ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>{data?.name || '—'}</div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>DOB:</span>
              <span className={`font-medium ${
                darkMode ? 'text-stone-200' : 'text-stone-900'
              }`}>{data?.dob || '—'}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Blood Type:</span>
              <span className={`font-medium ${
                darkMode ? 'text-stone-200' : 'text-stone-900'
              }`}>{data?.bloodType || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Allergies:</span>
              <span className={`font-medium ${
                darkMode ? 'text-stone-200' : 'text-stone-900'
              }`}>{data?.allergies || '—'}</span>
            </div>
          </div>

          <div className="flex justify-between">
            <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Emergency:</span>
            <span className={`font-medium ${
              darkMode ? 'text-stone-200' : 'text-stone-900'
            }`}>{data?.emergency || '—'}</span>
          </div>

          <div className="flex justify-between">
            <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Conditions:</span>
            <span className={`font-medium ${
              darkMode ? 'text-stone-200' : 'text-stone-900'
            }`}>{data?.conditions || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

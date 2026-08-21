import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const { data: patientData, error: patientError } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (patientError && patientError.code !== 'PGRST116') {
        throw patientError;
      }

      setProfile(userProfile || null);
      setPatientProfile(patientData || null);
    } catch (err) {
      console.error('[useProfile]', err);
      setError(err?.message || 'Failed to load profile');
      setProfile(null);
      setPatientProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const medicalID = {
    fullName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
    dateOfBirth: profile?.date_of_birth || null,
    bloodType: patientProfile?.blood_type || null,
    allergies: patientProfile?.allergies || [],
    conditions: patientProfile?.conditions || [],
    initials: profile
      ? `${(profile.first_name || '')[0] || ''}${(profile.last_name || '')[0] || ''}`.toUpperCase()
      : 'HV',
  };

  return { profile, patientProfile, medicalID, loading, error, refetch: fetch };
}

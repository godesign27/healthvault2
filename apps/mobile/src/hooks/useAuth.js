import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseRecoveryLink, requestPasswordRecovery, saveRecoveredPassword } from '../lib/passwordRecovery';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [recovery, setRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const recoveryKey = 'hv-password-recovery-pending';

  useEffect(() => {
    let active = true;
    let handlingLink = false;
    const handleLink = async (url) => {
      if (handlingLink) return;
      let claimed = false;
      try {
        const tokens = parseRecoveryLink(url);
        if (!tokens) return;
        handlingLink = true; claimed = true;
        if (active) setLoading(true);
        if (active) { setRecovery(true); setRecoveryError(''); }
        await AsyncStorage.setItem(recoveryKey, '1');
        const { error } = await supabase.auth.setSession(tokens);
        if (error) throw error;
      } catch {
        if (active) { setRecovery(true); setRecoveryError('This recovery link could not be verified. Request a new link.'); }
      } finally {
        if (claimed) { handlingLink = false; if (active) setLoading(false); }
      }
    };
    const links = Linking.addEventListener('url', ({ url }) => { void handleLink(url); });
    const initialize = async () => {
      try {
        const pending = await AsyncStorage.getItem(recoveryKey);
        if (active && pending) setRecovery(true);
        await handleLink(await Linking.getInitialURL());
        const { data: { session: s }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active) { setSession(s); setUser(s?.user ?? null); }
      } catch {
        if (active) setRecoveryError('Unable to restore your session. Please try signing in again.');
      } finally { if (active) setLoading(false); }
    };
    void initialize();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => { active = false; links.remove(); subscription.unsubscribe(); };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) { await AsyncStorage.removeItem(recoveryKey); setRecovery(false); setRecoveryError(''); }
    return { error };
  };

  const requestRecovery = (email) => requestPasswordRecovery(supabase.auth, email);
  const completeRecovery = async (password, confirmation) => {
    if (!recovery || recoveryError) throw new Error('Request and open a valid recovery link first.');
    await saveRecoveredPassword(supabase.auth, password, confirmation);
    const { error } = await signOut();
    if (error) throw new Error('Password updated. Please try signing out again.');
  };
  return { session, user, loading, signIn, signOut, recovery, recoveryError, requestRecovery, completeRecovery };
}

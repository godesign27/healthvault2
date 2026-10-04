import {insuranceMemberIdFields} from './insurance-status';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';

type Action = 'primary' | 'remove' | 'stop' | 'resume' | 'memberId';
type Feedback = (message: string, type: 'success' | 'error') => void;
const messages: Record<Action, string> = {
  primary: 'Primary coverage updated', remove: 'Saved coverage removed',
  memberId: 'Member ID saved',
  stop: 'Saved coverage marked stopped', resume: 'Saved coverage marked active',
};

/** Serialize this screen's writes and suppress receipts after account changes/unmount. */
export function useInsuranceMutation(client: SupabaseClient, feedback: Feedback, refresh: () => Promise<unknown>, clearFeedback: () => void) {
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(false);
  const callbacks = useRef({feedback, refresh, clearFeedback});
  callbacks.current = {feedback, refresh, clearFeedback};
  useEffect(() => {
    mounted.current = true;
    const {data: {subscription}} = client.auth.onAuthStateChange(() => {
      generation.current++;
      callbacks.current.clearFeedback();
    });
    return () => {mounted.current = false; generation.current++; subscription.unsubscribe();};
  }, [client]);
  const run = useCallback(async (owner: string | null, id: string | undefined, action: Action, memberId?: string) => {
    if (locked.current || !mounted.current || !owner || !id) return false;
    if (action === 'memberId' && !memberId?.trim()) {
      callbacks.current.feedback('Enter the member ID from your insurance card.', 'error');
      return false;
    }
    locked.current = true; setBusy(true);
    const version = generation.current;
    const current = () => mounted.current && version === generation.current;
    try {
      const {data: auth, error: authError} = await client.auth.getUser();
      if (!current()) return false;
      if (authError || auth.user?.id !== owner) throw new Error('Account changed');
      if (action === 'primary') {
        const {data, error} = await client.rpc('set_primary_insurance', {p_coverage_id: id});
        if (error || data !== id) throw new Error('Missing receipt');
      } else {
        const table = client.from('insurance_coverages');
        const query = action === 'remove' ? table.delete() : table.update(action === 'memberId' ? insuranceMemberIdFields(memberId) : action === 'stop'
          ? {coverage_status: 'stopped', stopped_at: new Date().toISOString(), is_primary: false}
          : {coverage_status: 'active', stopped_at: null});
        const {data, error} = await query.eq('id', id).eq('user_id', owner).select('id').single();
        if (error || data?.id !== id) throw new Error('Missing receipt');
      }
      if (!current()) return false;
      callbacks.current.feedback(messages[action], 'success');
      await callbacks.current.refresh();
      return current();
    } catch {
      if (current()) callbacks.current.feedback('Could not update saved coverage. Refresh to check its current state before trying again.', 'error');
      return false;
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [client]);
  return {busy, run};
}

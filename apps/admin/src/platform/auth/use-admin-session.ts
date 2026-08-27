import type { Session } from '@supabase/supabase-js';
import type { AdminRoleAssignment } from '@health-vault/admin-contracts';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getAdminAssignments } from './admin-access';

type AdminSessionState =
  | { status: 'loading'; session: null; assignments: readonly [] ; error: null }
  | { status: 'signed_out'; session: null; assignments: readonly [] ; error: null }
  | { status: 'unauthorized'; session: Session; assignments: readonly [] ; error: string | null }
  | { status: 'authenticated'; session: Session; assignments: readonly AdminRoleAssignment[]; error: null };

const LOADING_STATE: AdminSessionState = {
  status: 'loading',
  session: null,
  assignments: [],
  error: null,
};

async function resolveAdminSession(session: Session | null): Promise<AdminSessionState> {
  if (!session) {
    return { status: 'signed_out', session: null, assignments: [], error: null };
  }

  try {
    const assignments = await getAdminAssignments(session.user.id);
    if (assignments.length === 0) {
      return { status: 'unauthorized', session, assignments: [], error: null };
    }
    return { status: 'authenticated', session, assignments, error: null };
  } catch (error) {
    return {
      status: 'unauthorized',
      session,
      assignments: [],
      error: error instanceof Error ? error.message : 'Unable to verify admin access',
    };
  }
}

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>(LOADING_STATE);

  useEffect(() => {
    let isActive = true;

    void supabase.auth.getSession().then(async ({ data }) => {
      const nextState = await resolveAdminSession(data.session);
      if (isActive) setState(nextState);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void resolveAdminSession(session).then((nextState) => {
        if (isActive) setState(nextState);
      });
    });

    return () => {
      isActive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}

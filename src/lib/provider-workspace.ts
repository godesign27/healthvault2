export type ProviderWorkspaceStep = 'loading' | 'sign_in' | 'verify_email' | 'enroll_mfa' | 'challenge_mfa' | 'load_workspace' | 'ready';

export function getProviderWorkspaceStep(state: {
  loading: boolean;
  signedIn: boolean;
  emailVerified: boolean;
  hasVerifiedTotp: boolean;
  currentAal: string | null;
  workspaceLoaded: boolean;
}): ProviderWorkspaceStep {
  if (state.loading) return 'loading';
  if (!state.signedIn) return 'sign_in';
  if (!state.emailVerified) return 'verify_email';
  if (!state.hasVerifiedTotp) return 'enroll_mfa';
  if (state.currentAal !== 'aal2') return 'challenge_mfa';
  return state.workspaceLoaded ? 'ready' : 'load_workspace';
}

export interface ProviderRosterRow {
  id: string;
  externalPatientId: string;
  organizationPatientNumber: string;
  givenName: string;
  familyName: string;
  birthDate: string;
  administrativeSex: string;
  city: string;
  state: string;
}

export function filterProviderRoster(rows: readonly ProviderRosterRow[], search: string): ProviderRosterRow[] {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return [...rows];
  return rows.filter((row) => [row.externalPatientId, row.organizationPatientNumber, row.givenName, row.familyName, row.birthDate, row.city, row.state]
    .some((value) => value.toLocaleLowerCase().includes(query)));
}

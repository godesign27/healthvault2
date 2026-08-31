interface PatientInvitationLifecycleEntry {
  id: string;
  provider_patient_identity_id: string;
  created_at: string;
}

export function selectCurrentPatientInvitations<T extends PatientInvitationLifecycleEntry>(entries: readonly T[]) {
  const current = new Map<string, T>();
  for (const entry of entries) {
    const timestamp = new Date(entry.created_at).getTime();
    if (!entry.provider_patient_identity_id || !Number.isFinite(timestamp)) continue;
    const existing = current.get(entry.provider_patient_identity_id);
    if (!existing || timestamp > new Date(existing.created_at).getTime()) current.set(entry.provider_patient_identity_id, entry);
  }
  return current;
}

import { AlertTriangle, FileUp, Loader2, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '../../lib/supabase';

interface Practitioner {
  id: string;
  display_name: string;
  specialty: string | null;
  credential_status: string;
  status: string;
}

interface Patient {
  id: string;
  organizationPatientNumber: string | null;
  externalPatientId: string;
  status: string;
  givenName: string;
  familyName: string;
  birthDate: string | null;
  hasActiveAccessGrant: boolean;
}

interface Assignment {
  id: string;
  practitioner_profile_id: string;
  provider_patient_identity_id: string;
  relationship_type: string;
  status: string;
}

interface AccessiblePatient {
  id: string; organizationPatientNumber: string | null; givenName: string; familyName: string;
  birthDate: string | null; administrativeSex: string | null; city: string | null; state: string | null;
  relationshipType: string; accessExpiresAt: string | null;
}

const relationships = [
  ['care_team', 'Care team'],
  ['primary_care', 'Primary care'],
  ['specialist', 'Specialist'],
  ['care_coordinator', 'Care coordinator'],
] as const;

interface PanelImportRow { practitionerEmail: string; patientNumber: string; relationshipType: string }

function parsePanelCsv(csv: string): PanelImportRow[] {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.shift()?.trim() !== 'practitioner_email,patient_number,relationship_type') throw new Error('CSV header must be practitioner_email,patient_number,relationship_type');
  if (!lines.length || lines.length > 2000) throw new Error('CSV must contain 1 to 2,000 assignments.');
  return lines.map((line, index) => {
    const values = line.split(',').map((value) => value.trim());
    if (values.length !== 3) throw new Error(`Row ${index + 2} must contain exactly three columns.`);
    const [practitionerEmail, patientNumber, relationshipType] = values;
    if (!practitionerEmail || !patientNumber || !relationships.some(([value]) => value === relationshipType)) throw new Error(`Row ${index + 2} contains an invalid email, patient number, or relationship.`);
    return { practitionerEmail: practitionerEmail.toLowerCase(), patientNumber, relationshipType };
  });
}

export function PractitionerPanelManager({ providerAccountId, practitionerView = false }: { providerAccountId: string; practitionerView?: boolean }) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [practitionerId, setPractitionerId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [relationshipType, setRelationshipType] = useState('care_team');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<'manage' | 'my-patients'>('manage');
  const [accessiblePatients, setAccessiblePatients] = useState<AccessiblePatient[]>([]);
  const [assignedCount, setAssignedCount] = useState(0);
  const [importRows, setImportRows] = useState<PanelImportRow[]>([]);
  const [importFileName, setImportFileName] = useState('');

  const invoke = useCallback(async (body: Record<string, unknown>) => {
    const { data, error: invokeError } = await supabase.functions.invoke('provider-admin-api', { body: { ...body, providerAccountId } });
    if (invokeError) {
      let detail = data?.error;
      const context = (invokeError as { context?: Response }).context;
      if (!detail && context && typeof context.json === 'function') {
        try { detail = (await context.clone().json())?.error; } catch { /* retain SDK message */ }
      }
      throw new Error(detail ?? invokeError.message);
    }
    return data;
  }, [providerAccountId]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      try {
        const practitionerData = await invoke({ action: 'list-my-practitioner-patients' });
        setMode('my-patients'); setAccessiblePatients(practitionerData?.patients ?? []); setAssignedCount(practitionerData?.assignedCount ?? 0);
        return;
      } catch {
        if (practitionerView) {
          setMode('my-patients');
          setError('Your professional verification is pending. My patients will become available after Health Vault verifies your practitioner credentials.');
          return;
        }
        setMode('manage');
      }
      const data = await invoke({ action: 'list-panel-management' });
      setPractitioners(data?.practitioners ?? []);
      setPatients(data?.patients ?? []);
      setAssignments(data?.assignments ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load practitioner panels.');
    } finally { setLoading(false); }
  }, [invoke, practitionerView]);

  useEffect(() => { void load(); }, [load]);

  const selectedPractitioner = practitioners.find((item) => item.id === practitionerId);
  const existingPatientIds = useMemo(() => new Set(assignments.filter((item) => item.practitioner_profile_id === practitionerId).map((item) => item.provider_patient_identity_id)), [assignments, practitionerId]);
  const availablePatients = useMemo(() => patients.filter((patient) => {
    const query = search.trim().toLowerCase();
    const matches = !query || `${patient.givenName} ${patient.familyName} ${patient.organizationPatientNumber ?? ''}`.toLowerCase().includes(query);
    return matches && !existingPatientIds.has(patient.id);
  }).slice(0, 50), [patients, search, existingPatientIds]);

  async function assignPatient() {
    if (!practitionerId || !patientId) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await invoke({ action: 'assign-practitioner-patient', practitionerProfileId: practitionerId, patientIdentityId: patientId, relationshipType });
      setPatientId(''); setNotice('Patient added to the practitioner panel. Access still depends on a separate active patient grant.');
      await load();
    } catch (assignError) { setError(assignError instanceof Error ? assignError.message : 'Unable to assign patient.'); }
    finally { setBusy(false); }
  }

  async function revokeAssignment(assignmentId: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      await invoke({ action: 'revoke-practitioner-assignment', assignmentId });
      setNotice('The panel assignment was revoked.'); await load();
    } catch (revokeError) { setError(revokeError instanceof Error ? revokeError.message : 'Unable to revoke assignment.'); }
    finally { setBusy(false); }
  }

  async function choosePanelCsv(file: File | undefined) {
    if (!file) return;
    setError(''); setNotice('');
    try { setImportRows(parsePanelCsv(await file.text())); setImportFileName(file.name); }
    catch (parseError) { setImportRows([]); setImportFileName(''); setError(parseError instanceof Error ? parseError.message : 'Unable to parse panel CSV.'); }
  }

  async function importPanelAssignments() {
    if (!importRows.length) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const data = await invoke({ action: 'bulk-assign-practitioner-patients', assignments: importRows });
      setNotice(`${data.createdCount} panel assignment${data.createdCount === 1 ? '' : 's'} created. ${data.skippedCount ? `${data.skippedCount} existing assignment${data.skippedCount === 1 ? ' was' : 's were'} skipped. ` : ''}Patient access still requires separate consent.`);
      setImportRows([]); setImportFileName(''); await load();
    } catch (importError) { setError(importError instanceof Error ? importError.message : 'Unable to import panel assignments.'); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="flex items-center gap-2 rounded-xl border border-stroke-subtle bg-surface-raised p-6 text-sm text-content-secondary"><Loader2 className="h-4 w-4 animate-spin" />Loading practitioner panels…</div>;

  if (mode === 'my-patients') return error ? <div><p className="text-sm font-semibold text-indigo-600">Practitioner onboarding</p><h1 className="mt-1 text-3xl font-bold">My patients</h1><div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><strong>Professional verification pending.</strong><p className="mt-2 leading-6">{error}</p></div></div> : <PractitionerPatientList patients={accessiblePatients} assignedCount={assignedCount} onRefresh={() => void load()} />;

  return <div>
    <p className="text-sm font-semibold text-indigo-600">Mandatory panel access</p>
    <h1 className="mt-1 text-3xl font-bold">Practitioner panels</h1>
    <p className="mt-2 text-content-secondary">Assign roster patients to verified practitioners in this provider organization.</p>

    <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div><strong>Assignment does not grant patient access.</strong><p className="mt-1">A practitioner also needs an active patient identity link and consent/access grant. No clinical data is shown here.</p></div>
    </div>
    {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

    {practitioners.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-stroke-default bg-surface-raised p-8 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-content-tertiary" /><h2 className="mt-3 font-semibold">No practitioner profiles yet</h2><p className="mt-1 text-sm text-content-secondary">Invite a member with the Practitioner role. Their profile must then be professionally verified before patients can be assigned.</p></div> : <>
      <div className="mt-6 rounded-xl border border-stroke-subtle bg-surface-raised p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><FileUp className="h-5 w-5 text-indigo-600" /><h2 className="font-semibold">Import panel assignments</h2></div><p className="mt-2 text-sm text-content-secondary">Upload up to 2,000 practitioner-to-patient assignments. Use practitioner email and the provider patient number.</p></div><button type="button" onClick={() => { const blob = new Blob(['practitioner_email,patient_number,relationship_type\npractitioner@example.com,HV-DEMO-0001,care_team\n'], { type: 'text/csv' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'health-vault-panel-assignments-template.csv'; link.click(); URL.revokeObjectURL(link.href); }} className="text-sm font-semibold text-indigo-700">Download template</button></div><label className="mt-4 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-4 py-6 text-sm font-semibold text-indigo-700"><input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void choosePanelCsv(event.target.files?.[0])} />{importFileName || 'Choose panel CSV'}</label>{importRows.length > 0 && <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-content-secondary"><strong className="text-content-primary">{importRows.length}</strong> valid assignment rows ready. Fresh MFA is required.</p><button type="button" disabled={busy} onClick={() => void importPanelAssignments()} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Import assignments</button></div>}</div>
      <div className="mt-6 grid gap-4 rounded-xl border border-stroke-subtle bg-surface-raised p-5 md:grid-cols-2">
        <label className="text-sm font-medium">Practitioner<select value={practitionerId} onChange={(event) => { setPractitionerId(event.target.value); setPatientId(''); }} className="mt-2 w-full rounded-lg border border-stroke-default bg-white px-3 py-2.5"><option value="">Select practitioner</option>{practitioners.map((item) => <option key={item.id} value={item.id}>{item.display_name} — {item.credential_status}</option>)}</select></label>
        <label className="text-sm font-medium">Relationship<select value={relationshipType} onChange={(event) => setRelationshipType(event.target.value)} className="mt-2 w-full rounded-lg border border-stroke-default bg-white px-3 py-2.5">{relationships.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm font-medium md:col-span-2">Find roster patient<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or patient number" className="mt-2 w-full rounded-lg border border-stroke-default px-3 py-2.5" /></label>
        <label className="text-sm font-medium md:col-span-2">Patient<select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="mt-2 w-full rounded-lg border border-stroke-default bg-white px-3 py-2.5"><option value="">Select patient</option>{availablePatients.map((patient) => <option key={patient.id} value={patient.id}>{patient.familyName}, {patient.givenName} — {patient.organizationPatientNumber ?? patient.externalPatientId} — {patient.hasActiveAccessGrant ? 'grant active' : 'no grant'}</option>)}</select></label>
        <div className="md:col-span-2"><button disabled={busy || !practitionerId || !patientId || selectedPractitioner?.credential_status !== 'verified' || selectedPractitioner?.status !== 'active'} onClick={() => void assignPatient()} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><UserPlus className="h-4 w-4" />Add to panel</button>{selectedPractitioner && selectedPractitioner.credential_status !== 'verified' && <p className="mt-2 text-xs text-amber-700">This practitioner cannot receive panel assignments until professional verification is complete.</p>}</div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-stroke-subtle bg-surface-raised"><div className="border-b border-stroke-subtle px-5 py-4"><h2 className="font-semibold">Active assignments</h2></div>{assignments.length === 0 ? <p className="p-8 text-center text-sm text-content-secondary">No active panel assignments.</p> : <div className="divide-y divide-stroke-subtle">{assignments.map((assignment) => { const practitioner = practitioners.find((item) => item.id === assignment.practitioner_profile_id); const patient = patients.find((item) => item.id === assignment.provider_patient_identity_id); return <div key={assignment.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{patient ? `${patient.familyName}, ${patient.givenName}` : 'Roster patient'}</p><p className="mt-1 text-xs text-content-secondary">{practitioner?.display_name ?? 'Practitioner'} · {relationships.find(([value]) => value === assignment.relationship_type)?.[1] ?? assignment.relationship_type} · {patient?.hasActiveAccessGrant ? 'Active grant' : 'No active grant'}</p></div><button disabled={busy} onClick={() => void revokeAssignment(assignment.id)} className="flex items-center gap-2 self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"><UserMinus className="h-4 w-4" />Revoke</button></div>; })}</div>}</div>
    </>}
  </div>;
}

function PractitionerPatientList({ patients, assignedCount, onRefresh }: { patients: AccessiblePatient[]; assignedCount: number; onRefresh: () => void }) {
  return <div><p className="text-sm font-semibold text-indigo-600">Consent-gated workspace</p><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="mt-1 text-3xl font-bold">My patients</h1><p className="mt-2 text-content-secondary">Roster demographics for assigned patients with active identity links and access grants.</p></div><button onClick={onRefresh} className="rounded-lg border border-stroke-default px-3 py-2 text-sm font-semibold">Refresh</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-stroke-subtle bg-surface-raised p-5"><p className="text-sm text-content-secondary">Panel assignments</p><strong className="mt-2 block text-2xl">{assignedCount}</strong></div><div className="rounded-xl border border-stroke-subtle bg-surface-raised p-5"><p className="text-sm text-content-secondary">Accessible now</p><strong className="mt-2 block text-2xl">{patients.length}</strong></div></div><div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Roster-only view.</strong> No clinical records are exposed in this pilot. Patients disappear immediately when assignment, identity link, or consent access becomes inactive.</div><div className="mt-6 overflow-hidden rounded-xl border border-stroke-subtle bg-surface-raised">{patients.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-stroke-subtle bg-surface-sunken text-xs uppercase tracking-wide text-content-tertiary"><tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Patient number</th><th className="px-4 py-3">Birth date</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Relationship</th><th className="px-4 py-3">Access ends</th></tr></thead><tbody className="divide-y divide-stroke-subtle">{patients.map((patient) => <tr key={patient.id}><td className="px-4 py-3 font-semibold">{patient.familyName}, {patient.givenName}</td><td className="px-4 py-3 font-mono text-xs">{patient.organizationPatientNumber ?? '—'}</td><td className="px-4 py-3">{patient.birthDate ?? '—'}</td><td className="px-4 py-3">{[patient.city, patient.state].filter(Boolean).join(', ') || '—'}</td><td className="px-4 py-3 capitalize">{patient.relationshipType.replace(/_/g, ' ')}</td><td className="px-4 py-3">{patient.accessExpiresAt ? new Date(patient.accessExpiresAt).toLocaleDateString() : 'No expiry'}</td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-content-tertiary" /><h2 className="mt-3 font-semibold">No patients are accessible yet</h2><p className="mx-auto mt-1 max-w-xl text-sm text-content-secondary">A patient must be assigned to your panel and must accept an active identity link and roster-demographics access grant before appearing here.</p></div>}</div></div>;
}

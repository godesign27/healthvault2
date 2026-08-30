import { PROVIDER_ROLE_KEYS, type ProviderAccountStatus, type ProviderRoleKey } from '@health-vault/provider-contracts';
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Building2, CheckCircle2, Database, ExternalLink, KeyRound, RefreshCw, Search, Send, ShieldAlert, ShieldCheck, Stethoscope, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminMfaControl } from '../../platform/auth/admin-mfa-control';
import { bulkUpdatePractitionerCredentials, createProviderInvitation, fetchPatientConnections, fetchPractitionerReviews, fetchProviderDirectory, fetchProviderImports, fetchProviderMembers, lookupMfaRecoveryAccount, resendProviderInvitation, resetUserMfa, terminatePatientConnection, updatePractitionerCredential, type MfaRecoveryAccount, type PatientConnectionEntry, type PractitionerReviewEntry } from './provider-operations-api';
import { filterPatientConnections, filterPractitionerReviews, filterProviderDirectory, filterProviderImports, getMembershipSummary, getPatientConnectionSummary, getPractitionerReviewSummary, getProviderDirectorySummary, getProviderImportSummary, mergeProviderMemberships, type PatientConnectionStatusFilter, type PractitionerCredentialFilter, type ProviderDirectoryEntry, type ProviderImportEntry, type ProviderImportStatus, type ProviderMembershipEntry } from './provider-operations-data';
import { validatePatientAccessIntervention } from './patient-access-intervention';

interface ProviderOperationsPageProps { section: string; isPlatformOwner: boolean }
function formatStatus(status: string) { return status.replace(/_/g, ' '); }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'No activity yet'; }

function PageSelectionCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: (checked: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (inputRef.current) inputRef.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input ref={inputRef} type="checkbox" aria-label="Select practitioners on this page" checked={checked} onChange={(event) => onChange(event.target.checked)} />;
}

function DirectoryView({ providers }: { providers: readonly ProviderDirectoryEntry[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ProviderAccountStatus | 'all'>('all');
  const summary = getProviderDirectorySummary(providers);
  const visible = useMemo(() => filterProviderDirectory(providers, { query, status }), [providers, query, status]);
  return <div className="provider-view"><section className="provider-stat-strip" aria-label="Provider directory summary"><div><span>Total organizations</span><strong>{summary.total}</strong></div><div><span>Active</span><strong>{summary.active}</strong></div><div><span>Needs attention</span><strong>{summary.needsAttention}</strong></div><div><span>In onboarding</span><strong>{summary.onboarding}</strong></div></section><section className="provider-table-panel"><div className="provider-panel-heading"><div><h2>Provider directory</h2><p>Live organization lifecycle and roster readiness.</p></div><span>{visible.length} shown</span></div><div className="provider-toolbar"><label className="provider-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search providers</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, type, or slug" /></label><label className="provider-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as ProviderAccountStatus | 'all')}><option value="all">All statuses</option><option value="active">Active</option><option value="degraded">Degraded</option><option value="verification_pending">Verification pending</option><option value="suspended">Suspended</option></select></label></div>{visible.length ? <div className="provider-table-wrap"><table className="provider-table"><thead><tr><th>Organization</th><th>Status</th><th>Readiness</th><th>Roster</th><th>Members</th><th>Connections</th><th>Last activity</th></tr></thead><tbody>{visible.map((provider) => <tr key={provider.id}><td><strong>{provider.displayName}</strong><small>{provider.providerType}</small></td><td><span className={`provider-status provider-status-${provider.status}`}>{formatStatus(provider.status)}</span></td><td>{provider.readiness}</td><td>{provider.rosterCount.toLocaleString()}</td><td>{provider.activeMemberCount}</td><td>{provider.activeConnectionCount}</td><td>{formatDate(provider.lastActivityAt)}</td></tr>)}</tbody></table></div> : <div className="provider-empty"><Search size={22} /><strong>No matching providers</strong><p>Adjust the search or status filter.</p></div>}</section></div>;
}

function MembershipsView({ providers, canManage }: { providers: readonly ProviderDirectoryEntry[]; canManage: boolean }) {
  const [providerId, setProviderId] = useState(providers[0]?.id ?? '');
  const [memberships, setMemberships] = useState<ProviderMembershipEntry[]>([]);
  const [invitationIds, setInvitationIds] = useState(new Set<string>());
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProviderRoleKey>('operations_staff');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const summary = getMembershipSummary(memberships);

  useEffect(() => { if (!providerId && providers[0]) setProviderId(providers[0].id); }, [providerId, providers]);
  async function loadMembers(nextProviderId = providerId) {
    if (!nextProviderId) return;
    setBusy('load'); setError('');
    try {
      const data = await fetchProviderMembers(nextProviderId);
      setMemberships(mergeProviderMemberships(nextProviderId, data.members, data.invitations));
      setInvitationIds(new Set(data.invitations.map((invitation: { id: string }) => invitation.id)));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load provider members.'); }
    finally { setBusy(''); }
  }
  useEffect(() => { void loadMembers(providerId); }, [providerId]); // eslint-disable-line react-hooks/exhaustive-deps
  async function invite() {
    if (!canManage) { setError('Verify your administrator session before creating an invitation.'); return; }
    if (!providerId || !/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid member email.'); return; }
    setBusy('invite'); setError(''); setMessage('');
    try { await createProviderInvitation(providerId, email, [role]); setEmail(''); setMessage('Invitation created and delivery requested.'); await loadMembers(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to create invitation.'); }
    finally { setBusy(''); }
  }
  async function resend(invitationId: string) {
    if (!canManage) { setError('Verify your administrator session before resending an invitation.'); return; }
    setBusy(invitationId); setError(''); setMessage('');
    try { await resendProviderInvitation(providerId, invitationId); setMessage('Invitation delivery requested again.'); await loadMembers(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to resend invitation.'); }
    finally { setBusy(''); }
  }
  return <div className="provider-view"><div className="provider-toolbar"><label className="provider-filter"><span>Organization</span><select value={providerId} onChange={(event) => setProviderId(event.target.value)}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.displayName}</option>)}</select></label><button type="button" onClick={() => void loadMembers()} disabled={busy === 'load'}><RefreshCw size={16} /> Refresh</button></div><section className="provider-stat-strip" aria-label="Provider membership summary"><div><span>Total memberships</span><strong>{summary.total}</strong></div><div><span>Active</span><strong>{summary.active}</strong></div><div><span>Invited</span><strong>{summary.invited}</strong></div><div><span>Suspended</span><strong>{summary.suspended}</strong></div></section><section className="provider-table-panel"><div className="provider-panel-heading"><div><h2>Memberships and invitations</h2><p>Live provider-scoped access lifecycle for the selected organization.</p></div></div><div className="provider-toolbar"><label className="provider-search"><span className="sr-only">Member email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="member@example.com" disabled={!canManage} /></label><label className="provider-filter"><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value as ProviderRoleKey)} disabled={!canManage}>{PROVIDER_ROLE_KEYS.map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}</select></label><button type="button" onClick={() => void invite()} disabled={!canManage || busy === 'invite' || !providerId}><Send size={16} />{busy === 'invite' ? 'Inviting…' : 'Invite member'}</button></div>{(error || message) && <div className="provider-action-note"><ShieldCheck size={17} /><p>{error || message}</p></div>}<div className="provider-table-wrap"><table className="provider-table"><thead><tr><th>Member</th><th>Roles</th><th>Status</th><th>Lifecycle activity</th><th>Action</th></tr></thead><tbody>{memberships.map((membership) => <tr key={membership.id}><td><strong>{membership.name}</strong><small>{membership.email}</small></td><td><div className="provider-role-list">{membership.roles.map((entry) => <span key={entry}>{formatStatus(entry)}</span>)}</div></td><td><span className={`provider-status provider-status-${membership.status}`}>{formatStatus(membership.status)}</span></td><td>{membership.status === 'invited' ? `Invited ${formatDate(membership.invitedAt)}` : formatDate(membership.lastActiveAt)}</td><td>{invitationIds.has(membership.id) ? <button type="button" onClick={() => void resend(membership.id)} disabled={!canManage || busy === membership.id}>{busy === membership.id ? 'Sending…' : 'Resend'}</button> : '—'}</td></tr>)}</tbody></table></div></section></div>;
}

function ImportsView({ providers }: { providers: readonly ProviderDirectoryEntry[] }) {
  const [imports, setImports] = useState<ProviderImportEntry[]>([]);
  const [providerId, setProviderId] = useState('all');
  const [status, setStatus] = useState<ProviderImportStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { void fetchProviderImports().then(setImports).catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load imports.')).finally(() => setLoading(false)); }, []);
  const summary = getProviderImportSummary(imports);
  const visible = useMemo(() => filterProviderImports(imports, { providerId, status, query }), [imports, providerId, status, query]);
  if (loading) return <div className="provider-empty"><RefreshCw /><strong>Loading import operations</strong></div>;
  if (error) return <div className="provider-empty"><AlertTriangle /><strong>Import data unavailable</strong><p>{error}</p></div>;
  return <div className="provider-view"><section className="provider-stat-strip" aria-label="Provider import summary"><div><span>Total jobs</span><strong>{summary.total}</strong></div><div><span>Committed</span><strong>{summary.committed}</strong></div><div><span>Needs attention</span><strong>{summary.needsAttention}</strong></div><div><span>Rows processed</span><strong>{summary.processedRows.toLocaleString()}</strong></div></section><section className="provider-table-panel"><div className="provider-panel-heading"><div><h2>Roster import operations</h2><p>Aggregate job health, provenance, and reconciliation. Patient rows are never returned.</p></div><span>{visible.length} shown</span></div><div className="provider-toolbar"><label className="provider-search"><Search size={17} /><span className="sr-only">Search import jobs</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search organization or source" /></label><label className="provider-filter"><span>Organization</span><select value={providerId} onChange={(event) => setProviderId(event.target.value)}><option value="all">All organizations</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.displayName}</option>)}</select></label><label className="provider-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as ProviderImportStatus | 'all')}><option value="all">All statuses</option><option value="staged">Staged</option><option value="validated">Validated</option><option value="rejected">Rejected</option><option value="committed">Committed</option><option value="rolled_back">Rolled back</option></select></label></div><div className="provider-table-wrap"><table className="provider-table"><thead><tr><th>Organization / source</th><th>Status</th><th>Rows</th><th>Validation</th><th>Reconciliation</th><th>Created</th></tr></thead><tbody>{visible.map((job) => <tr key={job.id}><td><strong>{job.providerName}</strong><small>{job.sourceName} · {job.sourceSystem}{job.synthetic ? ' · synthetic' : ''}</small></td><td><span className={`provider-status provider-status-${job.status}`}>{formatStatus(job.status)}</span></td><td>{job.rowCount.toLocaleString()}</td><td>{job.validRowCount} valid · {job.invalidRowCount} invalid · {job.exceptionCount} exceptions</td><td>{job.status === 'committed' ? `${job.insertedCount} inserted · ${job.unchangedCount} unchanged` : 'Not committed'}</td><td>{formatDate(job.createdAt)}</td></tr>)}</tbody></table>{visible.length === 0 && <div className="provider-empty"><Database /><strong>No matching import jobs</strong><p>Adjust the organization, status, or source filter.</p></div>}</div></section></div>;
}

function PractitionerReviewsView({ canManage }: { canManage: boolean }) {
  const [practitioners, setPractitioners] = useState<PractitionerReviewEntry[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState<'pending' | 'verified' | 'rejected' | 'expired'>('pending');
  const [evidenceRef, setEvidenceRef] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [bulkStatus, setBulkStatus] = useState<'pending' | 'verified' | 'rejected' | 'expired'>('verified');
  const [bulkEvidenceRef, setBulkEvidenceRef] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [query, setQuery] = useState('');
  const [credentialFilter, setCredentialFilter] = useState<PractitionerCredentialFilter>('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: 'practitioner' | 'organization' | 'credential' | 'reviewed'; direction: 'asc' | 'desc' }>({ key: 'reviewed', direction: 'desc' });
  const pageSize = 25;
  const load = async () => { setBusy(true); setError(''); try { setPractitioners(await fetchPractitionerReviews()); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load practitioner reviews.'); } finally { setBusy(false); } };
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(''), 5000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);
  useEffect(() => {
    if (selectedId || !practitioners.length) return;
    const requestedEmail = new URLSearchParams(window.location.search).get('practitioner')?.trim().toLowerCase();
    const requested = requestedEmail ? practitioners.find((item) => item.email?.toLowerCase() === requestedEmail) : null;
    if (!requested) return;
    setSelectedId(requested.id);
    setStatus(requested.credential_status === 'unverified' ? 'pending' : requested.credential_status);
    setEvidenceRef(requested.credential_evidence_ref ?? '');
    setReason(requested.credential_review_reason ?? '');
  }, [practitioners, selectedId]);
  const selected = practitioners.find((item) => item.id === selectedId);
  const summary = useMemo(() => getPractitionerReviewSummary(practitioners), [practitioners]);
  const visible = useMemo(() => {
    const filtered = filterPractitionerReviews(practitioners, { query, status: credentialFilter });
    const valueFor = (item: PractitionerReviewEntry) => sort.key === 'practitioner' ? item.display_name : sort.key === 'organization' ? item.provider_name : sort.key === 'credential' ? item.credential_status : item.credential_reviewed_at ?? '';
    return [...filtered].sort((a, b) => valueFor(a).localeCompare(valueFor(b), undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1));
  }, [practitioners, query, credentialFilter, sort]);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);
  const pageIds = pageItems.map((item) => item.id);
  const pageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  useEffect(() => { setPage(1); }, [query, credentialFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  function changeSort(key: typeof sort.key) { setSort((current) => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }); }
  function SortIcon({ column }: { column: typeof sort.key }) { return sort.key !== column ? <ArrowUpDown size={13} /> : sort.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />; }
  async function save() {
    if (!selected) return;
    if (status === 'verified' && !evidenceRef.trim()) {
      setError('An evidence reference is required before a practitioner can be verified. Enter the source used for the review or use the synthetic pilot evidence option.');
      return;
    }
    setBusy(true); setError(''); setMessage('');
    try { const successMessage = `${selected.display_name} credential status updated to ${status}.`; await updatePractitionerCredential({ practitionerProfileId: selected.id, providerAccountId: selected.provider_account_id, credentialStatus: status, evidenceRef, reason }); setMessage(successMessage); setToastMessage(successMessage); setSelectedId(''); setEvidenceRef(''); setReason(''); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update credential review.'); }
    finally { setBusy(false); }
  }
  async function saveBulkReview() {
    if (!selectedIds.size) return;
    if (bulkStatus === 'verified' && !bulkEvidenceRef.trim()) { setError('A shared evidence reference is required for bulk verification.'); return; }
    if (bulkStatus === 'rejected' && !bulkReason.trim()) { setError('A shared review reason is required for bulk rejection.'); return; }
    if (!window.confirm(`Set ${selectedIds.size} selected practitioner${selectedIds.size === 1 ? '' : 's'} to ${bulkStatus}? Each practitioner will receive an individual audit entry.`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const data = await bulkUpdatePractitionerCredentials({ practitionerProfileIds: [...selectedIds], credentialStatus: bulkStatus, evidenceRef: bulkEvidenceRef, reason: bulkReason });
      const successMessage = `${data.updatedCount} practitioner credential review${data.updatedCount === 1 ? '' : 's'} updated to ${bulkStatus}.`;
      setMessage(successMessage); setToastMessage(successMessage); setSelectedIds(new Set()); setBulkEvidenceRef(''); setBulkReason(''); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update selected practitioner reviews.'); }
    finally { setBusy(false); }
  }
  return <div className="provider-view">
    {toastMessage && <div className="admin-toast admin-toast-success" role="status" aria-live="polite"><ShieldCheck size={20} /><div><strong>Review saved</strong><p>{toastMessage}</p></div><button type="button" aria-label="Dismiss notification" onClick={() => setToastMessage('')}>×</button></div>}
    <section className="provider-stat-strip provider-stat-filters" aria-label="Filter practitioner reviews by status"><button type="button" className={credentialFilter === 'all' ? 'active' : ''} onClick={() => setCredentialFilter('all')}><span>Total practitioners</span><strong>{summary.total}</strong></button><button type="button" className={credentialFilter === 'needs_review' ? 'active' : ''} onClick={() => setCredentialFilter('needs_review')}><span>Needs review</span><strong>{summary.needsReview}</strong></button><button type="button" className={credentialFilter === 'verified' ? 'active' : ''} onClick={() => setCredentialFilter('verified')}><span>Verified</span><strong>{summary.verified}</strong></button><button type="button" className={credentialFilter === 'attention' ? 'active' : ''} onClick={() => setCredentialFilter('attention')}><span>Needs attention</span><strong>{summary.attention}</strong></button></section>
    <section className="provider-table-panel">
      <div className="provider-panel-heading"><div><h2>Practitioner credential reviews</h2><p>Platform review is separate from provider membership and panel assignment.</p></div><button type="button" className="button-secondary" onClick={() => void load()} disabled={busy}><RefreshCw size={16} /> Refresh</button></div>
      <div className="provider-toolbar"><label className="provider-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search practitioners</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, specialty, organization, or identifier" /></label><label className="provider-filter"><span>Credential</span><select value={credentialFilter} onChange={(event) => setCredentialFilter(event.target.value as PractitionerCredentialFilter)}><option value="all">All statuses</option><option value="needs_review">Needs review</option><option value="attention">Needs attention</option><option value="unverified">Unverified</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="expired">Expired</option></select></label><span className="provider-result-count">{visible.length} shown</span></div>
      {error && <div className="provider-action-note"><AlertTriangle size={17} /><p>{error}</p></div>}{message && <div className="provider-action-note"><ShieldCheck size={17} /><p>{message}</p></div>}
      {selectedIds.size > 0 && <div className="provider-bulk-review"><div><strong>{selectedIds.size} selected</strong><small>Selections persist while you filter and change pages.</small></div><label className="provider-filter"><span>Status</span><select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as typeof bulkStatus)}><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="expired">Expired</option></select></label><label className="provider-search"><span>Shared evidence{bulkStatus === 'verified' ? ' · required' : ''}</span><input value={bulkEvidenceRef} onChange={(event) => setBulkEvidenceRef(event.target.value)} placeholder="npi-batch:reference" maxLength={500} /></label><label className="provider-search"><span>Shared reason{bulkStatus === 'rejected' ? ' · required' : ''}</span><input value={bulkReason} onChange={(event) => setBulkReason(event.target.value)} placeholder="Batch review notes" maxLength={1000} /></label>{bulkStatus === 'verified' && visible.length > 0 && visible.every((item) => item.provider_name === 'Health Vault Demo Provider') && !bulkEvidenceRef.trim() && <button type="button" onClick={() => { setBulkEvidenceRef(`synthetic-pilot:batch-${new Date().toISOString().slice(0, 10)}`); setBulkReason((value) => value || 'Synthetic demo practitioners approved for pilot testing only.'); }}>Use pilot evidence</button>}<button type="button" disabled={busy || !canManage} onClick={() => void saveBulkReview()}>Update {selectedIds.size}</button><button type="button" disabled={busy} onClick={() => setSelectedIds(new Set())}>Clear</button></div>}
      <div className="provider-table-wrap"><table className="provider-table provider-review-table"><thead><tr><th><PageSelectionCheckbox checked={pageSelected} indeterminate={somePageSelected && !pageSelected} onChange={(checked) => setSelectedIds((current) => { const next = new Set(current); pageIds.forEach((id) => checked ? next.add(id) : next.delete(id)); return next; })} /></th><th><button type="button" className="table-sort" onClick={() => changeSort('practitioner')}>Practitioner <SortIcon column="practitioner" /></button></th><th><button type="button" className="table-sort" onClick={() => changeSort('organization')}>Organization <SortIcon column="organization" /></button></th><th><button type="button" className="table-sort" onClick={() => changeSort('credential')}>Credential <SortIcon column="credential" /></button></th><th>Identifier</th><th><button type="button" className="table-sort" onClick={() => changeSort('reviewed')}>Last review <SortIcon column="reviewed" /></button></th><th>Action</th></tr></thead><tbody>{pageItems.map((item) => <tr key={item.id} className={selectedIds.has(item.id) ? 'selected' : ''}><td><input type="checkbox" aria-label={`Select ${item.display_name}`} checked={selectedIds.has(item.id)} onChange={(event) => setSelectedIds((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next; })} /></td><td><strong>{item.display_name}</strong><small>{item.email ?? 'Email unavailable'}{item.specialty ? ` · ${item.specialty}` : ''}</small></td><td>{item.provider_name}</td><td><span className={`provider-status provider-status-${item.credential_status}`}>{item.credential_status === 'verified' && <CheckCircle2 size={13} aria-hidden="true" />}{formatStatus(item.credential_status)}</span></td><td>{item.professional_identifier_value ? `${item.professional_identifier_type ?? 'ID'}: ${item.professional_identifier_value}` : 'Not supplied'}</td><td>{formatDate(item.credential_reviewed_at)}</td><td><button type="button" className="button-secondary button-compact" disabled={!canManage} onClick={() => { setSelectedId(item.id); setStatus(item.credential_status === 'unverified' ? 'pending' : item.credential_status); setEvidenceRef(item.credential_evidence_ref ?? ''); setReason(item.credential_review_reason ?? ''); setError(''); }}>Review</button></td></tr>)}</tbody></table>{!pageItems.length && <div className="provider-empty"><Stethoscope /><strong>{practitioners.length ? 'No matching practitioners' : 'No practitioner profiles'}</strong><p>{practitioners.length ? 'Adjust the search or credential filter.' : 'Profiles appear after a Practitioner invitation is accepted.'}</p></div>}</div>
      {visible.length > 0 && <div className="provider-pagination"><span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, visible.length)} of {visible.length}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button></div></div>}
    </section>
    {selected && <section className="provider-table-panel"><div className="provider-panel-heading"><div><h2>Review {selected.display_name}</h2><p>Record a bounded evidence reference—not credential documents or secrets.</p></div><button type="button" className="button-secondary" onClick={() => setSelectedId('')}><X size={16} /> Close review</button></div><div className="provider-toolbar"><label className="provider-filter"><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setError(''); }}><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="expired">Expired</option></select></label><label className="provider-search"><span>Evidence reference{status === 'verified' ? ' · required' : ''}</span><input value={evidenceRef} onChange={(event) => { setEvidenceRef(event.target.value); setError(''); }} placeholder="Enter a source, such as npi-registry:1234567890" maxLength={500} /></label>{status === 'verified' && selected.provider_name === 'Health Vault Demo Provider' && !evidenceRef.trim() && <button type="button" className="button-secondary" onClick={() => { setEvidenceRef(`synthetic-pilot:${selected.id}`); setReason((value) => value || 'Synthetic demo practitioner approved for pilot testing only.'); setError(''); }}>Use synthetic pilot evidence</button>}<label className="provider-search"><span>Review reason</span><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Review notes" maxLength={1000} /></label><button type="button" onClick={() => void save()} disabled={busy || !canManage || (status === 'rejected' && !reason.trim())}>Save review</button></div>{status === 'verified' && !evidenceRef.trim() && <div className="provider-action-note"><AlertTriangle size={17} /><p>Verification requires an evidence reference. For this demo organization, you can use the synthetic pilot evidence option.</p></div>}</section>}
  </div>;
}

function PatientConnectionsView({ canManage }: { canManage: boolean }) {
  const [connections, setConnections] = useState<PatientConnectionEntry[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PatientConnectionStatusFilter>('all');
  const [selected, setSelected] = useState<PatientConnectionEntry | null>(null);
  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: 'patient' | 'provider' | 'status' | 'effective' | 'end'; direction: 'asc' | 'desc' }>({ key: 'effective', direction: 'desc' });
  const pageSize = 25;
  const load = async () => { setBusy(true); setError(''); try { setConnections(await fetchPatientConnections()); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load patient connections.'); } finally { setBusy(false); } };
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(''), 5000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);
  const summary = useMemo(() => getPatientConnectionSummary(connections), [connections]);
  const visible = useMemo(() => {
    const filtered = filterPatientConnections(connections, { query, status });
    const valueFor = (entry: PatientConnectionEntry) => sort.key === 'patient' ? entry.patientName : sort.key === 'provider' ? entry.providerName : sort.key === 'status' ? entry.status : sort.key === 'effective' ? entry.effectiveAt ?? '' : entry.revokedAt ?? entry.expiresAt ?? '';
    return [...filtered].sort((a, b) => valueFor(a).localeCompare(valueFor(b), undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1));
  }, [connections, query, status, sort]);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [query, status]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  function changeSort(key: typeof sort.key) { setSort((current) => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }); }
  function SortIcon({ column }: { column: typeof sort.key }) { return sort.key !== column ? <ArrowUpDown size={13} /> : sort.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />; }
  function openIntervention(entry: PatientConnectionEntry) { setSelected(entry); setReason(''); setAcknowledged(false); setError(''); setMessage(''); }
  function closeIntervention() { setSelected(null); setReason(''); setAcknowledged(false); }
  async function terminate() {
    if (!selected) return;
    try {
      const input = validatePatientAccessIntervention({ providerPatientIdentityId: selected.providerPatientIdentityId, providerAccountId: selected.providerAccountId, reason });
      if (!acknowledged) { setError('Confirm that you understand the effect of this intervention before continuing.'); return; }
      if (!window.confirm(`Terminate ${selected.providerName} access for ${selected.patientName}? The patient-owned profile and retained records will not be deleted.`)) return;
      setBusy(true); setError(''); setMessage(''); await terminatePatientConnection(input);
      const successMessage = `${selected.providerName} access for ${selected.patientName} was terminated. The patient-owned profile was retained.`;
      setMessage(successMessage); setToastMessage(successMessage); closeIntervention(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to terminate patient access.'); }
    finally { setBusy(false); }
  }
  return <div className="provider-view">
    {toastMessage && <div className="admin-toast admin-toast-success" role="status" aria-live="polite"><ShieldCheck size={20} /><div><strong>Access intervention complete</strong><p>{toastMessage}</p></div><button type="button" aria-label="Dismiss notification" onClick={() => setToastMessage('')}>×</button></div>}
    <section className="provider-stat-strip provider-stat-filters" aria-label="Filter patient connections by status"><button type="button" className={status === 'all' ? 'active' : ''} onClick={() => setStatus('all')}><span>Total connections</span><strong>{summary.total}</strong></button><button type="button" className={status === 'active' ? 'active' : ''} onClick={() => setStatus('active')}><span>Active</span><strong>{summary.active}</strong></button><button type="button" className={status === 'expired' ? 'active' : ''} onClick={() => setStatus('expired')}><span>Expired</span><strong>{summary.expired}</strong></button><button type="button" className={status === 'revoked' ? 'active' : ''} onClick={() => setStatus('revoked')}><span>Revoked</span><strong>{summary.revoked}</strong></button></section>
    <section className="provider-table-panel"><div className="provider-panel-heading"><div><h2>Patient-provider connections</h2><p>Platform-owner intervention only. Patient profile ownership and retained records are never transferred or deleted.</p></div><button type="button" className="button-secondary" onClick={() => void load()} disabled={busy}><RefreshCw size={16} /> Refresh</button></div><div className="provider-toolbar"><label className="provider-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search connections</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient, provider, number, scope, or consent receipt" /></label><label className="provider-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as PatientConnectionStatusFilter)}><option value="all">All statuses</option><option value="active">Active</option><option value="expired">Expired</option><option value="revoked">Revoked</option></select></label><span className="provider-result-count">{visible.length} shown</span></div>{error && <div className="provider-action-note provider-action-note-error"><AlertTriangle size={17} /><p>{error}</p></div>}{message && <div className="provider-action-note"><ShieldCheck size={17} /><p>{message}</p></div>}<div className="provider-table-wrap"><table className="provider-table provider-review-table provider-connection-table"><thead><tr><th><button type="button" className="table-sort" onClick={() => changeSort('patient')}>Patient <SortIcon column="patient" /></button></th><th><button type="button" className="table-sort" onClick={() => changeSort('provider')}>Provider <SortIcon column="provider" /></button></th><th><button type="button" className="table-sort" onClick={() => changeSort('status')}>Status <SortIcon column="status" /></button></th><th>Approved scope</th><th><button type="button" className="table-sort" onClick={() => changeSort('effective')}>Effective <SortIcon column="effective" /></button></th><th><button type="button" className="table-sort" onClick={() => changeSort('end')}>End <SortIcon column="end" /></button></th><th>Action</th></tr></thead><tbody>{pageItems.map((entry) => <tr key={`${entry.providerPatientIdentityId}-${entry.effectiveAt}`} className={selected?.providerPatientIdentityId === entry.providerPatientIdentityId ? 'selected' : ''}><td><strong>{entry.patientName}</strong><small>{entry.email ?? 'Email unavailable'}{entry.organizationPatientNumber ? ` · ${entry.organizationPatientNumber}` : ''}</small></td><td><strong>{entry.providerName}</strong><small>{entry.purpose ? formatStatus(entry.purpose) : 'Purpose unavailable'}</small></td><td><span className={`provider-status provider-status-${entry.status}`}>{entry.status === 'active' && <CheckCircle2 size={13} aria-hidden="true" />}{formatStatus(entry.status)}</span></td><td>{entry.scope.map(formatStatus).join(', ') || 'None'}</td><td>{formatDate(entry.effectiveAt)}</td><td>{entry.revokedAt ? `Revoked ${formatDate(entry.revokedAt)}` : formatDate(entry.expiresAt)}</td><td>{entry.status === 'active' ? <button type="button" className="button-secondary button-compact" disabled={!canManage} onClick={() => openIntervention(entry)}>Review</button> : <button type="button" className="button-secondary button-compact" onClick={() => openIntervention(entry)}>Details</button>}</td></tr>)}</tbody></table>{!pageItems.length && <div className="provider-empty"><ShieldAlert /><strong>No matching patient connections</strong><p>{connections.length ? 'Adjust the search or status filter.' : 'Connections appear after a patient accepts provider access.'}</p></div>}</div>{visible.length > 0 && <div className="provider-pagination"><span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, visible.length)} of {visible.length}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button></div></div>}</section>
    {selected && <section className="provider-table-panel provider-connection-review"><div className="provider-panel-heading"><div><h2>{selected.status === 'active' ? 'Review provider access' : 'Connection details'}</h2><p>{selected.patientName} · {selected.providerName}</p></div><button type="button" className="button-secondary" onClick={closeIntervention} disabled={busy}><X size={16} /> Close</button></div><dl className="provider-detail-grid"><div><dt>Patient</dt><dd>{selected.patientName}<small>{selected.email ?? 'Email unavailable'}{selected.organizationPatientNumber ? ` · ${selected.organizationPatientNumber}` : ''}</small></dd></div><div><dt>Provider</dt><dd>{selected.providerName}</dd></div><div><dt>Approved scope</dt><dd>{selected.scope.map(formatStatus).join(', ') || 'None'}</dd></div><div><dt>Purpose</dt><dd>{selected.purpose ? formatStatus(selected.purpose) : 'Not recorded'}</dd></div><div><dt>Consent evidence</dt><dd>{selected.consentEvidenceType ? formatStatus(selected.consentEvidenceType) : 'Not recorded'}<small>{selected.consentedAt ? formatDate(selected.consentedAt) : 'Consent date unavailable'}</small></dd></div><div><dt>Consent record</dt><dd className="provider-detail-code">{selected.consentVersion ?? 'Version unavailable'}<small>{selected.consentReceiptId ?? 'Receipt unavailable'}</small></dd></div><div><dt>Effective</dt><dd>{formatDate(selected.effectiveAt)}</dd></div><div><dt>{selected.revokedAt ? 'Revoked' : 'Scheduled end'}</dt><dd>{formatDate(selected.revokedAt ?? selected.expiresAt)}</dd></div></dl>{selected.status === 'active' && <><div className="provider-intervention-warning"><ShieldAlert size={18} /><p><strong>High-impact intervention.</strong> This stops this provider’s future access. It does not delete the patient’s Health Vault identity, profile, or retained records.</p></div><div className="provider-intervention-form"><label className="provider-search"><span>Required intervention reason</span><input value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} maxLength={500} placeholder="Document the safety, privacy, or support basis" /></label><label className="provider-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={(event) => { setAcknowledged(event.target.checked); setError(''); }} /><span>I understand this ends provider access only and preserves the patient-owned profile and retained records.</span></label><div className="provider-intervention-actions"><button type="button" className="button-destructive" onClick={() => void terminate()} disabled={busy || !canManage || !reason.trim() || !acknowledged}><ShieldAlert size={16} />{busy ? 'Terminating…' : 'Terminate provider access'}</button><button type="button" className="button-secondary" onClick={closeIntervention} disabled={busy}>Cancel</button></div></div></>}</section>}
  </div>;
}

function MfaRecoveryView({ canManage }: { canManage: boolean }) {
  const [email, setEmail] = useState('');
  const [account, setAccount] = useState<MfaRecoveryAccount | null>(null);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function lookup() {
    setBusy(true); setError(''); setMessage(''); setAccount(null);
    try { setAccount(await lookupMfaRecoveryAccount(email)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to find the authentication account.'); }
    finally { setBusy(false); }
  }
  async function reset() {
    if (!account) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await resetUserMfa({ userId: account.userId, email: account.email, confirmEmail, reason });
      setMessage(`MFA was reset for ${account.email}. Existing sessions were invalidated; the user must enroll again.`);
      setAccount(null); setEmail(''); setConfirmEmail(''); setReason('');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to reset MFA.'); }
    finally { setBusy(false); }
  }
  return <div className="provider-view"><section className="provider-table-panel"><div className="provider-panel-heading"><div><h2>MFA recovery</h2><p>Platform-owner recovery for patients, practitioners, provider administrators, and other Health Vault identities.</p></div><span>Fresh MFA required</span></div><div className="synthetic-notice"><ShieldAlert size={18} /><p><strong>Identity review required.</strong> Confirm the support request and the user’s identity before removing a factor. A reset invalidates sessions and requires fresh authenticator enrollment.</p></div><div className="provider-toolbar"><label className="provider-search"><Search size={17} /><span>Exact account email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" /></label><button type="button" onClick={() => void lookup()} disabled={busy || !canManage || !/^\S+@\S+\.\S+$/.test(email)}>{busy ? 'Searching…' : 'Find account'}</button></div>{error && <div className="provider-action-note"><AlertTriangle size={17} /><p>{error}</p></div>}{message && <div className="provider-action-note"><ShieldCheck size={17} /><p>{message}</p></div>}</section>{account && <section className="provider-table-panel"><div className="provider-panel-heading"><div><h2>Reset authenticator for {account.email}</h2><p>{account.verifiedFactors.length} verified factor{account.verifiedFactors.length === 1 ? '' : 's'} will be removed. This cannot be undone.</p></div><KeyRound /></div><div className="provider-toolbar"><label className="provider-search"><span>Type the account email to confirm</span><input value={confirmEmail} onChange={(event) => setConfirmEmail(event.target.value)} placeholder={account.email} /></label><label className="provider-search"><span>Required recovery reason</span><input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Document identity verification and support ticket" /></label><button type="button" onClick={() => void reset()} disabled={busy || !canManage || confirmEmail.trim().toLowerCase() !== account.email.toLowerCase() || reason.trim().length < 10}><KeyRound size={16} />{busy ? 'Resetting…' : 'Reset MFA and sessions'}</button><button type="button" onClick={() => { setAccount(null); setConfirmEmail(''); setReason(''); }} disabled={busy}>Cancel</button></div></section>}</div>;
}

export function ProviderOperationsPage({ section, isPlatformOwner }: ProviderOperationsPageProps) {
  const activeSection = section === 'members' ? 'members' : section === 'imports' ? 'imports' : section === 'practitioners' ? 'practitioners' : section === 'patient-access' ? 'patient-access' : section === 'mfa-recovery' ? 'mfa-recovery' : 'directory';
  const [providers, setProviders] = useState<ProviderDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mfaVerified, setMfaVerified] = useState(false);
  const [pilotNoticeVisible, setPilotNoticeVisible] = useState(() => sessionStorage.getItem('hv-provider-pilot-notice-dismissed') !== 'true');
  const providerPortalUrl = import.meta.env.VITE_PROVIDER_PORTAL_URL
    ?? (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://127.0.0.1:5173/provider' : '/provider');
  useEffect(() => { void fetchProviderDirectory().then(setProviders).catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load provider operations.')).finally(() => setLoading(false)); }, []);
  return <main><header className="page-header"><div><p className="eyebrow">Platform operations</p><h1>Providers</h1><p>Oversee provider organizations, access readiness, and pilot operations.</p></div><div className="page-header-actions"><span className="status-badge">Live protected data</span><a className="portal-link" href={providerPortalUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} />Open Provider Portal</a></div></header><nav className="tabs" aria-label="Provider operations sections"><a href="/providers/directory" className={activeSection === 'directory' ? 'active' : ''}><Building2 size={16} />Directory</a><a href="/providers/members" className={activeSection === 'members' ? 'active' : ''}><Users size={16} />Memberships</a><a href="/providers/practitioners" className={activeSection === 'practitioners' ? 'active' : ''}><Stethoscope size={16} />Practitioners</a><a href="/providers/imports" className={activeSection === 'imports' ? 'active' : ''}><Database size={16} />Imports</a>{isPlatformOwner && <a href="/providers/patient-access" className={activeSection === 'patient-access' ? 'active' : ''}><ShieldAlert size={16} />Patient access</a>}{isPlatformOwner && <a href="/providers/mfa-recovery" className={activeSection === 'mfa-recovery' ? 'active' : ''}><KeyRound size={16} />MFA recovery</a>}</nav>{pilotNoticeVisible && <div className="synthetic-notice dismissible-notice"><AlertTriangle size={18} aria-hidden="true" /><p><strong>Pilot provider environment.</strong> Only roster demographics and access lifecycle data are shown; clinical data is excluded.</p><button type="button" className="notice-dismiss" aria-label="Dismiss pilot environment message" title="Dismiss" onClick={() => { sessionStorage.setItem('hv-provider-pilot-notice-dismissed', 'true'); setPilotNoticeVisible(false); }}><X size={18} /></button></div>}{(activeSection === 'members' || activeSection === 'practitioners' || activeSection === 'patient-access' || activeSection === 'mfa-recovery') && <AdminMfaControl onAssuranceChange={setMfaVerified} />}{loading ? <div className="provider-empty"><RefreshCw /><strong>Loading provider operations</strong></div> : error ? <div className="provider-empty"><AlertTriangle /><strong>Provider data unavailable</strong><p>{error}</p></div> : activeSection === 'directory' ? <DirectoryView providers={providers} /> : activeSection === 'members' ? <MembershipsView providers={providers} canManage={mfaVerified} /> : activeSection === 'practitioners' ? <PractitionerReviewsView canManage={mfaVerified} /> : activeSection === 'patient-access' ? <PatientConnectionsView canManage={mfaVerified} /> : activeSection === 'mfa-recovery' ? <MfaRecoveryView canManage={mfaVerified} /> : <ImportsView providers={providers} />}</main>;
}

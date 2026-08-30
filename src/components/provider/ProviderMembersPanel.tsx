import { ExternalLink, KeyRound, RefreshCw, ShieldCheck, UserPlus, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '../../lib/supabase';

interface Member { id: string; principal_id: string; email: string | null; roles: string[]; status: string; activated_at: string | null }
interface Invitation { id: string; email: string; roles: string[]; status: string; invited_at: string; expires_at: string; delivery_status: string; last_delivery_at: string | null; practitioner_display_name?: string | null; practitioner_specialty?: string | null; professional_identifier_type?: string | null; professional_identifier_value?: string | null; source_import_name?: string | null; source_import_batch_id?: string | null }

async function invoke(body: Record<string, unknown>) {
  const response = await supabase.functions.invoke('provider-admin-api', { body });
  if (!response.error) return response.data;
  let detail = response.data?.error;
  const context = (response.error as { context?: Response }).context;
  if (!detail && context && typeof context.json === 'function') {
    try { detail = (await context.clone().json())?.error; } catch { /* retain SDK message */ }
  }
  throw new Error(detail ?? response.error.message);
}

function practitionerReviewUrl(email: string) {
  const configuredOrigin = String(import.meta.env.VITE_ADMIN_PORTAL_URL ?? '').trim().replace(/\/$/, '');
  const localOrigin = `${window.location.protocol}//${window.location.hostname}:5174`;
  const adminOrigin = configuredOrigin || (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? localOrigin : window.location.origin);
  return `${adminOrigin}/providers/practitioners?practitioner=${encodeURIComponent(email)}`;
}

export function ProviderMembersPanel({ providerAccountId, onAddPractitioners }: { providerAccountId: string; onAddPractitioners: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'attention'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const directoryRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const pendingRows = invitations.map((item) => ({ kind: 'invitation' as const, id: item.id, email: item.email, name: item.practitioner_display_name || item.email.split('@')[0], specialty: item.practitioner_specialty || '', state: item.delivery_status === 'failed' ? 'attention' : 'pending', imported: Boolean(item.source_import_name), source: item.source_import_name || '', invitation: item }));
    const memberRows = members.map((item) => ({ kind: 'member' as const, id: item.id, email: item.email || '', name: item.email?.split('@')[0] || 'Practitioner', specialty: '', state: item.status === 'active' ? 'active' : 'attention', imported: false, source: '', member: item }));
    return [...pendingRows, ...memberRows].filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.state === statusFilter;
      const haystack = `${row.name} ${row.email} ${row.specialty} ${row.source}`.toLowerCase();
      return matchesStatus && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [invitations, members, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(directoryRows.length / pageSize));
  const visibleRows = directoryRows.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);

  const load = useCallback(async () => {
    setBusy('load'); setError('');
    try { const data = await invoke({ action: 'list-members', providerAccountId }); setMembers(data?.memberships ?? []); setInvitations(data?.invitations ?? []); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load members.'); }
    finally { setBusy(''); }
  }, [providerAccountId]);
  useEffect(() => { void load(); }, [load]);

  async function verifyRecentMfa() {
    if (!/^\d{6}$/.test(code)) { setError('Enter the six-digit code from your authenticator app.'); return; }
    setBusy('mfa'); setError(''); setMessage('');
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp.find((item) => item.status === 'verified');
    if (!factor) { setError('A verified authenticator is required.'); setBusy(''); return; }
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (verifyError) setError(verifyError.message); else { setCode(''); setMessage('Protected member actions unlocked for 24 hours.'); }
    setBusy('');
  }

  async function resend(invitationId: string) {
    setBusy(invitationId); setError(''); setMessage('');
    try { await invoke({ action: 'resend-invitation', providerAccountId, invitationId }); setMessage('Invitation delivery requested again.'); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to resend invitation.'); }
    finally { setBusy(''); }
  }

  async function cancelInvitations(input: { invitationIds?: string[]; sourceImportBatchId?: string }, label: string) {
    if (!window.confirm(`Cancel ${label}? Only pending invitations will be affected.`)) return;
    setBusy(`cancel:${label}`); setError(''); setMessage('');
    try { const data = await invoke({ action: 'cancel-practitioner-invitations', providerAccountId, ...input }); setMessage(`${data.cancelledCount} pending practitioner invitation${data.cancelledCount === 1 ? '' : 's'} cancelled.`); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to cancel invitations.'); }
    finally { setBusy(''); }
  }

  async function changeMemberStatus(member: Member, status: 'active' | 'suspended' | 'removed') {
    const practitioner = member.email || 'this practitioner';
    const prompt = status === 'active'
      ? `Reactivate ${practitioner} in this provider workspace?`
      : status === 'suspended'
        ? `Suspend ${practitioner}? They will lose provider workspace and panel access until reactivated.`
        : `Remove ${practitioner} from this provider? This ends their provider workspace membership and panel eligibility. It does not delete their Health Vault identity or account.`;
    if (!window.confirm(prompt)) return;
    setBusy(`member:${member.id}`); setError(''); setMessage('');
    try {
      await invoke({ action: 'set-member-status', providerAccountId, targetPrincipalId: member.principal_id, status });
      setMessage(status === 'active'
        ? `${practitioner} was reactivated.`
        : status === 'suspended'
          ? `${practitioner} was suspended from this provider workspace.`
          : `${practitioner} was removed from this provider workspace. Their Health Vault identity and account were not deleted.`);
      await load();
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update practitioner access.'); }
    finally { setBusy(''); }
  }

  return <div><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-indigo-600">Provider access</p><h1 className="mt-1 text-3xl font-bold">Members and invitations</h1><p className="mt-2 text-content-secondary">Invite and manage practitioners at organizational scale. Acceptance requires verified email, authenticator enrollment, and AAL2.</p></div><button type="button" onClick={onAddPractitioners} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"><UserPlus className="h-4 w-4" />Add practitioners</button></div>
    <section className="mt-6 rounded-xl border border-stroke-subtle bg-surface-raised p-5"><div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-indigo-600" /><h2 className="font-semibold">Re-verify protected actions</h2></div><p className="mt-2 text-sm text-content-secondary">Invitation and access mutations require a fresh authenticator check every 24 hours.</p><form className="mt-4 flex max-w-3xl gap-2" onSubmit={(event) => { event.preventDefault(); void verifyRecentMfa(); }}><input aria-label="Six-digit authenticator code" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="min-w-0 flex-1 rounded-lg border border-stroke-default px-3 py-2.5 text-center tracking-[0.25em]" placeholder="000000" /><button disabled={busy === 'mfa'} className="rounded-lg border border-stroke-default px-4 py-2.5 text-sm font-semibold">Verify</button></form></section>
    {(error || message) && <div role={error ? 'alert' : 'status'} className={`mt-4 rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || message}</div>}
    <div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Pending invitations" value={String(invitations.length)} /><Metric label="Active members" value={String(members.filter((item) => item.status === 'active').length)} /><Metric label="Delivery attention" value={String(invitations.filter((item) => item.delivery_status === 'failed').length)} /></div>
    <section className="mt-4 overflow-hidden rounded-xl border border-stroke-subtle bg-surface-raised">
      <div className="border-b border-stroke-subtle p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-2"><UsersRound className="h-5 w-5" /><h2 className="font-semibold">Practitioner directory</h2></div><button onClick={() => void load()} className="flex items-center gap-2 text-sm font-semibold text-indigo-700"><RefreshCw className="h-4 w-4" />Refresh</button></div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row"><input aria-label="Search practitioners" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, email, specialty, or import file" className="min-w-0 flex-1 rounded-lg border border-stroke-default px-3 py-2.5 text-sm" /><div className="flex flex-wrap gap-2">{(['all', 'pending', 'active', 'attention'] as const).map((filter) => <button key={filter} type="button" onClick={() => { setStatusFilter(filter); setPage(1); }} className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize ${statusFilter === filter ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-stroke-default text-content-secondary'}`}>{filter}</button>)}</div></div>
      </div>
      {visibleRows.length ? <div className="divide-y divide-stroke-subtle">{visibleRows.map((row) => <div key={`${row.kind}-${row.id}`} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong>{row.name}</strong><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.state === 'active' ? 'bg-emerald-50 text-emerald-800' : row.state === 'attention' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{row.kind === 'member' ? row.member.status : row.state}</span>{row.imported && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">CSV import</span>}</div><p className="mt-1 truncate text-sm text-content-secondary">{row.email}{row.specialty ? ` · ${row.specialty}` : ''}</p>{row.source && <p className="mt-1 truncate text-xs text-content-tertiary">Source: {row.source}</p>}</div>{row.kind === 'invitation' ? <div className="flex flex-wrap gap-2"><button disabled={Boolean(busy)} onClick={() => void resend(row.id)} className="rounded-lg border border-stroke-default px-3 py-2 text-sm font-semibold">Resend</button><button disabled={Boolean(busy)} onClick={() => void cancelInvitations({ invitationIds: [row.id] }, row.email)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Cancel</button>{row.invitation.source_import_batch_id && <button disabled={Boolean(busy)} onClick={() => void cancelInvitations({ sourceImportBatchId: row.invitation.source_import_batch_id! }, `the entire ${row.source} import batch`)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Cancel batch</button>}</div> : row.member.roles.includes('practitioner') && <div className="flex flex-wrap items-center gap-2"><span className="flex items-center gap-1 text-xs font-semibold text-amber-800"><ShieldCheck className="h-3.5 w-3.5" />Health Vault review required</span>{row.email && <a href={practitionerReviewUrl(row.email)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700"><ExternalLink className="h-3.5 w-3.5" />Review in Health Vault Admin</a>}{row.member.status === 'active' && <button type="button" disabled={Boolean(busy)} onClick={() => void changeMemberStatus(row.member, 'suspended')} className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50">Suspend</button>}{row.member.status === 'suspended' && <><button type="button" disabled={Boolean(busy)} onClick={() => void changeMemberStatus(row.member, 'active')} className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50">Reactivate</button><button type="button" disabled={Boolean(busy)} onClick={() => void changeMemberStatus(row.member, 'removed')} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Remove</button></>}</div>}</div>)}</div> : <p className="p-8 text-center text-sm text-content-secondary">No practitioners match these filters.</p>}
      <div className="flex items-center justify-between border-t border-stroke-subtle px-5 py-4 text-sm"><span className="text-content-secondary">{directoryRows.length} result{directoryRows.length === 1 ? '' : 's'} · page {Math.min(page, totalPages)} of {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-stroke-default px-3 py-2 font-semibold disabled:opacity-40">Previous</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-stroke-default px-3 py-2 font-semibold disabled:opacity-40">Next</button></div></div>
    </section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-stroke-subtle bg-surface-raised p-4"><p className="text-xs text-content-tertiary">{label}</p><strong className="mt-1 block text-xl">{value}</strong></div>; }

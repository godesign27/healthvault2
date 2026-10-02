import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type DeletionRequest = { id: string; status: string; requested_at: string; resolved_at: string | null; user_message: string | null };
const requestColumns = 'id,status,requested_at,resolved_at,user_message';

export function AccountDataControls({ client = supabase }: { client?: typeof supabase } = {}) {
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [request, setRequest] = useState<DeletionRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    void (async () => {
      try {
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) throw new Error('Sign in to manage your account data.');
        const { data, error: readError } = await client.from('account_deletion_requests')
          .select(requestColumns).eq('user_id', user.id).order('requested_at', { ascending: false }).limit(1);
        if (readError) throw new Error('Unable to check deletion requests. Close and reopen Settings to retry.');
        if (mounted.current) setRequest(data?.[0] || null);
      } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Unable to load account controls.'); }
      finally { if (mounted.current) setLoadingRequest(false); }
    })();
    return () => { mounted.current = false; };
  }, [client]);

  async function download() {
    if (locked.current) return;
    locked.current = true; setBusy('export'); setError(''); setNotice('');
    try {
      const { data, error: exportError } = await client.functions.invoke('account-export', { body: {} });
      if (exportError) {
        let message = 'Unable to download your data. Please try again.';
        if (exportError.context instanceof Response) {
          const body = await exportError.context.json().catch(() => null);
          if (typeof body?.error === 'string') message = body.error;
        }
        throw new Error(message);
      }
      const { data: { user } } = await client.auth.getUser();
      if (!user || data?.accountId !== user.id || data?.format !== 'health-vault-personal-data' || !data?.tables) {
        throw new Error('Your session changed or the export was incomplete. No download was created.');
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = `health-vault-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setNotice('Your download is ready. Check your browser downloads. Keep this file private—it contains your health information.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to download your data.'); }
    finally { locked.current = false; setBusy(null); }
  }

  async function requestDeletion() {
    if (locked.current || confirmation !== 'DELETE' || loadingRequest) return;
    locked.current = true; setBusy('delete'); setError(''); setNotice('');
    try {
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (authError || !user) throw new Error('Sign in again before requesting deletion.');
      const { error: insertError } = await client.from('account_deletion_requests').insert({ user_id: user.id, confirmed: true });
      if (insertError && insertError.code !== '23505') throw new Error('Unable to confirm your request. Reopen Settings to check its status before submitting again.');
      const { data, error: readError } = await client.from('account_deletion_requests')
        .select(requestColumns).eq('user_id', user.id).in('status', ['requested', 'reviewing']).single();
      if (readError || !data) throw new Error('Your request may have been received. Reopen Settings to check its status before submitting again.');
      setRequest(data); setShowReview(false); setConfirmation('');
      setNotice('Deletion request received. Your account remains active while the request is reviewed.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to confirm your request.'); }
    finally { locked.current = false; setBusy(null); }
  }
  const pending = request && ['requested', 'reviewing'].includes(request.status);
  const button = 'w-full px-4 py-2.5 rounded-lg border border-stroke-default text-sm font-medium text-left text-content-primary hover:bg-surface-sunken disabled:opacity-50 disabled:cursor-not-allowed';
  return <section aria-label="Your account data" className="space-y-3">
    <button type="button" className={button} disabled={!!busy} onClick={download}>
      {busy === 'export' ? 'Preparing download…' : 'Download My Data'}
    </button>
    <p className="text-xs text-content-secondary">Downloads your personal structured Vault data as JSON, including saved form answers and wellness entries. Original files, images and PDFs must be downloaded separately from their records. Credentials and internal administrative records are excluded.</p>
    <button type="button" className={button} disabled={!!busy || !!pending || loadingRequest} onClick={() => { setShowReview(true); setError(''); setNotice(''); }}>
      {loadingRequest ? 'Checking deletion requests…' : pending ? 'Deletion request pending' : 'Request Account Deletion'}
    </button>
    {request && <div className="text-sm text-content-secondary space-y-1" role="status">
      <p>Request status: <strong>{request.status}</strong></p><p>Reference: {request.id}</p>
      <p>Requested {new Date(request.requested_at).toLocaleString()}</p>
      {request.user_message && <p>{request.user_message}</p>}
      {pending && <p>Your account and data have not been deleted. Review status appears here.</p>}
    </div>}
    {showReview && <div className="rounded-lg border border-stroke-default p-4 space-y-3">
      <h4 className="font-semibold text-content-primary">Review your deletion request</h4>
      <p className="text-sm text-content-secondary">This submits a request for review. It does not immediately delete your data, stop sharing, or sign you out. Download what you need first. The review will determine any required retention of provider, consent, or backup records before erasure.</p>
      <label className="block text-sm text-content-primary">Type DELETE to request review
        <input value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" disabled={!!busy}
          className="mt-2 w-full rounded-lg border border-stroke-default bg-surface-raised text-content-primary px-3 py-2" />
      </label>
      <div className="flex gap-3">
        <button type="button" className={button} disabled={!!busy || confirmation !== 'DELETE'} onClick={requestDeletion}>{busy === 'delete' ? 'Submitting…' : 'Submit deletion request'}</button>
        <button type="button" className={button} disabled={!!busy} onClick={() => { setShowReview(false); setConfirmation(''); }}>Cancel</button>
      </div>
    </div>}
    {error && <p role="alert" className="text-sm text-content-primary">{error}</p>}
    {notice && <p role="status" className="text-sm text-content-primary">{notice}</p>}
    <nav aria-label="Account policies" className="flex gap-4 text-sm underline text-content-primary"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a></nav>
  </section>;
}

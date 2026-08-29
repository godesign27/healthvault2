import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw, Save, ShieldOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Partner = { display_name: string; status: string; launch_stage: string; framework_version: number; prompt_version: number; disclaimer: string; consent_copy: string; website_url: string; gpt_enabled: boolean; cloud_enabled: boolean; generation_enabled: boolean; updated_at: string };
type Overview = { partner: Partner; operations: { total: number; succeeded: number; failed: number; rejected: number; pending: number; averageDurationMs: number }; metrics: Array<{ key: string; count: number }> };

async function adminCall<T>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Administrator session expired.');
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wellness-partner-admin`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Admin request failed.');
  return data as T;
}

export function WellnessPartnersPage({ section: _section }: { section: string }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [draft, setDraft] = useState<Partner | null>(null);
  const [reason, setReason] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { try { const data = await adminCall<Overview>({ action: 'overview' }); setOverview(data); setDraft(data.partner); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load partner operations.'); } }, []);
  useEffect(() => { void load(); }, [load]);
  const update = async () => { if (!draft || !reason.trim()) { setError('Enter an audit reason before saving.'); return; } setSaving(true); try { await adminCall({ action: 'update', changes: { status: draft.status, launch_stage: draft.launch_stage, disclaimer: draft.disclaimer, consent_copy: draft.consent_copy, website_url: draft.website_url, gpt_enabled: draft.gpt_enabled, cloud_enabled: draft.cloud_enabled, generation_enabled: draft.generation_enabled }, reason }); setReason(''); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save.'); } finally { setSaving(false); } };
  const publish = async () => { if (!promptTemplate.trim() || !reason.trim()) { setError('Prompt and audit reason are required.'); return; } setSaving(true); try { await adminCall({ action: 'publish', promptTemplate, reason }); setPromptTemplate(''); setReason(''); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to publish.'); } finally { setSaving(false); } };
  const kill = async () => { if (!reason.trim()) { setError('Enter an audit reason before using the emergency switch.'); return; } setSaving(true); try { await adminCall({ action: 'kill_switch', reason }); setReason(''); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to disable partner.'); } finally { setSaving(false); } };
  if (!draft || !overview) return <div className="section-dashboard"><h1>Wellness Partners</h1><p>{error || 'Loading Nourished Rebel operations…'}</p></div>;
  const field = (key: keyof Partner, value: string | boolean) => setDraft({ ...draft, [key]: value });
  return <div className="section-dashboard">
    <div className="section-header"><div><p className="eyebrow">Partner operations</p><h1>Nourished Rebel</h1><p>Configure delivery and review privacy-minimized performance across GPT App and SaaS Cloud.</p></div><button type="button" onClick={() => void load()}><RefreshCw size={16} /> Refresh</button></div>
    {error && <div className="narrative-card" role="alert"><AlertTriangle size={18} /><p>{error}</p></div>}
    <div className="metric-grid">{[['Generations', overview.operations.total], ['Succeeded', overview.operations.succeeded], ['Failed', overview.operations.failed], ['Safety rejected', overview.operations.rejected], ['Pending', overview.operations.pending], ['Average latency', `${overview.operations.averageDurationMs} ms`]].map(([label, value]) => <div className="metric-card" key={label}><p>{label}</p><strong>{value}</strong></div>)}</div>
    <div className="dashboard-grid">
      <section className="narrative-card"><p className="eyebrow">Configuration</p><h3>Delivery controls</h3><div className="form-grid">
        <label>Status<select value={draft.status} onChange={(e) => field('status', e.target.value)}><option>draft</option><option>active</option><option>paused</option><option>disabled</option></select></label>
        <label>Launch stage<select value={draft.launch_stage} onChange={(e) => field('launch_stage', e.target.value)}><option>internal</option><option>closed_beta</option><option>public</option></select></label>
        <label>Partner website URL<input value={draft.website_url} onChange={(e) => field('website_url', e.target.value)} /></label>
      </div><div className="plain-list"><label><input type="checkbox" checked={draft.gpt_enabled} onChange={(e) => field('gpt_enabled', e.target.checked)} /> GPT enabled</label><label><input type="checkbox" checked={draft.cloud_enabled} onChange={(e) => field('cloud_enabled', e.target.checked)} /> Cloud enabled</label><label><input type="checkbox" checked={draft.generation_enabled} onChange={(e) => field('generation_enabled', e.target.checked)} /> Generation enabled</label></div>
        <label>Disclaimer<textarea value={draft.disclaimer} onChange={(e) => field('disclaimer', e.target.value)} /></label><label>Consent copy<textarea value={draft.consent_copy} onChange={(e) => field('consent_copy', e.target.value)} /></label>
      </section>
      <section className="narrative-card"><p className="eyebrow">Versioning</p><h3>Framework v{draft.framework_version} · Prompt v{draft.prompt_version}</h3><p>Publishing creates an immutable version. Patient content is never exposed here.</p><label>New approved prompt<textarea rows={8} value={promptTemplate} onChange={(e) => setPromptTemplate(e.target.value)} placeholder="Paste the reviewed Nourished Rebel system prompt." /></label><button type="button" disabled={saving} onClick={() => void publish()}><ExternalLink size={16} /> Publish prompt version</button></section>
    </div>
    <section className="narrative-card"><p className="eyebrow">Audit requirement</p><label>Reason for this change<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required for configuration, publication, and emergency actions." /></label><div className="section-actions"><button type="button" disabled={saving} onClick={() => void update()}><Save size={16} /> Save configuration</button><button type="button" className="danger" disabled={saving} onClick={() => void kill()}><ShieldOff size={16} /> Emergency disable</button></div></section>
    <section className="narrative-card"><p className="eyebrow">30-day funnel</p><h3>Product-scoped aggregate events</h3><ul className="plain-list">{overview.metrics.length ? overview.metrics.map((metric) => <li key={metric.key}><span>{metric.key.replace(':', ' · ')}</span><strong>{metric.count}</strong></li>) : <li>No events recorded yet.</li>}</ul></section>
  </div>;
}

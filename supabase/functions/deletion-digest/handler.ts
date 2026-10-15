export type Claim = { state: string; run_key?: string; lease_token?: string;
  pending_count?: number; oldest_date?: string; verification?: boolean };
export type Dependencies = {
  claim(token: string, verification: boolean): Promise<Claim>;
  send(message: { subject: string; text: string }, key: string): Promise<string>;
  finish(claim: Claim, providerId: string | null, error: string | null): Promise<void>;
};
const QUEUE = 'https://supabase.com/dashboard/project/sgwekxjlvadvdosyudgj/editor';
export function messageFor(c: Claim) {
  if (c.verification) return {
    subject: 'Health Vault — deletion monitor verification',
    text: `This is a verification email for your approved Health Vault deletion-request monitor.\n\nOn weekdays at 9:00 AM America/Denver, you will receive an email only when requests need review. It will contain only the pending count, oldest request date and restricted queue link.\n\nThis test does not report a pending request or change any account.\n\nRestricted queue: ${QUEUE}`,
  };
  if (!Number.isSafeInteger(c.pending_count) || c.pending_count! < 1 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(c.oldest_date ?? '')) throw new Error('Invalid aggregate');
  return { subject: 'Health Vault — deletion requests need review',
    text: `There are ${c.pending_count} open deletion requests. The oldest was received on ${c.oldest_date} (America/Denver).\n\nReview the restricted queue in Supabase:\n${QUEUE}` };
}
export function createHandler(d: Dependencies) {
  return async (req: Request) => {
    if (req.method !== 'POST') return Response.json({ state: 'method_not_allowed' }, { status: 405 });
    const token = req.headers.get('x-deletion-monitor-key');
    if (!token || token.length !== 72) return Response.json({ state: 'unauthorized' }, { status: 401 });
    let claim: Claim | undefined;
    try {
      claim = await d.claim(token, req.headers.get('x-monitor-verification') === '1');
      if (claim.state === 'unauthorized') return Response.json({ state: 'unauthorized' }, { status: 401 });
      if (claim.state !== 'send') return Response.json({ state: claim.state });
      if (!claim.run_key || !claim.lease_token) throw new Error('Invalid claim');
      const id = await d.send(messageFor(claim), `deletion-monitor/${claim.run_key}`);
      if (!id) throw new Error('No provider receipt');
      await d.finish(claim, id, null);
      return Response.json({ state: 'accepted' });
    } catch {
      // Never log request headers, patient data, provider bodies or credentials.
      if (claim?.state === 'send') {
        try { await d.finish(claim, null, 'send_failed'); } catch { /* lease will expire */ }
      }
      console.error('Deletion monitor failed; inspect restricted run and dispatch ledgers');
      return Response.json({ state: 'failed' }, { status: 503 });
    }
  };
}

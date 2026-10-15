type Item = { id: string; storage_bucket: string; storage_path: string | null };
type Claim = { state: string; lease?: string; items?: Item[] };
export interface RecoveryDeps {
  claim(token: string): Promise<Claim>;
  abandon(id: string): Promise<{ state: string; storage_path?: string | null }>;
  remove(bucket: string, path: string): Promise<void>;
  finish(lease: string, checked: number, failed: number): Promise<void>;
}
export function createRecoveryHandler(deps: RecoveryDeps) {
  const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
  return async (req: Request) => {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const token = req.headers.get('x-upload-recovery-key');
    if (!token || token.length > 200) return json({ error: 'Unauthorized' }, 401);
    try {
      const claim = await deps.claim(token);
      if (claim.state === 'unauthorized') return json({ error: 'Unauthorized' }, 401);
      if (claim.state !== 'run') return json({ state: claim.state });
      if (!claim.lease || !Array.isArray(claim.items)) throw new Error('Invalid claim');
      let checked = 0, failed = 0;
      for (const item of claim.items) {
        checked++;
        try {
          // A concurrent successful commit wins: abandon returns committed, never delete it.
          const result = await deps.abandon(item.id);
          if (result.state === 'committed') continue;
          if (result.state !== 'abandoned' || result.storage_path !== item.storage_path) throw new Error('Invalid recovery');
          if (item.storage_path) {
            if (!['inbound-records', 'record-request-files'].includes(item.storage_bucket) ||
                !new RegExp(`^[0-9a-f-]{36}/${item.id}$`).test(item.storage_path)) throw new Error('Invalid path');
            await deps.remove(item.storage_bucket, item.storage_path);
          }
        } catch { failed++; }
      }
      await deps.finish(claim.lease, checked, failed);
      return json({ checked, failed }, failed ? 503 : 200);
    } catch { return json({ error: 'Recovery unavailable' }, 503); }
  };
}

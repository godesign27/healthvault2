export const SUPPORT_ADDRESS = 'team@healthvault.me';
export const DESTINATION = 'godesigngo@gmail.com';
type Event = { type?: string; data?: { email_id?: string; to?: string[] } };
type Receipt = { first_attempt_at: string; forwarded_id: string | null };
export type Dependencies = {
  verify: (body: string, headers: Headers) => Event;
  receipt: (id: string) => Promise<Receipt>;
  forward: (id: string, key: string) => Promise<string>;
  complete: (id: string, forwardedId: string) => Promise<void>;
  now?: () => number;
};
export function addressedToSupport(to: unknown): boolean {
  return Array.isArray(to) && to.some(value => typeof value === 'string' && value.trim().toLowerCase() === SUPPORT_ADDRESS);
}
export function createHandler(deps: Dependencies) {
  return async (req: Request): Promise<Response> => {
    const reply = (status: number, state: string) => Response.json({ state }, { status, headers: { 'Cache-Control': 'no-store' } });
    if (req.method !== 'POST') return reply(405, 'method_not_allowed');
    // Read a bounded raw body, before signature verification. Never log message contents.
    const reader = req.body?.getReader();
    if (!reader) return reply(400, 'missing_body');
    let size = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 262144) { await reader.cancel(); return reply(413, 'too_large'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let event: Event;
    try { event = deps.verify(new TextDecoder().decode(bytes), req.headers); }
    catch { return reply(401, 'invalid_signature'); }
    if (event.type !== 'email.received' || !addressedToSupport(event.data?.to)) return reply(200, 'ignored');
    const id = event.data?.email_id;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return reply(400, 'invalid_email_id');
    try {
      const receipt = await deps.receipt(id);
      if (receipt.forwarded_id) return reply(200, 'already_forwarded');
      // Resend's send idempotency window is 24h. Stop ambiguous old attempts
      // before that window expires; operators must reconcile these, never blindly retry.
      const age = (deps.now?.() ?? Date.now()) - Date.parse(receipt.first_attempt_at);
      if (!Number.isFinite(age) || age >= 23 * 3600000) return reply(503, 'manual_review_required');
      const forwardedId = await deps.forward(id, `support-forward/${id}`);
      await deps.complete(id, forwardedId);
      return reply(200, 'forwarded');
    } catch {
      // A retry will reuse the delivery key after an ambiguous send/ledger failure.
      console.error('support_email_forward_failed');
      return reply(503, 'retry_required');
    }
  };
}

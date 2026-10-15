import { Resend } from 'npm:resend@6.31.0';
import PostalMime from 'npm:postal-mime@4.0.2';
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { addressedToSupport, createHandler, DESTINATION } from './handler.ts';

const apiKey = Deno.env.get('RESEND_API_KEY');
const webhookSecret = Deno.env.get('RESEND_SUPPORT_WEBHOOK_SECRET');
const resend = apiKey ? new Resend(apiKey) : null;
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const handler = createHandler({
  verify(body, headers) {
    if (!resend || !webhookSecret) throw new Error('Not configured');
    const event = resend.webhooks.verify({ payload: body, webhookSecret, headers: {
      id: headers.get('svix-id') ?? '', timestamp: headers.get('svix-timestamp') ?? '', signature: headers.get('svix-signature') ?? '',
    } });
    return event.type === 'email.received' ? event : { type: event.type };
  },
  async receipt(id) {
    const inserted = await db.from('support_email_deliveries').insert({ email_id: id });
    if (inserted.error && inserted.error.code !== '23505') throw new Error('Ledger unavailable');
    const result = await db.from('support_email_deliveries').select('first_attempt_at,forwarded_id').eq('email_id', id).single();
    if (result.error || !result.data) throw new Error('Ledger unavailable');
    return result.data;
  },
  async forward(id, key) {
    if (!resend) throw new Error('Not configured');
    const signal = AbortSignal.timeout(25000);
    const { data: email, error } = await resend.emails.receiving.get(id);
    if (error || !email || !addressedToSupport(email.to)) throw new Error('Email unavailable or wrong recipient');
    if (!email.raw?.download_url) throw new Error('Raw message unavailable');
    const url = new URL(email.raw.download_url);
    if (url.protocol !== 'https:') throw new Error('Invalid raw URL');
    const raw = await fetch(url, { signal, redirect: 'error' });
    if (!raw.ok || !raw.body) throw new Error('Raw download failed');
    const reader = raw.body.getReader(); const parts: Uint8Array[] = []; let size = 0;
    for (;;) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.length;
      if (size > 20 * 1024 * 1024) { await reader.cancel(); throw new Error('Message requires manual handling'); }
      parts.push(chunk.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    const parsed = await PostalMime.parse(bytes, { attachmentEncoding: 'base64' });
    const replyTo = parsed.replyTo?.map(x => x.address).filter((x): x is string => Boolean(x));
    const result = await resend.emails.send({
      from: 'Health Vault Support <team@healthvault.me>', to: [DESTINATION],
      replyTo: replyTo?.length ? replyTo : parsed.from?.address || email.from,
      subject: `[Health Vault support] ${email.subject || '(no subject)'}`,
      text: parsed.text || '', html: parsed.html || undefined,
      attachments: parsed.attachments.map(a => ({ filename: a.filename || 'attachment', content: a.content as string,
        contentType: a.mimeType, contentId: a.contentId?.replace(/^<|>$/g, '') })),
    }, { idempotencyKey: key });
    if (result.error || !result.data?.id) throw new Error('Forward failed');
    return result.data.id;
  },
  async complete(id, forwardedId) {
    const { error } = await db.from('support_email_deliveries').update({ forwarded_id: forwardedId, forwarded_at: new Date().toISOString() }).eq('email_id', id);
    if (error) throw new Error('Receipt update failed');
  },
});
Deno.serve(req => {
  if (!apiKey || !webhookSecret) return Response.json({ state: 'not_configured' }, { status: 503 });
  return handler(req);
});

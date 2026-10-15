import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { createFileHandler, FileAccessError, MAX_FILE_BYTES, parseFileReference } from './handler.ts';
const projectUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(projectUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
Deno.serve(createFileHandler({
  async authorize(token, recordId) {
    const client = createClient(projectUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: token } }, auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) throw new FileAccessError(401, 'Sign in to open this file.');
    const gate = await client.rpc('current_account_access_allowed');
    if (gate.error) throw new Error('Access check unavailable');
    if (gate.data !== true) throw new FileAccessError(403, 'This account is unavailable. Contact support.');
    const record = await client.from('health_records').select('id,user_id,preview_url,file_type')
      .eq('id', recordId).eq('user_id', user.id).maybeSingle();
    if (record.error) throw new Error('Record query unavailable');
    if (!record.data) throw new FileAccessError(404, 'Record not found.');
    const file = parseFileReference(record.data.preview_url, projectUrl);
    // An owned record alone is insufficient: preview_url is user-editable metadata.
    // Verify the actual object belongs to this same account before privileged download.
    if (file.bucket === 'record-request-files') {
      const rows = await admin.from('record_request_files').select('request_id').eq('storage_path', file.path).limit(2);
      if (rows.error) throw new Error('File ownership query unavailable');
      if (rows.data?.length !== 1) throw new FileAccessError(404, 'File not found.');
      const request = await admin.from('health_record_requests').select('id,user_id')
        .eq('id', rows.data[0].request_id).eq('user_id', user.id).maybeSingle();
      if (request.error) throw new Error('Request ownership query unavailable');
      if (!request.data || !file.path.startsWith(`${request.data.id}/`)) throw new FileAccessError(404, 'File not found.');
    } else if (!file.path.startsWith(`${user.id}/`)) {
      throw new FileAccessError(404, 'File not found.');
    }
    return { ...file, userId: user.id, recordId, type: record.data.file_type || 'unknown' };
  },
  async download(file) {
    // Fixed Storage endpoint, no redirects or caller-controlled outbound hosts.
    const encoded = file.path.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`${projectUrl}/storage/v1/object/authenticated/${file.bucket}/${encoded}`, {
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, 'Cache-Control': 'no-store' },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(25000),
    });
    if ([400,404].includes(response.status)) throw new FileAccessError(404, 'File not found.');
    if (!response.ok || !response.body) throw new Error('Storage unavailable');
    if (Number(response.headers.get('content-length')) > MAX_FILE_BYTES) {
      await response.body.cancel(); throw new FileAccessError(413, 'File exceeds the 25 MB preview limit. Contact support.');
    }
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
    for (;;) { const chunk = await reader.read(); if (chunk.done) break;
      length += chunk.value.length;
      if (length > MAX_FILE_BYTES) { await reader.cancel(); throw new FileAccessError(413, 'File exceeds the 25 MB preview limit. Contact support.'); }
      chunks.push(chunk.value); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
  },
}));

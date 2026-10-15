// Server-derived identity: identical bytes + normalized metadata within one request.
// Never accepts a client-provided digest as evidence of matching content.
async function digest(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}
export async function requestFileFingerprint(record: Record<string, unknown>, bytes: Uint8Array,
  contentType: string): Promise<string> {
  const contentHash = await digest(bytes);
  return digest(new TextEncoder().encode(JSON.stringify([
    'request-file-v1', record.kind, record.title, record.file_name, record.file_type,
    record.notes ?? null, contentType, contentHash,
  ])));
}

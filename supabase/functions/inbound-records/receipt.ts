// Stable across JSON object key ordering. Array order is intentionally significant.
export function canonical(value: unknown, depth = 0): string {
  if (depth > 64) throw new Error('Import metadata is too deeply nested');
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return '[' + value.map(v => canonical(v, depth + 1)).join(',') + ']';
  if (typeof value === 'object') return '{' + Object.keys(value).sort().map(k =>
    JSON.stringify(k) + ':' + canonical((value as Record<string, unknown>)[k], depth + 1)).join(',') + '}';
  return JSON.stringify(value);
}
export async function sha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}
export function validRetryKey(key: string | null): key is string {
  return key !== null && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(key);
}
export async function batchFingerprint(records: unknown[], provider: string, personalUpload = false): Promise<string> {
  const hashes: string[] = [];
  // Hash records sequentially so encoded buffers for all files are not retained together.
  for (const record of records) hashes.push(await sha256(canonical(record)));
  return sha256(canonical([personalUpload ? 'personal-upload-v1' : 'inbound-batch-v1', provider, hashes]));
}

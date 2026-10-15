export class FileAccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export type FileRef = { bucket: string; path: string };
export type AuthorizedFile = FileRef & { userId: string; recordId: string; type: string };
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
const BUCKETS = new Set(['record-request-files', 'inbound-records', 'medical-form-uploads']);
export function parseFileReference(value: string | null, projectUrl: string): FileRef {
  if (!value) throw new FileAccessError(404, 'No file is available for this record.');
  try {
    const url = new URL(value); let bucket: string; let path: string;
    if (url.protocol === 'hv-storage:') { bucket = url.hostname; path = decodeURIComponent(url.pathname.slice(1)); }
    else {
      if (url.origin !== new URL(projectUrl).origin || url.protocol !== 'https:') throw new Error();
      const match = url.pathname.match(/^\/storage\/v1\/object\/(?:sign|authenticated)\/([^/]+)\/(.+)$/);
      if (!match) throw new Error();
      bucket = match[1]; path = decodeURIComponent(match[2]);
    }
    if (!BUCKETS.has(bucket) || !path || path.length > 1500 || /[\\\x00-\x1f\x7f]/.test(path) ||
      path.split('/').some(x => !x || x === '.' || x === '..')) throw new Error();
    return { bucket, path };
  } catch { throw new FileAccessError(404, 'This file needs an updated access link. Contact support.'); }
}
export const FILE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store',
  'Surrogate-Control': 'no-store', 'Pragma': 'no-cache', 'Expires': '0',
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'Access-Control-Allow-Origin': 'https://healthvault.me', 'Vary': 'Origin, Authorization',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
export function createFileHandler(deps: {
  authorize(token: string, recordId: string): Promise<AuthorizedFile>;
  download(file: AuthorizedFile): Promise<Uint8Array>;
}) {
  return async (req: Request) => {
    const json = (error: string, status: number) => Response.json({ error }, { status, headers: FILE_HEADERS });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: FILE_HEADERS });
    if (req.method !== 'POST') return json('Method not allowed.', 405);
    const token = req.headers.get('Authorization');
    if (!token?.startsWith('Bearer ') || token.length > 8192) return json('Sign in to open this file.', 401);
    try {
      // Never accept a storage path, bucket, target user or external URL from the caller.
      const reader = req.body?.getReader(); if (!reader) return json('Record ID required.', 400);
      let text = ''; let size = 0; const decoder = new TextDecoder();
      for (;;) { const chunk = await reader.read(); if (chunk.done) break;
        size += chunk.value.length; if (size > 1024) { await reader.cancel(); return json('Request too large.', 413); }
        text += decoder.decode(chunk.value, { stream: true }); }
      text += decoder.decode();
      let body; try { body = JSON.parse(text); } catch { return json('Invalid request.', 400); }
      const id = body?.recordId;
      if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return json('Record ID required.', 400);
      const file = await deps.authorize(token, id);
      const bytes = await deps.download(file);
      if (bytes.length > MAX_FILE_BYTES) return json('File exceeds the 25 MB preview limit. Contact support.', 413);
      // Re-check after I/O: a block or unlink during download must deny the response.
      const latest = await deps.authorize(token, id);
      if (latest.userId !== file.userId || latest.bucket !== file.bucket || latest.path !== file.path) return json('File access changed. Please try again.', 403);
      const types: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', txt: 'text/plain' };
      return new Response(bytes as BodyInit, { headers: { ...FILE_HEADERS,
        'Content-Type': types[file.type] || 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="health-vault-record"',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      } });
    } catch (error) {
      if (error instanceof FileAccessError) return json(error.message, error.status);
      console.error('Protected record file request failed');
      return json('File access could not be verified. Please try again.', 503);
    }
  };
}

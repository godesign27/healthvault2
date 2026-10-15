// Bound streamed bytes before JSON parsing/base64 decoding, including chunked requests.
export const UPLOAD_BODY_LIMIT = 40 * 1024 * 1024;
export const CONTROL_BODY_LIMIT = 64 * 1024;
export class RequestBodyError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function readJsonObject(req: Request, limit: number,
  timeoutMs = 30_000): Promise<Record<string, any>> {
  const tooLarge = () => new RequestBodyError(413, 'Upload is too large. Send a smaller batch.');
  const length = req.headers.get('content-length');
  let oversized = length !== null && (!/^\d+$/.test(length) || Number(length) > limit);
  // The hosted relay must finish forwarding the request before it can deliver our
  // response reliably. Once over the limit, discard remaining chunks without
  // decoding/retaining them. The same absolute deadline bounds the drain.
  if (!req.body) throw new RequestBodyError(400, 'A JSON object is required.');
  const reader = req.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RequestBodyError(408, 'Upload timed out. Send a smaller batch.')), timeoutMs);
  });
  let size = 0;
  const parts: string[] = [];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > limit) { oversized = true; parts.length = 0; }
      if (!oversized) parts.push(decoder.decode(value, { stream: true }));
    }
    if (oversized) throw tooLarge();
    parts.push(decoder.decode());
    const body = JSON.parse(parts.join(''));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Not an object');
    return body;
  } catch (error) {
    // Do not wait for an uncooperative sender to acknowledge cancellation.
    void reader.cancel().catch(() => {});
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError(400, 'A valid JSON object is required.');
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

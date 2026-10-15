export type SavedRecord = { id: string; title: string; kind: string };
type Recovery = { state: 'committed'; record: SavedRecord | null } |
  { state: 'abandoned'; storage_path: string | null };
export type Preparation = void | { state: 'committed'; record: SavedRecord } |
  { state: 'busy'; attemptId: string };
export interface ImportStore {
  authorize(): Promise<void>;
  prepare(id: string, path: string | null, input: { record: Record<string, unknown>; bytes: Uint8Array | null; contentType: string }): Promise<Preparation>;
  upload(path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  finalize(id: string, record: Record<string, unknown>): Promise<SavedRecord>;
  abandon(id: string): Promise<Recovery>;
  remove(path: string): Promise<void>;
}
export type ImportResult = { saved: SavedRecord } | {
  error: 'invalid_file' | 'save_failed' | 'reconciliation_required';
  attemptId?: string;
};

export async function persistImport(store: ImportStore, userId: string,
  record: Record<string, unknown>, base64: unknown, contentType: string): Promise<ImportResult> {
  let bytes: Uint8Array | null = null;
  if (base64 !== null && base64 !== undefined) {
    try {
      if (typeof base64 !== 'string' || !base64.length || base64.length > 34952536 ||
          base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
        return { error: 'invalid_file' };
      }
      bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      if (!bytes.length || bytes.length > 25 * 1024 * 1024) return { error: 'invalid_file' };
    } catch { return { error: 'invalid_file' }; }
  }
  const id = crypto.randomUUID();
  const path = bytes ? `${userId}/${id}` : null;
  let prepared = false;
  try {
    await store.authorize();
    const reservation = await store.prepare(id, path, { record, bytes, contentType });
    if (reservation?.state === 'committed') return { saved: reservation.record };
    if (reservation?.state === 'busy') return { error: 'reconciliation_required', attemptId: reservation.attemptId };
    // Only the caller that acquired a new durable reservation may upload/abandon.
    prepared = true;
    if (bytes && path) await store.upload(path, bytes, contentType);
    const saved = await store.finalize(id, { ...record, file_size_bytes: bytes?.length ?? null });
    return { saved };
  } catch {
    // A lost prepare response can leave an empty journal row, but no object was sent.
    if (!prepared) return { error: 'save_failed', attemptId: id };
    try {
      const recovery = await store.abandon(id);
      if (recovery.state === 'committed') {
        return recovery.record ? { saved: recovery.record } : { error: 'reconciliation_required', attemptId: id };
      }
      if (recovery.storage_path) await store.remove(recovery.storage_path);
      // Keep abandoned journal rows: a timed-out Storage request can finish late.
      return { error: 'save_failed', attemptId: id };
    } catch {
      // Never blindly remove an object when the database commit outcome is unknown.
      return { error: 'reconciliation_required', attemptId: id };
    }
  }
}

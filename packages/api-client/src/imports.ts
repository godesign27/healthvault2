export interface ImportReceipt {
  success: boolean;
  importBatchId: string;
  received: number;
  failed: number;
  records: Array<{ id: string; title: string; kind: string }>;
  recordErrors: Array<{ index: number; code: string; attemptId?: string }>;
}
export class ImportRequestError extends Error {
  constructor(message: string, public readonly retryKey: string,
    public readonly outcome: 'rejected' | 'unknown', public readonly status?: number,
    public readonly receipt?: ImportReceipt) { super(message); }
}
export function requireRetryKey(key: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(key)) throw new Error('Provide a persistent import retry key.');
}
export async function sendImport(url: string, headers: Record<string,string>, body: unknown,
  retryKey: string): Promise<ImportReceipt> {
  requireRetryKey(retryKey);
  const payload = JSON.stringify(body);
  if (new TextEncoder().encode(payload).byteLength > 40 * 1024 * 1024) {
    throw new ImportRequestError('The import is too large. Nothing was sent.', retryKey, 'rejected', 413);
  }
  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers: { ...headers,
      'Content-Type':'application/json', 'Idempotency-Key':retryKey }, body:payload });
  } catch {
    throw new ImportRequestError('Import result unknown. Retry the unchanged batch with the same key.', retryKey, 'unknown');
  }
  const result = await response.json().catch(() => null);
  const validReceipt = result && typeof result.success === 'boolean' &&
    typeof result.importBatchId === 'string' && result.importBatchId.length > 0 &&
    Number.isInteger(result.received) && result.received >= 0 && Number.isInteger(result.failed) && result.failed >= 0 &&
    Array.isArray(result.records) && result.records.length === result.received &&
    result.records.every((record: any) => record && typeof record.id === 'string' && record.id.length > 0 &&
      typeof record.title === 'string' && typeof record.kind === 'string') &&
    Array.isArray(result.recordErrors) && result.recordErrors.length === result.failed &&
    result.recordErrors.every((error: any) => error && Number.isInteger(error.index) && error.index >= 0 && typeof error.code === 'string') &&
    result.success === (result.failed === 0);
  if ([200,207,422].includes(response.status) && validReceipt) {
    return result as ImportReceipt; // Partial results are not success and must remain visible.
  }
  const rejected = [400,401,403,404,409,410,413].includes(response.status) || result?.code === 'request_body_rejected';
  throw new ImportRequestError(result?.error || 'Import result unavailable. Keep the same retry key.',
    retryKey, rejected ? 'rejected' : 'unknown', response.status);
}
/** Integration/server use only. Never embed a personal integration API key in a mobile/web bundle. */
export class HealthVaultImportClient {
  constructor(private config: { supabaseUrl: string; supabaseAnonKey: string; getApiKey: () => Promise<string> }) {}
  async importRecords(body: Record<string,unknown>, retryKey: string): Promise<ImportReceipt> {
    requireRetryKey(retryKey);
    const apiKey=await this.config.getApiKey();
    return sendImport(`${this.config.supabaseUrl}/functions/v1/inbound-records`,
      {apikey:this.config.supabaseAnonKey,Authorization:`Bearer ${apiKey}`},body,retryKey);
  }
}

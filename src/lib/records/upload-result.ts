// A missing receipt is not proof that the server saved nothing.
export function uploadNeedsReview(status: number, body: Record<string, unknown>): boolean {
  const hasReceipt = body.success === false && Array.isArray(body.saved) &&
    Array.isArray(body.fileErrors) && typeof body.completionPending === 'boolean';
  const rejectedBeforeSave = body.code === 'request_body_rejected' ||
    ([400, 401, 403, 404, 410, 413].includes(status) && typeof body.error === 'string');
  return (!hasReceipt && !rejectedBeforeSave) || body.completionPending === true ||
    (Array.isArray(body.fileErrors) && body.fileErrors.some(entry => entry?.code === 'reconciliation_required'));
}

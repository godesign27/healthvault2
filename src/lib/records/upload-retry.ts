// Persist only an opaque key indexed by a digest; never persist file bytes or names.
export async function uploadRetryKey(ownerId: string, bytes: ArrayBuffer, metadata: unknown,
  storage: Pick<Storage, 'getItem' | 'setItem'>): Promise<string> {
  const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2,'0')).join('');
  const fileHash=hex(await crypto.subtle.digest('SHA-256',bytes));
  const identity=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([ownerId,fileHash,metadata]))));
  const storageKey=`hv:record-upload:v1:${identity}`;
  const previous=storage.getItem(storageKey);
  if(previous && /^[0-9a-f-]{36}$/i.test(previous)) return previous;
  const retryKey=crypto.randomUUID();
  storage.setItem(storageKey,retryKey);
  if(storage.getItem(storageKey)!==retryKey) throw new Error('Unable to retain upload status. Enable browser storage before uploading.');
  return retryKey;
}

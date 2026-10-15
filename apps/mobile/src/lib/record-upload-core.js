// Dependency injection keeps native file IO testable without substituting the upload transport.
export async function savePickedRecord({ asset, kind, ownerId, fileSystem, digest, client }) {
  if (!ownerId) throw new Error('Sign in before uploading.');
  const info = await fileSystem.getInfoAsync(asset.uri);
  if (!info.exists || info.isDirectory || !info.size || info.size > 25 * 1024 * 1024) {
    throw new Error('Choose a nonempty file of at most 25 MB.');
  }
  const base64 = await fileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
  // Deterministic identity survives restarts and reselection without storing patient data.
  const contentHash = await digest(base64);
  const idempotencyKey = await digest(JSON.stringify(['native-upload-v1', ownerId, contentHash, asset.name, kind]));
  return client.uploadRecordBase64({ base64, fileName: asset.name, kind, idempotencyKey });
}

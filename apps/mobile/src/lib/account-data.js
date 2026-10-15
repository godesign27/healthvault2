// Owner-scoped account export and deletion-request rules shared with the website.
// A deletion request is a review receipt. It does not erase data or close the account.

const REQUEST_COLUMNS = 'id,status,requested_at,resolved_at,user_message';

export function isOpenDeletionRequest(request) {
  return !!request && (request.status === 'requested' || request.status === 'reviewing');
}

export function accountExportFileName(now = new Date()) {
  return `health-vault-data-${now.toISOString().slice(0, 10)}.json`;
}

export async function loadLatestDeletionRequest(client) {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user?.id) throw new Error('Sign in to manage your account data.');
  const { data, error } = await client.from('account_deletion_requests')
    .select(REQUEST_COLUMNS)
    .eq('user_id', user.id)
    .order('requested_at', { ascending: false })
    .limit(1);
  if (error) throw new Error('Unable to check deletion requests. Close and reopen Settings to retry.');
  return data?.[0] || null;
}

async function exportFailure(error) {
  let message = 'Unable to download your data. Please try again.';
  const body = error?.context && typeof error.context.json === 'function'
    ? await error.context.json().catch(() => null)
    : null;
  if (typeof body?.error === 'string' && body.error.trim()) message = body.error;
  return message;
}

export async function fetchAccountExport(client) {
  const { data, error } = await client.functions.invoke('account-export', { body: {} });
  if (error) throw new Error(await exportFailure(error));
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user?.id || data?.accountId !== user.id || data?.format !== 'health-vault-personal-data' || !data?.tables) {
    throw new Error('Your session changed or the export was incomplete. No download was created.');
  }
  return data;
}

export async function submitDeletionRequest(client, confirmation) {
  if (confirmation !== 'DELETE') throw new Error('Type DELETE to request review.');
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user?.id) throw new Error('Sign in again before requesting deletion.');
  const { error: insertError } = await client.from('account_deletion_requests').insert({ user_id: user.id, confirmed: true });
  if (insertError && insertError.code !== '23505') {
    throw new Error('Unable to confirm your request. Reopen Settings to check its status before submitting again.');
  }
  const { data, error: readError } = await client.from('account_deletion_requests')
    .select(REQUEST_COLUMNS)
    .eq('user_id', user.id)
    .in('status', ['requested', 'reviewing'])
    .single();
  if (readError || !data?.id) {
    throw new Error('Your request may have been received. Reopen Settings to check its status before submitting again.');
  }
  return data;
}

export async function presentAccountExport({ fileSystem, share, platform, payload, now = new Date() }) {
  const name = accountExportFileName(now);
  const body = JSON.stringify(payload, null, 2);
  if (platform === 'android') {
    const permission = await fileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission?.granted || !permission.directoryUri) throw new Error('Choose a folder to save your download.');
    const uri = await fileSystem.StorageAccessFramework.createFileAsync(permission.directoryUri, name, 'application/json');
    await fileSystem.writeAsStringAsync(uri, body);
    return { name, uri };
  }
  if (!fileSystem.documentDirectory) throw new Error('Unable to save your download on this device.');
  const uri = `${fileSystem.documentDirectory}${name}`;
  await fileSystem.writeAsStringAsync(uri, body, { encoding: fileSystem.EncodingType?.UTF8 });
  await share.share({ url: uri, title: name });
  return { name, uri };
}

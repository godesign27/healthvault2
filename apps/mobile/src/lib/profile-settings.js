const PHOTO_LIMIT = 5 * 1024 * 1024;

export async function saveSignedInProfile({ client, fileSystem, env, firstName, lastName, avatarUri }) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const session = sessionData?.session;
  if (sessionError || !session?.user?.id) throw new Error('Sign in before saving your profile.');
  const first = firstName.trim();
  const last = lastName.trim();
  if (!first && !last) throw new Error('Enter a first or last name.');
  let photoUrl = avatarUri?.startsWith('http') ? avatarUri : null;
  if (avatarUri && !avatarUri.startsWith('http')) {
    const info = await fileSystem.getInfoAsync(avatarUri);
    if (!info.exists || info.isDirectory || !info.size || info.size > PHOTO_LIMIT) {
      throw new Error('Choose a photo smaller than 5 MB.');
    }
    const path = `avatars/${session.user.id}-${Date.now()}.jpg`;
    const result = await fileSystem.uploadAsync(
      `${env.supabaseUrl}/storage/v1/object/profile-images/${path}`,
      avatarUri,
      {
        httpMethod: 'POST',
        uploadType: fileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: env.anonKey,
          'Content-Type': 'image/jpeg',
        },
      },
    );
    if (result.status < 200 || result.status >= 300) throw new Error('The profile photo could not be saved.');
    photoUrl = client.storage.from('profile-images').getPublicUrl(path).data.publicUrl;
  }
  const profileUpdate = {
    user_id: session.user.id,
    first_name: first,
    last_name: last,
    email: session.user.email,
  };
  if (photoUrl) profileUpdate.profile_photo_url = photoUrl;
  const { error } = await client.from('user_profiles').upsert(profileUpdate, { onConflict: 'user_id' });
  if (error) throw new Error('The profile could not be saved.');
  const name = `${first} ${last}`.trim();
  const account = { full_name: name };
  if (photoUrl) account.avatar_url = photoUrl;
  const { error: nameError } = await client.auth.updateUser({ data: account });
  if (nameError) throw new Error('Your name was saved. The account label could not be updated.');
  return { name, email: session.user.email, avatarUri: photoUrl };
}

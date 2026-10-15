async function requireUser(client) {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error('Sign in to load wellness.');
  return data.user.id;
}

// Owner-scoped meals and Life Signals for the same seven-day windows as the website.
export async function loadWellness(client, start, end) {
  const uid = await requireUser(client);
  const [diet, signals] = await Promise.all([
    client.from('diet_log_entries')
      .select('id, meal_type, consumed_at, items, water_ml, notes, source, confirmation_status')
      .eq('user_id', uid)
      .gte('consumed_at', start)
      .lt('consumed_at', end)
      .order('consumed_at', { ascending: false }),
    client.from('life_signal_entries')
      .select('id, energy, sleep, mood, stress, pain, note, recorded_at, source, confirmation_status')
      .eq('user_id', uid)
      .gte('recorded_at', start)
      .lt('recorded_at', end)
      .order('recorded_at', { ascending: false }),
  ]);
  if (diet.error || signals.error) throw diet.error || signals.error;
  return { diet: diet.data ?? [], signals: signals.data ?? [] };
}

export async function latestDietMoment(client) {
  const uid = await requireUser(client);
  const { data, error } = await client.from('diet_log_entries')
    .select('consumed_at')
    .eq('user_id', uid)
    .limit(1)
    .order('consumed_at', { ascending: false });
  if (error) throw error;
  return data?.[0]?.consumed_at ?? null;
}

export async function saveDietEntry(client, id, entry) {
  const uid = await requireUser(client);
  const { error } = await client.from('diet_log_entries').update(entry).eq('id', id).eq('user_id', uid);
  if (error) throw error;
}

export async function removeDietEntry(client, id) {
  const uid = await requireUser(client);
  const { error } = await client.from('diet_log_entries').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}

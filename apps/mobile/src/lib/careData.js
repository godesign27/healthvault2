// Patient-scoped data shared by the native Care screen and its regression tests.
export async function loadCareData(client, now = new Date().toISOString()) {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error('Sign in to load your care records.');
  const uid = data.user.id;
  const results = await Promise.all([
    client.from('appointments').select('*').eq('user_id', uid).eq('status', 'scheduled').gte('scheduled_at', now).order('scheduled_at', { ascending: true }),
    client.from('encounters').select('*').eq('user_id', uid).order('encounter_date', { ascending: false }),
    client.from('claims').select('*').eq('user_id', uid).order('service_date', { ascending: false }),
  ]);
  for (const result of results) if (result.error) throw result.error;
  return { appointments: results[0].data ?? [], encounters: results[1].data ?? [], claims: results[2].data ?? [] };
}

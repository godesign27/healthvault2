function pickEmbeddedProvider(c) {
  const candidates = [c.provider, c.insurance_providers];
  for (const raw of candidates) {
    if (raw == null) continue;
    const p = Array.isArray(raw) ? raw[0] : raw;
    if (p && p.id) return p;
  }
  return null;
}

function normalizeVerificationStatus(raw) {
  const s = (raw == null ? 'needs_attention' : String(raw)).toLowerCase().replace(/\s+/g, '_');
  if (s === 'needsattention') return 'needs_attention';
  if (['connected', 'verified', 'verifying', 'needs_attention', 'expiring'].includes(s)) return s;
  return 'needs_attention';
}

/** Merge raw coverage row with provider map (by provider_id). Never drops a row. */
function mapCoverageRow(c, providerById) {
  const embedded = pickEmbeddedProvider(c);
  const fromMap = c.provider_id ? providerById.get(c.provider_id) : null;
  const p = embedded || fromMap;
  const fallbackName = p?.name || 'Insurance provider';
  return {
    id: c.id,
    userId: c.user_id,
    providerId: c.provider_id,
    planName: c.plan_name || '—',
    memberId: c.member_id || '',
    memberIdHash: c.member_id_hash,
    groupNumber: c.group_number,
    bin: c.bin,
    pcn: c.pcn,
    relationship: c.relationship,
    effectiveStart: c.effective_start,
    effectiveEnd: c.effective_end,
    isPrimary: c.is_primary,
    verificationStatus: normalizeVerificationStatus(c.verification_status),
    lastVerifiedAt: c.last_verified_at,
    source: c.source,
    coverageStatus: c.coverage_status || 'active',
    stoppedAt: c.stopped_at,
    provider: {
      id: p?.id || c.provider_id,
      name: fallbackName,
      payerId: p?.payer_id,
      logoUrl: p?.logo_url,
      slug: p?.slug || 'unknown',
      isPopular: p?.is_popular,
    },
  };
}


export async function loadInsurance(client) {
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user?.id) throw new Error('Sign in to load insurance.');
  const userId = data.user.id;
  const result = await client.from('insurance_coverages').select('*').eq('user_id', userId)
    .order('is_primary', { ascending: false }).order('created_at', { ascending: false });
  if (result.error) throw result.error;
  const rows = result.data ?? [];
  const ids = [...new Set(rows.map(row => row.provider_id).filter(Boolean))];
  const providers = new Map();
  if (ids.length) {
    const result = await client.from('insurance_providers').select('*').in('id', ids);
    if (result.error) throw result.error;
    for (const provider of result.data ?? []) providers.set(provider.id, provider);
  }
  return { userId, coverages: rows.map(row => mapCoverageRow(row, providers)) };
}

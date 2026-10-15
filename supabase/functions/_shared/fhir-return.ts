// Only the application's fixed completion route is a valid OAuth return target.
export function fhirReturnUrl(appUrl: string, requested?: string | null): URL {
  const base = new URL(appUrl);
  if (base.username || base.password ||
      (base.protocol !== 'https:' && !(base.protocol === 'http:' && base.hostname === 'localhost'))) {
    throw new Error('Invalid application URL');
  }
  const canonical = new URL('/connect/fhir/complete', base.origin);
  if (requested) {
    const candidate = new URL(requested, base.origin);
    if (candidate.origin !== canonical.origin || candidate.pathname !== canonical.pathname ||
        candidate.username || candidate.password || candidate.hash || candidate.search) {
      throw new Error('Invalid return URL');
    }
  }
  return canonical;
}

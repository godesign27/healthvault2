export interface SubdomainInfo {
  subdomain: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isProvider: boolean;
  organizationSlug: string | null;
}

export function parseSubdomain(hostname: string = window.location.hostname): SubdomainInfo {
  const parts = hostname.split('.');

  // Check for development/preview environments (localhost, IPs, or cloud development environments)
  const isDevelopment = hostname === 'localhost' ||
                       hostname.startsWith('127.0.0.1') ||
                       hostname.startsWith('192.168');

  // Check for cloud development platforms
  const isCloudDev = hostname.includes('.bolt.new') ||
                     hostname.endsWith('.bolt.new') ||
                     hostname.includes('bolt.new') ||
                     hostname.includes('.webcontainer-api.io') ||
                     hostname.includes('.stackblitz.io') ||
                     hostname.includes('stackblitz.com');

  if (isDevelopment || isCloudDev) {
    const urlParams = new URLSearchParams(window.location.search);
    const mockSubdomain = urlParams.get('subdomain');

    if (mockSubdomain) {
      return {
        subdomain: mockSubdomain,
        isAdmin: mockSubdomain === 'admin',
        isSuperAdmin: mockSubdomain === 'admin',
        isProvider: mockSubdomain !== 'admin' && mockSubdomain !== null,
        organizationSlug: mockSubdomain !== 'admin' ? mockSubdomain : null,
      };
    }

    return {
      subdomain: null,
      isAdmin: false,
      isSuperAdmin: true,
      isProvider: false,
      organizationSlug: null,
    };
  }

  if (parts.length < 3) {
    return {
      subdomain: null,
      isAdmin: false,
      isSuperAdmin: true,
      isProvider: false,
      organizationSlug: null,
    };
  }

  const subdomain = parts[0];

  const isAdmin = subdomain === 'admin' || subdomain === 'www';

  return {
    subdomain,
    isAdmin,
    isSuperAdmin: isAdmin,
    isProvider: !isAdmin,
    organizationSlug: !isAdmin ? subdomain : null,
  };
}

export function buildUrl(subdomain: string | null, path: string = '/'): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  const isDevelopment = hostname === 'localhost' ||
                       hostname.startsWith('127.0.0.1') ||
                       hostname.startsWith('192.168');

  const isCloudDev = hostname.includes('.bolt.new') ||
                     hostname.endsWith('.bolt.new') ||
                     hostname.includes('bolt.new') ||
                     hostname.includes('.webcontainer-api.io') ||
                     hostname.includes('.stackblitz.io') ||
                     hostname.includes('stackblitz.com');

  if (isDevelopment || isCloudDev) {
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}${path}`;
    return subdomain ? `${baseUrl}?subdomain=${subdomain}` : baseUrl;
  }

  const parts = hostname.split('.');
  const domain = parts.slice(-2).join('.');

  const newHostname = subdomain ? `${subdomain}.${domain}` : domain;

  return `${protocol}//${newHostname}${port ? `:${port}` : ''}${path}`;
}

export function getOrganizationFromSubdomain(): string | null {
  const info = parseSubdomain();
  return info.organizationSlug;
}

export function isSuperAdminDomain(): boolean {
  const info = parseSubdomain();
  return info.isSuperAdmin;
}

export function isProviderDomain(): boolean {
  const info = parseSubdomain();
  return info.isProvider;
}

import type { ProductKey } from '@health-vault/admin-contracts';

export type AdminRoute =
  | { kind: 'product'; productKey: ProductKey; section: string }
  | { kind: 'providers'; section: string }
  | { kind: 'wellness-partners'; section: string }
  | { kind: 'home' };

export function parseAdminRoute(pathname: string): AdminRoute {
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] === 'providers') {
    return { kind: 'providers', section: segments[1] ?? 'directory' };
  }

  if (segments[0] === 'wellness-partners') return { kind: 'wellness-partners', section: segments[1] ?? 'overview' };

  if (segments[0] === 'products' && segments[1] === 'gpt-app') {
    return { kind: 'product', productKey: 'gpt_app', section: segments[2] ?? 'insights' };
  }

  if (segments[0] === 'products' && segments[1] === 'saas-cloud') {
    return { kind: 'product', productKey: 'saas_cloud', section: segments[2] ?? 'insights' };
  }

  return { kind: 'home' };
}

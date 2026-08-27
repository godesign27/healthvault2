export const PRODUCT_KEYS = ['gpt_app', 'saas_cloud'] as const;

export type ProductKey = (typeof PRODUCT_KEYS)[number];

export const ADMIN_ROLE_KEYS = [
  'platform_owner',
  'product',
  'security_privacy',
  'support',
] as const;

export type AdminRoleKey = (typeof ADMIN_ROLE_KEYS)[number];

export const ADMIN_PERMISSIONS = [
  'analytics.read',
  'audit.read',
  'providers.read',
  'providers.manage',
  'roles.manage',
  'rollouts.manage',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export interface AdminRoleAssignment {
  id: string;
  principalId: string;
  productKey: ProductKey | null;
  roleKey: AdminRoleKey;
  permissions: readonly AdminPermission[];
  grantedAt: string;
}

export interface AdminProductDefinition {
  key: ProductKey;
  label: string;
  path: string;
  status: 'active' | 'reserved';
}

export const ADMIN_PRODUCTS: readonly AdminProductDefinition[] = [
  { key: 'gpt_app', label: 'GPT App', path: '/products/gpt-app', status: 'active' },
  { key: 'saas_cloud', label: 'SaaS Cloud', path: '/products/saas-cloud', status: 'reserved' },
];

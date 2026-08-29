import type { AdminPermission, AdminRoleAssignment, AdminRoleKey, ProductKey } from '@health-vault/admin-contracts';
import { supabase } from '../../lib/supabase';

interface AdminRoleRow {
  id: string;
  principal_id: string;
  product_key: ProductKey | null;
  role_key: AdminRoleKey;
  permissions: AdminPermission[] | null;
  granted_at: string;
}

export async function getAdminAssignments(principalId: string): Promise<AdminRoleAssignment[]> {
  const { data, error } = await supabase
    .from('admin_role_assignments')
    .select('id, principal_id, product_key, role_key, permissions, granted_at')
    .eq('principal_id', principalId)
    .is('revoked_at', null);

  if (error) {
    throw new Error(`Unable to verify admin access: ${error.message}`);
  }

  return ((data ?? []) as AdminRoleRow[]).map((row) => ({
    id: row.id,
    principalId: row.principal_id,
    productKey: row.product_key,
    roleKey: row.role_key,
    permissions: row.permissions ?? [],
    grantedAt: row.granted_at,
  }));
}

export function canAccessProduct(
  assignments: readonly AdminRoleAssignment[],
  productKey: ProductKey,
): boolean {
  return assignments.some(
    (assignment) => assignment.productKey === null || assignment.productKey === productKey,
  );
}

export function canAccessProviderOperations(assignments: readonly AdminRoleAssignment[]): boolean {
  return assignments.some(
    (assignment) =>
      assignment.roleKey === 'platform_owner'
      || assignment.permissions.includes('providers.read')
      || assignment.permissions.includes('providers.manage'),
  );
}

export function canAccessWellnessPartners(assignments: readonly AdminRoleAssignment[]): boolean {
  return assignments.some((assignment) => assignment.roleKey === 'platform_owner' || assignment.permissions.includes('wellness_partners.read') || assignment.permissions.includes('wellness_partners.manage'));
}

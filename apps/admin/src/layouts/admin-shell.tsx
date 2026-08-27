import { ADMIN_PRODUCTS, type AdminRoleAssignment } from '@health-vault/admin-contracts';
import { Activity, Building2, LogOut, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { canAccessProduct, canAccessProviderOperations } from '../platform/auth/admin-access';
import { supabase } from '../lib/supabase';

interface AdminShellProps {
  assignments: readonly AdminRoleAssignment[];
  children: ReactNode;
}

export function AdminShell({ assignments, children }: AdminShellProps) {
  const canAccessProviders = canAccessProviderOperations(assignments);

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <a className="brand" href="/products/gpt-app/insights"><span>HV</span><strong>Admin</strong></a>
        <nav aria-label="Admin navigation">
          <p className="nav-label">Products</p>
          {ADMIN_PRODUCTS.map((product) => {
            const canAccess = canAccessProduct(assignments, product.key);
            return (
              <a key={product.key} href={`${product.path}/insights`} aria-disabled={!canAccess} className={!canAccess ? 'disabled' : ''}>
                <Activity size={18} />{product.label}{product.status === 'reserved' && <em>Reserved</em>}
              </a>
            );
          })}
          <p className="nav-label">Operations</p>
          <a href="/providers/directory" aria-disabled={!canAccessProviders} className={!canAccessProviders ? 'disabled' : ''}><Building2 size={18} />Providers</a>
          <a href="/security/audit" aria-disabled="true" className="disabled"><ShieldCheck size={18} />Security &amp; Audit<em>Next</em></a>
        </nav>
        <button className="sign-out" type="button" onClick={() => void supabase.auth.signOut()}><LogOut size={18} />Sign out</button>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}

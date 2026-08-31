import { ADMIN_PRODUCTS, type AdminRoleAssignment } from '@health-vault/admin-contracts';
import { Activity, Building2, Leaf, LogOut, Moon, PanelLeftClose, PanelLeftOpen, ShieldCheck, Sun } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { canAccessProduct, canAccessProviderOperations, canAccessWellnessPartners } from '../platform/auth/admin-access';
import { supabase } from '../lib/supabase';

interface AdminShellProps {
  assignments: readonly AdminRoleAssignment[];
  children: ReactNode;
}

export function AdminShell({ assignments, children }: AdminShellProps) {
  const canAccessProviders = canAccessProviderOperations(assignments);
  const canAccessPartners = canAccessWellnessPartners(assignments);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('hv-admin-sidebar-collapsed') === 'true');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('hv-admin-theme');
    return saved === 'light' || saved === 'dark' ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }, [theme]);
  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem('hv-admin-sidebar-collapsed', String(next));
      return next;
    });
  }
  function toggleTheme() {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('hv-admin-theme', next);
      return next;
    });
  }

  return (
    <div className={`admin-layout${sidebarCollapsed ? ' admin-layout-collapsed' : ''}`}>
      <aside className={`sidebar${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="sidebar-heading"><a className="brand sidebar-tooltip" data-tooltip="Health Vault Admin" aria-label="Health Vault Admin" href="/products/gpt-app/insights"><span>HV</span><strong>Admin</strong></a><button className="sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!sidebarCollapsed} title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button></div>
        <nav aria-label="Admin navigation">
          <p className="nav-label">Products</p>
          {ADMIN_PRODUCTS.map((product) => {
            const canAccess = canAccessProduct(assignments, product.key);
            return (
              <a key={product.key} href={`${product.path}/insights`} aria-label={product.label} data-tooltip={product.label} aria-disabled={!canAccess} className={`sidebar-tooltip${!canAccess ? ' disabled' : ''}`}>
                <Activity size={18} /><span className="sidebar-link-label">{product.label}</span>{product.status === 'reserved' && <em>Reserved</em>}
              </a>
            );
          })}
          <p className="nav-label">Operations</p>
          <a href="/providers/directory" aria-label="Providers" data-tooltip="Providers" aria-disabled={!canAccessProviders} className={`sidebar-tooltip${!canAccessProviders ? ' disabled' : ''}`}><Building2 size={18} /><span className="sidebar-link-label">Providers</span></a>
          <a href="/wellness-partners/overview" aria-label="Wellness Partners" data-tooltip="Wellness Partners" aria-disabled={!canAccessPartners} className={`sidebar-tooltip${!canAccessPartners ? ' disabled' : ''}`}><Leaf size={18} /><span className="sidebar-link-label">Wellness Partners</span></a>
          <a href="/security/audit" aria-label="Security and Audit" data-tooltip="Security & Audit" aria-disabled="true" className="sidebar-tooltip disabled"><ShieldCheck size={18} /><span className="sidebar-link-label">Security &amp; Audit</span><em>Next</em></a>
        </nav>
        <button className="appearance-toggle sidebar-tooltip" data-tooltip={theme === 'dark' ? 'Use light mode' : 'Use dark mode'} aria-label={theme === 'dark' ? 'Use light mode' : 'Use dark mode'} type="button" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}<span className="sidebar-link-label">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span></button>
        <button className="sign-out sidebar-tooltip" data-tooltip="Sign out" aria-label="Sign out" type="button" onClick={() => void supabase.auth.signOut()}><LogOut size={18} /><span className="sidebar-link-label">Sign out</span></button>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}

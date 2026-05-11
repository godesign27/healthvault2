import { useState, useEffect } from 'react';
import { Building2, Plus, Settings, Users, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  slug: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  subscription_tier: string;
  created_at: string;
  primary_color: string;
}

interface OrganizationStats {
  total_organizations: number;
  active_organizations: number;
  total_patients: number;
  total_admins: number;
}

export default function SuperAdminPage() {
  const [darkMode] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<OrganizationStats>({
    total_organizations: 0,
    active_organizations: 0,
    total_patients: 0,
    total_admins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
    loadStats();
  }, []);

  async function loadOrganizations() {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const [orgsResult, patientsResult, adminsResult] = await Promise.all([
        supabase.from('organizations').select('id, status', { count: 'exact', head: true }),
        supabase.from('organization_patients').select('id', { count: 'exact', head: true }),
        supabase.from('organization_admins').select('id', { count: 'exact', head: true }),
      ]);

      const activeOrgs = await supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        total_organizations: orgsResult.count || 0,
        active_organizations: activeOrgs.count || 0,
        total_patients: patientsResult.count || 0,
        total_admins: adminsResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  function getSubdomainUrl(subdomain: string): string {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
      return `${protocol}//${hostname}${port ? `:${port}` : ''}/?subdomain=${subdomain}`;
    }

    const parts = hostname.split('.');
    const domain = parts.slice(-2).join('.');
    return `${protocol}//${subdomain}.${domain}${port ? `:${port}` : ''}/`;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'}`}>
      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-content-primary'}`}>
            Super Admin Dashboard
          </h1>
          <p className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>
            Manage all organizations and system settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>Total Organizations</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
              {stats.total_organizations}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              {stats.active_organizations} active
            </p>
          </div>

          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>Total Patients</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
              {stats.total_patients}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              Across all orgs
            </p>
          </div>

          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>Admin Users</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
              {stats.total_admins}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              Organization admins
            </p>
          </div>

          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-rose-50">
                <TrendingUp className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>Growth</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
              +12%
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              This month
            </p>
          </div>
        </div>

        <div className={`rounded-lg border ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
          <div className="p-6 border-b border-stroke-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                  Organizations
                </h2>
                <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                  Manage all healthcare provider organizations
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add Organization
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${darkMode ? 'border-stroke-default' : 'border-stroke-subtle'}`}>
                <tr className={darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'}>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    Organization
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    Subdomain
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    Contact
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    Plan
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-stroke-default' : 'divide-stroke-subtle'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>Loading...</div>
                    </td>
                  </tr>
                ) : organizations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>No organizations found</div>
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => (
                    <tr key={org.id} className={`${darkMode ? 'hover:bg-surface-overlay' : 'hover:bg-surface-sunken'} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: org.primary_color }}
                          >
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                              {org.name}
                            </div>
                            <div className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                              ID: {org.id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={getSubdomainUrl(org.subdomain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 font-mono text-sm"
                        >
                          {org.subdomain}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
                          {org.contact_email}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                          {org.contact_phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            org.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-surface-sunken text-content-primary'
                          }`}
                        >
                          {org.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm capitalize ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
                          {org.subscription_tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-surface-overlay' : 'hover:bg-surface-sunken'} transition-colors`}>
                          <Settings className={`w-4 h-4 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

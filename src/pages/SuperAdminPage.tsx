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
    <div className={`min-h-screen ${darkMode ? 'bg-stone-900' : 'bg-stone-50'}`}>
      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
            Super Admin Dashboard
          </h1>
          <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>
            Manage all organizations and system settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stone-800 bg-stone-800' : 'border-stone-200 bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>Total Organizations</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              {stats.total_organizations}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              {stats.active_organizations} active
            </p>
          </div>

          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stone-800 bg-stone-800' : 'border-stone-200 bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>Total Patients</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              {stats.total_patients}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              Across all orgs
            </p>
          </div>

          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stone-800 bg-stone-800' : 'border-stone-200 bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>Admin Users</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              {stats.total_admins}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              Organization admins
            </p>
          </div>

          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stone-800 bg-stone-800' : 'border-stone-200 bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-rose-50">
                <TrendingUp className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>Growth</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              +12%
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              This month
            </p>
          </div>
        </div>

        <div className={`rounded-lg border ${darkMode ? 'border-stone-800 bg-stone-800' : 'border-stone-200 bg-white'}`}>
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                  Organizations
                </h2>
                <p className={`text-sm mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
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
              <thead className={`border-b ${darkMode ? 'border-stone-700' : 'border-stone-200'}`}>
                <tr className={darkMode ? 'bg-stone-900' : 'bg-stone-50'}>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                    Organization
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                    Subdomain
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                    Contact
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                    Plan
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-stone-700' : 'divide-stone-200'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Loading...</div>
                    </td>
                  </tr>
                ) : organizations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className={darkMode ? 'text-stone-400' : 'text-stone-600'}>No organizations found</div>
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => (
                    <tr key={org.id} className={`hover:${darkMode ? 'bg-stone-700' : 'bg-stone-50'} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: org.primary_color }}
                          >
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                              {org.name}
                            </div>
                            <div className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
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
                        <div className={`text-sm ${darkMode ? 'text-stone-300' : 'text-stone-900'}`}>
                          {org.contact_email}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                          {org.contact_phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            org.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {org.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm capitalize ${darkMode ? 'text-stone-300' : 'text-stone-900'}`}>
                          {org.subscription_tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className={`p-2 rounded-lg hover:${darkMode ? 'bg-stone-600' : 'bg-stone-100'} transition-colors`}>
                          <Settings className={`w-4 h-4 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`} />
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

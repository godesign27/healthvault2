import { useState, useEffect } from 'react';
import { Users, Calendar, FileText, Settings, Activity, TrendingUp, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getOrganizationFromSubdomain } from '../lib/subdomain';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string;
  primary_color: string;
  contact_email: string;
  contact_phone: string;
  status: string;
}

interface Patient {
  id: string;
  patient_id: string;
  patient_number: string;
  assigned_at: string;
}

interface Stats {
  total_patients: number;
  appointments_today: number;
  pending_forms: number;
  active_staff: number;
}

export default function ProviderAdminPage() {
  const [darkMode] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_patients: 0,
    appointments_today: 0,
    pending_forms: 0,
    active_staff: 2,
  });
  const [loading, setLoading] = useState(true);
  const organizationSlug = getOrganizationFromSubdomain();

  useEffect(() => {
    if (organizationSlug) {
      loadOrganization();
    }
  }, [organizationSlug]);

  async function loadOrganization() {
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('subdomain', organizationSlug)
        .maybeSingle();

      if (orgError) throw orgError;
      if (!orgData) {
        console.error('Organization not found');
        setLoading(false);
        return;
      }

      setOrganization(orgData);

      const { data: patientsData, error: patientsError } = await supabase
        .from('organization_patients')
        .select('*')
        .eq('organization_id', orgData.id)
        .order('assigned_at', { ascending: false });

      if (patientsError) throw patientsError;
      setPatients(patientsData || []);

      setStats({
        total_patients: patientsData?.length || 0,
        appointments_today: 5,
        pending_forms: 12,
        active_staff: 8,
      });
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'}`}>
        <div className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>Loading organization...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'}`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-content-primary'}`}>
            Organization Not Found
          </h1>
          <p className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>
            The subdomain "{organizationSlug}" does not match any active organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'}`}>
      <div
        className="border-b"
        style={{
          backgroundColor: organization.primary_color,
          borderBottomColor: darkMode ? '#292524' : '#e7e5e4',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {organization.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{organization.name}</h1>
                <p className="text-sm text-white/80">Provider Admin Dashboard</p>
              </div>
            </div>
            <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>Total Patients</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
              {stats.total_patients}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              Active patients
            </p>
          </div>

          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>Appointments Today</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
              {stats.appointments_today}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              Scheduled for today
            </p>
          </div>

          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>Pending Forms</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
              {stats.pending_forms}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              Awaiting completion
            </p>
          </div>

          <div className={`rounded-lg border p-6 ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-rose-50">
                <Activity className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>Active Staff</h3>
            </div>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
              {stats.active_staff}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              Online now
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-lg border ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
            <div className="p-6 border-b border-stroke-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                    Recent Patients
                  </h2>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    Patients assigned to your organization
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  <UserPlus className="w-4 h-4" />
                  Add Patient
                </button>
              </div>
            </div>
            <div className="p-6">
              {patients.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                  No patients assigned yet
                </div>
              ) : (
                <div className="space-y-4">
                  {patients.slice(0, 5).map((patient) => (
                    <div
                      key={patient.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        darkMode ? 'border-stroke-default' : 'border-stroke-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                            Patient {patient.patient_number || patient.patient_id.substring(0, 8)}
                          </div>
                          <div className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                            Added {new Date(patient.assigned_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button className={`text-sm font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-lg border ${darkMode ? 'border-stroke-subtle bg-surface-sunken' : 'border-stroke-subtle bg-white'}`}>
            <div className="p-6 border-b border-stroke-subtle">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                Quick Actions
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                Common tasks for managing your practice
              </p>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-stroke-subtle hover:bg-surface-sunken transition-colors text-left">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                    Manage Appointments
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    View and schedule appointments
                  </div>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-stroke-subtle hover:bg-surface-sunken transition-colors text-left">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                    Medical Forms
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    Review pending forms
                  </div>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-stroke-subtle hover:bg-surface-sunken transition-colors text-left">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                    Analytics & Reports
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    View practice insights
                  </div>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-stroke-subtle hover:bg-surface-sunken transition-colors text-left">
                <Users className="w-5 h-5 text-rose-600" />
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                    Staff Management
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    Manage team members
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

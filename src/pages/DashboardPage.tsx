import { FileText, Activity, Calendar, Pill, ArrowRight, Sparkles, X, Home, Menu, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { Surface } from '../providers/SurfaceProvider';
import { fetchRecordRequests, type RecordRequestRow } from '../lib/records/requests-api';
import { supabase } from '../lib/supabase';
import { MedicalIDCard } from '../components/MedicalIDCard';
import { HealthStatsCard } from '../components/HealthStatsCard';
import { RecentActivityItem } from '../components/RecentActivityItem';
import { AIAssistantPanel } from '../components/AIAssistantPanel';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { FloatingChatActions } from '../components/FloatingChatActions';
import { CarePage } from './CarePage';
import { MedicalFormsPage } from './MedicalFormsPage';
import { MedicalProfilePage } from './MedicalProfilePage';
import { InsurancePage } from './InsurancePage';
import NetworkPage from './NetworkPage';
import { HealthRecordsPage } from './HealthRecordsPage';
import { ProfileSettingsDrawer } from '../components/ProfileSettingsDrawer';
import { WellnessPage, type WellnessTab } from './WellnessPage';
import { NourishedRebelInsights } from '../components/wellness/NourishedRebelInsights';

interface DashboardPageProps {
  onViewChange?: (view: 'health-vault' | 'design-system' | 'projects' | 'marketing') => void;
}

interface ActivityItem {
  id: string;
  kind: 'record' | 'request' | 'medication';
  title: string;
  subtitle: string;
  timestamp: string;
}

interface ProviderConnectionNotice {
  providerDisplayName: string;
  dataSummary: { profileDetails: number; healthRecords: number; labs: number; medications: number; vitals: number } | null;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage({ onViewChange }: DashboardPageProps) {
  const { setTheme: setGlobalTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState(() => {
    const requested = sessionStorage.getItem('hv-dashboard-page');
    sessionStorage.removeItem('hv-dashboard-page');
    return requested === 'medical-forms' ? requested : 'dashboard';
  });
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [assistantWellnessInsightId, setAssistantWellnessInsightId] = useState<string | null>(null);
  const [wellnessInitialTab, setWellnessInitialTab] = useState<WellnessTab>('diet');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const medicalProfileActionsRef = useRef<{
    openAddCondition?: () => void;
    openAddMedication?: () => void;
    openAddAllergy?: () => void;
    openAddImmunization?: () => void;
    refreshData?: () => Promise<void>;
  }>({});

  const careActionsRef = useRef<{
    openAddProvider?: () => void;
    refreshData?: () => void;
  }>({});

  const insuranceActionsRef = useRef<{
    openAddCoverage?: () => void;
    refreshData?: () => void;
  }>({});

  const networkActionsRef = useRef<{
    openAddProvider?: () => void;
    openAddPharmacy?: () => void;
    openFindSpecialist?: () => void;
    refreshData?: () => void;
  }>({});

  const healthRecordsActionsRef = useRef<{
    openRequestRecords?: () => void;
  }>({});

  const [providerConnectionRequested, setProviderConnectionRequested] = useState(false);
  const [receivedRequests, setReceivedRequests] = useState<RecordRequestRow[]>([]);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState({ records: 0, medications: 0, appointments: 0 });
  const [formsCount, setFormsCount] = useState<number | null>(null);
  const [vaultStats, setVaultStats] = useState<{ connectedProviders: number; pendingRequests: number; lastSyncedAt: string | null } | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [dismissedDashboardBanners, setDismissedDashboardBanners] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissedRecordBanners');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [providerConnectionNotice, setProviderConnectionNotice] = useState<ProviderConnectionNotice | null>(() => {
    try {
      const stored = sessionStorage.getItem('hv-provider-connection-accepted');
      sessionStorage.removeItem('hv-provider-connection-accepted');
      return stored ? JSON.parse(stored) as ProviderConnectionNotice : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (dismissedDashboardBanners.size > 0) {
      localStorage.setItem('dismissedRecordBanners', JSON.stringify([...dismissedDashboardBanners]));
    }
  }, [dismissedDashboardBanners]);

  useEffect(() => {
    fetchRecordRequests()
      .then(data => setReceivedRequests(data.filter(r => r.status === 'received')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const userId = session.user.id;

      const [profileRes, recordsRes, medsRes, apptRes, patientRes] = await Promise.all([
        supabase.from('user_profiles').select('first_name').eq('user_id', userId).maybeSingle(),
        supabase.from('health_records').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('medications').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'scheduled'),
        supabase.from('patient_profiles').select('id').eq('user_id', userId).maybeSingle(),
      ]);

      if (profileRes.data?.first_name) setUserFirstName(profileRes.data.first_name);
      setDashboardStats({
        records: recordsRes.count ?? 0,
        medications: medsRes.count ?? 0,
        appointments: apptRes.count ?? 0,
      });

      // Completed medical forms count (form_responses is keyed by patient_profiles.id)
      if (patientRes.data?.id) {
        const { count: formsDone } = await supabase
          .from('form_responses')
          .select('id', { count: 'exact', head: true })
          .eq('patient_id', patientRes.data.id)
          .in('status', ['completed', 'signed']);
        setFormsCount(formsDone ?? 0);
      } else {
        setFormsCount(0);
      }

      // Connected providers / pending requests / last sync via vault-stats
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-stats`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        });
        if (res.ok) {
          const s = await res.json();
          setVaultStats({
            connectedProviders: s.connectedProviders ?? 0,
            pendingRequests: s.pendingRequests ?? 0,
            lastSyncedAt: s.lastSyncedAt ?? null,
          });
        }
      } catch { /* non-blocking */ }

      // Recent activity feed from real data (records + received requests + medications)
      const [recRows, reqRows, medRows] = await Promise.all([
        supabase.from('health_records').select('id, title, kind, provider_name, received_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('health_record_requests').select('id, provider_name, doctor_name, status, submitted_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('medications').select('id, name, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      ]);

      const activity: ActivityItem[] = [];
      for (const r of recRows.data ?? []) {
        activity.push({
          id: `rec-${r.id}`,
          kind: 'record',
          title: r.title || 'Health record added',
          subtitle: r.provider_name || (r.kind ? String(r.kind) : 'Health record'),
          timestamp: r.received_at || r.created_at,
        });
      }
      for (const r of reqRows.data ?? []) {
        if (r.status === 'received') {
          activity.push({
            id: `req-${r.id}`,
            kind: 'request',
            title: `Records received from ${r.doctor_name || r.provider_name}`,
            subtitle: 'Requested records are now available',
            timestamp: r.submitted_at || r.created_at,
          });
        }
      }
      for (const m of medRows.data ?? []) {
        activity.push({
          id: `med-${m.id}`,
          kind: 'medication',
          title: `Medication added: ${m.name}`,
          subtitle: 'Added to your medications',
          timestamp: m.created_at,
        });
      }
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activity.slice(0, 4));
    };
    loadUserData().catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    setGlobalTheme(darkMode ? 'dark' : 'light');
  }, [darkMode, setGlobalTheme]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleProfileSignOut = async () => {
    await supabase.auth.signOut();
    onViewChange?.('marketing');
  };

  const renderMainContent = () => {
    if (currentPage === 'profile-settings') {
      return (
        <ProfileSettingsDrawer
          layout="inline"
          isOpen
          darkMode={darkMode}
          onClose={() => setCurrentPage('dashboard')}
          onSave={() => setProfileRefreshKey((k) => k + 1)}
          onSignOut={handleProfileSignOut}
        />
      );
    }

    if (currentPage === 'care') {
      return <CarePage darkMode={darkMode} actionsRef={careActionsRef} />;
    }

    if (currentPage === 'medical-forms') {
      return <MedicalFormsPage darkMode={darkMode} />;
    }

    if (currentPage === 'medical-profile') {
      return <MedicalProfilePage darkMode={darkMode} actionsRef={medicalProfileActionsRef} />;
    }

    if (currentPage === 'network') {
      return <NetworkPage darkMode={darkMode} actionsRef={networkActionsRef} />;
    }

    if (currentPage === 'insurance') {
      return <InsurancePage darkMode={darkMode} actionsRef={insuranceActionsRef} />;
    }

    if (currentPage === 'health-records') {
      return (
        <HealthRecordsPage
          darkMode={darkMode}
          actionsRef={healthRecordsActionsRef}
          onConnectProvider={() => {
            setIsAIPanelOpen(true);
            setProviderConnectionRequested(true);
          }}
        />
      );
    }

    if (currentPage === 'wellness') {
      return <WellnessPage initialTab={wellnessInitialTab} onOpenAssistant={(insightId) => { setAssistantWellnessInsightId(insightId ?? null); setIsAIPanelOpen(true); }} />;
    }

    if (currentPage === 'vitals') {
      return (
        <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-content-primary">Vitals</h1>
            <p className="mt-1 text-content-secondary">Track your vital signs and health metrics</p>
          </div>

          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-surface-sunken">
              <Activity className="w-8 h-8 text-content-tertiary" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-content-primary">Coming Soon</h2>
            <p className="text-center max-w-md text-content-secondary">
              We're working on bringing you powerful vitals tracking features. Stay tuned!
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12 relative">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-content-primary">
            <Home className="w-7 h-7" />
            Dashboard
          </h1>
          <p className="text-content-secondary">
            Welcome back{userFirstName ? `, ${userFirstName}` : ''}! Here's your health overview.
          </p>
        </div>

        {providerConnectionNotice && <div className={`mb-6 flex items-start gap-4 rounded-xl border p-4 ${darkMode ? 'border-indigo-800 bg-indigo-950/30' : 'border-indigo-200 bg-indigo-50'}`} role="status"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-indigo-900' : 'bg-indigo-100'}`}><CheckCircle className={`h-5 w-5 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`} /></div><div className="min-w-0 flex-1"><p className={`font-semibold ${darkMode ? 'text-indigo-200' : 'text-indigo-950'}`}>{providerConnectionNotice.providerDisplayName} is now connected</p><p className={`mt-1 text-sm ${darkMode ? 'text-indigo-300/80' : 'text-indigo-800'}`}>{providerConnectionNotice.dataSummary ? `${providerConnectionNotice.dataSummary.profileDetails} profile details added to your patient-controlled connection. Clinical records will appear as your provider imports them.` : 'Your patient-controlled provider connection is ready.'}</p></div><button className={`text-xs font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`} onClick={() => setProviderConnectionNotice(null)}>Dismiss</button></div>}

        {receivedRequests.filter(r => !dismissedDashboardBanners.has(r.id)).map(req => (
          <div
            key={req.id}
            className={`mb-4 flex items-center gap-4 p-4 rounded-xl border transition-all ${
              darkMode
                ? 'bg-emerald-950/20 border-emerald-800/50'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              darkMode ? 'bg-emerald-900/40' : 'bg-emerald-100'
            }`}>
              <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
                Records received from {req.doctor_name || req.provider_name}
              </p>
              <p className={`text-xs mt-0.5 hidden sm:block ${darkMode ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
                Your requested health records are now available.
              </p>
            </div>
            <button
              onClick={() => { setCurrentPage('health-records'); setDismissedDashboardBanners(prev => new Set(prev).add(req.id)); }}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                darkMode
                  ? 'bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              View Records
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDismissedDashboardBanners(prev => new Set(prev).add(req.id))}
              className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                darkMode ? 'text-emerald-500 hover:bg-emerald-900/40' : 'text-emerald-400 hover:bg-emerald-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Medical ID Card - Takes 2/3 width on medium, 1/2 on large */}
          <div className="md:col-span-4 lg:col-span-6 lg:row-span-2">
            <div className="h-full">
              <MedicalIDCard darkMode={darkMode} />
            </div>
          </div>

          {/* Stats Grid - 2 columns on medium, wraps nicely */}
          <div className="md:col-span-3 lg:col-span-3">
            <HealthStatsCard
              icon={<FileText className="w-5 h-5" />}
              title="Health Records"
              value={String(dashboardStats.records)}
              subtitle={
                vaultStats && vaultStats.connectedProviders > 0
                  ? `${dashboardStats.records} total · ${vaultStats.connectedProviders} connected`
                  : vaultStats?.lastSyncedAt
                    ? `Last synced ${relativeTime(vaultStats.lastSyncedAt)}`
                    : dashboardStats.records === 0 ? 'No records yet' : `${dashboardStats.records} total`
              }
              iconBgColor="bg-indigo-50"
              iconColor="text-indigo-600"
              darkMode={darkMode}
            />
          </div>

          <div className="md:col-span-3 lg:col-span-3">
            <HealthStatsCard
              icon={<Activity className="w-5 h-5" />}
              title="Medical Forms"
              value={formsCount === null ? '—' : String(formsCount)}
              subtitle={formsCount ? `${formsCount} completed` : 'None completed yet'}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-600"
              darkMode={darkMode}
            />
          </div>

          <div className="md:col-span-3 lg:col-span-3">
            <HealthStatsCard
              icon={<Calendar className="w-5 h-5" />}
              title="Appointments"
              value={String(dashboardStats.appointments)}
              subtitle={dashboardStats.appointments === 0 ? 'None scheduled' : 'Upcoming'}
              iconBgColor="bg-amber-50"
              iconColor="text-amber-600"
              darkMode={darkMode}
            />
          </div>

          <div className="md:col-span-3 lg:col-span-3">
            <HealthStatsCard
              icon={<Pill className="w-5 h-5" />}
              title="Medications"
              value={String(dashboardStats.medications)}
              subtitle={dashboardStats.medications === 0 ? 'None on file' : 'On file'}
              iconBgColor="bg-rose-50"
              iconColor="text-rose-600"
              darkMode={darkMode}
            />
          </div>

          {/* Quick Actions - Takes full width on mobile, balanced on larger screens */}
          <div className="md:col-span-6 lg:col-span-12 flex h-full flex-col hv-surface-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-indigo-50 p-2 dark:bg-action-primary-subtle/30">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-action-primary" />
              </div>
              <h2 className="text-lg font-semibold text-content-primary">Quick Actions</h2>
            </div>
            <p className="text-sm mb-6 text-content-secondary">Common tasks to manage your health data</p>

            <div className="flex flex-col gap-3 mt-auto">
              <button
                onClick={() => setCurrentPage('medical-forms')}
                className="flex items-center justify-center gap-2 rounded-lg bg-action-primary px-5 py-3 text-sm font-medium text-content-on-action transition-all hover:-translate-y-0.5 hover:bg-action-primary-hover hover:shadow-lg hover:shadow-black/20"
              >
                <FileText className="w-4 h-4" />
                View Medical Forms
              </button>
              <button
                onClick={() => setCurrentPage('care')}
                className="flex items-center justify-between px-4 py-2.5 border border-stroke-default rounded-lg transition-all text-left group hover:-translate-y-0.5 hover:bg-action-secondary hover:border-stroke-strong hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-content-primary">
                  <Activity className="w-4 h-4" />
                  View Care History
                </div>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-content-tertiary group-hover:text-content-secondary" />
              </button>
              <button
                onClick={() => setIsAIPanelOpen(true)}
                className="flex items-center justify-between px-4 py-2.5 border border-stroke-default rounded-lg transition-all text-left group hover:-translate-y-0.5 hover:bg-action-secondary hover:border-stroke-strong hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-content-primary">
                  <Sparkles className="w-4 h-4" />
                  Ask the AI Assistant
                </div>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-content-tertiary group-hover:text-content-secondary" />
              </button>
            </div>
          </div>

          {/* Recent Activity - Balanced layout */}
          <div className="md:col-span-4 lg:col-span-9 flex h-full flex-col hv-surface-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-indigo-50 p-2 dark:bg-action-primary-subtle/30">
                <Activity className="h-5 w-5 text-indigo-600 dark:text-action-primary" />
              </div>
              <h2 className="text-lg font-semibold text-content-primary">Recent Activity</h2>
            </div>
            <p className="text-sm mb-6 text-content-secondary">Your latest health updates</p>

            <div className="space-y-3 flex-1">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-surface-sunken">
                    <Activity className="w-6 h-6 text-content-tertiary" />
                  </div>
                  <p className="text-sm text-content-secondary">No recent activity yet</p>
                  <p className="text-xs mt-1 text-content-tertiary">Records, requests, and medications will show up here.</p>
                </div>
              ) : (
                recentActivity.map(item => {
                  const cfg = item.kind === 'request'
                    ? { icon: <CheckCircle className="w-5 h-5" />, bg: 'bg-emerald-50', color: 'text-emerald-600' }
                    : item.kind === 'medication'
                      ? { icon: <Pill className="w-5 h-5" />, bg: 'bg-rose-50', color: 'text-rose-600' }
                      : { icon: <FileText className="w-5 h-5" />, bg: 'bg-indigo-50', color: 'text-indigo-600' };
                  return (
                    <RecentActivityItem
                      key={item.id}
                      icon={cfg.icon}
                      title={item.title}
                      subtitle={item.subtitle}
                      time={relativeTime(item.timestamp)}
                      iconBgColor={cfg.bg}
                      iconColor={cfg.color}
                      darkMode={darkMode}
                    />
                  );
                })
              )}
            </div>

            {recentActivity.length > 0 && (
              <button
                onClick={() => setCurrentPage('health-records')}
                className="group mt-6 flex items-center gap-2 text-sm font-medium text-action-primary transition-colors hover:text-action-primary-hover"
              >
                View All Activity
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <NourishedRebelInsights compact onOpen={() => { setWellnessInitialTab('insights'); setCurrentPage('wellness'); }} onAsk={(insightId) => { setAssistantWellnessInsightId(insightId); setCurrentPage('wellness'); setIsAIPanelOpen(true); }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Surface name="steel" className="h-dvh w-screen max-w-none min-h-0">
      <div
        data-theme={darkMode ? 'dark' : undefined}
        className="flex h-dvh w-screen bg-surface-page text-content-primary"
      >
      <DashboardSidebar
        onViewChange={onViewChange}
        onPageChange={(page) => {
          if (page === 'wellness') setWellnessInitialTab('diet');
          setCurrentPage(page);
          setIsMobileMenuOpen(false);
        }}
        currentPage={currentPage}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        profileRefreshKey={profileRefreshKey}
      />

      <div className="flex-1 flex overflow-hidden min-w-0 relative">
        <main data-steel-chrome="main" className="flex-1 overflow-y-auto min-w-0 relative bg-surface-page">
          {/* Mobile top bar — hamburger + centered logo */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center px-3 h-14 border-b border-stroke-subtle backdrop-blur-sm bg-surface-overlay/95">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 rounded-xl transition-all active:scale-95 text-content-primary hover:bg-action-secondary"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img
                src={darkMode ? '/hv_logo-dark.png' : '/hv_logo-light.png'}
                alt="Logo"
                className="h-7 w-auto object-contain"
              />
            </div>
          </div>

          {renderMainContent()}
        </main>

        {/* Floating AI Assistant Toggle Buttons */}
        {!isAIPanelOpen && (
          <FloatingChatActions
            onOpenChat={() => setIsAIPanelOpen(true)}
            darkMode={darkMode}
            context={currentPage as any}
          />
        )}

        {/* Mobile backdrop for AI panel */}
        {isAIPanelOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsAIPanelOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* AI Assistant Panel */}
        {isAIPanelOpen && (
          <aside
            className={`
              shrink-0 relative z-50 bg-transparent
              fixed lg:relative inset-y-0 right-0
              w-full lg:w-[33vw] lg:min-w-[400px]
              transition-transform duration-300 ease-in-out
              ${isAIPanelOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
          >
            <button
              onClick={() => setIsAIPanelOpen(false)}
              className="absolute top-6 right-6 z-10 flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-action-secondary active:scale-95 text-content-tertiary hover:text-content-primary"
              title="Close"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>

            <AIAssistantPanel
              darkMode={darkMode}
              currentPage={currentPage}
              wellnessInsightId={assistantWellnessInsightId}
              onAddCondition={() => medicalProfileActionsRef.current.openAddCondition?.()}
              onAddMedication={() => medicalProfileActionsRef.current.openAddMedication?.()}
              onAddAllergy={() => medicalProfileActionsRef.current.openAddAllergy?.()}
              onAddImmunization={() => medicalProfileActionsRef.current.openAddImmunization?.()}
              onAddCoverage={() => insuranceActionsRef.current.openAddCoverage?.()}
              onAddProvider={() => networkActionsRef.current.openAddProvider?.()}
              onAddPharmacy={() => networkActionsRef.current.openAddPharmacy?.()}
              onFindSpecialist={() => networkActionsRef.current.openFindSpecialist?.()}
              onRequestRecords={() => healthRecordsActionsRef.current.openRequestRecords?.()}
              startProviderConnection={providerConnectionRequested}
              onProviderConnectionStarted={() => setProviderConnectionRequested(false)}
              onRefreshData={async () => {
                if (medicalProfileActionsRef.current.refreshData) {
                  await medicalProfileActionsRef.current.refreshData();
                }
                if (insuranceActionsRef.current.refreshData) {
                  await insuranceActionsRef.current.refreshData();
                }
                if (networkActionsRef.current.refreshData) {
                  await networkActionsRef.current.refreshData();
                }
              }}
            />
          </aside>
        )}
      </div>
    </div>
    </Surface>
  );
}

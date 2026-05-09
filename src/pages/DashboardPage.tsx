import { FileText, Activity, Calendar, Pill, Heart, ArrowRight, Sparkles, Send, X, Home, Menu, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
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
import type { PageContext } from '../lib/voice/context-messages';

interface DashboardPageProps {
  onViewChange?: (view: 'health-vault' | 'design-system' | 'projects' | 'marketing') => void;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  care: 'Care History',
  'medical-forms': 'Medical Forms',
  'medical-profile': 'Medical Profile',
  network: 'Care Network',
  insurance: 'Insurance',
  'health-records': 'Health Records',
  vitals: 'Vitals',
};

export default function DashboardPage({ onViewChange }: DashboardPageProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
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
  const [dismissedDashboardBanners, setDismissedDashboardBanners] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissedRecordBanners');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
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

      const [profileRes, recordsRes, medsRes, apptRes] = await Promise.all([
        supabase.from('user_profiles').select('first_name').eq('user_id', userId).maybeSingle(),
        supabase.from('health_records').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('medications').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'scheduled'),
      ]);

      if (profileRes.data?.first_name) setUserFirstName(profileRes.data.first_name);
      setDashboardStats({
        records: recordsRes.count ?? 0,
        medications: medsRes.count ?? 0,
        appointments: apptRes.count ?? 0,
      });
    };
    loadUserData().catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderMainContent = () => {
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

    if (currentPage === 'vitals') {
      return (
        <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
          <div className="mb-8">
            <h1 className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>Vitals</h1>
            <p className={`mt-1 ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>Track your vital signs and health metrics</p>
          </div>

          <div className="flex flex-col items-center justify-center py-24">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              darkMode ? 'bg-stone-800' : 'bg-stone-100'
            }`}>
              <Activity className={`w-8 h-8 ${
                darkMode ? 'text-stone-400' : 'text-stone-500'
              }`} />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>Coming Soon</h2>
            <p className={`text-center max-w-md ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              We're working on bringing you powerful vitals tracking features. Stay tuned!
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12 relative">
        <div className="mb-8">
          <h1 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            <Home className="w-7 h-7" />
            Dashboard
          </h1>
          <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>
            Welcome back{userFirstName ? `, ${userFirstName}` : ''}! Here's your health overview.
          </p>
        </div>

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
              subtitle={dashboardStats.records === 0 ? 'No records yet' : `${dashboardStats.records} total`}
              iconBgColor="bg-indigo-50"
              iconColor="text-indigo-600"
              darkMode={darkMode}
            />
          </div>

          <div className="md:col-span-3 lg:col-span-3">
            <HealthStatsCard
              icon={<Activity className="w-5 h-5" />}
              title="Medical Forms"
              value="—"
              subtitle="View in Medical Forms"
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
          <div className={`md:col-span-6 lg:col-span-6 rounded-xl border p-6 h-full flex flex-col ${
            darkMode
              ? 'border-stone-800 bg-gradient-to-br from-stone-900/50 to-stone-900/30'
              : 'border-stone-200 bg-gradient-to-br from-white to-stone-50/50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>Quick Actions</h2>
            </div>
            <p className={`text-sm mb-6 ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>Common tasks to manage your health data</p>

            <div className="flex flex-col gap-3 mt-auto">
              <button className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-600/20 hover:-translate-y-0.5">
                <FileText className="w-4 h-4" />
                Download Medical Forms
              </button>
              <button className={`flex items-center justify-between px-4 py-2.5 border rounded-lg transition-all text-left group hover:-translate-y-0.5 ${
                darkMode
                  ? 'border-stone-700 hover:bg-stone-800 hover:border-stone-600'
                  : 'border-stone-200 hover:bg-white hover:border-stone-300 hover:shadow-md'
              }`}>
                <div className={`flex items-center gap-2 text-sm font-medium ${
                  darkMode ? 'text-stone-300' : 'text-stone-700'
                }`}>
                  <Activity className="w-4 h-4" />
                  View Care History
                </div>
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                  darkMode
                    ? 'text-stone-500 group-hover:text-stone-400'
                    : 'text-stone-400 group-hover:text-stone-600'
                }`} />
              </button>
              <button className={`flex items-center justify-between px-4 py-2.5 border rounded-lg transition-all text-left group hover:-translate-y-0.5 ${
                darkMode
                  ? 'border-stone-700 hover:bg-stone-800 hover:border-stone-600'
                  : 'border-stone-200 hover:bg-white hover:border-stone-300 hover:shadow-md'
              }`}>
                <div className={`flex items-center gap-2 text-sm font-medium ${
                  darkMode ? 'text-stone-300' : 'text-stone-700'
                }`}>
                  <Calendar className="w-4 h-4" />
                  Schedule Appointment
                </div>
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                  darkMode
                    ? 'text-stone-500 group-hover:text-stone-400'
                    : 'text-stone-400 group-hover:text-stone-600'
                }`} />
              </button>
            </div>
          </div>

          {/* Recent Activity - Balanced layout */}
          <div className={`md:col-span-6 lg:col-span-6 rounded-xl border p-6 h-full flex flex-col ${
            darkMode
              ? 'border-stone-800 bg-gradient-to-br from-stone-900/50 to-stone-900/30'
              : 'border-stone-200 bg-gradient-to-br from-white to-stone-50/50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>Recent Activity</h2>
            </div>
            <p className={`text-sm mb-6 ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>Your latest health updates</p>

            <div className="space-y-3 flex-1">
              <RecentActivityItem
                icon={<Heart className="w-5 h-5" />}
                title="Annual Physical Examination"
                subtitle="Completed with Dr. Sarah Johnson"
                time="2 days ago"
                iconBgColor="bg-rose-50"
                iconColor="text-rose-600"
                darkMode={darkMode}
              />
              <RecentActivityItem
                icon={<Activity className="w-5 h-5" />}
                title="Lab Results Updated"
                subtitle="Complete Blood Count (CBC) - Normal"
                time="5 days ago"
                iconBgColor="bg-emerald-50"
                iconColor="text-emerald-600"
                darkMode={darkMode}
              />
              <RecentActivityItem
                icon={<Pill className="w-5 h-5" />}
                title="Prescription Refilled"
                subtitle="Albuterol Inhaler - 3 refills remaining"
                time="1 week ago"
                iconBgColor="bg-indigo-50"
                iconColor="text-indigo-600"
                darkMode={darkMode}
              />
            </div>

            <button className="flex items-center gap-2 mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors group">
              View All Activity
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-dvh w-screen ${
      darkMode ? 'bg-stone-950' : 'bg-stone-50'
    }`}>
      <DashboardSidebar
        onViewChange={onViewChange}
        onPageChange={(page) => {
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
      />

      <div className="flex-1 flex overflow-hidden min-w-0 relative">
        <main className={`flex-1 overflow-y-auto min-w-0 relative ${
          darkMode
            ? 'bg-gradient-to-br from-stone-950 via-stone-950 to-stone-900'
            : 'bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50'
        }`}>
          {/* Mobile top bar — hamburger + centered logo */}
          <div className={`lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center px-3 h-14 border-b backdrop-blur-sm ${
            darkMode
              ? 'bg-stone-950/95 border-stone-800'
              : 'bg-white/95 border-stone-200'
          }`}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                darkMode ? 'text-white hover:bg-stone-800' : 'text-stone-700 hover:bg-stone-100'
              }`}
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
              shrink-0 relative bg-white z-50
              fixed lg:relative inset-y-0 right-0
              w-full lg:w-[33vw] lg:min-w-[400px]
              transition-transform duration-300 ease-in-out
              ${isAIPanelOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
          >
            <button
              onClick={() => setIsAIPanelOpen(false)}
              className="absolute top-6 right-6 z-10 flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-stone-100 active:scale-95 text-stone-500 hover:text-stone-700"
              title="Close"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>

            <AIAssistantPanel
              darkMode={darkMode}
              currentPage={currentPage}
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
  );
}

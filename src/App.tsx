import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { DesignSystemDemoShell } from './components/DesignSystemDemoShell';
import { Surface } from './providers/SurfaceProvider';
import { AdminPage } from './pages/AdminPage';
import { AccordionsPage } from './pages/AccordionsPage';
import { ActionFieldsPage } from './pages/ActionFieldsPage';
import { ColorsPage } from './pages/ColorsPage';
import { DatePickerPage } from './pages/DatePickerPage';
import DialogsPage from './pages/DialogsPage';
import { DrawersPage } from './pages/DrawersPage';
import { DropdownsPage } from './pages/DropdownsPage';
import { CheckboxesPage } from './pages/CheckboxesPage';
import { TypographyPage } from './pages/TypographyPage';
import { IconsPage } from './pages/IconsPage';
import { ButtonsPage } from './pages/ButtonsPage';
import { CardsPage } from './pages/CardsPage';
import { SegmentedControlPage } from './pages/SegmentedControlPage';
import { BreadcrumbsPage } from './pages/BreadcrumbsPage';
import { PrimaryNavigationPage } from './pages/PrimaryNavigationPage';
import { HeadersPage } from './pages/HeadersPage';
import { RadioButtonsPage } from './pages/RadioButtonsPage';
import { ProgressBarsPage } from './pages/ProgressBarsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PopupMenusPage } from './pages/PopupMenusPage';
import SearchPage from './pages/SearchPage';
import { ValidationPage } from './pages/ValidationPage';
import { TooltipsPage } from './pages/TooltipsPage';
import { TogglesPage } from './pages/TogglesPage';
import { TabsPage } from './pages/TabsPage';
import { TagsPage } from './pages/TagsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { SlidersPage } from './pages/SlidersPage';
import { SpinnersPage } from './pages/SpinnersPage';
import { StepperPage } from './pages/StepperPage';
import { ToolbarsPage } from './pages/ToolbarsPage';
import { WizardsPage } from './pages/WizardsPage';
import { TablesPage } from './pages/TablesPage';
import { LegacyNavigationPage } from './pages/LegacyNavigationPage';
import DashboardPage from './pages/DashboardPage';
import { MarketingSitePage } from './pages/MarketingSitePage';
import SecureShareLanding from './pages/SecureShareLanding';
import ProviderRecordSubmitPage from './pages/ProviderRecordSubmitPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingStartPage } from './pages/OnboardingStartPage';
import { OnboardingAccountPage } from './pages/OnboardingAccountPage';
import { OnboardingVerifyEmailPage } from './pages/OnboardingVerifyEmailPage';
import { OnboardingIdentityPage } from './pages/OnboardingIdentityPage';
import { OnboardingInsurancePage } from './pages/OnboardingInsurancePage';
import { OnboardingPreferencesPage } from './pages/OnboardingPreferencesPage';
import { OnboardingCompletePage } from './pages/OnboardingCompletePage';
import SuperAdminPage from './pages/SuperAdminPage';
import ProviderAdminPage from './pages/ProviderAdminPage';
import { OAuthConsentPage } from './pages/OAuthConsentPage';
import { supabase } from './lib/supabase';
import { parseSubdomain } from './lib/subdomain';

type AppView = 'design-system' | 'projects' | 'health-vault' | 'marketing' | 'login' | 'onboarding';

const SESSION_VIEW_KEY = 'hv-current-view';
const SESSION_DEMO_KEY = 'hv-demo-mode';
const SESSION_DS_SURFACE_KEY = 'hv-ds-surface-theme';
const SESSION_RETURN_TO_KEY = 'hv-return-to';
const SESSION_ONBOARDING_STEP_KEY = 'hv-onboarding-step';
const SESSION_DASHBOARD_PAGE_KEY = 'hv-dashboard-page';
const SESSION_MEDICAL_FORM_KEY = 'hv-medical-form';

type OnboardingStep = 'start' | 'account' | 'verify-email' | 'identity' | 'insurance' | 'preferences' | 'complete';

function isOnboardingStep(value: unknown): value is OnboardingStep {
  return ['start', 'account', 'verify-email', 'identity', 'insurance', 'preferences', 'complete'].includes(String(value));
}

function getRequestedOnboardingStep(): OnboardingStep {
  try {
    const requested = sessionStorage.getItem(SESSION_ONBOARDING_STEP_KEY);
    sessionStorage.removeItem(SESSION_ONBOARDING_STEP_KEY);
    if (isOnboardingStep(requested)) return requested;
  } catch {}
  return 'start';
}

type DesignSystemSurface = 'default' | 'bold' | 'steel';

function getSavedDesignSystemSurface(): DesignSystemSurface {
  try {
    const v = sessionStorage.getItem(SESSION_DS_SURFACE_KEY);
    if (v === 'bold' || v === 'default' || v === 'steel') return v;
  } catch {}
  return 'steel';
}

// Runs at module load time so sessionStorage is set before any useState reads it
const IS_DEMO_MODE = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const requestedApp = params.get('app');
    const requestedDashboard = window.location.pathname === '/dashboard';
    const returnTo = params.get('return_to');
    if (returnTo?.startsWith('/oauth/consent?authorization_id=')) {
      sessionStorage.setItem(SESSION_RETURN_TO_KEY, returnTo);
    }
    if (requestedApp === 'dashboard' || requestedApp === 'medical-forms' || requestedDashboard) {
      sessionStorage.removeItem(SESSION_DEMO_KEY);
      sessionStorage.setItem(SESSION_VIEW_KEY, 'health-vault');
      if (requestedApp === 'medical-forms') {
        sessionStorage.setItem(SESSION_DASHBOARD_PAGE_KEY, 'medical-forms');
        const requestedForm = params.get('form');
        if (requestedForm) sessionStorage.setItem(SESSION_MEDICAL_FORM_KEY, requestedForm);
      }
      window.history.replaceState({}, '', '/dashboard');
      return false;
    }
    if (requestedApp === 'marketing') {
      sessionStorage.removeItem(SESSION_DEMO_KEY);
      sessionStorage.setItem(SESSION_VIEW_KEY, 'marketing');
      return false;
    }
    if (requestedApp === 'onboarding') {
      sessionStorage.removeItem(SESSION_DEMO_KEY);
      sessionStorage.setItem(SESSION_VIEW_KEY, 'onboarding');
      const requestedStep = params.get('step');
      if (isOnboardingStep(requestedStep)) {
        sessionStorage.setItem(SESSION_ONBOARDING_STEP_KEY, requestedStep);
      }
      window.history.replaceState({}, '', window.location.pathname);
      return false;
    }
    if (params.has('demo')) {
      sessionStorage.setItem(SESSION_DEMO_KEY, 'true');
      sessionStorage.setItem(SESSION_VIEW_KEY, 'health-vault');
      window.history.replaceState({}, '', window.location.pathname);
      return true;
    }
    return sessionStorage.getItem(SESSION_DEMO_KEY) === 'true';
  } catch {
    return false;
  }
})();

function getSavedView(): AppView {
  try {
    const saved = sessionStorage.getItem(SESSION_VIEW_KEY) as AppView | null;
    if (saved && ['design-system', 'projects', 'health-vault', 'marketing', 'login', 'onboarding'].includes(saved)) {
      return saved;
    }
  } catch {}
  return 'marketing';
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>(getSavedView);
  const [designSystemSurface, setDesignSystemSurface] = useState<DesignSystemSurface>(getSavedDesignSystemSurface);
  const [currentPage, setCurrentPage] = useState<string>('accordions');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(getRequestedOnboardingStep);
  const [onboardingEmail, setOnboardingEmail] = useState<string>('');
  const [authState, setAuthState] = useState(() => ({
    isAuthenticated: IS_DEMO_MODE,
    authChecked: IS_DEMO_MODE,
    onboardingComplete: IS_DEMO_MODE,
    onboardingChecked: IS_DEMO_MODE
  }));

  const initializingRef = useRef(false);
  const authSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_VIEW_KEY, currentView);
    } catch {}
  }, [currentView]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_DS_SURFACE_KEY, designSystemSurface);
    } catch {}
  }, [designSystemSurface]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_DEMO_KEY) === 'true') return;
    if (
      authState.authChecked &&
      !authState.isAuthenticated &&
      (currentView === 'health-vault' || currentView === 'design-system' || currentView === 'projects')
    ) {
      setCurrentView(currentView === 'health-vault' ? 'login' : 'marketing');
    }
  }, [authState.isAuthenticated, authState.authChecked, currentView]);

  useEffect(() => {
    if (
      currentView === 'onboarding' &&
      authState.authChecked &&
      !authState.isAuthenticated &&
      ['identity', 'insurance', 'preferences', 'complete'].includes(onboardingStep)
    ) {
      setOnboardingStep('start');
    }
  }, [authState.authChecked, authState.isAuthenticated, currentView, onboardingStep]);

  useEffect(() => {
    if (
      authState.authChecked &&
      authState.onboardingChecked &&
      authState.isAuthenticated &&
      authState.onboardingComplete &&
      currentView === 'marketing' &&
      window.location.pathname === '/' &&
      new URLSearchParams(window.location.search).get('app') !== 'marketing'
    ) {
      setCurrentView('health-vault');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [authState, currentView]);

  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const initialize = async () => {
      if (sessionStorage.getItem(SESSION_DEMO_KEY) === 'true') return;
      const { data: { session } } = await supabase.auth.getSession();
      const authenticated = !!session;

      let onboardingComplete = false;
      if (authenticated && session?.user?.id) {
        try {
          const userId = session.user.id;
          const { data } = await supabase
            .from('user_profiles')
            .select('onboarding_complete')
            .eq('user_id', userId)
            .maybeSingle();

          onboardingComplete = data?.onboarding_complete || false;
        } catch (error) {
          console.error('Failed to check onboarding status:', error);
        }
      }

      setAuthState({
        isAuthenticated: authenticated,
        authChecked: true,
        onboardingComplete,
        onboardingChecked: true
      });
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (sessionStorage.getItem(SESSION_DEMO_KEY) === 'true') return;
      const authenticated = !!session;

      if (!authenticated) {
        setAuthState({
          isAuthenticated: false,
          authChecked: true,
          onboardingComplete: false,
          onboardingChecked: true
        });
        return;
      }

      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        authChecked: true
      }));

      (async () => {
        try {
          const userId = session!.user.id;
          const { data } = await supabase
            .from('user_profiles')
            .select('onboarding_complete')
            .eq('user_id', userId)
            .maybeSingle();

          setAuthState({
            isAuthenticated: true,
            authChecked: true,
            onboardingComplete: data?.onboarding_complete || false,
            onboardingChecked: true
          });
        } catch (error) {
          console.error('Failed to check onboarding status:', error);
          setAuthState({
            isAuthenticated: true,
            authChecked: true,
            onboardingComplete: false,
            onboardingChecked: true
          });
        }
      })();
    });

    authSubscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleViewChange = (view: 'design-system' | 'projects' | 'health-vault' | 'marketing' | 'login' | 'onboarding', skipOnboarding = false) => {
    if (view === currentView) return;

    if (view === 'health-vault' || view === 'design-system' || view === 'projects') {
      if (!authState.isAuthenticated) {
        if (currentView !== 'login') {
          setCurrentView('login');
        }
        return;
      }
      if (!authState.onboardingComplete && view === 'health-vault' && !skipOnboarding) {
        if (currentView !== 'onboarding') {
          setCurrentView('onboarding');
          setOnboardingStep('start');
        }
        return;
      }
    }
    setCurrentView(view);
    if (view === 'health-vault' && window.location.pathname !== '/dashboard') {
      window.history.pushState({}, '', '/dashboard');
    } else if (view === 'marketing') {
      window.history.pushState({}, '', '/?app=marketing');
    }
    if (view === 'projects') {
      setCurrentProjectId(null);
    }
  };

  const handleDirectHealthVaultAccess = () => {
    handleViewChange('health-vault');
  };

  const handleMarketingLogout = async () => {
    await supabase.auth.signOut();
    try {
      sessionStorage.removeItem(SESSION_VIEW_KEY);
      sessionStorage.removeItem(SESSION_DEMO_KEY);
    } catch {}
    setAuthState({
      isAuthenticated: false,
      authChecked: true,
      onboardingComplete: false,
      onboardingChecked: true
    });
    setCurrentView('marketing');
    window.history.replaceState({}, '', '/?app=marketing');
  };

  const handleLoginSuccess = () => {
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: true,
      authChecked: true
    }));

    setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error('No user session');
        }

        const userId = session.user.id;
        const { data } = await supabase
          .from('user_profiles')
          .select('onboarding_complete')
          .eq('user_id', userId)
          .maybeSingle();

        const onboardingComplete = data?.onboarding_complete || false;

        setAuthState({
          isAuthenticated: true,
          authChecked: true,
          onboardingComplete,
          onboardingChecked: true
        });

        if (onboardingComplete) {
          setCurrentView('health-vault');
          window.history.replaceState({}, '', '/dashboard');
        } else {
          setCurrentView('onboarding');
          setOnboardingStep('start');
        }
      } catch (error) {
        console.error('Failed to check onboarding:', error);
        setAuthState({
          isAuthenticated: true,
          authChecked: true,
          onboardingComplete: false,
          onboardingChecked: true
        });
        setCurrentView('onboarding');
        setOnboardingStep('start');
      }
    }, 0);
  };

  const handleLoginCancel = () => {
    setCurrentView('marketing');
    if (window.location.pathname === '/dashboard') {
      window.history.replaceState({}, '', '/');
    }
  };

  const handleProjectOpen = (projectId: string) => {
    setCurrentProjectId(projectId);
  };

  const handleProjectBack = () => {
    setCurrentProjectId(null);
  };

  const renderPage = () => {
    if (currentView === 'login') {
      return <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onCancel={handleLoginCancel}
        onCreateAccount={() => {
          setCurrentView('onboarding');
          setOnboardingStep('start');
        }}
      />;
    }

    if (currentView === 'onboarding') {
      switch (onboardingStep) {
        case 'start':
          return <OnboardingStartPage onNext={() => setOnboardingStep('account')} onBack={() => setCurrentView('marketing')} />;
        case 'account':
          return <OnboardingAccountPage
            onNext={(email) => {
              setOnboardingEmail(email);
              setOnboardingStep('verify-email');
            }}
            onBack={() => setCurrentView('marketing')}
          />;
        case 'verify-email':
          return <OnboardingVerifyEmailPage
            email={onboardingEmail}
            onNext={() => setOnboardingStep('identity')}
            onBack={() => setOnboardingStep('account')}
          />;
        case 'identity':
          return <OnboardingIdentityPage
            onNext={() => setOnboardingStep('insurance')}
            onBack={() => setOnboardingStep('verify-email')}
          />;
        case 'insurance':
          return <OnboardingInsurancePage
            onNext={() => setOnboardingStep('preferences')}
            onBack={() => setOnboardingStep('identity')}
            onSkip={() => setOnboardingStep('preferences')}
          />;
        case 'preferences':
          return <OnboardingPreferencesPage
            onNext={() => setOnboardingStep('complete')}
            onBack={() => setOnboardingStep('insurance')}
            onSkip={() => setOnboardingStep('complete')}
          />;
        case 'complete':
          return <OnboardingCompletePage
            onGoToDashboard={() => {
              setAuthState(prev => ({
                ...prev,
                onboardingComplete: true
              }));
              const returnTo = sessionStorage.getItem(SESSION_RETURN_TO_KEY);
              if (returnTo?.startsWith('/oauth/consent?authorization_id=')) {
                sessionStorage.removeItem(SESSION_RETURN_TO_KEY);
                window.location.assign(returnTo);
                return;
              }
              setCurrentView('health-vault');
            }}
          />;
        default:
          return <OnboardingStartPage onNext={() => setOnboardingStep('account')} onBack={() => setCurrentView('marketing')} />;
      }
    }

    if (currentView === 'health-vault') {
      return <DashboardPage onViewChange={handleViewChange} />;
    }

    if (currentView === 'marketing') {
      return <MarketingSitePage
        onViewChange={handleViewChange}
        onLoginClick={() => setCurrentView('login')}
        onLogoutClick={handleMarketingLogout}
        onStartOnboarding={() => {
          setCurrentView('onboarding');
          setOnboardingStep('start');
        }}
        onDirectHealthVaultAccess={handleDirectHealthVaultAccess}
        isAuthenticated={authState.isAuthenticated}
      />;
    }

    if (currentView === 'projects') {
      if (currentProjectId) {
        return <ProjectDetailPage projectId={currentProjectId} onBack={handleProjectBack} />;
      }
      return <ProjectsPage onProjectOpen={handleProjectOpen} />;
    }

    const designSystemContent = (() => {
      switch (currentPage) {
        case 'accordions':
          return <AccordionsPage />;
        case 'action-fields':
          return <ActionFieldsPage />;
        case 'breadcrumbs':
          return <BreadcrumbsPage />;
        case 'buttons':
          return <ButtonsPage />;
        case 'cards':
          return <CardsPage />;
        case 'checkboxes':
          return <CheckboxesPage />;
        case 'colors':
          return <ColorsPage />;
        case 'date-picker':
          return <DatePickerPage />;
        case 'dialogs':
          return <DialogsPage />;
        case 'drawers':
          return <DrawersPage />;
        case 'dropdowns':
          return <DropdownsPage />;
        case 'headers':
          return <HeadersPage />;
        case 'icons':
          return <IconsPage />;
        case 'notifications':
          return <NotificationsPage />;
        case 'popup-menus':
          return <PopupMenusPage />;
        case 'primary-navigation':
          return <PrimaryNavigationPage />;
        case 'legacy-navigation':
          return <LegacyNavigationPage />;
        case 'progress-bars':
          return <ProgressBarsPage />;
        case 'radio-buttons':
          return <RadioButtonsPage />;
        case 'search':
          return <SearchPage />;
        case 'segmented-control':
          return <SegmentedControlPage />;
        case 'sliders':
          return <SlidersPage />;
        case 'spinners':
          return <SpinnersPage />;
        case 'stepper':
          return <StepperPage />;
        case 'tabs':
          return <TabsPage />;
        case 'tables':
          return <TablesPage />;
        case 'toolbars':
          return <ToolbarsPage />;
        case 'tags':
          return <TagsPage />;
        case 'toggles':
          return <TogglesPage />;
        case 'tooltips':
          return <TooltipsPage />;
        case 'typography':
          return <TypographyPage />;
        case 'validation':
          return <ValidationPage />;
        case 'wizards':
          return <WizardsPage />;
        case 'admin':
          return <AdminPage />;
        default:
          return <AccordionsPage />;
      }
    })();

    return <DesignSystemDemoShell>{designSystemContent}</DesignSystemDemoShell>;
  };

  const isShareRoute = window.location.pathname.startsWith('/share/');
  if (isShareRoute) {
    return <SecureShareLanding />;
  }

  const isRecordRequestRoute = window.location.pathname.startsWith('/record-request/');
  if (isRecordRequestRoute) {
    return <ProviderRecordSubmitPage />;
  }

  if (window.location.pathname === '/oauth/consent') {
    return <OAuthConsentPage />;
  }

  const subdomainInfo = parseSubdomain();
  if (subdomainInfo.isSuperAdmin && window.location.pathname === '/admin') {
    return <SuperAdminPage />;
  }

  if (subdomainInfo.isProvider) {
    return <ProviderAdminPage />;
  }

  const layoutShellClass =
    currentView === 'health-vault' || currentView === 'marketing' || currentView === 'login' || currentView === 'onboarding'
      ? 'w-screen max-w-none'
      : 'flex min-h-screen min-w-0 w-full bg-surface-page';

  const showSidebar =
    currentView !== 'health-vault' &&
    currentView !== 'marketing' &&
    currentView !== 'login' &&
    currentView !== 'onboarding' &&
    !currentProjectId;

  const shellInner = (
    <>
      {showSidebar && (
        <Sidebar
          currentPage={currentPage}
          currentView={currentView}
          onNavigate={setCurrentPage}
          onViewChange={handleViewChange}
          designSystemSurface={designSystemSurface}
          onDesignSystemSurfaceChange={setDesignSystemSurface}
        />
      )}
      {renderPage()}
    </>
  );

  /* Steel / bold / default surfaces apply only inside the design-system gallery,
   * or inside the Health Vault app (DashboardPage wraps itself in <Surface name="steel">).
   * Marketing, login, and onboarding stay on the global default tokens — do not wrap them in Surface. */
  const useSurfaceRoot = currentView === 'design-system';

  return useSurfaceRoot ? (
    <Surface name={designSystemSurface} className={layoutShellClass}>
      {shellInner}
    </Surface>
  ) : (
    <div className={layoutShellClass}>{shellInner}</div>
  );
}

export default App;

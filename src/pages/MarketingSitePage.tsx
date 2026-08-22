import { useState, useRef, useEffect } from 'react';
import { Menu, Shield, Target, Lightbulb, Lock, Users, Database, FileText, TrendingUp, BarChart3, PieChart, Heart, Code, Package, Zap, CheckCircle2, ExternalLink, Eye, Key, Wallet, Coins, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { MarketingSidebar } from '../components/MarketingSidebar';
import { MarketingHeader } from '../components/MarketingHeader';
import { MarketingFooter } from '../components/MarketingFooter';
import { MarketingHomePage } from './MarketingHomePage';
import { ProvidersPage } from './ProvidersPage';
import { PricingPage } from './PricingPage';
import { PersonalHealthVaultPage } from './PersonalHealthVaultPage';

interface MarketingSitePageProps {
  onViewChange?: (view: 'health-vault' | 'design-system' | 'projects' | 'marketing') => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onStartOnboarding?: () => void;
  onDirectHealthVaultAccess?: () => void;
  isAuthenticated?: boolean;
}

export function MarketingSitePage({ onViewChange, onLoginClick, onLogoutClick, onStartOnboarding, onDirectHealthVaultAccess, isAuthenticated = false }: MarketingSitePageProps) {
  const [currentPage, setCurrentPage] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <MarketingHomePage darkMode={darkMode} onNavigate={setCurrentPage} onGetStarted={onStartOnboarding} />;
      case 'providers':
        return <ProvidersPage darkMode={darkMode} onNavigate={setCurrentPage} />;
      case 'pricing':
        return <PricingPage darkMode={darkMode} onNavigate={setCurrentPage} onStartOnboarding={onStartOnboarding} />;
      case 'personal-health-vault':
        return <PersonalHealthVaultPage darkMode={darkMode} />;
      case 'whitepaper':
        return (
          <div className={`flex-1 overflow-y-auto ${
            darkMode ? 'bg-surface-raised' : 'bg-white'
          }`}>
            {/* Hero Section */}
            <div className="relative isolate overflow-hidden">
              {/* Grid pattern background */}
              <svg
                aria-hidden="true"
                className={`absolute inset-0 -z-10 h-full w-full ${
                  darkMode
                    ? 'stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]'
                    : 'stroke-subtle [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]'
                }`}
              >
                <defs>
                  <pattern
                    id="whitepaper-grid-pattern"
                    width="200"
                    height="200"
                    x="50%"
                    y="-1"
                    patternUnits="userSpaceOnUse"
                  >
                    <path d="M.5 200V.5H200" fill="none" />
                  </pattern>
                </defs>
                <svg x="50%" y="-1" className={`overflow-visible ${darkMode ? 'fill-hv-neutral-800/20' : 'fill-surface-sunken'}`}>
                  <path
                    d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                    strokeWidth="0"
                  />
                </svg>
                <rect width="100%" height="100%" strokeWidth="0" fill="url(#whitepaper-grid-pattern)" />
              </svg>

              {/* Background gradient blur effect - top */}
              <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                <div
                  style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                  className={`relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] ${
                    darkMode ? 'opacity-20' : 'opacity-30'
                  }`}
                />
              </div>

              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl py-16 sm:py-32 lg:py-40">
                  {/* Announcement banner */}
                  <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                    <div className={`relative rounded-full px-3 py-1 text-sm/6 ring-1 ${
                      darkMode
                        ? 'text-content-secondary ring-white/10'
                        : 'text-content-secondary ring-stroke-subtle/40'
                    }`}>
                      Empowering health data ownership worldwide.
                    </div>
                  </div>

                  {/* Hero content */}
                  <div className="text-center">
                    <h1 className="text-6xl font-semibold tracking-tight text-balance sm:text-9xl">
                      <span
                        className="inline-block bg-clip-text text-transparent"
                        style={{
                          backgroundImage: 'linear-gradient(90deg, #5B9FFF 0%, #9D7DFF 35%, #E961FF 70%, #FF6B9D 100%)'
                        }}
                      >
                        Health Vault Technical Whitepaper
                      </span>
                    </h1>
                    <p className={`mt-8 text-lg font-medium text-pretty sm:text-xl/8 ${
                      darkMode ? 'text-content-secondary' : 'text-content-secondary'
                    }`}>
                      A decentralized health data ecosystem built to give people ownership of their most valuable asset — their health information. Powered by AI and blockchain, transforming personal and family medical data into actionable insights.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                      <a href="#" className={`rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                        darkMode
                          ? 'bg-indigo-500 hover:bg-indigo-400 focus-visible:outline-indigo-500'
                          : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600'
                      }`}>
                        Download PDF
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background gradient blur effect - bottom */}
              <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                <div
                  style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                  className={`relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] ${
                    darkMode ? 'opacity-20' : 'opacity-30'
                  }`}
                />
              </div>
            </div>

            {/* Whitepaper content */}
            <div className={`${darkMode ? 'bg-surface-raised' : 'bg-white'} py-24 sm:py-32`} id="abstract">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Combined Section Header */}
                <div className="mx-auto max-w-2xl lg:text-center mb-16">
                  <h2 className={`text-base/7 font-semibold ${
                    darkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`}>The Health Data Revolution</h2>
                  <p className={`mt-2 text-4xl font-semibold tracking-tight text-pretty sm:text-5xl lg:text-balance ${
                    darkMode ? 'text-white' : 'text-content-primary'
                  }`}>
                    Reclaiming ownership of your most valuable asset
                  </p>
                  <p className={`mt-6 text-lg/8 ${
                    darkMode ? 'text-content-primary' : 'text-content-secondary'
                  }`}>
                    Health Vault is a decentralized health data ecosystem built to give people ownership of their health information. Powered by AI and blockchain, we transform personal and family medical data into actionable insights that improve health outcomes and drive preventive care.
                  </p>
                </div>

                {/* Three Column Feature Grid - The Problem */}
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                  <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                    {/* Problem 1 */}
                    <div className="flex flex-col">
                      <dt className="flex flex-col gap-y-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset w-fit ${
                          darkMode
                            ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                            : 'bg-red-50 text-red-700 ring-red-600/10'
                        }`}>
                          PROBLEM
                        </span>
                        <div className={`flex items-center gap-x-3 text-base/7 font-semibold ${
                          darkMode ? 'text-white' : 'text-content-primary'
                        }`}>
                          <Database className={`h-5 w-5 flex-none ${
                            darkMode ? 'text-red-400' : 'text-red-600'
                          }`} />
                          Fragmented Data
                        </div>
                      </dt>
                      <dd className={`mt-4 flex flex-auto flex-col text-base/7 ${
                        darkMode ? 'text-content-primary' : 'text-content-secondary'
                      }`}>
                        <p className="flex-auto">Your medical history is scattered across multiple systems, with no unified control. Healthcare data lives in silos, making it nearly impossible to get a complete picture of your health.</p>
                      </dd>
                    </div>

                    {/* Problem 2 */}
                    <div className="flex flex-col">
                      <dt className="flex flex-col gap-y-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset w-fit ${
                          darkMode
                            ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                            : 'bg-red-50 text-red-700 ring-red-600/10'
                        }`}>
                          PROBLEM
                        </span>
                        <div className={`flex items-center gap-x-3 text-base/7 font-semibold ${
                          darkMode ? 'text-white' : 'text-content-primary'
                        }`}>
                          <AlertCircle className={`h-5 w-5 flex-none ${
                            darkMode ? 'text-red-400' : 'text-red-600'
                          }`} />
                          Lost Value
                        </div>
                      </dt>
                      <dd className={`mt-4 flex flex-auto flex-col text-base/7 ${
                        darkMode ? 'text-content-primary' : 'text-content-secondary'
                      }`}>
                        <p className="flex-auto">Healthcare companies profit from your data and your care — but you get none of the value back. Your health information generates billions in revenue for others while you remain uncompensated.</p>
                      </dd>
                    </div>

                    {/* Problem 3 */}
                    <div className="flex flex-col">
                      <dt className="flex flex-col gap-y-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset w-fit ${
                          darkMode
                            ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                            : 'bg-red-50 text-red-700 ring-red-600/10'
                        }`}>
                          PROBLEM
                        </span>
                        <div className={`flex items-center gap-x-3 text-base/7 font-semibold ${
                          darkMode ? 'text-white' : 'text-content-primary'
                        }`}>
                          <TrendingUp className={`h-5 w-5 flex-none ${
                            darkMode ? 'text-red-400' : 'text-red-600'
                          }`} />
                          Reactive Systems
                        </div>
                      </dt>
                      <dd className={`mt-4 flex flex-auto flex-col text-base/7 ${
                        darkMode ? 'text-content-primary' : 'text-content-secondary'
                      }`}>
                        <p className="flex-auto">Fragmented tools fail–leaving insights, trends, and predictions trapped. Healthcare remains reactive instead of preventive, treating problems after they emerge rather than preventing them.</p>
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* The Opportunity Section */}
                <div className={`mt-32 rounded-3xl p-12 lg:p-16 ${
                  darkMode
                    ? 'bg-surface-sunken ring-1 ring-stroke-default'
                    : 'bg-gradient-to-br from-indigo-50 to-blue-50'
                }`}>
                  <div className="mx-auto max-w-2xl lg:text-center">
                    <div className="flex items-center justify-center gap-x-3 mb-6">
                      <Lightbulb className={`h-8 w-8 ${
                        darkMode ? 'text-amber-400' : 'text-amber-600'
                      }`} />
                      <h2 className={`text-3xl font-semibold tracking-tight sm:text-4xl ${
                        darkMode ? 'text-white' : 'text-content-primary'
                      }`}>The Opportunity</h2>
                    </div>
                    <p className={`mt-6 text-lg/8 ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>
                      Imagine having your entire health history, wearable data, and family health trends encrypted in one secure, private vault — owned entirely by you.
                    </p>
                    <p className={`mt-6 text-lg/8 ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>
                      AI models inside Health Vault can recognize early warning signs, optimize nutrition, and flag hereditary risks when families link their vaults.
                    </p>
                    <p className={`mt-8 text-xl font-semibold ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>
                      It's more than convenience — it's a new architecture for human health intelligence.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Vision Section */}
            <div className={`${darkMode ? 'bg-surface-raised' : 'bg-white'} py-16 sm:py-20`}>
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Vision Header */}
                <div className="mx-auto max-w-2xl lg:text-center mb-16">
                  <h2 className={`text-base/7 font-semibold ${
                    darkMode ? 'text-rose-400' : 'text-rose-600'
                  }`}>Our Vision</h2>
                  <p className={`mt-2 text-4xl font-semibold tracking-tight text-pretty sm:text-5xl lg:text-balance ${
                    darkMode ? 'text-white' : 'text-content-primary'
                  }`}>
                    To return ownership and value to the individual
                  </p>
                  <p className={`mt-6 text-lg/8 ${
                    darkMode ? 'text-content-primary' : 'text-content-secondary'
                  }`}>
                    Accelerating breakthroughs in preventive care. We believe that when people control their data, the whole world benefits.
                  </p>
                </div>

                {/* Bento Grid - Four Cards */}
                <div className="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-2">
                  {/* Card 1: Earn HVLT Tokens */}
                  <div className="relative">
                    <div className={`absolute inset-px rounded-lg ${
                      darkMode ? 'bg-surface-sunken' : 'bg-white'
                    }`}></div>
                    <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                      <div className="px-8 pt-8 pb-8">
                        <div className="flex items-center gap-x-3 mb-4 flex-wrap">
                          <TrendingUp className={`h-6 w-6 ${
                            darkMode ? 'text-emerald-400' : 'text-emerald-600'
                          }`} />
                          <p className={`text-lg font-medium tracking-tight ${
                            darkMode ? 'text-white' : 'text-content-primary'
                          }`}>Earn HVLT Tokens</p>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            June 2027
                          </span>
                        </div>
                        <p className={`text-sm/6 ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>
                          Empower users to earn HVLT Tokens for completing health actions or sharing verified data.
                        </p>
                      </div>
                    </div>
                    <div className={`pointer-events-none absolute inset-px rounded-lg shadow-sm ${
                      darkMode ? 'outline outline-white/15' : 'outline outline-black/5'
                    }`}></div>
                  </div>

                  {/* Card 2: Family Insights */}
                  <div className="relative">
                    <div className={`absolute inset-px rounded-lg ${
                      darkMode ? 'bg-surface-sunken' : 'bg-white'
                    }`}></div>
                    <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                      <div className="px-8 pt-8 pb-8">
                        <div className="flex items-center gap-x-3 mb-4">
                          <Users className={`h-6 w-6 ${
                            darkMode ? 'text-blue-400' : 'text-blue-600'
                          }`} />
                          <p className={`text-lg font-medium tracking-tight ${
                            darkMode ? 'text-white' : 'text-content-primary'
                          }`}>Family Insights</p>
                        </div>
                        <p className={`text-sm/6 ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>
                          Give families predictive insights through linked vaults for hereditary risk detection.
                        </p>
                      </div>
                    </div>
                    <div className={`pointer-events-none absolute inset-px rounded-lg shadow-sm ${
                      darkMode ? 'outline outline-white/15' : 'outline outline-black/5'
                    }`}></div>
                  </div>

                  {/* Card 3: Secure Data Sharing */}
                  <div className="relative">
                    <div className={`absolute inset-px rounded-lg ${
                      darkMode ? 'bg-surface-sunken' : 'bg-white'
                    }`}></div>
                    <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                      <div className="px-8 pt-8 pb-8">
                        <div className="flex items-center gap-x-3 mb-4">
                          <Lock className={`h-6 w-6 ${
                            darkMode ? 'text-indigo-400' : 'text-indigo-600'
                          }`} />
                          <p className={`text-lg font-medium tracking-tight ${
                            darkMode ? 'text-white' : 'text-content-primary'
                          }`}>Secure Data Sharing</p>
                        </div>
                        <p className={`text-sm/6 ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>
                          Offer secure and on-demand secure, consent-based access to anonymized data.
                        </p>
                      </div>
                    </div>
                    <div className={`pointer-events-none absolute inset-px rounded-lg shadow-sm ${
                      darkMode ? 'outline outline-white/15' : 'outline outline-black/5'
                    }`}></div>
                  </div>

                  {/* Card 4: Ethical AI */}
                  <div className="relative">
                    <div className={`absolute inset-px rounded-lg ${
                      darkMode ? 'bg-surface-sunken' : 'bg-white'
                    }`}></div>
                    <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                      <div className="px-8 pt-8 pb-8">
                        <div className="flex items-center gap-x-3 mb-4">
                          <Zap className={`h-6 w-6 ${
                            darkMode ? 'text-violet-400' : 'text-violet-600'
                          }`} />
                          <p className={`text-lg font-medium tracking-tight ${
                            darkMode ? 'text-white' : 'text-content-primary'
                          }`}>Ethical AI</p>
                        </div>
                        <p className={`text-sm/6 ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>
                          Use AI ethically — transparent, explainable, and privacy-first in all operations.
                        </p>
                      </div>
                    </div>
                    <div className={`pointer-events-none absolute inset-px rounded-lg shadow-sm ${
                      darkMode ? 'outline outline-white/15' : 'outline outline-black/5'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue with remaining sections */}
            <div className={`${darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'}`}>
              <div className="max-w-4xl mx-auto px-6 py-16">

              {/* The Health Vault App */}
              <div className={`rounded-2xl border p-8 mb-8 shadow-sm ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                <div className="flex items-start gap-3 mb-6">
                  <Heart className="w-5 h-5 text-rose-600 mt-1" />
                  <h2 className={`text-xl font-semibold tracking-tight ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>The Health Vault App</h2>
                </div>
                <p className={`mb-6 text-base/7 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>
                  A modern, secure interface where users can take control of their health journey.
                </p>

                {/* Two Column Features */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
                          1
                        </div>
                        <div>
                          <h4 className={`font-semibold mb-1 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Create Your Personal Vault</h4>
                          <p className={`text-sm/6 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>Store your medical records and own your health data.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
                          2
                        </div>
                        <div>
                          <h4 className={`font-semibold mb-1 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Sync Medical Data</h4>
                          <p className={`text-sm/6 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>Connect medical records, wearables, and lab results to one place.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
                          3
                        </div>
                        <div>
                          <h4 className={`font-semibold mb-1 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>AI-Driven Insights</h4>
                          <p className={`text-sm/6 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>View personalized insights about wellness, test factors, and care recommendations.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
                          4
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold ${
                              darkMode ? 'text-white' : 'text-content-primary'
                            }`}>Earn HVLT Tokens</h4>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              June 2027
                            </span>
                          </div>
                          <p className={`text-sm/6 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>Get rewarded for participation, consistency, and verified data contributions.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
                          5
                        </div>
                        <div>
                          <h4 className={`font-semibold mb-1 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Family Vaults</h4>
                          <p className={`text-sm/6 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>Linking family members unlocks advanced prediction models that can identify shared genetic and lifestyle patterns before a condition manifests.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
                          6
                        </div>
                        <div>
                          <h4 className={`font-semibold mb-1 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Family Insights</h4>
                          <p className={`text-sm/6 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>Linking family members unlocks advanced prediction models that can identify shared genetic and lifestyle patterns before a condition manifests.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HVLT Token Overview */}
              <div className={`rounded-2xl border p-8 mb-8 shadow-sm ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                <div className="flex items-start gap-3 mb-6">
                  <BarChart3 className="w-5 h-5 text-indigo-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className={`text-xl font-semibold tracking-tight ${
                        darkMode ? 'text-white' : 'text-content-primary'
                      }`}>HVLT Token Overview</h2>
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Launch: June 2027
                      </span>
                    </div>
                  </div>
                </div>

                {/* Token Details Table */}
                <div className="mb-8">
                  <div className={`grid grid-cols-2 gap-px rounded-lg overflow-hidden ${
                    darkMode
                      ? 'bg-surface-sunken border border-stroke-default'
                      : 'bg-surface-overlay border border-stroke-subtle'
                  }`}>
                    <div className={`p-4 font-medium ${
                      darkMode ? 'bg-surface-sunken text-white' : 'bg-white text-content-primary'
                    }`}>Detail</div>
                    <div className={`p-4 font-medium ${
                      darkMode ? 'bg-surface-sunken text-white' : 'bg-white text-content-primary'
                    }`}>Description</div>

                    <div className={`p-4 text-sm ${
                      darkMode ? 'bg-surface-sunken/50 text-content-secondary' : 'bg-surface-sunken text-content-primary'
                    }`}>Name</div>
                    <div className={`p-4 text-sm font-medium ${
                      darkMode ? 'bg-surface-sunken/50 text-white' : 'bg-surface-sunken text-content-primary'
                    }`}>Health Vault Token</div>

                    <div className={`p-4 text-sm ${
                      darkMode ? 'bg-surface-sunken text-content-secondary' : 'bg-white text-content-primary'
                    }`}>Symbol</div>
                    <div className={`p-4 text-sm font-medium ${
                      darkMode ? 'bg-surface-sunken text-white' : 'bg-white text-content-primary'
                    }`}>HVLT</div>

                    <div className={`p-4 text-sm ${
                      darkMode ? 'bg-surface-sunken/50 text-content-secondary' : 'bg-surface-sunken text-content-primary'
                    }`}>Network</div>
                    <div className={`p-4 text-sm font-medium ${
                      darkMode ? 'bg-surface-sunken/50 text-white' : 'bg-surface-sunken text-content-primary'
                    }`}>Polygon (Matic) on solana soon</div>

                    <div className={`p-4 text-sm ${
                      darkMode ? 'bg-surface-sunken text-content-secondary' : 'bg-white text-content-primary'
                    }`}>Total Supply</div>
                    <div className={`p-4 text-sm font-medium ${
                      darkMode ? 'bg-surface-sunken text-white' : 'bg-white text-content-primary'
                    }`}>1 Billion HVLT</div>

                    <div className={`p-4 text-sm ${
                      darkMode ? 'bg-surface-sunken/50 text-content-secondary' : 'bg-surface-sunken text-content-primary'
                    }`}>Initial Price</div>
                    <div className={`p-4 text-sm font-medium ${
                      darkMode ? 'bg-surface-sunken/50 text-white' : 'bg-surface-sunken text-content-primary'
                    }`}>$100 USD</div>

                    <div className={`p-4 text-sm ${
                      darkMode ? 'bg-surface-sunken text-content-secondary' : 'bg-white text-content-primary'
                    }`}>Founder Allocation</div>
                    <div className={`p-4 text-sm font-medium ${
                      darkMode ? 'bg-surface-sunken text-white' : 'bg-white text-content-primary'
                    }`}>15% (150M HVLT)</div>

                    <div className={`p-4 text-sm ${
                      darkMode ? 'bg-surface-sunken/50 text-content-secondary' : 'bg-surface-sunken text-content-primary'
                    }`}>Investor Allocation</div>
                    <div className={`p-4 text-sm font-medium ${
                      darkMode ? 'bg-surface-sunken/50 text-white' : 'bg-surface-sunken text-content-primary'
                    }`}>10% (100M HVLT)</div>

                    <div className={`p-4 text-sm ${
                      darkMode ? 'bg-surface-sunken text-content-secondary' : 'bg-white text-content-primary'
                    }`}>Public Allocation</div>
                    <div className={`p-4 text-sm font-medium ${
                      darkMode ? 'bg-surface-sunken text-white' : 'bg-white text-content-primary'
                    }`}>40% (400M HVLT)</div>

                    <div className={`p-4 text-sm ${
                      darkMode ? 'bg-surface-sunken/50 text-content-secondary' : 'bg-surface-sunken text-content-primary'
                    }`}>Ecosystem Rewards</div>
                    <div className={`p-4 text-sm font-medium ${
                      darkMode ? 'bg-surface-sunken/50 text-white' : 'bg-surface-sunken text-content-primary'
                    }`}>25% (250M HVLT)</div>

                    <div className={`p-4 text-sm ${
                      darkMode ? 'bg-surface-sunken text-content-secondary' : 'bg-white text-content-primary'
                    }`}>Treasury Reserve</div>
                    <div className={`p-4 text-sm font-medium ${
                      darkMode ? 'bg-surface-sunken text-white' : 'bg-white text-content-primary'
                    }`}>10% (100M HVLT)</div>
                  </div>
                </div>

                {/* Token Distribution Chart */}
                <div className="mb-6">
                  <h3 className={`font-semibold mb-4 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Token Distribution</h3>
                  <div className="flex gap-4 justify-between items-end h-40">
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-full bg-blue-500 rounded-t-lg mb-2" style={{ height: '65%' }}></div>
                      <div className="text-center">
                        <div className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>40%</div>
                        <div className={`text-xs ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>Public</div>
                        <div className={`text-xs ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>400M HVLT</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-full bg-emerald-500 rounded-t-lg mb-2" style={{ height: '40%' }}></div>
                      <div className="text-center">
                        <div className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>25%</div>
                        <div className={`text-xs ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>Ecosystem</div>
                        <div className={`text-xs ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>250M HVLT</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-full bg-amber-500 rounded-t-lg mb-2" style={{ height: '24%' }}></div>
                      <div className="text-center">
                        <div className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>15%</div>
                        <div className={`text-xs ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>Founders</div>
                        <div className={`text-xs ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>150M HVLT</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-full bg-violet-500 rounded-t-lg mb-2" style={{ height: '16%' }}></div>
                      <div className="text-center">
                        <div className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>10%</div>
                        <div className={`text-xs ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>Investors</div>
                        <div className={`text-xs ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>100M HVLT</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-full bg-rose-500 rounded-t-lg mb-2" style={{ height: '16%' }}></div>
                      <div className="text-center">
                        <div className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>10%</div>
                        <div className={`text-xs ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>Treasury</div>
                        <div className={`text-xs ${
                          darkMode ? 'text-content-secondary' : 'text-content-secondary'
                        }`}>100M HVLT</div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className={`text-sm ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                } italic text-center`}>*See the Health Revolution</p>
              </div>

              {/* Call to Action */}
              <div className={`rounded-2xl border p-8 text-center mb-8 shadow-sm ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    HVLT Token System launches June 2027
                  </span>
                </div>
                <p className={`mb-6 text-base/7 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>
                  Be part of a movement that puts you in control of your health data and will reward you for taking charge of your wellness.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Learn More
                  </button>
                  <button className={`px-8 py-3 border font-medium rounded-lg transition-colors ${
                    darkMode
                      ? 'border-stroke-default text-white hover:bg-surface-sunken'
                      : 'border-stroke-default text-content-primary hover:bg-surface-sunken'
                  }`}>
                    Learn More
                  </button>
                </div>
              </div>

              {/* Blockchain Architecture */}
              <div className={`rounded-2xl border p-8 mb-8 shadow-sm ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                <div className="flex items-start gap-3 mb-6">
                  <Code className="w-5 h-5 text-indigo-600 mt-1" />
                  <h2 className={`text-xl font-semibold tracking-tight ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Blockchain Architecture</h2>
                </div>
                <p className={`mb-6 text-base/7 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>
                  Health Vault uses a hybrid blockchain model for scalability and decentralization.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className={`border rounded-lg p-6 ${
                  darkMode
                    ? 'border-stroke-default bg-surface-sunken/50'
                    : 'border-stroke-subtle bg-white'
                }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <Package className="w-5 h-5 text-indigo-600" />
                      <h3 className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Current</h3>
                    </div>
                    <h4 className={`font-medium mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Polygon (Matic)</h4>
                    <p className={`text-sm/6 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>
                      Fast, tier-cost transactions and smart contract execution for HVLT rewards and sharing.
                    </p>
                  </div>

                  <div className={`border rounded-lg p-6 ${
                  darkMode
                    ? 'border-stroke-default bg-surface-sunken/50'
                    : 'border-stroke-subtle bg-white'
                }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <Zap className="w-5 h-5 text-violet-600" />
                      <h3 className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Future</h3>
                    </div>
                    <h4 className={`font-medium mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Package Integration</h4>
                    <p className={`text-sm/6 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>
                      Enables cross-chain interoperability with healthcare systems and research partners while minimizing data sovereignty.
                    </p>
                  </div>
                </div>
              </div>

              {/* Your Data Stays Private */}
              <div className={`rounded-2xl border p-8 shadow-sm ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                <div className="flex items-start gap-3 mb-4">
                  <Lock className="w-5 h-5 text-emerald-600 mt-1" />
                  <h2 className={`text-xl font-semibold tracking-tight ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Your Data Stays Private</h2>
                </div>
                <p className={`text-base/7 ${
                  darkMode ? 'text-content-primary' : 'text-content-secondary'
                }`}>
                  Your data stays encrypted <span className="font-medium">on-chain</span> — accessible only with your keys and explicit consent.
                </p>
              </div>

              {/* CTA Section */}
              <div className="mt-16 text-center">
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    HVLT Token available June 2027
                  </span>
                </div>
                <h2 className={`text-3xl font-bold mb-4 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Ready to Join the Health Revolution?</h2>
                <p className={`mb-8 max-w-2xl mx-auto ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                  Learn how to purchase HVLT tokens and start taking control of your health data when we launch in June 2027.
                </p>
                <button
                  onClick={() => setCurrentPage('how-to-buy')}
                  className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Learn How to Buy HVLT
                </button>
              </div>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className={`flex-1 overflow-y-auto ${
            darkMode ? 'bg-surface-raised' : 'bg-white'
          }`}>
            {/* Hero Section */}
            <div className="relative isolate overflow-hidden">
              {/* Grid pattern background */}
              <svg
                aria-hidden="true"
                className={`absolute inset-0 -z-10 h-full w-full ${
                  darkMode
                    ? 'stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]'
                    : 'stroke-subtle [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]'
                }`}
              >
                <defs>
                  <pattern
                    id="security-grid-pattern"
                    width="200"
                    height="200"
                    x="50%"
                    y="-1"
                    patternUnits="userSpaceOnUse"
                  >
                    <path d="M.5 200V.5H200" fill="none" />
                  </pattern>
                </defs>
                <svg x="50%" y="-1" className={`overflow-visible ${darkMode ? 'fill-hv-neutral-800/20' : 'fill-surface-sunken'}`}>
                  <path
                    d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                    strokeWidth="0"
                  />
                </svg>
                <rect width="100%" height="100%" strokeWidth="0" fill="url(#security-grid-pattern)" />
              </svg>

              {/* Background gradient blur effect - top */}
              <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                <div
                  style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                  className={`relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] ${
                    darkMode ? 'opacity-20' : 'opacity-30'
                  }`}
                />
              </div>

              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl py-16 sm:py-32 lg:py-40">
                  {/* Announcement banner */}
                  <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                    <div className={`relative rounded-full px-3 py-1 text-sm/6 ring-1 ${
                      darkMode
                        ? 'text-content-secondary ring-white/10'
                        : 'text-content-secondary ring-stroke-subtle/40'
                    }`}>
                      Your health data deserves the highest level of security.
                    </div>
                  </div>

                  {/* Hero content */}
                  <div className="text-center">
                    <h1 className="text-6xl font-semibold tracking-tight text-balance sm:text-9xl">
                      <span
                        className="inline-block bg-clip-text text-transparent"
                        style={{
                          backgroundImage: 'linear-gradient(90deg, #5B9FFF 0%, #9D7DFF 35%, #E961FF 70%, #FF6B9D 100%)'
                        }}
                      >
                        Security & Transparency
                      </span>
                    </h1>
                    <p className={`mt-8 text-lg font-medium text-pretty sm:text-xl/8 ${
                      darkMode ? 'text-content-secondary' : 'text-content-secondary'
                    }`}>
                      We're committed to transparency and protecting your most valuable information. Every layer of Health Vault is designed with security first.
                    </p>
                  </div>
                </div>
              </div>

              {/* Background gradient blur effect - bottom */}
              <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                <div
                  style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                  className={`relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] ${
                    darkMode ? 'opacity-20' : 'opacity-30'
                  }`}
                />
              </div>
            </div>

            <div className={`${darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'}`}>
            <div className="max-w-4xl mx-auto px-6 py-16">

              {/* Verified Smart Contract */}
              <div className={`rounded-xl border p-8 mb-12 ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <h2 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Verified Smart Contract</h2>
                </div>
                <p className={`mb-6 ${
                  darkMode ? 'text-content-primary' : 'text-content-primary'
                }`}>
                  The Health Vault Token (HVLT) smart contract is fully verified on PolygonScan, ensuring complete transparency and security for all token transactions.
                </p>
                <a
                  href="#"
                  className={`inline-flex items-center gap-2 px-6 py-2.5 border font-medium rounded-lg transition-colors ${
                    darkMode
                      ? 'border-stroke-default text-content-primary hover:bg-surface-sunken'
                      : 'border-stroke-default text-content-primary hover:bg-surface-sunken'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  View on PolygonScan
                </a>
              </div>

              {/* Built with Security First */}
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Built with Security First</h2>
                <p className={`${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>Every layer of Health Vault is designed to protect your data</p>
              </div>

              {/* Security Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {/* End-to-End Encryption */}
                <div className={`rounded-xl border p-6 ${
                  darkMode
                    ? 'bg-surface-sunken border-stroke-default'
                    : 'bg-white border-stroke-subtle'
                }`}>
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>End-to-End Encryption</h3>
                  <p className={`text-sm ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                    Your health data is encrypted at rest and in transit, ensuring only you have access to your information.
                  </p>
                </div>

                {/* Blockchain Security */}
                <div className={`rounded-xl border p-6 ${
                  darkMode
                    ? 'bg-surface-sunken border-stroke-default'
                    : 'bg-white border-stroke-subtle'
                }`}>
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Blockchain Security</h3>
                  <p className={`text-sm ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                    Built on Polkadot's secure blockchain infrastructure, providing immutable audit trails and data integrity.
                  </p>
                </div>

                {/* Full Transparency */}
                <div className={`rounded-xl border p-6 ${
                  darkMode
                    ? 'bg-surface-sunken border-stroke-default'
                    : 'bg-white border-stroke-subtle'
                }`}>
                  <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-4">
                    <Eye className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Full Transparency</h3>
                  <p className={`text-sm ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                    All smart contracts are verified and publicly auditable, so you can see exactly how your data is protected.
                  </p>
                </div>

                {/* Zero-Knowledge Proofs */}
                <div className={`rounded-xl border p-6 ${
                  darkMode
                    ? 'bg-surface-sunken border-stroke-default'
                    : 'bg-white border-stroke-subtle'
                }`}>
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Zero-Knowledge Proofs</h3>
                  <p className={`text-sm ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                    Share health insights without exposing sensitive data using advanced cryptographic techniques.
                  </p>
                </div>

                {/* Private Keys */}
                <div className={`rounded-xl border p-6 ${
                  darkMode
                    ? 'bg-surface-sunken border-stroke-default'
                    : 'bg-white border-stroke-subtle'
                }`}>
                  <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
                    <Key className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Private Keys</h3>
                  <p className={`text-sm ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                    You control your private keys, ensuring that only you can authorize access to your health vault.
                  </p>
                </div>

                {/* HIPAA Compliant */}
                <div className={`rounded-xl border p-6 ${
                  darkMode
                    ? 'bg-surface-sunken border-stroke-default'
                    : 'bg-white border-stroke-subtle'
                }`}>
                  <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>HIPAA Compliant</h3>
                  <p className={`text-sm ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                    Built to meet healthcare privacy standards while giving you full ownership of your data.
                  </p>
                </div>
              </div>

              {/* Your Data. Your Control. */}
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Your Data. Your Control.</h2>
                <p className={`max-w-2xl mx-auto ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                  Experience the peace of mind that comes with true data ownership and security.
                </p>
              </div>

              {/* Call to Action */}
              <div className="flex items-center justify-center gap-4">
                <button className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                  Get Started
                </button>
                <button className={`px-8 py-3 border font-medium rounded-lg transition-colors ${
                    darkMode
                      ? 'border-stroke-default text-content-primary hover:bg-surface-sunken'
                      : 'border-stroke-default text-content-primary hover:bg-surface-sunken'
                  }`}>
                  Read Whitepaper
                </button>
              </div>
            </div>
            </div>
          </div>
        );
      case 'how-to-buy':
        return (
          <div className={`flex-1 overflow-y-auto ${
            darkMode ? 'bg-surface-raised' : 'bg-white'
          }`}>
            {/* Hero Section */}
            <div className="relative isolate overflow-hidden">
              {/* Grid pattern background */}
              <svg
                aria-hidden="true"
                className={`absolute inset-0 -z-10 h-full w-full ${
                  darkMode
                    ? 'stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]'
                    : 'stroke-subtle [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]'
                }`}
              >
                <defs>
                  <pattern
                    id="howtobuy-grid-pattern"
                    width="200"
                    height="200"
                    x="50%"
                    y="-1"
                    patternUnits="userSpaceOnUse"
                  >
                    <path d="M.5 200V.5H200" fill="none" />
                  </pattern>
                </defs>
                <svg x="50%" y="-1" className={`overflow-visible ${darkMode ? 'fill-hv-neutral-800/20' : 'fill-surface-sunken'}`}>
                  <path
                    d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                    strokeWidth="0"
                  />
                </svg>
                <rect width="100%" height="100%" strokeWidth="0" fill="url(#howtobuy-grid-pattern)" />
              </svg>

              {/* Background gradient blur effect - top */}
              <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                <div
                  style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                  className={`relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] ${
                    darkMode ? 'opacity-20' : 'opacity-30'
                  }`}
                />
              </div>

              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl py-16 sm:py-32 lg:py-40">
                  {/* Announcement banner */}
                  <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                    <div className={`relative rounded-full px-3 py-1 text-sm/6 ring-1 ${
                      darkMode
                        ? 'text-content-secondary ring-white/10'
                        : 'text-content-secondary ring-stroke-subtle/40'
                    }`}>
                      Join the health data revolution.
                    </div>
                  </div>

                  {/* Hero content */}
                  <div className="text-center">
                    <div className="flex justify-center mb-6">
                      <div className={`rounded-full px-4 py-2 text-sm font-semibold ring-2 ${
                        darkMode
                          ? 'bg-blue-900/30 text-blue-400 ring-blue-500/50'
                          : 'bg-blue-100 text-blue-800 ring-blue-600/20'
                      }`}>
                        HVLT Token Launch: June 2027
                      </div>
                    </div>
                    <h1 className="text-6xl font-semibold tracking-tight text-balance sm:text-9xl">
                      <span
                        className="inline-block bg-clip-text text-transparent"
                        style={{
                          backgroundImage: 'linear-gradient(90deg, #5B9FFF 0%, #9D7DFF 35%, #E961FF 70%, #FF6B9D 100%)'
                        }}
                      >
                        How to Buy & Use HVLT
                      </span>
                    </h1>
                    <p className={`mt-8 text-lg font-medium text-pretty sm:text-xl/8 ${
                      darkMode ? 'text-content-secondary' : 'text-content-secondary'
                    }`}>
                      When HVLT launches in June 2027, you'll be able to purchase tokens and join the health data revolution. Follow this guide to prepare for the token launch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Background gradient blur effect - bottom */}
              <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                <div
                  style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                  className={`relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] ${
                    darkMode ? 'opacity-20' : 'opacity-30'
                  }`}
                />
              </div>
            </div>

            <div className={`${darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'}`}>
            <div className="max-w-4xl mx-auto px-6 py-16">

              {/* Steps */}
              <div className="space-y-6 mb-12">
                {/* Step 1 */}
                <div className={`rounded-xl border p-8 ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-lg flex items-center justify-center">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <Wallet className="w-5 h-5 text-blue-600" />
                        <h3 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Connect Your Wallet</h3>
                      </div>
                      <ul className={`space-y-3 ${
                        darkMode ? 'text-content-primary' : 'text-content-primary'
                      }`}>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Install a compatible wallet such as MetaMask, Coinbase Wallet, or Trust Wallet.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Select Polygon Network (Mainnet) in your wallet.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Connect your wallet at:</span>
                        </li>
                      </ul>
                      <a
                        href="https://app.uniswap.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 px-5 py-2 border border-stroke-default text-content-primary font-medium rounded-lg hover:bg-surface-sunken transition-colors text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        app.uniswap.org
                      </a>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`rounded-xl border p-8 ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 font-bold text-lg flex items-center justify-center">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-emerald-600" />
                        <h3 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Get MATIC for Gas Fees</h3>
                      </div>
                      <p className={`mb-3 ${
                        darkMode ? 'text-content-primary' : 'text-content-primary'
                      }`}>
                        You'll need a small amount of MATIC (Polygon's native token) to pay for transaction fees on the network.
                      </p>
                      <ul className={`space-y-3 ${
                        darkMode ? 'text-content-primary' : 'text-content-primary'
                      }`}>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Purchase MATIC on any major exchange (Coinbase, Binance, Kraken).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Transfer MATIC to your wallet on the Polygon Network.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>$5-10 worth of MATIC is typically enough for many transactions.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`rounded-xl border p-8 ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-bold text-lg flex items-center justify-center">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <ArrowRightLeft className="w-5 h-5 text-orange-600" />
                        <h3 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Swap for HVLT Tokens</h3>
                      </div>
                      <p className={`mb-3 ${
                        darkMode ? 'text-content-primary' : 'text-content-primary'
                      }`}>
                        Once your wallet is connected and funded with MATIC:
                      </p>
                      <ul className={`space-y-3 ${
                        darkMode ? 'text-content-primary' : 'text-content-primary'
                      }`}>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Visit Uniswap and ensure you're on the Polygon Network.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Search for HVLT token or paste the contract address.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Enter the amount you want to swap and confirm the transaction in your wallet.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Wait for the transaction to complete—HVLT tokens will appear in your wallet!</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`rounded-xl border p-8 ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 text-purple-600 font-bold text-lg flex items-center justify-center">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                        <h3 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Start Using Health Vault</h3>
                      </div>
                      <p className={`mb-3 ${
                        darkMode ? 'text-content-primary' : 'text-content-primary'
                      }`}>
                        Now that you have HVLT tokens, you're ready to participate in the Health Vault ecosystem:
                      </p>
                      <ul className={`space-y-3 ${
                        darkMode ? 'text-content-primary' : 'text-content-primary'
                      }`}>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Connect your wallet to the Health Vault app.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Earn HVLT rewards for verified health actions and data contributions.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Use HVLT to access premium features and AI-powered health insights.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-content-secondary mt-0.5 flex-shrink-0" />
                          <span>Join the community and help shape the future of decentralized health data.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className={`border rounded-xl p-6 mb-12 ${
                darkMode
                  ? 'bg-amber-900/20 border-amber-800'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className={`text-sm ${
                    darkMode ? 'text-amber-200' : 'text-amber-900'
                  }`}>
                    <p className="font-medium mb-1">Important:</p>
                    <p>Always verify the HVLT contract address before purchasing. Never share your private keys or seed phrase with anyone. Health Vault will never ask for your wallet credentials.</p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    HVLT Token available June 2027
                  </span>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-content-primary'
                }`}>Ready to Get Started?</h2>
                <p className={`mb-6 ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                  Prepare to join thousands of users who will be taking control of their health data with HVLT.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    disabled
                    className="px-8 py-3 bg-action-primary-disabled text-content-on-action font-medium rounded-lg cursor-not-allowed opacity-60"
                  >
                    Get Started
                  </button>
                  <button
                    disabled
                    className={`px-8 py-3 border font-medium rounded-lg cursor-not-allowed opacity-60 ${
                      darkMode
                        ? 'border-stroke-default text-content-secondary'
                        : 'border-stroke-default text-content-secondary'
                    }`}
                  >
                    View Whitepaper
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        );
      case 'press':
        return (
          <div className={`flex-1 overflow-y-auto ${
            darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'
          }`}>
            <div className="max-w-5xl mx-auto px-6 py-16">
              <h1 className={`text-4xl font-bold mb-8 ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>Press</h1>
              <div className={`rounded-xl border p-8 ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                <p className={`${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>Press releases coming soon...</p>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className={`flex-1 overflow-y-auto ${
            darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'
          }`}>
            <div className="max-w-5xl mx-auto px-6 py-16">
              <h1 className={`text-4xl font-bold mb-8 ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>Contact</h1>
              <div className={`rounded-xl border p-8 ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default'
                  : 'bg-white border-stroke-subtle'
              }`}>
                <p className={`${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>Contact information coming soon...</p>
              </div>
            </div>
          </div>
        );
      default:
        return <MarketingHomePage darkMode={darkMode} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen ${
      darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'
    }`}>
      <MarketingHeader
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onViewChange={onViewChange}
        onDirectHealthVaultAccess={onDirectHealthVaultAccess}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onLoginClick={onLoginClick}
        onLogoutClick={onLogoutClick}
        onGetStarted={onStartOnboarding}
        isAuthenticated={isAuthenticated}
        currentView="marketing"
      />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {renderPage()}
        <MarketingFooter darkMode={darkMode} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

import {
  Shield,
  Database,
  Brain,
  Users,
  Eye,
  BarChart3,
  FileText,
  Activity,
  Lock,
  CheckCircle2,
  TrendingUp,
  Clock,
  Zap,
  Heart,
  Search,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { track } from '../lib/analytics';

interface ProvidersPageProps {
  darkMode?: boolean;
  onNavigate?: (page: string) => void;
}

export function ProvidersPage({ darkMode = false, onNavigate }: ProvidersPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCTAClick = (analyticsId: string, label: string) => {
    track('cta_click', {
      category: 'providers_page',
      analyticsId,
      label
    });
  };

  const features = [
    {
      title: 'Read-Only Patient Vaults',
      description: 'View consented data: history, labs, vitals, medications, documents.',
      icon: Eye
    },
    {
      title: 'Population Health Analytics',
      description: 'Trends by age, gender, conditions, and care gaps.',
      icon: BarChart3
    },
    {
      title: 'AI Preventive Insights',
      description: 'Vaccines due, screenings due, follow-up nudge lists.',
      icon: Brain
    },
    {
      title: 'Family Health Link View',
      description: 'Opt-in, privacy-safe context for hereditary risks.',
      icon: Users
    },
    {
      title: 'FHIR-Based Integration',
      description: 'Import/export basics; roadmap to major EMRs.',
      icon: Database
    },
    {
      title: 'Custom Reports & Dashboards',
      description: 'Export practice-level performance and outreach lists.',
      icon: FileText
    }
  ];

  const roadmapItems = [
    {
      quarter: 'Q1 2026',
      title: 'Provider Portal MVP',
      description: 'Read-only vaults, patient lookup, invite flow.'
    },
    {
      quarter: 'Q2 2026',
      title: 'Analytics Dashboard',
      description: 'Panel metrics, AI preventive insights, exports.'
    },
    {
      quarter: 'Q3 2026',
      title: 'Family Health Link',
      description: 'Cross-family screening insights (opt-in).'
    },
    {
      quarter: 'Q4 2026',
      title: 'EHR/FHIR Integrations',
      description: 'Two-way sync with major EMRs.'
    },
    {
      quarter: '2027+',
      title: 'Predictive & Research API',
      description: 'Predictive scoring, anonymized research access.'
    }
  ];

  const faqs = [
    {
      question: 'Is this read-only?',
      answer: 'Yes. Providers cannot alter patient data in Health Vault. You have view-only access to information that patients have explicitly shared with you.'
    },
    {
      question: 'What if my clinic cancels?',
      answer: 'Patients keep their accounts for life. You can request access again when in-network. Patient data ownership is permanent and independent of provider relationships.'
    },
    {
      question: 'How is consent handled?',
      answer: 'Patient-first sharing with granular and revocable consent. Patients control exactly what data you can see and can revoke access at any time.'
    },
    {
      question: 'What about crypto?',
      answer: 'HVLT is optional for discounts and staking. Fiat payment is fully supported. You can participate in the Health Vault ecosystem without any cryptocurrency.'
    }
  ];

  return (
    <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-stone-900' : 'bg-white'}`}>
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <svg
          aria-hidden="true"
          className={`absolute inset-0 -z-10 h-full w-full ${
            darkMode
              ? 'stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]'
              : 'stroke-stone-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]'
          }`}
        >
          <defs>
            <pattern
              id="providers-grid-pattern"
              width="200"
              height="200"
              x="50%"
              y="-1"
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y="-1" className={`overflow-visible ${darkMode ? 'fill-stone-800/20' : 'fill-stone-50'}`}>
            <path
              d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
              strokeWidth="0"
            />
          </svg>
          <rect width="100%" height="100%" strokeWidth="0" fill="url(#providers-grid-pattern)" />
        </svg>

        <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
            className={`relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-400 to-cyan-600 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] ${
              darkMode ? 'opacity-20' : 'opacity-30'
            }`}
          />
        </div>

        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-32 lg:py-40">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                darkMode
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              }`}>
                <Shield className="w-3.5 h-3.5" />
                HIPAA-ready
              </span>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                darkMode
                  ? 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20'
                  : 'bg-cyan-50 text-cyan-700 ring-cyan-600/20'
              }`}>
                <Database className="w-3.5 h-3.5" />
                FHIR-friendly
              </span>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                darkMode
                  ? 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20'
                  : 'bg-indigo-50 text-indigo-700 ring-indigo-600/20'
              }`}>
                <Heart className="w-3.5 h-3.5" />
                Patient-Owned
              </span>
            </div>
          </div>

          <div className="text-center">
            <h1 className={`text-5xl font-bold tracking-tight sm:text-7xl ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>
              Empower your patients.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                Elevate your practice.
              </span>
            </h1>
            <p className={`mt-6 text-lg leading-8 sm:text-xl ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              A secure, AI-powered provider portal with read-only patient vaults, population analytics, and preventive insights—while patients keep lifelong ownership.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => handleCTAClick('providers_request_demo', 'Request Demo')}
                data-analytics-id="providers_request_demo"
                className="rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors"
              >
                Request Demo
              </button>
              <button
                onClick={() => handleCTAClick('providers_start_trial', 'Start Free Trial')}
                data-analytics-id="providers_start_trial"
                className={`text-base font-semibold leading-6 ${
                  darkMode ? 'text-white hover:text-stone-200' : 'text-stone-900 hover:text-stone-700'
                } transition-colors`}
              >
                Start Free Trial <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className={`py-20 sm:py-32 ${darkMode ? 'bg-stone-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={`text-3xl font-bold tracking-tight sm:text-5xl ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>
              How It Works
            </h2>
            <p className={`mt-4 text-lg leading-8 ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Four simple principles that transform patient-provider data sharing
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:max-w-none lg:grid-cols-2 xl:gap-8">
            <div className={`rounded-2xl p-8 ring-1 ${
              darkMode
                ? 'bg-stone-800/50 ring-stone-700/50'
                : 'bg-stone-50 ring-stone-900/5'
            }`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                darkMode ? 'bg-emerald-500/10' : 'bg-emerald-100'
              }`}>
                <Users className={`h-6 w-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <h3 className={`mt-6 text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>
                Patient-Owned Accounts
              </h3>
              <p className={`mt-2 text-base leading-7 ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>
                Patients connect once and keep their vault for life. You get read-only access while in-network.
              </p>
            </div>

            <div className={`rounded-2xl p-8 ring-1 ${
              darkMode
                ? 'bg-stone-800/50 ring-stone-700/50'
                : 'bg-stone-50 ring-stone-900/5'
            }`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                darkMode ? 'bg-cyan-500/10' : 'bg-cyan-100'
              }`}>
                <Activity className={`h-6 w-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              </div>
              <h3 className={`mt-6 text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>
                Provider Dashboard
              </h3>
              <p className={`mt-2 text-base leading-7 ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>
                One secure workspace to review shared forms, labs, meds, and visit summaries.
              </p>
            </div>

            <div className={`rounded-2xl p-8 ring-1 ${
              darkMode
                ? 'bg-stone-800/50 ring-stone-700/50'
                : 'bg-stone-50 ring-stone-900/5'
            }`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                darkMode ? 'bg-indigo-500/10' : 'bg-indigo-100'
              }`}>
                <Brain className={`h-6 w-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <h3 className={`mt-6 text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>
                AI-Powered Insights
              </h3>
              <p className={`mt-2 text-base leading-7 ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>
                Preventive-care flags, visit prep summaries, and pattern detection across your panel.
              </p>
            </div>

            <div className={`rounded-2xl p-8 ring-1 ${
              darkMode
                ? 'bg-stone-800/50 ring-stone-700/50'
                : 'bg-stone-50 ring-stone-900/5'
            }`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                darkMode ? 'bg-purple-500/10' : 'bg-purple-100'
              }`}>
                <Heart className={`h-6 w-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <h3 className={`mt-6 text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>
                Family Health Context
              </h3>
              <p className={`mt-2 text-base leading-7 ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>
                Opt-in family link view to support early screening and risk stratification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className={`py-20 sm:py-32 ${darkMode ? 'bg-stone-950' : 'bg-stone-50'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={`text-3xl font-bold tracking-tight sm:text-5xl ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>
              Key Features
            </h2>
            <p className={`mt-4 text-lg leading-8 ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Everything you need to deliver better care with patient-owned data
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:max-w-none lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`rounded-2xl p-8 ring-1 shadow-sm ${
                    darkMode
                      ? 'bg-stone-900 ring-stone-800'
                      : 'bg-white ring-stone-200'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    darkMode ? 'bg-emerald-500/10' : 'bg-emerald-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <h3 className={`mt-6 text-lg font-semibold ${
                    darkMode ? 'text-white' : 'text-stone-900'
                  }`}>
                    {feature.title}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${
                    darkMode ? 'text-stone-400' : 'text-stone-600'
                  }`}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Provider Benefits Section */}
      <div className={`py-20 sm:py-32 ${darkMode ? 'bg-stone-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={`text-3xl font-bold tracking-tight sm:text-5xl ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>
              Provider Benefits
            </h2>
            <p className={`mt-4 text-lg leading-8 ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Transform your practice with patient-owned data
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                darkMode ? 'bg-emerald-500/10' : 'bg-emerald-100'
              }`}>
                <Clock className={`h-6 w-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <h3 className={`mt-6 text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>
                Save Time
              </h3>
              <p className={`mt-2 text-base leading-7 ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>
                Eliminate repetitive intake processes and data wrangling. Access complete patient histories instantly with verified, up-to-date information.
              </p>
            </div>

            <div className="flex flex-col">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                darkMode ? 'bg-cyan-500/10' : 'bg-cyan-100'
              }`}>
                <TrendingUp className={`h-6 w-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              </div>
              <h3 className={`mt-6 text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>
                Improve Outcomes
              </h3>
              <p className={`mt-2 text-base leading-7 ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>
                AI-driven preventive prompts and comprehensive panel management help you deliver proactive, personalized care at scale.
              </p>
            </div>

            <div className="flex flex-col">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                darkMode ? 'bg-indigo-500/10' : 'bg-indigo-100'
              }`}>
                <Zap className={`h-6 w-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <h3 className={`mt-6 text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>
                Differentiate Your Practice
              </h3>
              <p className={`mt-2 text-base leading-7 ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>
                Stand out with transparent, patient-owned data practices. Build trust and attract patients who value data ownership and privacy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Section */}
      <div className={`py-20 sm:py-32 ${darkMode ? 'bg-stone-950' : 'bg-stone-50'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={`text-3xl font-bold tracking-tight sm:text-5xl ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>
              Roadmap
            </h2>
            <p className={`mt-4 text-lg leading-8 ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Our vision for the future of provider-patient data collaboration
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl sm:mt-20">
            <div className="space-y-8">
              {roadmapItems.map((item, index) => (
                <div
                  key={index}
                  className={`relative flex gap-6 rounded-2xl p-6 ring-1 ${
                    darkMode
                      ? 'bg-stone-900 ring-stone-800'
                      : 'bg-white ring-stone-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className={`flex h-16 w-24 items-center justify-center rounded-lg font-semibold ${
                      darkMode
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.quarter}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${
                      darkMode ? 'text-white' : 'text-stone-900'
                    }`}>
                      {item.title}
                    </h3>
                    <p className={`mt-2 text-sm leading-6 ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                  {index < roadmapItems.length - 1 && (
                    <div className={`absolute left-12 top-full h-8 w-0.5 ${
                      darkMode ? 'bg-stone-800' : 'bg-stone-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Compliance Section */}
      <div className={`py-20 sm:py-32 ${darkMode ? 'bg-stone-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className={`rounded-3xl p-10 ring-1 ${
            darkMode
              ? 'bg-gradient-to-br from-emerald-950/50 to-cyan-950/50 ring-emerald-500/20'
              : 'bg-gradient-to-br from-emerald-50 to-cyan-50 ring-emerald-500/20'
          }`}>
            <div className="flex items-start gap-6">
              <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${
                darkMode ? 'bg-emerald-500/10' : 'bg-emerald-100'
              }`}>
                <Lock className={`h-8 w-8 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold sm:text-3xl ${
                  darkMode ? 'text-white' : 'text-stone-900'
                }`}>
                  Security & Compliance
                </h2>
                <p className={`mt-4 text-lg leading-8 ${
                  darkMode ? 'text-stone-300' : 'text-stone-700'
                }`}>
                  HIPAA-ready processes, encryption in transit and at rest, patient-consent gating, and comprehensive audit logs ensure your practice meets the highest security standards.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${
                      darkMode ? 'text-emerald-400' : 'text-emerald-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-stone-300' : 'text-stone-700'
                    }`}>
                      End-to-end encryption
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${
                      darkMode ? 'text-emerald-400' : 'text-emerald-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-stone-300' : 'text-stone-700'
                    }`}>
                      Patient consent management
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${
                      darkMode ? 'text-emerald-400' : 'text-emerald-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-stone-300' : 'text-stone-700'
                    }`}>
                      Comprehensive audit trails
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${
                      darkMode ? 'text-emerald-400' : 'text-emerald-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-stone-300' : 'text-stone-700'
                    }`}>
                      HIPAA compliance ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Band */}
      <div className={`py-20 sm:py-32 ${darkMode ? 'bg-stone-950' : 'bg-stone-900'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Be part of the movement toward patient-owned healthcare.
            </h2>
            <p className="mt-6 text-lg leading-8 text-stone-300">
              Join forward-thinking providers who are transforming the future of healthcare data.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => handleCTAClick('providers_join_network', 'Join the Provider Network')}
                data-analytics-id="providers_join_network"
                className="rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors"
              >
                Join the Provider Network
              </button>
              <button
                onClick={() => handleCTAClick('providers_book_demo', 'Book a Demo')}
                data-analytics-id="providers_book_demo"
                className="text-base font-semibold leading-6 text-white hover:text-stone-200 transition-colors"
              >
                Book a Demo <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className={`py-20 sm:py-32 ${darkMode ? 'bg-stone-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={`text-3xl font-bold tracking-tight sm:text-5xl ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-16 space-y-4 sm:mt-20">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-2xl ring-1 overflow-hidden ${
                  darkMode
                    ? 'bg-stone-800/50 ring-stone-700'
                    : 'bg-stone-50 ring-stone-200'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                  aria-expanded={openFaq === index}
                >
                  <span className={`text-lg font-semibold ${
                    darkMode ? 'text-white' : 'text-stone-900'
                  }`}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 transition-transform ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    } ${openFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === index && (
                  <div className={`px-6 pb-6 ${
                    darkMode ? 'text-stone-400' : 'text-stone-600'
                  }`}>
                    <p className="text-base leading-7">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

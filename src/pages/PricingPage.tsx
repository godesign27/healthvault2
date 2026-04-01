import { useState } from 'react';
import {
  Shield,
  Lock,
  Database,
  Users,
  Brain,
  Activity,
  FileText,
  BarChart3,
  Eye,
  Share2,
  ChevronDown
} from 'lucide-react';
import { PricingToggle } from '../components/pricing/PricingToggle';
import { PlanCard } from '../components/pricing/PlanCard';
import { BusinessCalculator } from '../components/pricing/BusinessCalculator';
import { track } from '../lib/analytics';

interface PricingPageProps {
  darkMode?: boolean;
  onNavigate?: (page: string) => void;
  onStartOnboarding?: () => void;
}

export function PricingPage({ darkMode = false, onNavigate, onStartOnboarding }: PricingPageProps) {
  const [activeTab, setActiveTab] = useState<'individual' | 'business'>('individual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Do small clinics get the same features as enterprise?',
      answer: 'Yes. Every Business customer gets the full platform—no feature gating. Whether you have 100 patients or 100,000, you get access to all provider tools, analytics, AI insights, and integrations.'
    },
    {
      question: 'What happens if my provider stops paying?',
      answer: 'Patients keep their accounts for life and can switch to an Individual plan anytime. Your health data belongs to you forever, regardless of your provider relationships.'
    },
    {
      question: 'Can I pay with crypto?',
      answer: 'Yes — HVLT is supported for annual discounts; standard fiat payments are also available. We believe in giving you payment flexibility that matches your preferences.'
    },
    {
      question: 'How do you count active patients?',
      answer: 'Any patient with a connection, update, or shared item during the last 12 months counts as active. We only charge for engaged patients who are actively using the platform.'
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
              id="pricing-grid-pattern"
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
          <rect width="100%" height="100%" strokeWidth="0" fill="url(#pricing-grid-pattern)" />
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
          <div className="text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-8xl">
              <span
                className="inline-block bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)'
                }}
              >
                Simple, transparent pricing for individuals and providers.
              </span>
            </h1>
            <p className={`mt-6 text-lg leading-8 sm:text-xl ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Individuals own their health data for life. Providers pay per active patient—no feature gating, ever.
            </p>

            <div className="mt-10 flex justify-center">
              <PricingToggle
                activeTab={activeTab}
                onTabChange={setActiveTab}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Individual Tab Content */}
      {activeTab === 'individual' && (
        <div
          role="tabpanel"
          id="individual-panel"
          aria-labelledby="individual-tab"
          className={`py-20 sm:py-32 ${darkMode ? 'bg-stone-900' : 'bg-white'}`}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <PlanCard
                title="Free"
                price="$0"
                period="/ mo"
                features={[
                  '1 provider connection',
                  'Secure storage & sharing',
                  'Full AI health assistant',
                  'Data ownership forever'
                ]}
                ctaLabel="Get Started Free"
                onCta={() => {
                  track('pricing_individual_free_cta', { page: 'pricing', plan: 'free' });
                  onStartOnboarding?.();
                }}
                darkMode={darkMode}
              />

              <PlanCard
                title="Personal"
                price="$9"
                period="/ mo or $79 / yr"
                badge="Best Value"
                features={[
                  'Unlimited provider connections',
                  'Full AI assistant & preventive insights',
                  'Complete form tools & e-sign sharing',
                  'Secure storage & permissions'
                ]}
                ctaLabel="Start Personal"
                onCta={() => {
                  track('pricing_individual_personal_cta', { page: 'pricing', plan: 'personal' });
                  onStartOnboarding?.();
                }}
                darkMode={darkMode}
              />

              <PlanCard
                title="Family Vault"
                price="$18"
                period="/ mo or $159 / yr"
                badge="Household Plan"
                features={[
                  'Up to 5 family members',
                  'All Personal features for each member',
                  'Family health view & shared preventive guidance',
                  'Delegated access for caregiving'
                ]}
                ctaLabel="Start Family Vault"
                onCta={() => {
                  track('pricing_individual_family_cta', { page: 'pricing', plan: 'family' });
                  onStartOnboarding?.();
                }}
                darkMode={darkMode}
              />
            </div>

            <div className="mt-12 text-center max-w-3xl mx-auto">
              <p className={`text-sm leading-6 ${
                darkMode ? 'text-stone-500' : 'text-stone-600'
              }`}>
                No add-ons or hidden fees — every plan includes the full AI assistant and sharing tools.
                We believe access to your own health data should be universal, regardless of insurance status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Business Tab Content */}
      {activeTab === 'business' && (
        <div
          role="tabpanel"
          id="business-panel"
          aria-labelledby="business-tab"
          className={`py-20 sm:py-32 ${darkMode ? 'bg-stone-900' : 'bg-white'}`}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/* Pricing Description */}
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl mb-6 ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>
                Full platform at every size. No feature gating.
              </h2>
              <div className={`space-y-2 text-lg ${
                darkMode ? 'text-stone-300' : 'text-stone-700'
              }`}>
                <p>
                  <span className="font-semibold">$1.00</span> / active patient / month for panels up to 20,000
                </p>
                <p>
                  <span className="font-semibold">$0.50</span> / active patient / month once you exceed 20,000 — the reduced rate applies to <span className="underline">all</span> patients
                </p>
                <p className={`text-sm mt-4 ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  "Active" = a patient with at least one connection, update, or shared item during the last 12 months.
                </p>
              </div>
            </div>

            {/* Feature Parity Strip */}
            <div className={`rounded-2xl p-8 mb-16 ${
              darkMode
                ? 'bg-stone-800/50 border border-stone-700'
                : 'bg-stone-50 border border-stone-200'
            }`}>
              <h3 className={`text-center text-sm font-semibold uppercase tracking-wide mb-6 ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>
                All features included for every Business customer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: Eye, label: 'Read-only patient vaults with consent' },
                  { icon: Activity, label: 'Provider login & population health analytics' },
                  { icon: Brain, label: 'AI preventive insights & visit summaries' },
                  { icon: Users, label: 'Family Link (opt-in)' },
                  { icon: Database, label: 'FHIR/EMR integrations & API access' },
                  { icon: Shield, label: 'Multi-clinic dashboards, SSO/SCIM' },
                  { icon: FileText, label: 'Custom exports & reporting' }
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        darkMode ? 'text-emerald-400' : 'text-emerald-600'
                      }`} />
                      <span className={`text-sm ${
                        darkMode ? 'text-stone-300' : 'text-stone-700'
                      }`}>
                        {feature.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Example Plan Cards */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-16">
              <PlanCard
                title="Small Clinic"
                price="$2,000"
                period="/ month"
                features={['2,000 active patients']}
                ctaLabel="Start Clinic Trial"
                onCta={() => track('pricing_business_small_cta', { page: 'pricing', plan: 'small_clinic' })}
                subtext="Full platform included · No feature gating"
                darkMode={darkMode}
              />

              <PlanCard
                title="Growing Practice"
                price="$10,000"
                period="/ month"
                features={['10,000 active patients']}
                ctaLabel="Talk to Sales"
                onCta={() => track('pricing_business_growing_cta', { page: 'pricing', plan: 'growing_practice' })}
                subtext="Full platform included · No feature gating"
                darkMode={darkMode}
              />

              <PlanCard
                title="Enterprise Network"
                price="$25,000"
                period="/ month"
                badge="Volume Pricing"
                features={['50,000 active patients']}
                ctaLabel="Request Enterprise Demo"
                onCta={() => track('pricing_business_enterprise_cta', { page: 'pricing', plan: 'enterprise' })}
                subtext="Full platform included · No feature gating"
                darkMode={darkMode}
              />
            </div>

            {/* Live Calculator */}
            <BusinessCalculator darkMode={darkMode} />

            {/* Compliance Strip */}
            <div className={`mt-16 text-center text-sm ${
              darkMode ? 'text-stone-500' : 'text-stone-600'
            }`}>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  HIPAA-ready
                </span>
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Encryption at rest & in transit
                </span>
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Patient consent & audit logs
                </span>
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Read-only provider access
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className={`py-20 sm:py-32 ${darkMode ? 'bg-stone-950' : 'bg-stone-50'}`}>
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className={`text-3xl font-bold tracking-tight sm:text-5xl ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-2xl ring-1 overflow-hidden ${
                  darkMode
                    ? 'bg-stone-900 ring-stone-800'
                    : 'bg-white ring-stone-200'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
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

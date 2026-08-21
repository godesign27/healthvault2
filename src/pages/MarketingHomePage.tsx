import { Lock, Users, Coins, Shield, Database, BarChart3, Heart, Zap, TrendingUp, CircleDot, CheckCircle2, FileText, Share2, Clock } from 'lucide-react';

interface MarketingHomePageProps {
  darkMode?: boolean;
  onNavigate?: (page: string) => void;
  onGetStarted?: () => void;
}

export function MarketingHomePage({ darkMode = false, onNavigate, onGetStarted }: MarketingHomePageProps) {
  return (
    <div className={`flex-1 overflow-y-auto ${
      darkMode ? 'bg-surface-raised' : 'bg-white'
    }`}>
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
              id="home-grid-pattern"
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
          <rect width="100%" height="100%" strokeWidth="0" fill="url(#home-grid-pattern)" />
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

        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-40 lg:py-48">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className={`relative rounded-full px-3 py-1 text-sm leading-6 ring-1 ${
              darkMode
                ? 'text-content-secondary ring-white/10 hover:ring-white/20'
                : 'text-content-secondary ring-stroke-subtle/40 hover:ring-stroke-default/50'
            }`}>
              Own your health. Change the future.
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-6xl font-semibold tracking-tight text-balance sm:text-9xl">
              <span
                className="inline-block bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #5B9FFF 0%, #9D7DFF 35%, #E961FF 70%, #FF6B9D 100%)'
                }}
              >
                Your Health. Your Data. Your Power.
              </span>
            </h1>
            <p className={`mt-8 text-lg font-medium text-pretty sm:text-xl/8 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>
              Health Vault is a decentralized platform that gives you ownership of your health data — connecting families, patients, and providers through trust, transparency, and reward.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={onGetStarted}
                className={`rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                  darkMode ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-indigo-600'
                }`}>
                Get Started
              </button>
              <button onClick={() => onNavigate?.('whitepaper')} className={`text-sm font-semibold leading-6 ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>
                Read the Whitepaper <span aria-hidden="true">→</span>
              </button>
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

      <div className={`py-24 sm:py-32 ${darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'}`}>
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <h2 className={`text-center text-base/7 font-semibold ${
            darkMode ? 'text-indigo-400' : 'text-indigo-600'
          }`}>Take control of your health</h2>
          <p className={`mx-auto mt-2 max-w-lg text-center text-4xl font-semibold tracking-tight text-balance sm:text-5xl ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>Everything you need to own your health data</p>

          <div className="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2">
            <div className="relative lg:row-span-2">
              <div className={`absolute inset-px rounded-lg lg:rounded-l-[2rem] ${
                darkMode ? 'bg-surface-sunken' : 'bg-white'
              }`}></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">
                <div className="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                  <p className={`mt-2 text-lg font-medium tracking-tight max-lg:text-center ${
                    darkMode ? 'text-white' : 'text-content-primary'
                  }`}>Your Personal Health Vault</p>
                  <p className={`mt-2 max-w-lg text-sm/6 max-lg:text-center ${
                    darkMode ? 'text-content-secondary' : 'text-content-secondary'
                  }`}>Encrypt, organize, and own every record — from lab results to lifestyle data. You hold the key. No one else.</p>
                </div>
                <div className="relative min-h-[30rem] w-full grow max-lg:mx-auto max-lg:max-w-sm">
                  <div className="absolute inset-x-10 top-10 bottom-0 overflow-hidden rounded-t-[12cqw] border-x-[3cqw] border-t-[3cqw] border-stroke-default bg-surface-raised shadow-2xl">
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
                      <Lock className="w-24 h-24 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div className={`pointer-events-none absolute inset-px rounded-lg shadow-sm lg:rounded-l-[2rem] ${
                darkMode ? 'outline outline-white/15' : 'outline outline-black/5'
              }`}></div>
            </div>

            <div className="relative max-lg:row-start-1">
              <div className={`absolute inset-px rounded-lg max-lg:rounded-t-[2rem] ${
                darkMode ? 'bg-surface-sunken' : 'bg-white'
              }`}></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
                <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                  <p className={`mt-2 text-lg font-medium tracking-tight max-lg:text-center ${
                    darkMode ? 'text-white' : 'text-content-primary'
                  }`}>Connected Family Network</p>
                  <p className={`mt-2 max-w-lg text-sm/6 max-lg:text-center ${
                    darkMode ? 'text-content-secondary' : 'text-content-secondary'
                  }`}>Invite family members to join your circle. Together, your shared data creates a richer picture of genetic health.</p>
                </div>
                <div className="flex flex-1 items-center justify-center px-8 max-lg:pt-10 max-lg:pb-12 sm:px-10 lg:pb-2">
                  <div className="flex gap-4 items-center justify-center w-full">
                    <Users className="w-16 h-16 text-emerald-600" />
                    <div className="flex flex-col gap-2">
                      <div className="h-2 w-20 bg-emerald-200 dark:bg-emerald-900 rounded"></div>
                      <div className="h-2 w-16 bg-emerald-300 dark:bg-emerald-800 rounded"></div>
                      <div className="h-2 w-24 bg-emerald-200 dark:bg-emerald-900 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`pointer-events-none absolute inset-px rounded-lg shadow-sm max-lg:rounded-t-[2rem] ${
                darkMode ? 'outline outline-white/15' : 'outline outline-black/5'
              }`}></div>
            </div>

            <div className="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
              <div className={`absolute inset-px rounded-lg ${
                darkMode ? 'bg-surface-sunken' : 'bg-white'
              }`}></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                  <p className={`mt-2 text-lg font-medium tracking-tight max-lg:text-center ${
                    darkMode ? 'text-white' : 'text-content-primary'
                  }`}>AI-Driven Insights</p>
                  <p className={`mt-2 max-w-lg text-sm/6 max-lg:text-center ${
                    darkMode ? 'text-content-secondary' : 'text-content-secondary'
                  }`}>Our AI assistant surfaces patterns, predicts potential conditions, and offers personalized health actions.</p>
                </div>
                <div className="flex flex-1 items-center justify-center max-lg:py-6 lg:pb-2">
                  <div className="flex gap-3 items-center">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-950 rounded-lg">
                      <BarChart3 className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
                      <Heart className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                      <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div className={`pointer-events-none absolute inset-px rounded-lg shadow-sm ${
                darkMode ? 'outline outline-white/15' : 'outline outline-black/5'
              }`}></div>
            </div>

            <div className="relative lg:row-span-2">
              <div className={`absolute inset-px rounded-lg max-lg:rounded-b-[2rem] lg:rounded-r-[2rem] ${
                darkMode ? 'bg-surface-sunken' : 'bg-white'
              }`}></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]">
                <div className="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                  <div className="flex items-center gap-2 mb-2 max-lg:justify-center">
                    <p className={`text-lg font-medium tracking-tight ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Earn HVLT Tokens</p>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      June 2027
                    </span>
                  </div>
                  <p className={`mt-2 max-w-lg text-sm/6 max-lg:text-center ${
                    darkMode ? 'text-content-secondary' : 'text-content-secondary'
                  }`}>Every action that strengthens your health profile will earn you HVLT tokens that power our ecosystem.</p>
                </div>
                <div className="relative min-h-[30rem] w-full grow">
                  <div className={`absolute top-10 right-0 bottom-0 left-10 overflow-hidden rounded-tl-xl shadow-2xl ${
                    darkMode ? 'bg-surface-raised/60 outline outline-white/10' : 'bg-surface-raised outline outline-white/5'
                  }`}>
                    <div className={`flex border-b ${
                      darkMode ? 'bg-surface-raised border-white/5' : 'bg-surface-raised border-white/10'
                    }`}>
                      <div className="flex text-sm/6 font-medium text-content-secondary">
                        <div className="border-r border-b border-r-white/10 border-b-white/20 bg-white/5 px-4 py-2 text-white">TokenRewards.jsx</div>
                        <div className="border-r border-stroke-default/10 px-4 py-2">Dashboard.jsx</div>
                      </div>
                    </div>
                    <div className="px-6 pt-6 pb-14">
                      <div className="flex items-center gap-3 mb-4">
                        <Coins className="w-10 h-10 text-amber-500" />
                        <div>
                          <div className="text-white font-semibold text-lg">1,250 HVLT</div>
                          <div className="text-content-secondary text-sm">Total Earned</div>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-content-primary">
                          <span>Upload medical record</span>
                          <span className="text-amber-500">+50 HVLT</span>
                        </div>
                        <div className="flex justify-between text-content-primary">
                          <span>Complete health assessment</span>
                          <span className="text-amber-500">+100 HVLT</span>
                        </div>
                        <div className="flex justify-between text-content-primary">
                          <span>Share with provider</span>
                          <span className="text-amber-500">+25 HVLT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`pointer-events-none absolute inset-px rounded-lg shadow-sm max-lg:rounded-b-[2rem] lg:rounded-r-[2rem] ${
                darkMode ? 'outline outline-white/15' : 'outline outline-black/5'
              }`}></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`py-24 sm:py-32 ${darkMode ? 'bg-surface-raised' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={`text-4xl font-semibold tracking-tight text-pretty sm:text-5xl ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>A Health Movement, Not Just an App</h2>
            <p className={`mt-6 text-base/7 ${
              darkMode ? 'text-content-primary' : 'text-content-secondary'
            }`}>Health Vault isn't just another data platform. It's a new model for ownership and wellness — one that rewards action, protects transparency, and protects what matters most.</p>
          </div>

          <div className={`mt-16 rounded-2xl p-8 lg:mt-20 ${
            darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
          }`}>
            <p className={`text-center text-base/7 mb-12 ${
              darkMode ? 'text-content-primary' : 'text-content-secondary'
            }`}>When people own their data, we create a world where:</p>

            <div className="mx-auto flex max-w-2xl flex-col gap-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-stretch">
              <div className={`flex flex-col justify-between gap-y-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:gap-x-8 lg:w-72 lg:flex-none lg:flex-col lg:items-start ${
                darkMode ? 'bg-white/5 ring-1 ring-inset ring-white/10' : 'bg-white'
              }`}>
                <div className="flex-none">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-xl ${
                    darkMode ? 'bg-amber-900/30' : 'bg-amber-50'
                  }`}>
                    <Zap className="w-8 h-8 text-amber-600" />
                  </div>
                </div>
                <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
                  <p className={`text-lg font-semibold tracking-tight ${
                    darkMode ? 'text-white' : 'text-content-primary'
                  }`}>Early Detection</p>
                  <p className={`mt-2 text-base/7 ${
                    darkMode ? 'text-content-primary' : 'text-content-secondary'
                  }`}>Early detection becomes the norm, not the exception.</p>
                </div>
              </div>

              <div className={`flex flex-col justify-between gap-y-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:gap-x-8 lg:w-full lg:max-w-sm lg:flex-auto lg:flex-col lg:items-start ${
                darkMode ? 'bg-surface-sunken ring-1 ring-inset ring-white/10' : 'bg-surface-raised'
              }`}>
                <div className="flex-none">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-xl ${
                    darkMode ? 'bg-emerald-500/20' : 'bg-emerald-500/20'
                  }`}>
                    <Shield className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
                  <p className="text-lg font-semibold tracking-tight text-white">Family Strength</p>
                  <p className={`mt-2 text-base/7 ${
                    darkMode ? 'text-content-primary' : 'text-content-secondary'
                  }`}>Families become stronger through shared awareness.</p>
                </div>
              </div>

              <div className={`flex flex-col justify-between gap-y-6 rounded-2xl bg-indigo-600 p-8 sm:flex-row sm:items-center sm:gap-x-8 lg:w-full lg:max-w-none lg:flex-auto lg:flex-col lg:items-start ${
                darkMode ? 'ring-1 ring-inset ring-white/10' : ''
              }`}>
                <div className="flex-none">
                  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-white/20">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
                  <p className="text-lg font-semibold tracking-tight text-white">Health Breakthroughs</p>
                  <p className={`mt-2 text-base/7 ${
                    darkMode ? 'text-indigo-100' : 'text-indigo-200'
                  }`}>Health data powers breakthroughs, not bureaucracy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`overflow-hidden py-24 sm:py-32 ${darkMode ? 'bg-surface-raised' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-semibold tracking-tight text-pretty sm:text-5xl mb-3 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>Your forms. Pre-filled. Portable. Ready when you are.</h2>
            <p className={`text-lg max-w-3xl mx-auto ${
              darkMode ? 'text-content-primary' : 'text-content-secondary'
            }`}>Complete your onboarding forms once and share them instantly with any physician — directly from your vault.</p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
            <div className="px-6 lg:px-0 lg:pt-4">
              <div className={`relative isolate overflow-hidden rounded-3xl p-8 lg:p-12 ${
                darkMode ? 'bg-surface-sunken' : 'bg-indigo-50'
              }`}>
                <div className="space-y-4">
                  <div className={`flex items-center gap-4 p-4 rounded-xl ${
                    darkMode ? 'bg-surface-raised' : 'bg-white'
                  }`}>
                    <div className={`p-2 rounded-lg ${
                      darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}>
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className={`h-3 rounded mb-2 ${
                        darkMode ? 'bg-surface-sunken' : 'bg-surface-overlay'
                      }`} style={{width: '70%'}}></div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  </div>
                  <div className={`flex items-center gap-4 p-4 rounded-xl ${
                    darkMode ? 'bg-surface-raised' : 'bg-white'
                  }`}>
                    <div className={`p-2 rounded-lg ${
                      darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}>
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className={`h-3 rounded mb-2 ${
                        darkMode ? 'bg-surface-sunken' : 'bg-surface-overlay'
                      }`} style={{width: '60%'}}></div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  </div>
                  <div className={`flex items-center gap-4 p-4 rounded-xl ${
                    darkMode ? 'bg-surface-raised' : 'bg-white'
                  }`}>
                    <div className={`p-2 rounded-lg ${
                      darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}>
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className={`h-3 rounded mb-2 ${
                        darkMode ? 'bg-surface-sunken' : 'bg-surface-overlay'
                      }`} style={{width: '50%'}}></div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-0 lg:pr-4 lg:pt-4">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
                <dl className={`space-y-8 text-base/7 ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                  <div className="relative pl-9">
                    <dt className={`inline font-semibold ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>
                      <FileText className={`absolute top-1 left-1 h-5 w-5 ${
                        darkMode ? 'text-indigo-400' : 'text-indigo-600'
                      }`} />
                      Pre-filled once, used forever.
                    </dt>
                    <dd className="inline"> Complete your medical history, insurance, and preferences just once. Every future visit starts pre-populated.</dd>
                  </div>

                  <div className="relative pl-9">
                    <dt className={`inline font-semibold ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>
                      <Shield className={`absolute top-1 left-1 h-5 w-5 ${
                        darkMode ? 'text-indigo-400' : 'text-emerald-600'
                      }`} />
                      HIPAA-compliant sharing.
                    </dt>
                    <dd className="inline"> Send encrypted, secure links that only intended recipients can access. Full audit trail included.</dd>
                  </div>

                  <div className="relative pl-9">
                    <dt className={`inline font-semibold ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>
                      <Database className={`absolute top-1 left-1 h-5 w-5 ${
                        darkMode ? 'text-indigo-400' : 'text-blue-600'
                      }`} />
                      FHIR-ready format.
                    </dt>
                    <dd className="inline"> Your forms export as standardized FHIR bundles that integrate seamlessly with modern EHR systems.</dd>
                  </div>

                  <div className="relative pl-9">
                    <dt className={`inline font-semibold ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>
                      <Clock className={`absolute top-1 left-1 h-5 w-5 ${
                        darkMode ? 'text-indigo-400' : 'text-amber-600'
                      }`} />
                      Auto-expiring secure links.
                    </dt>
                    <dd className="inline"> Set expiration dates and revoke access anytime. You control who sees your data and for how long.</dd>
                  </div>

                  <div className="relative pl-9">
                    <dt className={`inline font-semibold ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>
                      <Share2 className={`absolute top-1 left-1 h-5 w-5 ${
                        darkMode ? 'text-indigo-400' : 'text-purple-600'
                      }`} />
                      Add personalized message to provider.
                    </dt>
                    <dd className="inline"> Include notes about your current symptoms, concerns, or questions alongside your shared forms.</dd>
                  </div>
                </dl>

                <div className="mt-10">
                  <button
                    onClick={onGetStarted}
                    className="w-full px-6 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Try Smart Medical Forms
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Health Vault CTA Section */}
      <div className={`py-24 sm:py-32 ${darkMode ? 'bg-surface-sunken/50' : 'bg-white'}`}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className={`inline-flex items-center justify-center p-2 rounded-full mb-6 ${
            darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
          }`}>
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className={`text-4xl sm:text-5xl font-bold mb-6 ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            Your Complete Health Story, All in One Secure Vault
          </h2>
          <p className={`text-lg sm:text-xl mb-10 max-w-2xl mx-auto ${
            darkMode ? 'text-content-primary' : 'text-content-secondary'
          }`}>
            Organize, manage, and securely share every part of your medical history — records, labs, medications, and forms — all controlled by you.
          </p>
          <button
            onClick={() => onNavigate?.('personal-health-vault')}
            className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Learn More About the Personal Health Vault
          </button>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'}`}>
        <div className="max-w-5xl mx-auto px-6 py-16">

        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-3 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>Benefits for Everyone</h2>
            <p className={`${
              darkMode ? 'text-content-primary' : 'text-content-secondary'
            }`}>See how Health Vault transforms healthcare for patients and providers</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className={`rounded-xl border p-8 ${
              darkMode
                ? 'bg-surface-sunken border-stroke-default'
                : 'bg-white border-stroke-subtle'
            }`}>
              <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>
                <Heart className="w-6 h-6 text-indigo-600" />
                For Patients
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Total Control</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>Own your health data.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Instant Sharing</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>No more clipboards.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Predictive Health</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>AI insights that prevent.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm mb-1 ${
                        darkMode ? 'text-white' : 'text-content-primary'
                      }`}>Rewarded Engagement</p>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        June 2027
                      </span>
                    </div>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>Earn HVLT tokens.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Connected Family Health</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>Share and protect together.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Seamless Continuity of Care</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>Bring your story anywhere.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className={`rounded-xl border p-8 ${
              darkMode
                ? 'bg-surface-sunken border-stroke-default'
                : 'bg-white border-stroke-subtle'
            }`}>
              <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>
                <Users className="w-6 h-6 text-emerald-600" />
                For Physicians
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Pre-Filled, Verified Onboarding</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>Cut intake time by 70%.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>FHIR-Ready Integration</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>Instant EHR import.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Reduced Admin Burden</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>Less paperwork.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Improved Coordination</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>Access real-time patient data.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Enhanced Patient Trust</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>Transparent and collaborative.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${
                      darkMode ? 'text-white' : 'text-content-primary'
                    }`}>Secure, Compliant Exchange</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-content-primary' : 'text-content-secondary'
                    }`}>Fully HIPAA and blockchain verified.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className={`rounded-xl border-t-4 border-indigo-600 p-8 text-center ${
            darkMode
              ? 'bg-surface-sunken'
              : 'bg-gradient-to-br from-indigo-50 to-blue-50'
          }`}>
            <p className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>Together, patients and providers build a smarter, more connected health future.</p>
          </div>
        </div>

        <div className={`rounded-xl border p-8 mb-16 ${
          darkMode
            ? 'bg-surface-sunken border-stroke-default'
            : 'bg-white border-stroke-subtle'
        }`}>
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-lg ${
              darkMode ? 'bg-blue-900/30' : 'bg-blue-50'
            }`}>
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className={`text-xl font-bold mb-2 ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>The Future of Healthcare Belongs to You</h2>
            </div>
          </div>
          <div className={`space-y-4 leading-relaxed ${
            darkMode ? 'text-content-primary' : 'text-content-primary'
          }`}>
            <p>
              Your family, healthcare data has lived in silos — owned by hospitals, insurers, and systems. Health Vault changes that.
            </p>
            <p>
              We help you take back control of your medical records, secure them on blockchain, and use AI to unlock insights that can save lives.
            </p>
            <p>
              When families connect, Health Vault can identify patterns across generations — helping predict risks, prevent disease, and rewrite health outcomes.
            </p>
            <p className={`font-semibold ${
              darkMode ? 'text-content-primary' : 'text-content-primary'
            }`}>
              It's healthcare reimagined for people — not institutions.
            </p>
          </div>
        </div>

        <div className={`rounded-xl border p-8 mb-16 ${
          darkMode
            ? 'bg-surface-sunken border-stroke-default'
            : 'bg-white border-stroke-subtle'
        }`}>
          <div className="text-center mb-8">
            <CircleDot className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-3 mb-3">
              <h2 className={`text-3xl font-bold ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>Powered by HVLT</h2>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Available June 2027
              </span>
            </div>
            <p className={`${
              darkMode ? 'text-content-primary' : 'text-content-secondary'
            }`}>The Health Vault Token (HVLT) will be more than currency — it will be the fuel behind a new health economy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4">
              <p className={`text-sm font-semibold mb-2 ${
                darkMode ? 'text-content-primary' : 'text-content-primary'
              }`}>Total Supply</p>
              <p className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>1B</p>
            </div>

            <div className="text-center p-4">
              <p className={`text-sm font-semibold mb-2 ${
                darkMode ? 'text-content-primary' : 'text-content-primary'
              }`}>Launch Price</p>
              <p className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>$1.00</p>
            </div>

            <div className="text-center p-4">
              <p className={`text-sm font-semibold mb-2 ${
                darkMode ? 'text-content-primary' : 'text-content-primary'
              }`}>Blockchain</p>
              <p className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>Polibase Mainnet</p>
            </div>

            <div className="text-center p-4">
              <p className={`text-sm font-semibold mb-2 ${
                darkMode ? 'text-content-primary' : 'text-content-primary'
              }`}>Utility</p>
              <p className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>Rewards & Access</p>
            </div>
          </div>

          <div className={`rounded-lg p-6 ${
            darkMode ? 'bg-surface-raised/50' : 'bg-surface-sunken'
          }`}>
            <h3 className={`font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>Use HVLT to:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${
                  darkMode ? 'text-content-primary' : 'text-content-primary'
                }`}>Unlock advanced AI health analytics</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${
                  darkMode ? 'text-content-primary' : 'text-content-primary'
                }`}>Join decentralized health studies</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${
                  darkMode ? 'text-content-primary' : 'text-content-primary'
                }`}>Access family network insights</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${
                  darkMode ? 'text-content-primary' : 'text-content-primary'
                }`}>Contribute to user-owned health datasets</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm ${
                    darkMode ? 'text-content-primary' : 'text-content-primary'
                  }`}>Earn HVLT Tokens for engagement</p>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    2027
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${
                  darkMode ? 'text-content-primary' : 'text-content-primary'
                }`}>Predictive, preventive AI health</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control?</h2>
          <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join the health revolution and be part of the future where you own your health data.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Join Health Vault Today
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

import { FileText, Shield, Database, Share2, Clock, CheckCircle2, Heart, Users, Brain, Lock, Activity, Pill, Calendar, FileSpreadsheet, Clipboard, Zap, ArrowRight, Download, Link2, Eye } from 'lucide-react';

interface PersonalHealthVaultPageProps {
  darkMode?: boolean;
}

export function PersonalHealthVaultPage({ darkMode = false }: PersonalHealthVaultPageProps) {
  return (
    <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-surface-raised' : 'bg-white'}`}>

      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        {/* Animated gradient background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden"
          style={{
            background: darkMode
              ? 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)'
          }}
        />

        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h1 className={`text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl mb-6 ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>
                Your Complete Health Story.{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  All in One Secure Vault.
                </span>
              </h1>
              <p className={`text-lg sm:text-xl leading-relaxed mb-10 ${
                darkMode ? 'text-content-primary' : 'text-content-secondary'
              }`}>
                Health Vault gives you one place to organize, manage, and securely share every part of your medical history — records, labs, medications, and forms — all controlled by you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl">
                  Create Your Vault
                </button>
                <button className={`px-8 py-4 font-semibold rounded-xl transition-all ${
                  darkMode
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    : 'bg-surface-sunken text-content-primary hover:bg-surface-overlay'
                }`}>
                  See How It Works
                </button>
              </div>
            </div>

            {/* Product UI Preview */}
            <div className="relative">
              <div className="relative space-y-4">
                {/* Health Records Card */}
                <div className={`rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-300 ${
                  darkMode ? 'bg-surface-sunken border border-stroke-default' : 'bg-white border border-stroke-subtle'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-content-primary'}`}>Health Records</h3>
                      <p className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>24 documents</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <div className={`h-2 rounded ${darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'}`} style={{width: '80%'}}></div>
                    <div className={`h-2 rounded ${darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'}`} style={{width: '60%'}}></div>
                    <div className={`h-2 rounded ${darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'}`} style={{width: '90%'}}></div>
                  </div>
                </div>

                {/* Secure Share Card */}
                <div className={`rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-300 ${
                  darkMode ? 'bg-surface-sunken border border-stroke-default' : 'bg-white border border-stroke-subtle'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <Share2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-content-primary'}`}>Shared with Dr. Smith</h3>
                      <p className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>Expires in 7 days</p>
                    </div>
                    <Lock className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>

                {/* Medical Forms Card */}
                <div className={`rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-300 ${
                  darkMode ? 'bg-surface-sunken border border-stroke-default' : 'bg-white border border-stroke-subtle'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Clipboard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-content-primary'}`}>Medical Forms</h3>
                      <p className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>All forms completed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating decoration */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className={`py-24 sm:py-32 relative overflow-hidden ${darkMode ? 'bg-surface-sunken/50' : 'bg-surface-sunken'}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-8">
              <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>
                Healthcare data is scattered everywhere.
              </h2>

              <div className={`text-lg sm:text-xl leading-relaxed space-y-6 ${
                darkMode ? 'text-content-primary' : 'text-content-secondary'
              }`}>
                <p>Your lab results live in one portal. Your prescriptions in another. Your specialist records somewhere else.</p>

                <p>Every new doctor visit means filling out the same paperwork and trying to remember years of medical history.</p>

                <p className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                  Important information gets lost between systems.
                </p>

                <p className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent pt-4`}>
                  Healthcare should not work this way.
                </p>
              </div>
            </div>

            {/* Right Side - Visual Problem Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[600px]">
                {/* Central Patient Icon - Confused/Overwhelmed */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl border-4 ${
                    darkMode
                      ? 'bg-surface-sunken border-stroke-default'
                      : 'bg-white border-stroke-default'
                  }`}>
                    <div className="relative">
                      <Heart className={`w-14 h-14 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`} />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs font-bold">?</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lab Portal - Top Left */}
                <div
                  className={`absolute top-8 left-4 w-48 p-4 rounded-xl shadow-xl transform -rotate-3 transition-transform hover:rotate-0 hover:scale-105 ${
                    darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                  }`}
                  style={{ animation: 'float 6s ease-in-out infinite' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-red-600" />
                    <span className={`font-bold text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Lab Portal</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-red-800' : 'bg-red-200'}`} style={{width: '80%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-red-800' : 'bg-red-200'}`} style={{width: '60%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-red-800' : 'bg-red-200'}`} style={{width: '90%'}}></div>
                  </div>
                </div>

                {/* Pharmacy - Top Right */}
                <div
                  className={`absolute top-8 right-4 w-48 p-4 rounded-xl shadow-xl transform rotate-3 transition-transform hover:rotate-0 hover:scale-105 ${
                    darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                  }`}
                  style={{ animation: 'float 6s ease-in-out infinite 1s' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-5 h-5 text-blue-600" />
                    <span className={`font-bold text-sm ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Pharmacy</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-blue-800' : 'bg-blue-200'}`} style={{width: '70%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-blue-800' : 'bg-blue-200'}`} style={{width: '85%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-blue-800' : 'bg-blue-200'}`} style={{width: '50%'}}></div>
                  </div>
                </div>

                {/* Primary Care - Left */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 left-0 w-48 p-4 rounded-xl shadow-xl transform -rotate-6 transition-transform hover:rotate-0 hover:scale-105 ${
                    darkMode ? 'bg-emerald-900/20 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200'
                  }`}
                  style={{ animation: 'float 6s ease-in-out infinite 2s' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span className={`font-bold text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Primary Care</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-emerald-800' : 'bg-emerald-200'}`} style={{width: '90%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-emerald-800' : 'bg-emerald-200'}`} style={{width: '65%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-emerald-800' : 'bg-emerald-200'}`} style={{width: '75%'}}></div>
                  </div>
                </div>

                {/* Specialist - Right */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 right-0 w-48 p-4 rounded-xl shadow-xl transform rotate-6 transition-transform hover:rotate-0 hover:scale-105 ${
                    darkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'
                  }`}
                  style={{ animation: 'float 6s ease-in-out infinite 3s' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span className={`font-bold text-sm ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>Specialist</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-purple-800' : 'bg-purple-200'}`} style={{width: '55%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-purple-800' : 'bg-purple-200'}`} style={{width: '80%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-purple-800' : 'bg-purple-200'}`} style={{width: '70%'}}></div>
                  </div>
                </div>

                {/* Hospital - Bottom Left */}
                <div
                  className={`absolute bottom-8 left-16 w-48 p-4 rounded-xl shadow-xl transform -rotate-2 transition-transform hover:rotate-0 hover:scale-105 ${
                    darkMode ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'
                  }`}
                  style={{ animation: 'float 6s ease-in-out infinite 4s' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <span className={`font-bold text-sm ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>Hospital Portal</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-orange-800' : 'bg-orange-200'}`} style={{width: '85%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-orange-800' : 'bg-orange-200'}`} style={{width: '60%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-orange-800' : 'bg-orange-200'}`} style={{width: '70%'}}></div>
                  </div>
                </div>

                {/* Insurance - Bottom Right */}
                <div
                  className={`absolute bottom-8 right-16 w-48 p-4 rounded-xl shadow-xl transform rotate-2 transition-transform hover:rotate-0 hover:scale-105 ${
                    darkMode ? 'bg-pink-900/20 border border-pink-800' : 'bg-pink-50 border border-pink-200'
                  }`}
                  style={{ animation: 'float 6s ease-in-out infinite 5s' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-pink-600" />
                    <span className={`font-bold text-sm ${darkMode ? 'text-pink-400' : 'text-pink-700'}`}>Insurance</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-pink-800' : 'bg-pink-200'}`} style={{width: '75%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-pink-800' : 'bg-pink-200'}`} style={{width: '50%'}}></div>
                    <div className={`h-1.5 rounded ${darkMode ? 'bg-pink-800' : 'bg-pink-200'}`} style={{width: '90%'}}></div>
                  </div>
                </div>

                {/* Disconnected lines showing fragmentation */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15">
                  <line x1="50%" y1="50%" x2="20%" y2="15%" stroke={darkMode ? '#ef4444' : '#dc2626'} strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="50%" y1="50%" x2="80%" y2="15%" stroke={darkMode ? '#3b82f6' : '#2563eb'} strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="50%" y1="50%" x2="10%" y2="50%" stroke={darkMode ? '#10b981' : '#059669'} strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="50%" y1="50%" x2="90%" y2="50%" stroke={darkMode ? '#a855f7' : '#9333ea'} strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="50%" y1="50%" x2="30%" y2="85%" stroke={darkMode ? '#f97316' : '#ea580c'} strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="50%" y1="50%" x2="70%" y2="85%" stroke={darkMode ? '#ec4899' : '#db2777'} strokeWidth="2" strokeDasharray="5,5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* CSS Animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(var(--rotate, 0deg)); }
            50% { transform: translateY(-20px) rotate(var(--rotate, 0deg)); }
          }
        `}} />
      </div>

      {/* Solution Section */}
      <div className={`py-24 sm:py-32 ${darkMode ? 'bg-surface-raised' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-bold mb-6 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>
              One place for your entire medical history.
            </h2>
            <p className={`text-lg sm:text-xl max-w-3xl mx-auto ${
              darkMode ? 'text-content-primary' : 'text-content-secondary'
            }`}>
              The Personal Health Vault creates a secure, patient-controlled home for your health information.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              { icon: FileText, title: 'Medical records', color: 'indigo' },
              { icon: FileSpreadsheet, title: 'Lab results and imaging', color: 'blue' },
              { icon: Pill, title: 'Medications and prescriptions', color: 'emerald' },
              { icon: Activity, title: 'Medical conditions and history', color: 'red' },
              { icon: Heart, title: 'Allergies and vitals', color: 'pink' },
              { icon: Calendar, title: 'Provider visits and care timeline', color: 'purple' },
              { icon: Clipboard, title: 'Personal health notes', color: 'amber' },
              { icon: Database, title: 'Complete health profile', color: 'cyan' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl ${
                    darkMode
                      ? 'bg-surface-sunken border border-stroke-default hover:border-stroke-default'
                      : 'bg-white border border-stroke-subtle hover:border-stroke-default shadow-md'
                  }`}
                >
                  <div className={`p-3 rounded-xl mb-4 w-fit bg-${item.color}-100 dark:bg-${item.color}-900/30`}>
                    <Icon className={`w-6 h-6 text-${item.color}-600`} />
                  </div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                    {item.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Experience Section */}
      <div className={`py-24 sm:py-32 ${darkMode ? 'bg-surface-sunken/50' : 'bg-surface-sunken'}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className={`text-4xl sm:text-5xl font-bold mb-6 ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>
                Your health history — organized and ready when you need it.
              </h2>
              <p className={`text-lg leading-relaxed mb-6 ${
                darkMode ? 'text-content-primary' : 'text-content-secondary'
              }`}>
                Your vault transforms scattered records into a living health timeline.
              </p>
              <p className={`text-lg leading-relaxed ${
                darkMode ? 'text-content-primary' : 'text-content-secondary'
              }`}>
                Everything you add becomes part of a secure, structured profile that grows with you over time.
              </p>
            </div>

            <div className="space-y-6">
              <div className={`rounded-2xl overflow-hidden shadow-2xl ${
                darkMode ? 'bg-surface-sunken border border-stroke-default' : 'bg-white border border-stroke-subtle'
              }`}>
                <div className={`p-4 border-b ${darkMode ? 'border-stroke-default bg-surface-raised/50' : 'border-stroke-subtle bg-surface-sunken'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className={`ml-4 text-sm font-medium ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                      Health Records
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                      Your Health Timeline
                    </h3>
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { date: 'Mar 10, 2026', title: 'Annual Physical', type: 'Lab Results' },
                      { date: 'Feb 15, 2026', title: 'Cardiology Visit', type: 'Consultation' },
                      { date: 'Jan 8, 2026', title: 'Blood Work Panel', type: 'Lab Results' },
                    ].map((record, idx) => (
                      <div key={idx} className={`p-4 rounded-xl ${
                        darkMode ? 'bg-surface-raised/50' : 'bg-surface-sunken'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <FileText className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                              {record.title}
                            </h4>
                            <p className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                              {record.type} · {record.date}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Sharing Section */}
      <div className={`py-24 sm:py-32 ${darkMode ? 'bg-surface-raised' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className={`rounded-2xl p-8 shadow-2xl ${
                darkMode ? 'bg-surface-sunken border border-stroke-default' : 'bg-white border border-stroke-subtle'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                    Share Records
                  </h3>
                  <button className="text-content-secondary hover:text-content-secondary">×</button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
                      Provider Email
                    </label>
                    <input
                      type="email"
                      placeholder="doctor@clinic.com"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-surface-raised border-stroke-default text-white placeholder:text-content-placeholder'
                          : 'bg-white border-stroke-default text-content-primary'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
                      Access Duration
                    </label>
                    <select className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-surface-raised border-stroke-default text-white'
                        : 'bg-white border-stroke-default text-content-primary'
                    }`}>
                      <option>7 days</option>
                      <option>30 days</option>
                      <option>90 days</option>
                    </select>
                  </div>
                </div>

                <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-surface-raised/50' : 'bg-surface-sunken'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                      4 items selected
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>
                      Medical History Form
                    </div>
                    <div className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>
                      Recent Lab Results
                    </div>
                    <div className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>
                      Current Medications
                    </div>
                    <div className={darkMode ? 'text-content-secondary' : 'text-content-secondary'}>
                      Allergy Information
                    </div>
                  </div>
                </div>

                <button className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                  Generate Secure Link
                </button>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className={`text-4xl sm:text-5xl font-bold mb-6 ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>
                Share your health history in seconds.
              </h2>
              <p className={`text-lg leading-relaxed mb-8 ${
                darkMode ? 'text-content-primary' : 'text-content-secondary'
              }`}>
                When visiting a new doctor or specialist, simply select the records you want to share and send a secure link.
              </p>
              <p className={`text-lg leading-relaxed mb-8 ${
                darkMode ? 'text-content-primary' : 'text-content-secondary'
              }`}>
                The provider receives your forms and records instantly — before you even arrive.
              </p>

              <ul className="space-y-4">
                {[
                  { icon: Link2, text: 'Secure access links' },
                  { icon: Clock, text: 'Expiring permissions' },
                  { icon: Download, text: 'Downloadable PDF packets' },
                  { icon: Database, text: 'FHIR JSON bundles for EHR systems' },
                  { icon: Eye, text: 'Patient-controlled permissions' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className={`text-lg ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
                        {item.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Real Life Scenario */}
      <div className={`py-24 sm:py-32 ${darkMode ? 'bg-surface-sunken/50' : 'bg-surface-sunken'}`}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-bold mb-6 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>
              A better experience for every doctor visit.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Schedule appointment', desc: 'Book your visit with a new specialist' },
              { num: '2', title: 'Open your Health Vault', desc: 'Review your organized medical history' },
              { num: '3', title: 'Select records to share', desc: 'Choose relevant forms and documents' },
              { num: '4', title: 'Send secure link', desc: 'Provider receives info before your visit' },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className={`rounded-2xl p-6 h-full ${
                  darkMode ? 'bg-surface-sunken border border-stroke-default' : 'bg-white border border-stroke-subtle'
                }`}>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-lg mb-4">
                    {step.num}
                  </div>
                  <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                    {step.desc}
                  </p>
                </div>
                {idx < 3 && (
                  <ArrowRight className="hidden lg:block absolute top-1/2 -right-8 transform -translate-y-1/2 text-indigo-600 w-6 h-6" />
                )}
              </div>
            ))}
          </div>

          <p className={`text-center text-lg mt-12 ${
            darkMode ? 'text-content-primary' : 'text-content-secondary'
          }`}>
            Your physician receives your information before the visit, giving them the context they need to provide better care.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className={`py-24 sm:py-32 ${darkMode ? 'bg-surface-raised' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-bold mb-6 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>
              Benefits for Everyone
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`rounded-2xl p-8 ${
              darkMode ? 'bg-surface-sunken border border-stroke-default' : 'bg-indigo-50 border border-indigo-100'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-600 rounded-xl">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                  For Patients
                </h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Total control of health records',
                  'No repeated paperwork',
                  'Complete medical history in one place',
                  'Faster doctor visits',
                  'Better long-term health tracking',
                ].map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className={darkMode ? 'text-content-primary' : 'text-content-primary'}>
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`rounded-2xl p-8 ${
              darkMode ? 'bg-surface-sunken border border-stroke-default' : 'bg-emerald-50 border border-emerald-100'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-600 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                  For Physicians
                </h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Pre-filled patient onboarding forms',
                  'Accurate patient histories',
                  'Reduced administrative burden',
                  'Faster intake and better care decisions',
                  'FHIR-ready interoperability',
                ].map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className={darkMode ? 'text-content-primary' : 'text-content-primary'}>
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Features */}
      <div className={`py-24 sm:py-32 ${darkMode ? 'bg-surface-sunken/50' : 'bg-surface-sunken'}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-bold mb-6 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>
              A complete platform built around your vault
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Clipboard,
                title: 'Smart Medical Forms',
                desc: 'Complete onboarding forms once and reuse them anywhere.',
                color: 'indigo',
              },
              {
                icon: Brain,
                title: 'AI Health Insights',
                desc: 'Your vault data enables personalized health insights.',
                color: 'purple',
              },
              {
                icon: Users,
                title: 'Family Health Network',
                desc: 'Securely connect family members to detect shared health risks.',
                color: 'emerald',
              },
              {
                icon: Share2,
                title: 'Secure Provider Sharing',
                desc: 'Send records directly to doctors with full patient control.',
                color: 'blue',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-8 transition-all hover:scale-105 ${
                    darkMode
                      ? 'bg-surface-sunken border border-stroke-default hover:border-stroke-default'
                      : 'bg-white border border-stroke-subtle hover:shadow-xl'
                  }`}
                >
                  <div className={`p-3 rounded-xl w-fit mb-4 bg-${feature.color}-100 dark:bg-${feature.color}-900/30`}>
                    <Icon className={`w-7 h-7 text-${feature.color}-600`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                    {feature.title}
                  </h3>
                  <p className={darkMode ? 'text-content-primary' : 'text-content-secondary'}>
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Closing Vision */}
      <div className={`py-32 sm:py-40 ${darkMode ? 'bg-surface-raised' : 'bg-white'}`}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Zap className="w-16 h-16 text-indigo-600 mx-auto mb-8" />
          <h2 className={`text-4xl sm:text-6xl font-bold mb-8 ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            Your health history is one of the most important records of your life.
          </h2>
          <p className={`text-xl sm:text-2xl leading-relaxed mb-12 ${
            darkMode ? 'text-content-primary' : 'text-content-secondary'
          }`}>
            Health Vault ensures it is organized, protected, and always within your control.
          </p>
          <button className="px-12 py-5 bg-indigo-600 text-white text-lg font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-2xl hover:shadow-indigo-500/50">
            Create Your Personal Health Vault
          </button>
        </div>
      </div>
    </div>
  );
}

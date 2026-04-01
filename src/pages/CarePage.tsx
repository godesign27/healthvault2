import { Beaker as BeakerIcon, Heart, Pill, FileText, Calendar, Search, Share2, ChevronDown } from 'lucide-react';
import { useState, MutableRefObject, useEffect, useRef } from 'react';

interface CarePageProps {
  darkMode?: boolean;
  actionsRef?: MutableRefObject<{
    openAddProvider?: () => void;
    refreshData?: () => void;
  }>;
}

export function CarePage({ darkMode = false, actionsRef }: CarePageProps) {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all-sources');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTimeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statsCards = [
    { title: 'Lab Results', count: 2, icon: BeakerIcon, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { title: 'Encounters', count: 2, icon: Heart, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { title: 'Medications', count: 3, icon: Pill, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { title: 'Claims', count: 1, icon: FileText, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' }
  ];

  const prescriptions = [
    {
      name: 'Albuterol Inhaler',
      condition: 'Asthma',
      dosage: '90 mcg, 2 puffs every 4-6 hours as needed',
      doctor: 'Dr. Sarah Johnson',
      refills: 3
    },
    {
      name: 'Fluticasone Propionate',
      condition: 'Asthma (maintenance)',
      dosage: '110 mcg, 2 puffs twice daily',
      doctor: 'Dr. Sarah Johnson',
      refills: 2
    },
    {
      name: 'Montelukast',
      condition: 'Asthma',
      dosage: '10 mg once daily at bedtime',
      doctor: 'Dr. Sarah Johnson',
      refills: 5
    }
  ];

  const appointments = [
    { doctor: 'Dr. Sarah Johnson', type: 'Annual Checkup', date: 'Apr 15' },
    { doctor: 'Dr. Michael Chen', type: 'Cardiology Follow-up', date: 'May 2' }
  ];

  const careHistory = [
    {
      type: 'Lab',
      date: 'September 19, 2025',
      title: 'Complete Blood Count (CBC)',
      description: 'All values within normal range. Follow-up in 6 months.',
      location: 'Quest Diagnostics'
    },
    {
      type: 'Encounter',
      date: 'September 14, 2025',
      title: 'Annual Physical Examination',
      description: 'Routine annual checkup with Dr. Sarah Johnson. Blood pressure and vitals normal.',
      location: 'UCSF Medical'
    },
    {
      type: 'Medication',
      date: 'August 9, 2025',
      title: 'Lisinopril 10mg - Prescription Filled',
      description: '30-day supply for blood pressure management. Next refill due in 30 days.',
      location: 'Walgreens'
    },
    {
      type: 'ER Visit',
      date: 'July 1, 2025',
      title: 'Emergency Department Visit',
      description: 'Chest pain evaluation. EKG and cardiac enzymes normal. Discharged home.',
      location: 'SF General'
    },
    {
      type: 'Lab',
      date: 'March 14, 2025',
      title: 'Lipid Panel',
      description: 'Cholesterol levels slightly elevated. Dietary changes recommended.',
      location: 'Quest Diagnostics'
    }
  ];

  const getTypeStyles = (type: string) => {
    if (darkMode) {
      switch (type) {
        case 'Lab':
          return 'bg-indigo-900/50 text-indigo-400';
        case 'Encounter':
          return 'bg-indigo-900/50 text-indigo-400';
        case 'Medication':
          return 'bg-indigo-900/50 text-indigo-400';
        case 'ER Visit':
          return 'bg-red-900/50 text-red-400';
        default:
          return 'bg-stone-700 text-stone-300';
      }
    } else {
      switch (type) {
        case 'Lab':
          return 'bg-indigo-50 text-indigo-700';
        case 'Encounter':
          return 'bg-indigo-50 text-indigo-700';
        case 'Medication':
          return 'bg-indigo-50 text-indigo-700';
        case 'ER Visit':
          return 'bg-red-50 text-red-700';
        default:
          return 'bg-stone-100 text-stone-700';
      }
    }
  };

  return (
    <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
      <div className="mb-8">
        <h1 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-stone-900'
        }`}>
          <Heart className="w-7 h-7" />
          Care Management
        </h1>
        <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Track your medications, appointments, and medical history</p>
      </div>

      <section className="mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${
          darkMode ? 'text-white' : 'text-stone-900'
        }`}>Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`rounded-xl border p-6 transition-all ${
              darkMode
                ? 'border-stone-800'
                : 'bg-white border-stone-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className={`text-sm font-medium ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>{card.title}</h3>
                <div className={`p-2.5 rounded-lg ${
                  darkMode ? 'bg-stone-700' : card.bgColor
                }`}>
                  <Icon className={`w-5 h-5 ${
                    darkMode ? 'text-indigo-400' : card.iconColor
                  }`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>{card.count}</p>
            </div>
          );
        })}
        </div>
      </section>

      <section className="mb-8">
        <div className={`rounded-xl border p-6 ${
          darkMode
            ? 'border-stone-800'
            : 'bg-white border-stone-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className={`w-5 h-5 ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`} />
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>Appointments</h2>
          </div>
          <p className={`text-sm mb-6 ${
            darkMode ? 'text-stone-400' : 'text-stone-600'
          }`}>Your upcoming healthcare appointments</p>

          <div>
            <h3 className={`font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>Upcoming Appointments</h3>
            <div className="space-y-4">
              {appointments.map((apt, index) => (
                <div key={index} className={`pb-4 border-b last:border-0 last:pb-0 ${
                  darkMode ? 'border-stone-700' : 'border-stone-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-medium ${
                        darkMode ? 'text-white' : 'text-stone-900'
                      }`}>{apt.doctor}</p>
                      <p className={`text-sm ${
                        darkMode ? 'text-stone-400' : 'text-stone-600'
                      }`}>{apt.type}</p>
                    </div>
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-white' : 'text-stone-900'
                    }`}>{apt.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className={`rounded-xl border p-6 ${
          darkMode
            ? 'border-stone-800'
            : 'bg-white border-stone-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Pill className={`w-5 h-5 ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`} />
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>Medications</h2>
          </div>
          <p className={`text-sm mb-6 ${
            darkMode ? 'text-stone-400' : 'text-stone-600'
          }`}>3 medications currently prescribed</p>

          <div className="space-y-4">
            {prescriptions.map((rx, index) => (
              <div key={index} className={`rounded-lg border p-4 ${
                darkMode ? 'border-stone-700 bg-stone-900' : 'border-stone-200 bg-stone-50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${
                    darkMode ? 'text-white' : 'text-stone-900'
                  }`}>{rx.name}</h3>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                </div>
                <span className={`text-sm block mb-2 ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>{rx.condition}</span>
                <p className={`text-sm mb-2 ${
                  darkMode ? 'text-stone-300' : 'text-stone-700'
                }`}>{rx.dosage}</p>
                <div className={`flex items-center gap-4 text-sm ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {rx.doctor}
                  </span>
                  <span>•</span>
                  <span>{rx.refills} refills remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`rounded-xl border p-6 ${
        darkMode
          ? 'border-stone-800'
          : 'bg-white border-stone-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl font-semibold mb-1 ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>Care History</h2>
            <p className={`text-sm ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>Complete timeline of your healthcare journey</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Filter Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  darkMode
                    ? 'bg-stone-800 text-white hover:bg-stone-700 border border-stone-700'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {[
                    { id: 'all', label: 'All time' },
                    { id: '6months', label: 'Last 6 months' },
                    { id: 'year', label: 'Last year' },
                    { id: '5years', label: 'Last 5 years' }
                  ].find(f => f.id === selectedTimeFilter)?.label || 'All time'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTimeDropdownOpen && (
                <div className={`absolute top-full left-0 mt-2 w-48 rounded-lg shadow-lg border z-10 ${
                  darkMode
                    ? 'bg-stone-800 border-stone-700'
                    : 'bg-white border-stone-200'
                }`}>
                  {[
                    { id: 'all', label: 'All time' },
                    { id: '6months', label: 'Last 6 months' },
                    { id: 'year', label: 'Last year' },
                    { id: '5years', label: 'Last 5 years' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setSelectedTimeFilter(filter.id);
                        setIsTimeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        selectedTimeFilter === filter.id
                          ? darkMode
                            ? 'bg-stone-700 text-white font-medium'
                            : 'bg-stone-900 text-white font-medium'
                          : darkMode
                            ? 'text-stone-300 hover:bg-stone-700'
                            : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Icon/Bar */}
            <div className="relative">
              {!isSearchExpanded ? (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className={`p-2.5 rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-stone-800 hover:bg-stone-700 border border-stone-700'
                      : 'bg-white hover:bg-stone-50 border border-stone-200'
                  }`}
                  aria-label="Open search"
                >
                  <Search className={`w-5 h-5 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`} />
                </button>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search your care timeline..."
                    autoFocus
                    onBlur={() => setIsSearchExpanded(false)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all ${
                      darkMode
                        ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500'
                        : 'bg-white border-stone-200'
                    }`}
                    style={{ minWidth: '300px' }}
                  />
                </div>
              )}
            </div>

            {/* Share Link Button */}
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share Link
            </button>
          </div>
        </div>

        <div className="mb-6">

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all-sources', label: 'All sources' },
              { id: 'labs', label: 'Labs only' },
              { id: 'medications', label: 'Medications' },
              { id: 'encounters', label: 'Encounters' },
              { id: 'claims', label: 'Claims' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedSourceFilter(filter.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedSourceFilter === filter.id
                    ? darkMode
                      ? 'bg-stone-700 text-white'
                      : 'bg-stone-900 text-white'
                    : darkMode
                      ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <p className={`text-sm mb-6 ${
          darkMode ? 'text-stone-400' : 'text-stone-600'
        }`}>Showing 6 of 6 records</p>

        <div className="space-y-4">
          {careHistory.map((record, index) => (
            <div key={index} className={`border rounded-lg p-5 hover:shadow-md transition-shadow ${
              darkMode
                ? 'border-stone-700 bg-stone-750'
                : 'bg-white border-stone-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeStyles(record.type)}`}>
                      {record.type}
                    </span>
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-white' : 'text-stone-900'
                    }`}>{record.date}</span>
                  </div>
                  <h3 className={`font-semibold mb-2 ${
                    darkMode ? 'text-white' : 'text-stone-900'
                  }`}>{record.title}</h3>
                  <p className={`text-sm mb-2 ${
                    darkMode ? 'text-stone-400' : 'text-stone-600'
                  }`}>{record.description}</p>
                </div>
                <span className={`text-sm ml-4 ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>{record.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

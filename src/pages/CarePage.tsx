import { Beaker as BeakerIcon, Heart, Pill, FileText, Calendar, Search, Share2, ChevronDown } from 'lucide-react';
import { useState, MutableRefObject, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface CarePageProps {
  darkMode?: boolean;
  actionsRef?: MutableRefObject<{
    openAddProvider?: () => void;
    refreshData?: () => void;
  }>;
}

interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  prescribing_doctor?: string;
  condition?: string;
  refills_remaining?: number;
  status?: string;
}

interface Appointment {
  id: string;
  provider_name: string;
  appointment_type: string;
  scheduled_at: string;
  location?: string;
  status: string;
}

interface EncounterRow {
  id: string;
  encounter_type: string;
  encounter_date: string;
  provider_name?: string;
  facility_name?: string;
  chief_complaint?: string;
  notes?: string;
}

interface ClaimRow {
  id: string;
  service_date: string;
  provider_name?: string;
  description?: string;
  amount_billed?: number;
  status?: string;
}

export function CarePage({ darkMode = false, actionsRef }: CarePageProps) {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all-sources');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [encounters, setEncounters] = useState<EncounterRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTimeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      const userId = session.user.id;

      const [medsRes, apptRes, encRes, claimRes] = await Promise.all([
        supabase.from('medications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').eq('user_id', userId).eq('status', 'scheduled').order('scheduled_at', { ascending: true }),
        supabase.from('encounters').select('*').eq('user_id', userId).order('encounter_date', { ascending: false }),
        supabase.from('claims').select('*').eq('user_id', userId).order('service_date', { ascending: false }),
      ]);

      setMedications(medsRes.data || []);
      setAppointments(apptRes.data || []);
      setEncounters(encRes.data || []);
      setClaims(claimRes.data || []);
    } catch {
      // silently fail - empty state shown
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (actionsRef) {
      actionsRef.current = { refreshData: loadData };
    }
  }, []);

  const labRecords = encounters.filter(e => e.encounter_type?.toLowerCase() === 'lab');

  const statsCards = [
    { title: 'Lab Results', count: labRecords.length, icon: BeakerIcon, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { title: 'Encounters', count: encounters.length, icon: Heart, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { title: 'Medications', count: medications.length, icon: Pill, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { title: 'Claims', count: claims.length, icon: FileText, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' }
  ];

  const careHistory = [
    ...encounters.map(e => ({
      type: e.encounter_type || 'Encounter',
      date: new Date(e.encounter_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      title: e.chief_complaint || `${e.encounter_type} Visit`,
      description: e.notes || '',
      location: e.facility_name || e.provider_name || '',
      rawDate: e.encounter_date,
    })),
    ...claims.map(c => ({
      type: 'Claim',
      date: new Date(c.service_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      title: c.description || 'Insurance Claim',
      description: c.amount_billed ? `Billed: $${c.amount_billed.toFixed(2)}` : '',
      location: c.provider_name || '',
      rawDate: c.service_date,
    })),
  ].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const timeFilteredHistory = careHistory.filter(item => {
    if (selectedTimeFilter === 'all') return true;
    const itemDate = new Date(item.rawDate);
    const now = new Date();
    if (selectedTimeFilter === '6months') {
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 6);
      return itemDate >= cutoff;
    }
    if (selectedTimeFilter === 'year') {
      const cutoff = new Date(now);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      return itemDate >= cutoff;
    }
    if (selectedTimeFilter === '5years') {
      const cutoff = new Date(now);
      cutoff.setFullYear(cutoff.getFullYear() - 5);
      return itemDate >= cutoff;
    }
    return true;
  });

  const sourceFilteredHistory = timeFilteredHistory.filter(item => {
    if (selectedSourceFilter === 'all-sources') return true;
    if (selectedSourceFilter === 'labs') return item.type.toLowerCase() === 'lab';
    if (selectedSourceFilter === 'encounters') return item.type.toLowerCase() !== 'claim';
    if (selectedSourceFilter === 'claims') return item.type === 'Claim';
    return true;
  });

  const searchFilteredHistory = sourceFilteredHistory.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
  });

  const getTypeStyles = (type: string) => {
    if (darkMode) {
      if (type === 'ER Visit') return 'bg-red-900/50 text-red-400';
      if (type === 'Claim') return 'bg-amber-900/50 text-amber-400';
      return 'bg-indigo-900/50 text-indigo-400';
    } else {
      if (type === 'ER Visit') return 'bg-red-50 text-red-700';
      if (type === 'Claim') return 'bg-amber-50 text-amber-700';
      return 'bg-indigo-50 text-indigo-700';
    }
  };

  const EmptyState = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-surface-sunken">
        <Icon className="w-6 h-6 text-content-tertiary" />
      </div>
      <p className="font-medium mb-1 text-content-primary">{title}</p>
      <p className="text-sm text-content-secondary">{description}</p>
    </div>
  );

  return (
    <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-content-primary">
          <Heart className="w-7 h-7" />
          Care Management
        </h1>
        <p className="text-content-secondary">Track your medications, appointments, and medical history</p>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-content-primary">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="hv-surface-card p-6 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-medium text-content-secondary">{card.title}</h3>
                  <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-surface-sunken' : card.bgColor}`}>
                    <Icon className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : card.iconColor}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-content-primary">{isLoading ? '—' : card.count}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <div className="hv-surface-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-content-secondary" />
            <h2 className="text-lg font-semibold text-content-primary">Upcoming Appointments</h2>
          </div>

          {isLoading ? (
            <div className="h-24 rounded-lg animate-pulse bg-surface-sunken" />
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming appointments"
              description="Your scheduled appointments will appear here. Ask the AI assistant to schedule one."
            />
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt.id} className="pb-4 border-b border-stroke-subtle last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-content-primary">{apt.provider_name}</p>
                      <p className="text-sm text-content-secondary">{apt.appointment_type}{apt.location ? ` · ${apt.location}` : ''}</p>
                    </div>
                    <span className="text-sm font-medium text-content-primary">
                      {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <div className="hv-surface-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-content-secondary" />
            <h2 className="text-lg font-semibold text-content-primary">Medications</h2>
          </div>

          {isLoading ? (
            <div className="h-24 rounded-lg animate-pulse bg-surface-sunken" />
          ) : medications.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No medications on file"
              description="Medications added to your medical profile will appear here."
            />
          ) : (
            <>
              <p className="text-sm mb-6 text-content-secondary">
                {medications.length} medication{medications.length !== 1 ? 's' : ''} on file
              </p>
              <div className="space-y-4">
                {medications.map((rx) => (
                  <div key={rx.id} className="rounded-lg border border-stroke-subtle bg-surface-sunken p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-content-primary">{rx.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        rx.status === 'discontinued'
                          ? 'bg-surface-overlay text-content-secondary'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {rx.status === 'discontinued' ? 'Discontinued' : 'Active'}
                      </span>
                    </div>
                    {rx.condition && (
                      <span className="text-sm block mb-2 text-content-secondary">{rx.condition}</span>
                    )}
                    {rx.dosage && (
                      <p className="text-sm mb-2 text-content-primary">{rx.dosage}{rx.frequency ? ` · ${rx.frequency}` : ''}</p>
                    )}
                    {rx.prescribing_doctor && (
                      <div className="flex items-center gap-1 text-sm text-content-secondary">
                        <Heart className="w-4 h-4" />
                        {rx.prescribing_doctor}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="hv-surface-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-1 text-content-primary">Care History</h2>
            <p className="text-sm text-content-secondary">Complete timeline of your healthcare journey</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 bg-surface-sunken text-content-primary border border-stroke-subtle hover:bg-surface-overlay"
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
                <div className="absolute left-0 top-full z-10 mt-2 w-48 hv-surface-card hv-surface-card--flat rounded-lg shadow-lg">
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
                          ? 'bg-action-primary text-content-on-action font-medium'
                          : 'text-content-secondary hover:bg-surface-sunken'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              {!isSearchExpanded ? (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2.5 rounded-lg transition-colors bg-surface-sunken hover:bg-surface-overlay border border-stroke-subtle"
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5 text-content-secondary" />
                </button>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-tertiary" />
                  <input
                    type="text"
                    placeholder="Search care timeline..."
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-surface-raised border-stroke-subtle text-content-primary placeholder:text-content-placeholder"
                    style={{ minWidth: '300px' }}
                  />
                </div>
              )}
            </div>

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
              { id: 'encounters', label: 'Encounters' },
              { id: 'claims', label: 'Claims' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedSourceFilter(filter.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedSourceFilter === filter.id
                    ? 'bg-action-primary text-content-on-action'
                    : 'bg-surface-sunken text-content-secondary hover:bg-surface-overlay'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-lg animate-pulse bg-surface-sunken" />
            ))}
          </div>
        ) : searchFilteredHistory.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No care history yet"
            description="Your encounters and claims will appear here once connected providers share your records."
          />
        ) : (
          <>
            <p className="text-sm mb-6 text-content-secondary">Showing {searchFilteredHistory.length} of {careHistory.length} records</p>

            <div className="space-y-4">
              {searchFilteredHistory.map((record, index) => (
                <div key={index} className="hv-surface-card p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeStyles(record.type)}`}>
                          {record.type}
                        </span>
                        <span className="text-sm font-medium text-content-primary">{record.date}</span>
                      </div>
                      <h3 className="font-semibold mb-2 text-content-primary">{record.title}</h3>
                      {record.description && (
                        <p className="text-sm mb-2 text-content-secondary">{record.description}</p>
                      )}
                    </div>
                    {record.location && (
                      <span className="text-sm ml-4 text-content-secondary">{record.location}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

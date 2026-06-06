import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMedications } from '../hooks/useMedications';
import { useCareStats } from '../hooks/useCareStats';

// Steel theme colors (aligned with desktop Care surface)
const STEEL = {
  canvas: 'transparent',
  surface: '#FFFFFF',
  border: '#D1D5E0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#4F46E5',
  accentBg: '#EEF2FF',
  success: '#10B981',
  successBg: '#D1FAE5',
};

const TIME_OPTIONS = [
  { id: 'all', label: 'All time' },
  { id: '6months', label: 'Last 6 months' },
  { id: 'year', label: 'Last year' },
  { id: '5years', label: 'Last 5 years' },
];

const SOURCE_OPTIONS = [
  { id: 'all-sources', label: 'All sources' },
  { id: 'labs', label: 'Labs only' },
  { id: 'encounters', label: 'Encounters' },
  { id: 'claims', label: 'Claims' },
];

/*
 * MOCK_FALLBACK — previous sample medications (live data from `medications` table via useMedications).
 */

const mockAppointments = [];

const mockEncounters = [
  {
    id: 'e1',
    encounter_type: 'Lab',
    encounter_date: '2025-04-10',
    chief_complaint: 'Complete Blood Count',
    notes: 'Results within normal range',
    facility_name: 'City Lab',
    provider_name: '',
  },
  {
    id: 'e2',
    encounter_type: 'Office Visit',
    encounter_date: '2024-11-02',
    chief_complaint: 'Annual wellness visit',
    notes: '',
    facility_name: '',
    provider_name: 'Dr. Sarah Johnson',
  },
];

const mockClaims = [
  {
    id: 'c1',
    service_date: '2024-10-15',
    description: 'Insurance Claim',
    amount_billed: 120,
    provider_name: 'City Hospital',
  },
];

function buildCareHistory(encounters, claims) {
  const rows = [
    ...encounters.map((e) => ({
      type: e.encounter_type || 'Encounter',
      date: new Date(e.encounter_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      title: e.chief_complaint || `${e.encounter_type || 'Encounter'} Visit`,
      description: e.notes || '',
      location: e.facility_name || e.provider_name || '',
      rawDate: e.encounter_date,
    })),
    ...claims.map((c) => ({
      type: 'Claim',
      date: new Date(c.service_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      title: c.description || 'Insurance Claim',
      description: c.amount_billed != null ? `Billed: $${Number(c.amount_billed).toFixed(2)}` : '',
      location: c.provider_name || '',
      rawDate: c.service_date,
    })),
  ];
  rows.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
  return rows;
}

function getHistoryTypeColors(type) {
  if (type === 'ER Visit') return { bg: '#fef2f2', fg: '#b91c1c' };
  if (type === 'Claim') return { bg: '#fffbeb', fg: '#b45309' };
  return { bg: '#EEF2FF', fg: '#4338ca' };
}

function StatMiniCard({ label, icon, count, loading }) {
  const display = loading ? '—' : String(count);
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardTop}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statIconWrap}>
          <Ionicons name={icon} size={18} color={STEEL.accent} />
        </View>
      </View>
      <Text style={styles.statCount}>{display}</Text>
    </View>
  );
}

function EmptyBlock({ icon, title, description }) {
  return (
    <View style={styles.emptyBlock}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={icon} size={28} color={STEEL.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{description}</Text>
    </View>
  );
}

function HistoryRow({ record }) {
  const { bg, fg } = getHistoryTypeColors(record.type);
  return (
    <View style={styles.historyRowCard}>
      <View style={styles.historyRowTop}>
        <View style={styles.historyRowMeta}>
          <View style={[styles.typeBadge, { backgroundColor: bg }]}>
            <Text style={[styles.typeBadgeText, { color: fg }]}>{record.type}</Text>
          </View>
          <Text style={styles.historyRowDate}>{record.date}</Text>
        </View>
        {!!record.location && <Text style={styles.historyRowLocation}>{record.location}</Text>}
      </View>
      <Text style={styles.historyRowTitle}>{record.title}</Text>
      {!!record.description && <Text style={styles.historyRowBody}>{record.description}</Text>}
    </View>
  );
}

export default function CareScreen({ omitShellTitle = false, scrollFabProps = {} }) {
  const insets = useSafeAreaInsets();
  const { medications, loading: medsLoading, error: medsError, refetch: refetchMeds } = useMedications();
  const { stats: careStats, loading: statsLoading, error: statsError, refetch: refetchCareStats } = useCareStats();

  const onRefresh = useCallback(() => {
    refetchMeds();
    refetchCareStats();
  }, [refetchMeds, refetchCareStats]);

  const overviewStats = useMemo(
    () => [
      { key: 'labResults', label: 'Lab Results', icon: 'flask-outline', count: careStats.labResults },
      { key: 'encounters', label: 'Encounters', icon: 'heart-outline', count: careStats.encounters },
      { key: 'medications', label: 'Medications', icon: 'medkit-outline', count: careStats.medications },
      { key: 'claims', label: 'Claims', icon: 'document-text-outline', count: careStats.claims },
    ],
    [careStats]
  );

  const appointments = mockAppointments;
  const encounters = mockEncounters;
  const claims = mockClaims;
  const isLoading = false;

  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all-sources');
  const [timeMenuOpen, setTimeMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const careHistory = useMemo(() => buildCareHistory(encounters, claims), [encounters, claims]);

  const timeFilteredHistory = useMemo(() => {
    return careHistory.filter((item) => {
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
  }, [careHistory, selectedTimeFilter]);

  const sourceFilteredHistory = useMemo(() => {
    return timeFilteredHistory.filter((item) => {
      if (selectedSourceFilter === 'all-sources') return true;
      if (selectedSourceFilter === 'labs') return item.type.toLowerCase() === 'lab';
      if (selectedSourceFilter === 'encounters') return item.type.toLowerCase() !== 'claim';
      if (selectedSourceFilter === 'claims') return item.type === 'Claim';
      return true;
    });
  }, [timeFilteredHistory, selectedSourceFilter]);

  const searchFilteredHistory = useMemo(() => {
    if (!searchQuery) return sourceFilteredHistory;
    const q = searchQuery.toLowerCase();
    return sourceFilteredHistory.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    );
  }, [sourceFilteredHistory, searchQuery]);

  const timeLabel = TIME_OPTIONS.find((t) => t.id === selectedTimeFilter)?.label || 'All time';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: STEEL.canvas }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 100, flexGrow: 1 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={medsLoading || statsLoading}
          onRefresh={onRefresh}
          tintColor="#4F46E5"
        />
      }
      {...scrollFabProps}
    >
      {!omitShellTitle ? (
        <View style={styles.pageIntro}>
          <View style={styles.pageTitleRow}>
            <Ionicons name="heart" size={26} color="#E11D48" />
            <Text style={styles.pageTitle}>Care Management</Text>
          </View>
          <Text style={styles.pageSubtitle}>Track your medications, appointments, and medical history</Text>
        </View>
      ) : null}

      {/* Overview — same counts as desktop CarePage (no nested ScrollView; avoids blank layout) */}
      <Text style={styles.sectionHeading}>Overview</Text>
      <View style={styles.statGrid}>
        {overviewStats.map((s) => (
          <StatMiniCard
            key={s.key}
            label={s.label}
            icon={s.icon}
            count={s.count}
            loading={statsLoading}
          />
        ))}
      </View>
      {statsError ? <Text style={styles.inlineError}>{statsError}</Text> : null}

      {/* Upcoming Appointments */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="calendar-outline" size={20} color={STEEL.textSecondary} />
          <Text style={styles.cardTitle}>Upcoming Appointments</Text>
        </View>
        {isLoading ? (
          <View style={styles.skeletonBar} />
        ) : appointments.length === 0 ? (
          <EmptyBlock
            icon="calendar-outline"
            title="No upcoming appointments"
            description="Your scheduled appointments will appear here. Ask the AI assistant to schedule one."
          />
        ) : (
          <View style={styles.listBlock}>
            {appointments.map((apt) => (
              <View key={apt.id} style={styles.apptRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.apptProvider}>{apt.provider_name}</Text>
                  <Text style={styles.apptMeta}>
                    {apt.appointment_type}
                    {apt.location ? ` · ${apt.location}` : ''}
                  </Text>
                </View>
                <Text style={styles.apptDate}>
                  {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Medications — same fields / copy as desktop */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="medkit-outline" size={20} color={STEEL.textSecondary} />
          <Text style={styles.cardTitle}>Medications</Text>
        </View>
        {medsError ? <Text style={styles.inlineError}>{medsError}</Text> : null}
        {medsLoading && medications.length === 0 ? (
          <>
            <View style={styles.skeletonRow} />
            <View style={styles.skeletonRow} />
          </>
        ) : medications.length === 0 ? (
          <View style={styles.emptyBlock}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="medical-outline" size={28} color={STEEL.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No medications on file</Text>
            <Text style={styles.emptyDesc}>Ask the AI assistant to log a medication</Text>
          </View>
        ) : (
          <>
            <Text style={styles.medsMeta}>
              {medications.length} medication{medications.length !== 1 ? 's' : ''} on file
            </Text>
            {medications.map((rx) => {
              const isDiscontinued =
                rx.status?.toLowerCase() === 'discontinued' || rx.status?.toLowerCase() === 'inactive';
              const doseLine = [rx.dosage, rx.frequency].filter(Boolean).join(' · ') || rx.instructions;
              return (
                <View key={rx.id} style={styles.medRow}>
                  <View style={styles.medNameRow}>
                    <Text style={styles.medName}>{rx.name}</Text>
                    <View style={[styles.statusPill, isDiscontinued ? styles.statusPillInactive : styles.statusPillActive]}>
                      <Text
                        style={isDiscontinued ? styles.statusPillTextInactive : styles.statusPillTextActive}
                      >
                        {isDiscontinued ? 'Inactive' : 'Active'}
                      </Text>
                    </View>
                  </View>
                  {!!rx.condition && <Text style={styles.medCondition}>{rx.condition}</Text>}
                  {!!doseLine && <Text style={styles.medInstructions}>{doseLine}</Text>}
                  {!!rx.prescribing_doctor && (
                    <View style={styles.medDoctorRow}>
                      <Ionicons name="heart" size={14} color={STEEL.textSecondary} />
                      <Text style={styles.medDoctor}>{rx.prescribing_doctor}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </View>

      {/* Care History — same merge, time/source/search filters as desktop */}
      <View style={styles.card}>
        <View style={styles.historyHeader}>
          <View style={styles.historyTitles}>
            <Text style={styles.historyMainTitle}>Care History</Text>
            <Text style={styles.historySubtitle}>Complete timeline of your healthcare journey</Text>
          </View>
        </View>

        <View style={styles.historyToolbar}>
          <View style={styles.timeFilterWrap}>
            <TouchableOpacity
              style={styles.timeFilterBtn}
              onPress={() => setTimeMenuOpen((o) => !o)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Time range"
            >
              <Ionicons name="calendar-outline" size={18} color={STEEL.textPrimary} />
              <Text style={styles.timeFilterText}>{timeLabel}</Text>
              <Ionicons name="chevron-down" size={18} color={STEEL.textSecondary} />
            </TouchableOpacity>
            {timeMenuOpen && (
              <View style={styles.timeMenu}>
                {TIME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.timeMenuItem, selectedTimeFilter === opt.id && styles.timeMenuItemActive]}
                    onPress={() => {
                      setSelectedTimeFilter(opt.id);
                      setTimeMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.timeMenuItemText,
                        selectedTimeFilter === opt.id && styles.timeMenuItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setSearchExpanded((e) => !e)}
            accessibilityRole="button"
            accessibilityLabel={searchExpanded ? 'Close search' : 'Search'}
          >
            <Ionicons name="search-outline" size={22} color={STEEL.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.9} accessibilityRole="button">
            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share Link</Text>
          </TouchableOpacity>
        </View>

        {searchExpanded && (
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={STEEL.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search care timeline..."
              placeholderTextColor={STEEL.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        <View style={styles.filterTabs}>
          {SOURCE_OPTIONS.map((f) => {
            const active = selectedSourceFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setSelectedSourceFilter(f.id)}
                style={[styles.filterTab, active && styles.filterTabActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.historySkeletonWrap}>
            {[0, 1, 2].map((k) => (
              <View key={k} style={styles.skeletonHistory} />
            ))}
          </View>
        ) : searchFilteredHistory.length === 0 ? (
          <EmptyBlock
            icon="document-text-outline"
            title="No care history yet"
            description="Your encounters and claims will appear here once connected providers share your records."
          />
        ) : (
          <>
            <Text style={styles.careShowingCount}>
              Showing {searchFilteredHistory.length} of {careHistory.length} records
            </Text>
            {searchFilteredHistory.map((record, index) => (
              <HistoryRow key={`${record.rawDate}-${record.type}-${index}`} record={record} />
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pageIntro: { marginBottom: 20 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: STEEL.textPrimary },
  pageSubtitle: { fontSize: 15, color: STEEL.textSecondary, lineHeight: 22 },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: STEEL.textPrimary, marginBottom: 12 },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: STEEL.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
    padding: 14,
    ...cardShadow,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: STEEL.textSecondary, paddingRight: 8 },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: STEEL.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: { fontSize: 28, fontWeight: '800', color: STEEL.textPrimary },
  card: {
    backgroundColor: STEEL.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
    padding: 18,
    marginBottom: 16,
    ...cardShadow,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: STEEL.textPrimary },
  skeletonBar: {
    height: 96,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  skeletonRow: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  inlineError: { fontSize: 13, color: '#EF4444', marginBottom: 10, lineHeight: 18 },
  emptyBlock: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 8 },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: STEEL.textPrimary, marginBottom: 6, textAlign: 'center' },
  emptyDesc: {
    fontSize: 13,
    color: STEEL.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  listBlock: { gap: 0 },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: STEEL.border,
  },
  apptProvider: { fontSize: 15, fontWeight: '600', color: STEEL.textPrimary },
  apptMeta: { fontSize: 13, color: STEEL.textSecondary, marginTop: 4 },
  apptDate: { fontSize: 13, fontWeight: '600', color: STEEL.textPrimary, marginLeft: 8 },
  medsMeta: { fontSize: 13, color: STEEL.textSecondary, marginBottom: 14 },
  medRow: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
    backgroundColor: '#F8FAFC',
    padding: 14,
    marginBottom: 10,
  },
  medNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  medName: { fontSize: 16, fontWeight: '700', color: STEEL.textPrimary },
  medCondition: { fontSize: 13, color: STEEL.textSecondary, marginBottom: 6 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusPillActive: { backgroundColor: STEEL.successBg },
  statusPillInactive: { backgroundColor: '#E2E8F0' },
  statusPillTextActive: { fontSize: 11, fontWeight: '700', color: STEEL.success },
  statusPillTextInactive: { fontSize: 11, fontWeight: '600', color: STEEL.textSecondary },
  medInstructions: { fontSize: 14, color: STEEL.textPrimary, lineHeight: 20, marginBottom: 4 },
  medDoctorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  medDoctor: { fontSize: 13, color: STEEL.textSecondary },
  historyHeader: { marginBottom: 14 },
  historyTitles: { gap: 4 },
  historyMainTitle: { fontSize: 20, fontWeight: '700', color: STEEL.textPrimary },
  historySubtitle: { fontSize: 13, color: STEEL.textSecondary, lineHeight: 18 },
  historyToolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    zIndex: 2,
  },
  timeFilterWrap: { position: 'relative', zIndex: 20 },
  timeFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEEL.border,
    backgroundColor: '#F8FAFC',
  },
  timeFilterText: { fontSize: 14, fontWeight: '600', color: STEEL.textPrimary },
  timeMenu: {
    position: 'absolute',
    left: 0,
    top: 48,
    minWidth: 180,
    backgroundColor: STEEL.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STEEL.border,
    overflow: 'hidden',
    ...cardShadow,
    zIndex: 10,
  },
  timeMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: STEEL.border,
  },
  timeMenuItemActive: { backgroundColor: STEEL.accentBg },
  timeMenuItemText: { fontSize: 14, color: STEEL.textSecondary },
  timeMenuItemTextActive: { color: STEEL.accent, fontWeight: '700' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEEL.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: STEEL.accent,
  },
  shareBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: STEEL.textPrimary, paddingVertical: 10, minHeight: 44 },
  filterTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  filterTab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: 'transparent' },
  filterTabActive: { backgroundColor: STEEL.accent },
  filterTabText: { fontSize: 13, fontWeight: '600', color: STEEL.textSecondary },
  filterTabTextActive: { color: '#FFFFFF' },
  careShowingCount: { fontSize: 12, color: STEEL.textSecondary, marginBottom: 10 },
  historySkeletonWrap: { gap: 10, marginTop: 8 },
  skeletonHistory: { height: 96, borderRadius: 10, backgroundColor: '#E2E8F0' },
  historyRowCard: {
    backgroundColor: STEEL.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
  },
  historyRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  historyRowMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, flex: 1, minWidth: 0 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typeBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  historyRowDate: { fontSize: 13, fontWeight: '600', color: STEEL.textPrimary },
  historyRowLocation: { fontSize: 12, color: STEEL.textSecondary, maxWidth: 120, textAlign: 'right' },
  historyRowTitle: { fontSize: 15, fontWeight: '700', color: STEEL.textPrimary, marginBottom: 4 },
  historyRowBody: { fontSize: 13, color: STEEL.textSecondary, lineHeight: 19 },
});

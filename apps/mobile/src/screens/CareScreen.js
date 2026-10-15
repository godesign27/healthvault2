import {recordsColors} from '../theme/records';
import {typeStyles,control,space} from '../theme/layout';
import {AppText as Text,AppTextInput as TextInput} from '../components/ui/AppText';
import React, { useMemo, useState, useCallback, createContext, useContext } from 'react';
import {
  View,

  ScrollView,
  TouchableOpacity,
  StyleSheet,

  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMedications } from '../hooks/useMedications';
import { formatCareDate, parseCareDate } from '../lib/careDates';
import { useCareData } from '../hooks/useCareData';
import { useCareStats } from '../hooks/useCareStats';

const CareTheme = createContext(null);
export default function CareScreen({ darkMode = false, ...props }) {
  const theme = useMemo(() => {
    const STEEL = recordsColors(darkMode);
    return { STEEL, styles: createStyles(STEEL) };
  }, [darkMode]);
  return <CareTheme.Provider value={theme}><CareContent {...props} /></CareTheme.Provider>;
}

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

function buildCareHistory(encounters, claims) {
  const rows = [
    ...encounters.map((e) => ({
      type: e.encounter_type || 'Encounter',
      date: formatCareDate(e.encounter_date),
      title: e.chief_complaint || `${e.encounter_type || 'Encounter'} Visit`,
      description: e.notes || '',
      location: e.facility_name || e.provider_name || '',
      rawDate: e.encounter_date,
    })),
    ...claims.map((c) => ({
      type: 'Claim',
      date: formatCareDate(c.service_date),
      title: c.description || 'Insurance Claim',
      description: c.amount_billed != null ? `Billed: $${Number(c.amount_billed).toFixed(2)}` : '',
      location: c.provider_name || '',
      rawDate: c.service_date,
    })),
  ];
  rows.sort((a, b) => (parseCareDate(b.rawDate)?.getTime() ?? -Infinity) - (parseCareDate(a.rawDate)?.getTime() ?? -Infinity));
  return rows;
}

function StatMiniCard({ label, icon, count, loading }) {
  const { STEEL, styles } = useContext(CareTheme);
  const display = loading ? '—' : String(count);
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardTop}>
        <Text variant="secondary" style={styles.statLabel}>{label}</Text>
        <View style={styles.statIconWrap}>
          <Ionicons name={icon} size={18} color={STEEL.accent} />
        </View>
      </View>
      <Text variant="page" style={styles.statCount}>{display}</Text>
    </View>
  );
}

function EmptyBlock({ icon, title, description }) {
  const { STEEL, styles } = useContext(CareTheme);
  return (
    <View style={styles.emptyBlock}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={icon} size={28} color={STEEL.textMuted} />
      </View>
      <Text variant="body" style={styles.emptyTitle}>{title}</Text>
      <Text variant="secondary" style={styles.emptyDesc}>{description}</Text>
    </View>
  );
}

function HistoryRow({ record }) {
  const { STEEL, styles } = useContext(CareTheme);
  // Record types describe provenance, not urgency or clinical severity.
  const bg = STEEL.infoBg, fg = STEEL.info;
  return (
    <View style={styles.historyRowCard}>
      <View style={styles.historyRowTop}>
        <View style={styles.historyRowMeta}>
          <View style={[styles.typeBadge, { backgroundColor: bg }]}>
            <Text variant="caption" style={[styles.typeBadgeText, { color: fg }]}>{record.type}</Text>
          </View>
          <Text variant="secondary" style={styles.historyRowDate}>{record.date}</Text>
        </View>
        {!!record.location && <Text variant="caption" style={styles.historyRowLocation}>{record.location}</Text>}
      </View>
      <Text variant="body" style={styles.historyRowTitle}>{record.title}</Text>
      {!!record.description && <Text variant="secondary" style={styles.historyRowBody}>{record.description}</Text>}
    </View>
  );
}

function CareContent({ omitShellTitle = false, scrollFabProps = {} }) {
  const { STEEL, styles } = useContext(CareTheme);
  const insets = useSafeAreaInsets();
  const { medications, loading: medsLoading, error: medsError, refetch: refetchMeds } = useMedications();
  const { stats: careStats, loading: statsLoading, error: statsError, refetch: refetchCareStats } = useCareStats();

  const { appointments, encounters, claims, loading: isLoading, error: careError, refetch: refetchCare } = useCareData();

  const onRefresh = useCallback(() => {
    refetchMeds();
    refetchCareStats();
    refetchCare();
  }, [refetchMeds, refetchCareStats, refetchCare]);

  const overviewStats = useMemo(
    () => [
      { key: 'labResults', label: 'Lab Results', icon: 'flask-outline', count: careStats.labResults },
      { key: 'encounters', label: 'Encounters', icon: 'heart-outline', count: careStats.encounters },
      { key: 'medications', label: 'Medications', icon: 'medkit-outline', count: careStats.medications },
      { key: 'claims', label: 'Claims', icon: 'document-text-outline', count: careStats.claims },
    ],
    [careStats]
  );


  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all-sources');
  const [timeMenuOpen, setTimeMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const careHistory = useMemo(() => buildCareHistory(encounters, claims), [encounters, claims]);

  const timeFilteredHistory = useMemo(() => {
    return careHistory.filter((item) => {
      if (selectedTimeFilter === 'all') return true;
      const itemDate = parseCareDate(item.rawDate);
      if (!itemDate) return false;
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
        { paddingBottom: insets.bottom + space.lg, flexGrow: 1 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={medsLoading || statsLoading || isLoading}
          onRefresh={onRefresh}
          tintColor={STEEL.accent}
        />
      }
      {...scrollFabProps}
    >
      {!omitShellTitle ? (
        <View style={styles.pageIntro}>
          <View style={styles.pageTitleRow}>
            <Ionicons name="heart" size={26} color={STEEL.accent} />
            <Text variant="title" style={styles.pageTitle}>Care Management</Text>
          </View>
          <Text variant="body" style={styles.pageSubtitle}>Track your medications, appointments, and medical history</Text>
        </View>
      ) : null}

      {/* Overview — same counts as desktop CarePage (no nested ScrollView; avoids blank layout) */}
      <Text variant="section" style={styles.sectionHeading}>Overview</Text>
      <View style={styles.statGrid}>
        {overviewStats.map((s) => (
          <StatMiniCard
            key={s.key}
            label={s.label}
            icon={s.icon}
            count={s.count}
            loading={statsLoading || !!statsError}
          />
        ))}
      </View>
      {statsError ? <Text variant="secondary" style={styles.inlineError}>{statsError}</Text> : null}

      {/* Upcoming Appointments */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="calendar-outline" size={20} color={STEEL.textSecondary} />
          <Text variant="section" style={styles.cardTitle}>Upcoming Appointments</Text>
        </View>
        {careError ? <Text variant="secondary" accessibilityRole="alert" style={styles.inlineError}>{careError} Pull down to retry.</Text> : isLoading ? (
          <View style={styles.skeletonBar} />
        ) : appointments.length === 0 ? (
          <EmptyBlock
            icon="calendar-outline"
            title="No upcoming appointments"
            description="Your upcoming scheduled appointments will appear here."
          />
        ) : (
          <View style={styles.listBlock}>
            {appointments.map((apt) => (
              <View key={apt.id} style={styles.apptRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="body" style={styles.apptProvider}>{apt.provider_name}</Text>
                  <Text variant="secondary" style={styles.apptMeta}>
                    {apt.appointment_type}
                    {apt.location ? ` · ${apt.location}` : ''}
                  </Text>
                </View>
                <Text variant="secondary" style={styles.apptDate}>
                  {new Date(apt.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
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
          <Text variant="section" style={styles.cardTitle}>Medications</Text>
        </View>
        {medsError ? <Text variant="secondary" style={styles.inlineError}>{medsError}</Text> : null}
        {medsLoading && medications.length === 0 ? (
          <>
            <View style={styles.skeletonRow} />
            <View style={styles.skeletonRow} />
          </>
        ) : medsError ? null : medications.length === 0 ? (
          <View style={styles.emptyBlock}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="medical-outline" size={28} color={STEEL.textMuted} />
            </View>
            <Text variant="body" style={styles.emptyTitle}>No medications on file</Text>
            <Text variant="secondary" style={styles.emptyDesc}>Ask the AI assistant to log a medication</Text>
          </View>
        ) : (
          <>
            <Text variant="secondary" style={styles.medsMeta}>
              {medications.length} medication{medications.length !== 1 ? 's' : ''} on file
            </Text>
            {medications.map((rx) => {
              const isDiscontinued =
                rx.status?.toLowerCase() === 'discontinued' || rx.status?.toLowerCase() === 'inactive';
              const doseLine = [rx.dosage, rx.frequency].filter(Boolean).join(' · ') || rx.instructions;
              const started = rx.startDate ? formatCareDate(rx.startDate) : '';
              return (
                <View key={rx.id} style={styles.medRow}>
                  <View style={styles.medNameRow}>
                    <Text variant="body" style={styles.medName}>{rx.name}</Text>
                    <View style={[styles.statusPill, isDiscontinued ? styles.statusPillInactive : styles.statusPillActive]}>
                      <Text variant="caption"
                        style={isDiscontinued ? styles.statusPillTextInactive : styles.statusPillTextActive}
                      >
                        {isDiscontinued ? 'Inactive' : 'Active'}
                      </Text>
                    </View>
                  </View>
                  {!!rx.condition && <Text variant="secondary" style={styles.medCondition}>{rx.condition}</Text>}
                  {!!doseLine && <Text variant="body" style={styles.medInstructions}>{doseLine}</Text>}
                  {!!started && <Text variant="secondary" style={styles.medInstructions}>Started {started}</Text>}
                  {!!rx.prescribing_doctor && (
                    <View style={styles.medDoctorRow}>
                      <Ionicons name="heart" size={14} color={STEEL.textSecondary} />
                      <Text variant="secondary" style={styles.medDoctor}>{rx.prescribing_doctor}</Text>
                    </View>
                  )}
                  {!!rx.notes && <Text variant="secondary" style={styles.medInstructions}>{rx.notes}</Text>}
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
            <Text variant="section" style={styles.historyMainTitle}>Care History</Text>
            <Text variant="secondary" style={styles.historySubtitle}>Your recorded encounters and claims</Text>
          </View>
        </View>

        <View style={styles.historyToolbar}>
          <View style={styles.timeFilterWrap}>
            <TouchableOpacity
              style={styles.timeFilterBtn}
              onPress={() => setTimeMenuOpen((o) => !o)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Time range: ${timeLabel}`}
              accessibilityState={{ expanded: timeMenuOpen }}
            >
              <Ionicons name="calendar-outline" size={18} color={STEEL.textPrimary} />
              <Text variant="body" style={styles.timeFilterText}>{timeLabel}</Text>
              <Ionicons name="chevron-down" size={18} color={STEEL.textSecondary} />
            </TouchableOpacity>
            {timeMenuOpen && (
              <View style={styles.timeMenu}>
                {TIME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedTimeFilter === opt.id }}
                    style={[styles.timeMenuItem, selectedTimeFilter === opt.id && styles.timeMenuItemActive]}
                    onPress={() => {
                      setSelectedTimeFilter(opt.id);
                      setTimeMenuOpen(false);
                    }}
                  >
                    <Text variant="body"
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
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedSourceFilter(f.id)}
                style={[styles.filterTab, active && styles.filterTabActive]}
                activeOpacity={0.85}
              >
                <Text variant="secondary" style={[styles.filterTabText, active && styles.filterTabTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {careError ? <Text variant="secondary" accessibilityRole="alert" style={styles.inlineError}>{careError} Pull down to retry.</Text> : isLoading ? (
          <View style={styles.historySkeletonWrap}>
            {[0, 1, 2].map((k) => (
              <View key={k} style={styles.skeletonHistory} />
            ))}
          </View>
        ) : searchFilteredHistory.length === 0 ? (
          <EmptyBlock
            icon="document-text-outline"
            title={careHistory.length ? "No matching care history" : "No care history yet"}
            description={careHistory.length ? "Try another time range, source, or search term." : "Your encounters and claims will appear here once connected providers share your records."}
          />
        ) : (
          <>
            <Text variant="caption" style={styles.careShowingCount}>
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

const createStyles = (STEEL) => StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pageIntro: { marginBottom: 20 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  pageTitle: { ...typeStyles.title, fontWeight: '700', color: STEEL.textPrimary },
  pageSubtitle: { ...typeStyles.body, color: STEEL.textSecondary, },
  sectionHeading: { ...typeStyles.section, fontWeight: '700', color: STEEL.textPrimary, marginBottom: 12 },
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
  statLabel: { flex: 1, ...typeStyles.secondary, fontWeight: '500', color: STEEL.textSecondary, paddingRight: 8 },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: STEEL.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: { ...typeStyles.page, fontWeight: '800', color: STEEL.textPrimary },
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
  cardTitle: { ...typeStyles.section, fontWeight: '700', color: STEEL.textPrimary },
  skeletonBar: {
    height: 96,
    borderRadius: 10,
    backgroundColor: STEEL.surfaceMuted,
    marginVertical: 8,
  },
  skeletonRow: {
    height: 52,
    borderRadius: 10,
    backgroundColor: STEEL.surfaceMuted,
    marginBottom: 10,
  },
  inlineError: { ...typeStyles.secondary, color: STEEL.dangerAction, marginBottom: 10, },
  emptyBlock: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 8 },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: STEEL.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { ...typeStyles.body, fontWeight: '600', color: STEEL.textPrimary, marginBottom: 6, textAlign: 'center' },
  emptyDesc: {
    ...typeStyles.secondary,
    color: STEEL.textSecondary,
    textAlign: 'center',

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
  apptProvider: { ...typeStyles.body, fontWeight: '600', color: STEEL.textPrimary },
  apptMeta: { ...typeStyles.secondary, color: STEEL.textSecondary, marginTop: 4 },
  apptDate: { ...typeStyles.secondary, fontWeight: '600', color: STEEL.textPrimary, marginLeft: 8 },
  medsMeta: { ...typeStyles.secondary, color: STEEL.textSecondary, marginBottom: 14 },
  medRow: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
    backgroundColor: STEEL.surfaceMuted,
    padding: 14,
    marginBottom: 10,
  },
  medNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  medName: { ...typeStyles.body, fontWeight: '700', color: STEEL.textPrimary },
  medCondition: { ...typeStyles.secondary, color: STEEL.textSecondary, marginBottom: 6 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusPillActive: { backgroundColor: STEEL.successBg },
  statusPillInactive: { backgroundColor: STEEL.surfaceMuted },
  statusPillTextActive: { ...typeStyles.caption, fontWeight: '700', color: STEEL.success },
  statusPillTextInactive: { ...typeStyles.caption, fontWeight: '600', color: STEEL.textSecondary },
  medInstructions: { ...typeStyles.body, color: STEEL.textPrimary,  marginBottom: 4 },
  medDoctorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  medDoctor: { ...typeStyles.secondary, color: STEEL.textSecondary },
  historyHeader: { marginBottom: 14 },
  historyTitles: { gap: 4 },
  historyMainTitle: { ...typeStyles.section, fontWeight: '700', color: STEEL.textPrimary },
  historySubtitle: { ...typeStyles.secondary, color: STEEL.textSecondary, },
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
    minHeight: control.minTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEEL.border,
    backgroundColor: STEEL.surfaceMuted,
  },
  timeFilterText: { ...typeStyles.body, fontWeight: '600', color: STEEL.textPrimary },
  timeMenu: {
    position: 'absolute',
    left: 0,
    top: '100%',
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
    minHeight: control.minTarget,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: STEEL.border,
  },
  timeMenuItemActive: { backgroundColor: STEEL.accentBg },
  timeMenuItemText: { ...typeStyles.body, color: STEEL.textSecondary },
  timeMenuItemTextActive: { color: STEEL.accent, fontWeight: '700' },
  iconBtn: {
    width: control.minTarget,
    height: control.minTarget,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEEL.border,
    backgroundColor: STEEL.surfaceMuted,
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
    backgroundColor: STEEL.navy,
  },
  shareBtnText: { color: STEEL.onAction, ...typeStyles.body, fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: STEEL.surface,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, ...typeStyles.body, color: STEEL.textPrimary, paddingVertical: 10, minHeight: control.minTarget },
  filterTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  filterTab: { minHeight: control.minTarget, justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: 'transparent' },
  filterTabActive: { backgroundColor: STEEL.navy },
  filterTabText: { ...typeStyles.secondary, fontWeight: '600', color: STEEL.textSecondary },
  filterTabTextActive: { color: STEEL.onAction },
  careShowingCount: { ...typeStyles.caption, color: STEEL.textSecondary, marginBottom: 10 },
  historySkeletonWrap: { gap: 10, marginTop: 8 },
  skeletonHistory: { height: 96, borderRadius: 10, backgroundColor: STEEL.surfaceMuted },
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
  typeBadgeText: { ...typeStyles.caption, fontWeight: '700', letterSpacing: 0.2 },
  historyRowDate: { ...typeStyles.secondary, fontWeight: '600', color: STEEL.textPrimary },
  historyRowLocation: { ...typeStyles.caption, color: STEEL.textSecondary, maxWidth: 120, textAlign: 'right' },
  historyRowTitle: { ...typeStyles.body, fontWeight: '700', color: STEEL.textPrimary, marginBottom: 4 },
  historyRowBody: { ...typeStyles.secondary, color: STEEL.textSecondary, },
});

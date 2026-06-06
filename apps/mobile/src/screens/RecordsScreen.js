import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecords } from '../hooks/useRecords';
import { useVaultStats } from '../hooks/useVaultStats';
import { usePendingRequests } from '../hooks/usePendingRequests';

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
  danger: '#EF4444',
  orange: '#EA580C',
  orangeBg: '#FFF7ED',
  navy: '#0F172A',
};

const KIND_ICON = {
  imaging: { name: 'image-outline', color: '#7C3AED', bg: '#EDE9FE' },
  lab: { name: 'flask', color: '#2563EB', bg: '#DBEAFE' },
  pathology: { name: 'medkit', color: '#059669', bg: '#D1FAE5' },
  specialist_report: { name: 'pulse', color: '#DC2626', bg: '#FEE2E2' },
  other: { name: 'document-text', color: '#6B7280', bg: '#F3F4F6' },
};

const RECORD_KIND_DETAIL_LABEL = {
  lab: 'LAB RESULTS',
  imaging: 'IMAGING',
  pathology: 'PATHOLOGY',
  specialist_report: 'SPECIALIST REPORTS',
  other: 'OTHER',
};

function labelForKind(kind) {
  if (RECORD_KIND_DETAIL_LABEL[kind]) return RECORD_KIND_DETAIL_LABEL[kind];
  return (kind || 'other').replace(/_/g, ' ').toUpperCase();
}

function formatServiceDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString();
}

function sourceLabel(source) {
  if (!source) return '—';
  return String(source).replace(/_/g, ' ').toUpperCase();
}

const RECORD_TYPE_OPTIONS = [
  { id: 'lab', label: 'Lab Results', desc: 'Blood work, urinalysis, cultures' },
  { id: 'imaging', label: 'Imaging & Scans', desc: 'X-rays, MRI, CT scans, ultrasounds' },
  { id: 'pathology', label: 'Pathology Reports', desc: 'Biopsy results, tissue analysis' },
  { id: 'specialist_report', label: 'Specialist Reports', desc: 'Consultation notes, referral reports' },
  { id: 'other', label: 'Other Records', desc: 'Discharge summaries, visit notes, other' },
];

const MOCK_PROVIDERS = [
  { id: '1', name: 'Dr. Sarah Chen', specialty: 'Internal Medicine', clinic: 'Springfield Medical Center' },
  { id: '2', name: 'Dr. Michael Rivera', specialty: 'Cardiology', clinic: 'Heart Health Associates' },
  { id: '3', name: 'Dr. Emily Watson', specialty: 'Dermatology', clinic: 'Skin Care Clinic' },
  { id: '4', name: 'Dr. James Park', specialty: 'Orthopedics', clinic: 'Joint & Bone Specialists' },
  { id: '5', name: 'Dr. Lisa Thompson', specialty: 'Neurology', clinic: 'Brain & Spine Institute' },
  { id: '6', name: 'Springfield General Hospital', specialty: 'Hospital', clinic: 'Springfield General Hospital' },
  { id: '7', name: 'Midwest Imaging Center', specialty: 'Radiology', clinic: 'Midwest Imaging Center' },
];

/*
 * MOCK_FALLBACK (previous mock shape; API returns providerName, serviceDate, kind, source, tags, aiSummary):
 * mockRecords: [{ id, title, provider, date, kind, source, tags, aiSummary, isShared, typeLabel, sourceLabel }, ...]
 * mockPendingRequests: [{ id, doctorName, clinic, recordType, sentAgo, ... }, ...]
 * mockStats: { lastSynced, connectedProviders, totalRecords }
 */

const BANNER = {
  id: 'banner-1',
  doctor: 'Dr. Bodhi McGuire',
  types: 'Imaging',
};

const FILTER_TAB_ORDER = ['All', 'Lab Results', 'Imaging', 'Pathology', 'Specialist Reports', 'Other'];

function RecordIcon({ kind }) {
  const cfg = KIND_ICON[kind] || KIND_ICON.other;
  return (
    <View style={[styles.recordIconWrap, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.name} size={22} color={cfg.color} />
    </View>
  );
}

export default function RecordsScreen({ omitShellTitle = false, scrollFabProps = {} }) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [dismissedRequestIds, setDismissedRequestIds] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordDetailTab, setRecordDetailTab] = useState('summary');
  const [showBanner, setShowBanner] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestFlow, setRequestFlow] = useState('provider');
  const [requestSearch, setRequestSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [priority, setPriority] = useState('routine');
  const [requestMessage, setRequestMessage] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualDoctor, setManualDoctor] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualTypes, setManualTypes] = useState([]);
  const [manualPriority, setManualPriority] = useState('routine');
  const [manualMessage, setManualMessage] = useState('');
  const [showRequestDetail, setShowRequestDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const kindMap = {
    All: undefined,
    'Lab Results': 'lab',
    Imaging: 'imaging',
    Pathology: 'pathology',
    'Specialist Reports': 'specialist_report',
    Other: 'other',
  };

  const { records, loading, error, refetch } = useRecords({
    kind: kindMap[activeFilter],
    pageSize: 50,
  });
  const { stats } = useVaultStats();
  const {
    requests: pendingRequestsFromServer,
    activeCount,
    loading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = usePendingRequests();

  const pendingRequests = useMemo(
    () => pendingRequestsFromServer.filter((r) => !dismissedRequestIds.includes(r.id)),
    [pendingRequestsFromServer, dismissedRequestIds]
  );

  const showPendingSkeleton =
    requestsLoading && pendingRequestsFromServer.length === 0 && !requestsError;
  const showPendingSection = pendingRequests.length > 0 || showPendingSkeleton;
  const onCombinedRefresh = useCallback(() => {
    refetch();
    refetchRequests();
  }, [refetch, refetchRequests]);

  const lastSyncedPill = stats?.lastSyncedAt
    ? new Date(stats.lastSyncedAt).toLocaleDateString()
    : 'Never';
  const connectedProvidersPill = stats?.connectedProviders ?? 0;
  const totalRecordsPill = stats?.totalRecords ?? 0;

  const showListSkeleton = loading && records.length === 0 && !error;

  const filteredProviders = MOCK_PROVIDERS.filter(
    (p) =>
      !requestSearch ||
      p.name.toLowerCase().includes(requestSearch.toLowerCase()) ||
      p.specialty.toLowerCase().includes(requestSearch.toLowerCase()) ||
      p.clinic.toLowerCase().includes(requestSearch.toLowerCase())
  );

  const openRequestModal = () => {
    setRequestFlow('provider');
    setRequestSearch('');
    setSelectedProvider(null);
    setSelectedTypes([]);
    setDateFrom('');
    setDateTo('');
    setPriority('routine');
    setRequestMessage('');
    setManualName('');
    setManualDoctor('');
    setManualEmail('');
    setManualTypes([]);
    setManualPriority('routine');
    setManualMessage('');
    setShowRequestModal(true);
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setRequestFlow('provider');
  };

  const toggleType = (id, list, setList) => {
    setList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const resetRequestFlow = () => {
    setRequestFlow('provider');
    setSelectedProvider(null);
    setSelectedTypes([]);
    setRequestMessage('');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            refreshing={loading || requestsLoading}
            onRefresh={onCombinedRefresh}
          />
        }
        {...scrollFabProps}
      >
        <View style={[styles.headerRow, omitShellTitle && { justifyContent: 'flex-end' }]}>
          {!omitShellTitle ? (
            <View style={styles.headerLeft}>
              <Text style={styles.nowViewing}>NOW VIEWING</Text>
              <Text style={styles.pageTitle}>Records</Text>
            </View>
          ) : null}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.btnNavy} activeOpacity={0.85} onPress={() => {}}>
              <Ionicons name="link" size={16} color="#fff" />
              <Text style={styles.btnNavyText}>Connect Provider</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} activeOpacity={0.85} onPress={openRequestModal}>
              <Ionicons name="send-outline" size={16} color={STEEL.textPrimary} />
              <Text style={styles.btnOutlineText}>Request Manually</Text>
              {activeCount > 0 ? (
                <View style={styles.badgeOrange}>
                  <Text style={styles.badgeOrangeText}>{activeCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <View style={styles.statPill}>
            <Ionicons name="document-text-outline" size={14} color="#fff" />
            <Text style={styles.statPillText}>Last Synced: {lastSyncedPill}</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="link" size={14} color="#fff" />
            <Text style={styles.statPillText}>Connected Providers: {connectedProvidersPill}</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="cloud-upload-outline" size={14} color="#fff" />
            <Text style={styles.statPillText}>Total Records: {totalRecordsPill}</Text>
          </View>
        </ScrollView>

        {showBanner ? (
          <View style={styles.successBanner}>
            <View style={styles.successBannerAccent} />
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={18} color={STEEL.success} />
            </View>
            <View style={styles.successBannerBody}>
              <Text style={styles.successTitle}>Records received from {BANNER.doctor}</Text>
              <Text style={styles.successSub}>
                {BANNER.types} — now available in your records
              </Text>
            </View>
            <TouchableOpacity style={styles.viewLinkBtn} activeOpacity={0.85}>
              <Text style={styles.viewLinkText}>View →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowBanner(false)} hitSlop={12}>
              <Text style={styles.dismissX}>×</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {requestsError ? (
          <Text style={styles.inlineRequestError}>{requestsError}</Text>
        ) : null}

        {showPendingSection ? (
          <View style={styles.section}>
            <View style={styles.pendingHeader}>
              <Text style={styles.pendingLabel}>PENDING REQUESTS</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{activeCount} active</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {showPendingSkeleton
                ? [0, 1].map((i) => (
                    <View key={`sk-${i}`} style={styles.pendingCardSkeleton}>
                      <View style={styles.pendingSkeletonIcon} />
                      <View style={styles.pendingSkeletonLine} />
                      <View style={styles.pendingSkeletonLineShort} />
                      <View style={styles.pendingSkeletonBadge} />
                      <View style={styles.pendingSkeletonLine} />
                      <View style={styles.pendingSkeletonLineTiny} />
                    </View>
                  ))
                : pendingRequests.map((req) => (
                    <TouchableOpacity
                      key={req.id}
                      style={styles.pendingCard}
                      activeOpacity={0.9}
                      onPress={() => {
                        setSelectedRequest(req);
                        setShowRequestDetail(true);
                      }}
                    >
                      <View style={styles.pendingIconCircle}>
                        <Ionicons name="business" size={18} color={STEEL.accent} />
                      </View>
                      <Text style={styles.pendingDoctor} numberOfLines={1}>
                        {req.doctorName}
                      </Text>
                      <Text style={styles.pendingClinic} numberOfLines={1}>
                        {req.clinic}
                      </Text>
                      <View style={styles.sentBadge}>
                        <Ionicons name="mail-outline" size={11} color={STEEL.accent} />
                        <Text style={styles.sentBadgeText}>{req.status === 'pending' ? 'Pending' : 'Sent'}</Text>
                      </View>
                      <Text style={styles.pendingType}>{req.recordType}</Text>
                      <Text style={styles.pendingAgo}>{req.sentAgo}</Text>
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {FILTER_TAB_ORDER.map((label) => {
            const active = activeFilter === label;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setActiveFilter(label)}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.listSection}>
          {showListSkeleton ? (
            <>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.recordSkeletonCard}>
                  <View style={styles.recordSkeletonIcon} />
                  <View style={styles.recordSkeletonCol}>
                    <View style={[styles.recordSkeletonLine, { width: '85%' }]} />
                    <View style={styles.recordSkeletonLineShort} />
                    <View style={[styles.recordSkeletonLine, { width: '55%', marginTop: 4 }]} />
                  </View>
                </View>
              ))}
            </>
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
              <Text style={styles.emptyTitle}>{"Couldn't load records"}</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
              <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : !loading && records.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No records yet</Text>
              <Text style={styles.emptySubtitle}>
                {`Try asking the assistant: "Upload a lab PDF" or 
"Connect my hospital portal"`}
              </Text>
            </View>
          ) : (
            records.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={styles.recordCard}
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedRecord(rec);
                  setRecordDetailTab('summary');
                }}
              >
                <RecordIcon kind={rec.kind} />
                <View style={styles.recordBody}>
                  <View style={styles.recordTopRow}>
                    <Text style={styles.recordTitle} numberOfLines={2}>
                      {rec.title}
                    </Text>
                    {rec.source === 'shared' ? (
                      <View style={styles.sharedBadge}>
                        <Ionicons name="link" size={11} color={STEEL.orange} />
                        <Text style={styles.sharedBadgeText}>Shared</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.recordMeta}>
                    {rec.providerName || '—'} • {formatServiceDate(rec.serviceDate)}
                  </Text>
                  {rec.aiSummary ? (
                    <View style={styles.aiRow}>
                      <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                      <Text style={styles.aiSnippet} numberOfLines={2}>
                        {rec.aiSummary}
                      </Text>
                    </View>
                  ) : null}
                  {rec.tags?.length ? (
                    <View style={styles.tagsRow}>
                      {rec.tags.map((t) => (
                        <View key={t} style={styles.tagPill}>
                          <Text style={styles.tagPillText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Record detail bottom sheet */}
      <Modal visible={!!selectedRecord} animationType="slide" transparent onRequestClose={() => setSelectedRecord(null)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setSelectedRecord(null)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={2}>
                {selectedRecord?.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedRecord(null)} hitSlop={12}>
                <Text style={styles.sheetClose}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detailTabs}>
              {['summary', 'document', 'insights'].map((tab) => (
                <TouchableOpacity key={tab} style={styles.detailTab} onPress={() => setRecordDetailTab(tab)}>
                  <Text style={[styles.detailTabText, recordDetailTab === tab && styles.detailTabTextActive]}>
                    {tab === 'summary' ? 'Summary' : tab === 'document' ? 'Document' : 'Insights'}
                  </Text>
                  {recordDetailTab === tab ? <View style={styles.detailTabUnderline} /> : null}
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {recordDetailTab === 'summary' && selectedRecord ? (
                <View>
                  <Row label="Provider" value={selectedRecord.providerName || '—'} />
                  <Row label="Date" value={formatServiceDate(selectedRecord.serviceDate)} />
                  <Row label="Type" value={labelForKind(selectedRecord.kind)} />
                  <Row label="Source" value={sourceLabel(selectedRecord.source)} />
                  {selectedRecord.aiSummary ? (
                    <View style={styles.aiSummaryCard}>
                      <Text style={styles.aiSummaryHeader}>✦ AI Summary</Text>
                      <Text style={styles.aiSummaryBody}>{selectedRecord.aiSummary}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {recordDetailTab === 'document' ? (
                <View style={styles.emptyDoc}>
                  <Ionicons name="document-text-outline" size={48} color={STEEL.textMuted} />
                  <Text style={styles.emptyDocTitle}>No document file attached to this record.</Text>
                  <Text style={styles.emptyDocSub}>Files uploaded by providers will appear here.</Text>
                </View>
              ) : null}
              {recordDetailTab === 'insights' ? (
                <View>
                  <TouchableOpacity style={styles.generateInsightsBtn} activeOpacity={0.9}>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.generateInsightsText}>Generate AI Insights</Text>
                  </TouchableOpacity>
                  <Text style={styles.insightsHint}>
                    Ask the AI assistant to analyze this record, explain findings, or compare with previous results.
                  </Text>
                </View>
              ) : null}
            </ScrollView>
            <TouchableOpacity style={styles.shareRecordBtn} activeOpacity={0.9}>
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.shareRecordText}>Share Record</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Request flow modal */}
      <Modal visible={showRequestModal} animationType="slide" transparent onRequestClose={closeRequestModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalFill}
        >
          <View style={[styles.requestModal, { paddingBottom: insets.bottom + 12 }]}>
            {requestFlow === 'provider' ? (
              <>
                <View style={styles.reqHeader}>
                  <Text style={styles.reqTitle}>Request Health Record</Text>
                  <TouchableOpacity onPress={closeRequestModal}>
                    <Text style={styles.sheetClose}>×</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.reqSubtitle}>Select a provider to request records from</Text>
                <Text style={styles.stepIndicator}>① Provider ——— 2 Details</Text>
                <View style={styles.searchPurple}>
                  <Ionicons name="search" size={18} color={STEEL.accent} />
                  <TextInput
                    style={styles.searchPurpleInput}
                    placeholder="Search by provider name, specialty, or clinic..."
                    placeholderTextColor={STEEL.textMuted}
                    value={requestSearch}
                    onChangeText={setRequestSearch}
                  />
                </View>
                <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
                  {filteredProviders.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.providerRow}
                      onPress={() => {
                        setSelectedProvider(p);
                        setRequestFlow('details');
                      }}
                    >
                      <Ionicons name="business-outline" size={20} color={STEEL.textSecondary} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.providerName}>{p.name}</Text>
                        <Text style={styles.providerSub}>
                          {p.specialty} — {p.clinic}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={STEEL.textMuted} />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.manualEntryRow}
                    onPress={() => setRequestFlow('manual')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="pencil-outline" size={20} color={STEEL.accent} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.manualEntryTitle}>Enter provider details manually</Text>
                      <Text style={styles.manualEntrySub}>Send a request via email to any provider</Text>
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : null}

            {requestFlow === 'details' && selectedProvider ? (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <RequestDetailsStep
                  selectedProvider={selectedProvider}
                  selectedTypes={selectedTypes}
                  toggleType={(id) => toggleType(id, selectedTypes, setSelectedTypes)}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  setDateFrom={setDateFrom}
                  setDateTo={setDateTo}
                  priority={priority}
                  setPriority={setPriority}
                  requestMessage={requestMessage}
                  setRequestMessage={setRequestMessage}
                  onBack={() => {
                    setSelectedProvider(null);
                    setRequestFlow('provider');
                  }}
                  onClose={closeRequestModal}
                />
              </ScrollView>
            ) : null}

            {requestFlow === 'manual' ? (
              <ManualRequestForm
                manualName={manualName}
                setManualName={setManualName}
                manualDoctor={manualDoctor}
                setManualDoctor={setManualDoctor}
                manualEmail={manualEmail}
                setManualEmail={setManualEmail}
                manualTypes={manualTypes}
                toggleType={(id) => toggleType(id, manualTypes, setManualTypes)}
                manualPriority={manualPriority}
                setManualPriority={setManualPriority}
                manualMessage={manualMessage}
                setManualMessage={setManualMessage}
                onBack={() => setRequestFlow('provider')}
                onClose={closeRequestModal}
              />
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Request detail bottom sheet */}
      <Modal visible={showRequestDetail} animationType="slide" transparent onRequestClose={() => setShowRequestDetail(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowRequestDetail(false)}>
          <Pressable style={[styles.sheet, { maxHeight: '92%', paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            {selectedRequest ? (
              <>
                <View style={styles.reqDetailHeader}>
                  <View style={styles.reqDetailIconOrange}>
                    <Ionicons name="business" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqDetailDoctor}>{selectedRequest.doctorName}</Text>
                    <Text style={styles.reqDetailClinic}>{selectedRequest.clinic}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowRequestDetail(false)}>
                    <Text style={styles.sheetClose}>×</Text>
                  </TouchableOpacity>
                </View>
                {selectedRequest.expired ? (
                  <View style={styles.expiredBanner}>
                    <Ionicons name="warning" size={16} color={STEEL.orange} />
                    <Text style={styles.expiredText}>
                      Request Expired — The provider link is no longer valid. Use Resend Request to issue a new one.
                    </Text>
                  </View>
                ) : null}
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.detailSectionLabel}>REQUESTED RECORDS</Text>
                  <View style={styles.pillRow}>
                    {(selectedRequest.recordTypes?.length
                      ? selectedRequest.recordTypes
                      : [selectedRequest.recordType]
                    ).map((t) => (
                      <View key={String(t)} style={styles.reqTypePill}>
                        <Text style={styles.reqTypePillText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.detailSectionLabel}>MESSAGE TO PROVIDER</Text>
                  <View style={styles.messageBox}>
                    <Text style={styles.messageText}>{selectedRequest.message}</Text>
                  </View>
                  <Text style={styles.detailSectionLabel}>TIMELINE</Text>
                  <Timeline t={selectedRequest.timeline} />
                  <Text style={styles.detailSectionLabel}>REQUEST DETAILS</Text>
                  <Row label="Provider Email" value={selectedRequest.providerEmail || '—'} />
                  <Row label="Patient Name" value={selectedRequest.patientName || '—'} />
                  <Row label="Urgency" value={selectedRequest.urgency || '—'} />
                </ScrollView>
                <View style={styles.reqDetailFooter}>
                  <TouchableOpacity style={styles.resendBtn} activeOpacity={0.9}>
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text style={styles.resendBtnText}>Resend Request</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={() => {
                      setDismissedRequestIds((prev) => [...prev, selectedRequest.id]);
                      setShowRequestDetail(false);
                      setSelectedRequest(null);
                    }}
                  >
                    <Ionicons name="trash-outline" size={22} color={STEEL.danger} />
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function Timeline({ t }) {
  if (!t) return null;
  return (
    <View style={styles.timeline}>
      <TimelineItem icon="document-text" title="Request Created" time={t.created} done />
      <TimelineItem icon="send" title="Email Sent" time={t.emailSent} done />
      <TimelineItem icon="eye-outline" title="Opened by Provider" time={t.opened} done={!!t.opened} />
      <TimelineItem icon="checkmark-circle-outline" title="Records Submitted" time={t.submitted} done={!!t.submitted} last />
    </View>
  );
}

function TimelineItem({ icon, title, time, done, last }) {
  return (
    <View style={[styles.tlRow, last ? null : styles.tlRowBorder]}>
      <View style={[styles.tlIcon, { backgroundColor: done ? '#D1FAE5' : '#F1F5F9' }]}>
        <Ionicons name={icon} size={16} color={done ? STEEL.success : STEEL.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tlTitle}>{title}</Text>
        <Text style={styles.tlTime}>{time || 'Pending'}</Text>
      </View>
    </View>
  );
}

function RequestDetailsStep({
  selectedProvider,
  selectedTypes,
  toggleType,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  priority,
  setPriority,
  requestMessage,
  setRequestMessage,
  onBack,
  onClose,
}) {
  return (
    <>
      <View style={styles.reqHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={STEEL.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.reqTitle, { flex: 1, textAlign: 'center' }]}>Request Health Record</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.sheetClose}>×</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.reqFromLine}>From {selectedProvider.name}</Text>
      <Text style={styles.stepIndicator}>✓ Provider ——— ② Details</Text>
      <View style={styles.selectedProviderBar}>
        <Ionicons name="business-outline" size={20} color={STEEL.textSecondary} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.providerName}>{selectedProvider.name}</Text>
          <Text style={styles.providerSub}>{selectedProvider.clinic}</Text>
        </View>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.changeLink}>Change</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.blockLabel}>Record Types</Text>
      {RECORD_TYPE_OPTIONS.map((opt) => {
        const sel = selectedTypes.includes(opt.id);
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.typeSelectRow, sel && styles.typeSelectRowActive]}
            onPress={() => toggleType(opt.id)}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.typeSelectLabel}>{opt.label}</Text>
              <Text style={styles.typeSelectDesc}>{opt.desc}</Text>
            </View>
            {sel ? <Ionicons name="checkmark-circle" size={22} color={STEEL.accent} /> : null}
          </TouchableOpacity>
        );
      })}
      <Text style={styles.blockLabel}>Date Range (optional)</Text>
      <View style={styles.dateRow}>
        <TextInput style={styles.dateInput} placeholder="From" value={dateFrom} onChangeText={setDateFrom} placeholderTextColor={STEEL.textMuted} />
        <TextInput style={styles.dateInput} placeholder="To" value={dateTo} onChangeText={setDateTo} placeholderTextColor={STEEL.textMuted} />
      </View>
      <Text style={styles.blockLabel}>Priority</Text>
      <View style={styles.priorityRow}>
        <TouchableOpacity
          style={[styles.priorityCard, priority === 'routine' && styles.priorityCardActive]}
          onPress={() => setPriority('routine')}
        >
          <Ionicons name="time-outline" size={22} color={STEEL.accent} />
          <Text style={styles.priorityTitle}>Routine</Text>
          <Text style={styles.prioritySub}>5-10 business days</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.priorityCard, priority === 'urgent' && styles.priorityCardActive]}
          onPress={() => setPriority('urgent')}
        >
          <Ionicons name="send-outline" size={22} color={STEEL.accent} />
          <Text style={styles.priorityTitle}>Urgent</Text>
          <Text style={styles.prioritySub}>1-3 business days</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.blockLabel}>Message to Provider</Text>
      <TextInput
        style={styles.messageInput}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        placeholder="Include any details that will help the provider locate your records..."
        placeholderTextColor={STEEL.textMuted}
        value={requestMessage}
        onChangeText={setRequestMessage}
      />
      <View style={styles.identityCard}>
        <View style={styles.identityHeader}>
          <Ionicons name="shield-checkmark" size={16} color={STEEL.success} />
          <Text style={styles.identityHeaderText}>IDENTITY VERIFICATION READY</Text>
        </View>
        <Text style={styles.identityBody}>
          Your date of birth, phone, and email will be included with this request so the provider can verify your identity.
        </Text>
        <Text style={styles.identityCheck}>✓ All verification fields complete</Text>
      </View>
      <TouchableOpacity style={styles.submitPurple} activeOpacity={0.9}>
        <Ionicons name="send" size={18} color="#fff" />
        <Text style={styles.submitPurpleText}>Submit Request</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backTextBtn} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </>
  );
}

function ManualRequestForm({
  manualName,
  setManualName,
  manualDoctor,
  setManualDoctor,
  manualEmail,
  setManualEmail,
  manualTypes,
  toggleType,
  manualPriority,
  setManualPriority,
  manualMessage,
  setManualMessage,
  onBack,
  onClose,
}) {
  return (
    <>
      <View style={styles.reqHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={STEEL.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.reqTitle, { flex: 1, textAlign: 'center' }]}>Manual Request</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.sheetClose}>×</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.reqSubtitle}>{"We'll email the provider on your behalf (mock)."}</Text>
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={18} color={STEEL.accent} />
        <Text style={styles.infoBannerText}>
          {"We'll send a secure record request to the provider's email on your behalf."}
        </Text>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.fieldLabel}>Provider / Facility Name *</Text>
        <TextInput style={styles.fieldInput} value={manualName} onChangeText={setManualName} placeholder="Name" placeholderTextColor={STEEL.textMuted} />
        <Text style={styles.fieldLabel}>{"Doctor's Name (optional)"}</Text>
        <TextInput style={styles.fieldInput} value={manualDoctor} onChangeText={setManualDoctor} placeholder="Doctor" placeholderTextColor={STEEL.textMuted} />
        <Text style={styles.fieldLabel}>{"Provider's Email Address *"}</Text>
        <TextInput
          style={styles.fieldInput}
          value={manualEmail}
          onChangeText={setManualEmail}
          placeholder="email@clinic.com"
          placeholderTextColor={STEEL.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.blockLabel}>Record Types</Text>
        {RECORD_TYPE_OPTIONS.map((opt) => {
          const sel = manualTypes.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.typeSelectRow, sel && styles.typeSelectRowActive]}
              onPress={() => toggleType(opt.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.typeSelectLabel}>{opt.label}</Text>
                <Text style={styles.typeSelectDesc}>{opt.desc}</Text>
              </View>
              {sel ? <Ionicons name="checkmark-circle" size={22} color={STEEL.accent} /> : null}
            </TouchableOpacity>
          );
        })}
        <Text style={styles.blockLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          <TouchableOpacity
            style={[styles.priorityCard, manualPriority === 'routine' && styles.priorityCardActive]}
            onPress={() => setManualPriority('routine')}
          >
            <Ionicons name="time-outline" size={22} color={STEEL.accent} />
            <Text style={styles.priorityTitle}>Routine</Text>
            <Text style={styles.prioritySub}>5-10 business days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.priorityCard, manualPriority === 'urgent' && styles.priorityCardActive]}
            onPress={() => setManualPriority('urgent')}
          >
            <Ionicons name="send-outline" size={22} color={STEEL.accent} />
            <Text style={styles.priorityTitle}>Urgent</Text>
            <Text style={styles.prioritySub}>1-3 business days</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.blockLabel}>Message to Provider</Text>
        <TextInput
          style={styles.messageInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder="Include any details..."
          placeholderTextColor={STEEL.textMuted}
          value={manualMessage}
          onChangeText={setManualMessage}
        />
        <TouchableOpacity style={styles.submitPurple} activeOpacity={0.9}>
          <Ionicons name="send" size={18} color="#fff" />
          <Text style={styles.submitPurpleText}>Send Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: STEEL.canvas },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 },
  headerLeft: { flex: 1, minWidth: 0 },
  nowViewing: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E53935',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pageTitle: { fontSize: 28, fontWeight: '800', color: STEEL.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnNavy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEEL.navy,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnNavyText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  btnOutline: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: STEEL.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: STEEL.surface,
  },
  btnOutlineText: { fontWeight: '600', fontSize: 12, color: STEEL.textPrimary },
  badgeOrange: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: STEEL.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeOrangeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  statsScroll: { marginBottom: 12 },
  inlineRequestError: {
    fontSize: 13,
    color: '#EF4444',
    marginBottom: 10,
    lineHeight: 18,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: STEEL.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  statPillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  successBannerAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: STEEL.success,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  successIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  successBannerBody: { flex: 1, minWidth: 0 },
  successTitle: { fontSize: 13, fontWeight: '700', color: '#065F46' },
  successSub: { fontSize: 12, color: STEEL.success, marginTop: 2 },
  viewLinkBtn: { paddingHorizontal: 8 },
  viewLinkText: { fontSize: 13, fontWeight: '700', color: STEEL.success },
  dismissX: { fontSize: 22, color: '#059669', paddingHorizontal: 4 },
  section: { marginBottom: 14 },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pendingLabel: { fontSize: 11, fontWeight: '700', color: STEEL.textMuted, letterSpacing: 1 },
  pendingBadge: { backgroundColor: STEEL.orange, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pendingBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  pendingCard: {
    width: 200,
    backgroundColor: STEEL.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  pendingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: STEEL.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pendingDoctor: { fontSize: 14, fontWeight: '700', color: STEEL.textPrimary },
  pendingClinic: { fontSize: 12, color: STEEL.textSecondary, marginTop: 2 },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: STEEL.accent,
  },
  sentBadgeText: { fontSize: 11, fontWeight: '600', color: STEEL.accent },
  pendingType: { fontSize: 12, color: STEEL.textPrimary, marginTop: 8, fontWeight: '600' },
  pendingAgo: { fontSize: 11, color: STEEL.textMuted, marginTop: 4 },
  pendingCardSkeleton: {
    width: 168,
    backgroundColor: STEEL.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
    gap: 8,
  },
  pendingSkeletonIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
  pendingSkeletonLine: { height: 12, borderRadius: 6, backgroundColor: '#E2E8F0', width: '90%' },
  pendingSkeletonLineShort: { height: 10, borderRadius: 5, backgroundColor: '#E2E8F0', width: '55%' },
  pendingSkeletonLineTiny: { height: 10, borderRadius: 5, backgroundColor: '#E2E8F0', width: '35%' },
  pendingSkeletonBadge: { height: 22, width: 52, borderRadius: 6, backgroundColor: '#E2E8F0', marginTop: 4 },
  filterScroll: { marginBottom: 12, flexGrow: 0 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEEL.border,
    backgroundColor: STEEL.surface,
    marginRight: 8,
  },
  filterPillActive: { backgroundColor: STEEL.success, borderColor: STEEL.success },
  filterPillText: { fontSize: 13, fontWeight: '600', color: STEEL.textSecondary },
  filterPillTextActive: { color: '#fff' },
  listSection: { gap: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: STEEL.textPrimary, marginTop: 12, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: STEEL.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: STEEL.accent,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  recordSkeletonCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
    backgroundColor: STEEL.surface,
  },
  recordSkeletonIcon: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#E2E8F0' },
  recordSkeletonCol: { flex: 1, gap: 8 },
  recordSkeletonLine: { height: 14, borderRadius: 6, backgroundColor: '#E2E8F0' },
  recordSkeletonLineShort: { height: 12, borderRadius: 6, backgroundColor: '#E2E8F0', width: '60%' },
  recordCard: {
    flexDirection: 'row',
    backgroundColor: STEEL.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
    gap: 12,
  },
  recordIconWrap: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recordBody: { flex: 1, minWidth: 0 },
  recordTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  recordTitle: { fontSize: 15, fontWeight: '700', color: STEEL.textPrimary, flex: 1 },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEEL.orangeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sharedBadgeText: { fontSize: 10, fontWeight: '700', color: STEEL.orange },
  recordMeta: { fontSize: 13, color: STEEL.textSecondary, marginTop: 4 },
  aiRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-start' },
  aiBadge: { backgroundColor: STEEL.successBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: STEEL.success },
  aiSnippet: { flex: 1, fontSize: 13, color: STEEL.textPrimary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagPillText: { fontSize: 11, color: STEEL.textSecondary, fontWeight: '500' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: STEEL.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '88%',
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: STEEL.textPrimary, flex: 1, paddingRight: 12 },
  sheetClose: { fontSize: 28, color: STEEL.textMuted, lineHeight: 32 },
  detailTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: STEEL.border, marginBottom: 12 },
  detailTab: { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  detailTabText: { fontSize: 14, fontWeight: '600', color: STEEL.textSecondary },
  detailTabTextActive: { color: STEEL.textPrimary },
  detailTabUnderline: { position: 'absolute', bottom: 0, height: 3, width: '60%', backgroundColor: STEEL.success, borderRadius: 2 },
  sheetBody: { maxHeight: 320 },
  kvRow: { marginBottom: 12 },
  kvLabel: { fontSize: 12, color: STEEL.textMuted, marginBottom: 2 },
  kvValue: { fontSize: 15, fontWeight: '600', color: STEEL.textPrimary },
  aiSummaryCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 8,
  },
  aiSummaryHeader: { fontSize: 13, fontWeight: '700', color: STEEL.success, marginBottom: 6 },
  aiSummaryBody: { fontSize: 14, color: STEEL.textPrimary, lineHeight: 20 },
  emptyDoc: { alignItems: 'center', paddingVertical: 24 },
  emptyDocTitle: { fontSize: 15, fontWeight: '600', color: STEEL.textPrimary, textAlign: 'center', marginTop: 12 },
  emptyDocSub: { fontSize: 13, color: STEEL.textSecondary, textAlign: 'center', marginTop: 6, paddingHorizontal: 16 },
  generateInsightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEEL.success,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateInsightsText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  insightsHint: { fontSize: 13, color: STEEL.textSecondary, marginTop: 12, lineHeight: 18 },
  shareRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEEL.success,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  shareRecordText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalFill: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  requestModal: {
    backgroundColor: STEEL.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: '94%',
    minHeight: '55%',
  },
  reqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  reqTitle: { fontSize: 17, fontWeight: '800', color: STEEL.textPrimary },
  reqSubtitle: { fontSize: 13, color: STEEL.textSecondary, marginBottom: 8 },
  stepIndicator: { fontSize: 12, color: STEEL.textMuted, marginBottom: 12, fontWeight: '600' },
  searchPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: STEEL.accentBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  searchPurpleInput: { flex: 1, fontSize: 14, color: STEEL.textPrimary },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: STEEL.border,
  },
  providerName: { fontSize: 15, fontWeight: '700', color: STEEL.textPrimary },
  providerSub: { fontSize: 12, color: STEEL.textSecondary, marginTop: 2 },
  manualEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: STEEL.accent,
    backgroundColor: STEEL.accentBg,
  },
  manualEntryTitle: { fontSize: 14, fontWeight: '700', color: STEEL.accent },
  manualEntrySub: { fontSize: 12, color: STEEL.textSecondary, marginTop: 2 },
  reqFromLine: { fontSize: 13, color: STEEL.textSecondary, marginBottom: 8 },
  selectedProviderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  changeLink: { fontSize: 14, fontWeight: '700', color: STEEL.accent },
  blockLabel: { fontSize: 12, fontWeight: '700', color: STEEL.textMuted, marginBottom: 8, marginTop: 8 },
  typeSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STEEL.border,
    marginBottom: 8,
  },
  typeSelectRowActive: { borderColor: STEEL.accent, backgroundColor: STEEL.accentBg },
  typeSelectLabel: { fontSize: 14, fontWeight: '700', color: STEEL.textPrimary },
  typeSelectDesc: { fontSize: 12, color: STEEL.textSecondary, marginTop: 2 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: STEEL.textPrimary,
  },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  priorityCardActive: { borderColor: STEEL.accent, backgroundColor: STEEL.accentBg },
  priorityTitle: { fontSize: 14, fontWeight: '700', marginTop: 6, color: STEEL.textPrimary },
  prioritySub: { fontSize: 11, color: STEEL.textSecondary, marginTop: 4, textAlign: 'center' },
  messageInput: {
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: STEEL.textPrimary,
    minHeight: 100,
    marginBottom: 12,
  },
  identityCard: {
    borderWidth: 1.5,
    borderColor: STEEL.success,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F0FDF4',
    marginBottom: 12,
  },
  identityHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  identityHeaderText: { fontSize: 11, fontWeight: '800', color: STEEL.success, letterSpacing: 0.5 },
  identityBody: { fontSize: 13, color: STEEL.textSecondary, lineHeight: 18 },
  identityCheck: { fontSize: 13, fontWeight: '600', color: STEEL.success, marginTop: 8 },
  submitPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEEL.accent,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  submitPurpleText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backTextBtn: { alignItems: 'center', paddingVertical: 8, marginBottom: 16 },
  backText: { fontSize: 15, fontWeight: '600', color: STEEL.accent },
  infoBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: STEEL.accentBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoBannerText: { flex: 1, fontSize: 13, color: STEEL.textPrimary, lineHeight: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: STEEL.textSecondary, marginBottom: 4, marginTop: 8 },
  fieldInput: {
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: STEEL.textPrimary,
  },
  reqDetailHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  reqDetailIconOrange: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: STEEL.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqDetailDoctor: { fontSize: 16, fontWeight: '800', color: STEEL.textPrimary },
  reqDetailClinic: { fontSize: 13, color: STEEL.textSecondary, marginTop: 2 },
  expiredBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: STEEL.orangeBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  expiredText: { flex: 1, fontSize: 12, color: '#9A3412', lineHeight: 17 },
  detailSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: STEEL.textMuted,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  reqTypePill: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  reqTypePillText: { fontSize: 12, fontWeight: '600', color: STEEL.textSecondary },
  messageBox: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 8 },
  messageText: { fontSize: 13, color: STEEL.textSecondary, lineHeight: 18 },
  timeline: { marginBottom: 12 },
  tlRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'center' },
  tlRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  tlIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlTitle: { fontSize: 13, fontWeight: '700', color: STEEL.textPrimary },
  tlTime: { fontSize: 12, color: STEEL.textMuted, marginTop: 2 },
  reqDetailFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: STEEL.border },
  resendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEEL.orange,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  trashBtn: { padding: 10 },
});

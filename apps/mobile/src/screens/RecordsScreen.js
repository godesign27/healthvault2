import {useAdaptiveLayout} from '../components/ui/AdaptiveControls';
import {typeStyles,space} from '../theme/layout';
import {AppText as Text,AppTextInput as TextInput} from '../components/ui/AppText';
import { formatRecordDate } from '../../../../packages/api-client/src/record-date';
import React, { useState, useMemo, useCallback, useRef, createContext, useContext } from 'react';
import {
  View,

  ScrollView,
  TouchableOpacity,

  StyleSheet,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProviderConnectionForm } from '../components/records/ProviderConnectionForm';
import { UploadRecordForm } from '../components/records/UploadRecordForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { cancelRecordRequest } from '../lib/request-cancel';
import { resendRecordRequest } from '../lib/request-resend';
import * as Crypto from 'expo-crypto';
import { useRequestProviders } from '../hooks/useRequestProviders';
import { createRecordRequest, validateRecordRequest } from '../lib/request-create';
import { useRecords } from '../hooks/useRecords';
import { useVaultStats } from '../hooks/useVaultStats';
import { usePendingRequests } from '../hooks/usePendingRequests';

import {recordsColors} from '../theme/records';
const RecordsTheme = createContext(null);

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



/*
 * MOCK_FALLBACK (previous mock shape; API returns providerName, serviceDate, kind, source, tags, aiSummary):
 * mockRecords: [{ id, title, provider, date, kind, source, tags, aiSummary, isShared, typeLabel, sourceLabel }, ...]
 * mockPendingRequests: [{ id, doctorName, clinic, recordType, sentAgo, ... }, ...]
 * mockStats: { lastSynced, connectedProviders, totalRecords }
 */

const FILTER_TAB_ORDER = ['All', 'Lab Results', 'Imaging', 'Pathology', 'Specialist Reports', 'Other'];

function RecordIcon({ kind }) {
  const {STEEL,styles}=useContext(RecordsTheme);
  const cfg = KIND_ICON[kind] || KIND_ICON.other;
  return (
    <View style={[styles.recordIconWrap, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.name} size={22} color={cfg.color} />
    </View>
  );
}

export default function RecordsScreen({darkMode=false,...props}) {
  const {stack:largeText}=useAdaptiveLayout();
  const theme=useMemo(()=>{const STEEL=recordsColors(darkMode);return {STEEL,styles:createStyles(STEEL,largeText)};},[darkMode,largeText]);
  return <RecordsTheme.Provider value={theme}><RecordsContent {...props} /></RecordsTheme.Provider>;
}

function RecordsContent({ omitShellTitle = false, scrollFabProps = {} }) {
  const {STEEL,styles}=useContext(RecordsTheme);
  const insets = useSafeAreaInsets();
  const [showProviderConnection,setShowProviderConnection]=useState(false);
  const providerList=useRequestProviders();
  const [creating,setCreating]=useState(false);
  const createBusy=useRef(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [dismissedRequestIds, setDismissedRequestIds] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordDetailTab, setRecordDetailTab] = useState('summary');
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
  const [resending,setResending]=useState(false);
  const resendBusy=useRef(false);
  const [cancelling,setCancelling]=useState(false);
  const cancelBusy=useRef(false);
  function confirmCancel(){
    const request=selectedRequest;
    if(!request || cancelBusy.current || resendBusy.current || !['pending','sent','failed'].includes(request.status))return;
    Alert.alert('Cancel records request?',`Stop accepting uploads from ${request.doctorName}? The upload link will stop working. Records already received stay in your Vault. An email already being sent may still arrive, but its link will be closed.`,[
      {text:'Keep request',style:'cancel'},{text:'Cancel request',style:'destructive',onPress:async()=>{
        if(cancelBusy.current||resendBusy.current)return;
        cancelBusy.current=true;setCancelling(true);
        try{await cancelRecordRequest({requestId:request.id,getSession:async()=>(await supabase.auth.getSession()).data.session,
          baseUrl:process.env.EXPO_PUBLIC_SUPABASE_URL,anonKey:process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY});
          setSelectedRequest({...request,status:'cancelled',expired:false});
          Alert.alert('Request cancelled','The upload link is closed. Records already received remain in your Vault.');
        }catch(e){Alert.alert('Cancellation not confirmed',e.message,[{text:'OK',onPress:()=>{setShowRequestDetail(false);setSelectedRequest(null);}}]);}
        finally{cancelBusy.current=false;setCancelling(false);refetchRequests();}
      }}]);
  }
  function confirmResend(){
    const request=selectedRequest;
    if(!request || cancelBusy.current || resendBusy.current || !['pending','sent','opened','expired'].includes(request.status))return;
    Alert.alert('Resend records request?',
      `Send a new request to ${request.providerEmail}? It includes your patient identity details, requested record types and request message. The previous upload link will stop working.`,
      [{text:'Cancel',style:'cancel'},{text:'Resend',onPress:async()=>{
        if(resendBusy.current||cancelBusy.current)return;
        resendBusy.current=true;setResending(true);
        try{
          const result=await resendRecordRequest({requestId:request.id,storage:AsyncStorage,
            getSession:async()=>(await supabase.auth.getSession()).data.session,
            baseUrl:process.env.EXPO_PUBLIC_SUPABASE_URL,anonKey:process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY});
          Alert.alert(result.emailAccepted?'Email accepted':'Email not sent',result.emailAccepted
            ?'The email service accepted the request. Inbox delivery is not yet confirmed.'
            :'The upload link was replaced, but the email was not sent. Please contact support before trying again.');
          setShowRequestDetail(false);setSelectedRequest(null);
        }catch(e){Alert.alert('Resend not confirmed',e.message);}
        finally{resendBusy.current=false;setResending(false);refetchRequests();}
      }}]);
  }

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
  const { stats, refetch: refetchStats } = useVaultStats();
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
    refetchStats();
  }, [refetch, refetchRequests, refetchStats]);

  const refreshAfterImport = useCallback(async () => {
    setActiveFilter('All');
    const results = await Promise.all([refetch({kind: undefined}), refetchStats()]);
    if (results.some(ok => !ok)) throw new Error('Records refresh failed');
  }, [refetch, refetchStats]);

  const lastSyncedPill = stats?.lastSyncedAt
    ? new Date(stats.lastSyncedAt).toLocaleDateString()
    : 'Never';
  const connectedProvidersPill = stats?.connectedProviders ?? 0;
  const totalRecordsPill = stats?.totalRecords ?? 0;

  const showListSkeleton = loading && records.length === 0 && !error;

  const filteredProviders = providerList.providers.filter(
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

  function reviewCreate(){
    if(createBusy.current)return;
    let input;
    try{input=validateRecordRequest({providerName:manualName,providerEmail:manualEmail,doctorName:manualDoctor,recordTypes:manualTypes,urgency:manualPriority,message:manualMessage});}
    catch(e){Alert.alert('Review request',e.message);return;}
    Alert.alert('Send records request?',`${input.providerName}\n${input.providerEmail}\nRecords: ${input.recordTypes.join(', ')}\nPriority: ${input.urgency}\nMessage: ${input.message||'None'}\n\nYour saved identity details (including name, birth date and contact information when available) will be included.`,[
      {text:'Cancel',style:'cancel'},{text:'Send request',onPress:async()=>{
        if(createBusy.current)return;createBusy.current=true;setCreating(true);
        try{const receipt=await createRecordRequest({input,storage:AsyncStorage,getSession:async()=>(await supabase.auth.getSession()).data.session,
          digest:value=>Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,value),baseUrl:process.env.EXPO_PUBLIC_SUPABASE_URL,anonKey:process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY});
          setShowRequestModal(false);Alert.alert('Request created',receipt.emailAccepted?'The email service accepted the request. Inbox delivery is not yet confirmed.':'The request was saved, but its email was not sent. Open the saved request to review it.');
        }catch(e){Alert.alert('Request not confirmed',e.message);}
        finally{createBusy.current=false;setCreating(false);refetchRequests();}
      }}]);
  }

  const closeRequestModal = () => {
    if(createBusy.current)return;
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
        contentContainerStyle={[styles.scrollContent,{paddingBottom:insets.bottom+space.lg}]}
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
              <Text variant="caption" style={styles.nowViewing}>NOW VIEWING</Text>
              <Text variant="page" style={styles.pageTitle}>Records</Text>
            </View>
          ) : null}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.btnNavy} activeOpacity={0.85} accessibilityRole="button" onPress={() => setShowProviderConnection(true)}>
              <Ionicons name="link" size={16} color={STEEL.onAction} />
              <Text variant="caption" style={styles.btnNavyText}>Connect Provider</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} activeOpacity={0.85} onPress={openRequestModal}>
              <Ionicons name="send-outline" size={16} color={STEEL.textPrimary} />
              <Text variant="caption" style={styles.btnOutlineText}>Request Manually</Text>
              {activeCount > 0 ? (
                <View style={styles.badgeOrange}>
                  <Text variant="caption" style={styles.badgeOrangeText}>{activeCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Ionicons name="document-text-outline" size={14} color={STEEL.textSecondary} />
            <Text variant="caption" style={styles.statPillText}>Last Synced: {lastSyncedPill}</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="link" size={14} color={STEEL.textSecondary} />
            <Text variant="caption" style={styles.statPillText}>Connected Providers: {connectedProvidersPill}</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="cloud-upload-outline" size={14} color={STEEL.textSecondary} />
            <Text variant="caption" style={styles.statPillText}>Total Records: {totalRecordsPill}</Text>
          </View>
        </View>

        <UploadRecordForm colors={STEEL} onSaved={refreshAfterImport} />

        {requestsError ? (
          <Text variant="secondary" style={styles.inlineRequestError}>{requestsError}</Text>
        ) : null}

        {showPendingSection ? (
          <View style={styles.section}>
            <View style={styles.pendingHeader}>
              <Text variant="caption" style={styles.pendingLabel}>RECORD REQUESTS</Text>
              <View style={styles.pendingBadge}>
                <Text variant="caption" style={styles.pendingBadgeText}>{activeCount} active</Text>
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
                      <Text variant="body" style={styles.pendingDoctor} numberOfLines={1}>
                        {req.doctorName}
                      </Text>
                      <Text variant="caption" style={styles.pendingClinic} numberOfLines={1}>
                        {req.clinic}
                      </Text>
                      <View style={styles.sentBadge}>
                        <Ionicons name="mail-outline" size={11} color={STEEL.accent} />
                        <Text variant="caption" style={styles.sentBadgeText}>{({pending:'Pending',sent:'Sent',received:'Received',failed:'Failed',cancelled:'Cancelled'})[req.status] || 'Unknown status'}</Text>
                      </View>
                      <Text variant="caption" style={styles.pendingType}>{req.recordType}</Text>
                      <Text variant="caption" style={styles.pendingAgo}>{req.sentAgo}</Text>
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
                <Text variant="secondary" style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
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
              <Ionicons name="alert-circle-outline" size={36} color={STEEL.danger} />
              <Text variant="section" style={styles.emptyTitle}>{"Couldn't load records"}</Text>
              <Text variant="body" style={styles.emptySubtitle}>{error}</Text>
              <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
                <Text variant="body" style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : !loading && records.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={36} color={STEEL.textMuted} />
              <Text variant="section" style={styles.emptyTitle}>No records yet</Text>
              <Text variant="body" style={styles.emptySubtitle}>
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
                    <Text variant="body" style={styles.recordTitle} numberOfLines={2}>
                      {rec.title}
                    </Text>
                    {rec.source === 'shared' ? (
                      <View style={styles.sharedBadge}>
                        <Ionicons name="link" size={11} color={STEEL.info} />
                        <Text variant="caption" style={styles.sharedBadgeText}>Shared</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text variant="secondary" style={styles.recordMeta}>
                    {rec.providerName || '—'} • {formatRecordDate(rec.serviceDate)}
                  </Text>
                  {rec.aiSummary ? (
                    <View style={styles.aiRow}>
                      <View style={styles.aiBadge}>
                        <Text variant="caption" style={styles.aiBadgeText}>AI</Text>
                      </View>
                      <Text variant="secondary" style={styles.aiSnippet} numberOfLines={2}>
                        {rec.aiSummary}
                      </Text>
                    </View>
                  ) : null}
                  {rec.tags?.length ? (
                    <View style={styles.tagsRow}>
                      {rec.tags.map((t) => (
                        <View key={t} style={styles.tagPill}>
                          <Text variant="caption" style={styles.tagPillText}>{t}</Text>
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

      <Modal visible={showProviderConnection} animationType="slide" transparent onRequestClose={() => setShowProviderConnection(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalFill}>
          <View style={[styles.requestModal, {paddingBottom:insets.bottom+12}]}>
            <View style={styles.reqHeader}>
              <Text variant="section" style={styles.reqTitle}>Connect Provider</Text>
              <TouchableOpacity accessibilityRole="button" style={{minWidth:48,minHeight:48,alignItems:'center',justifyContent:'center'}} accessibilityLabel="Close provider connection" onPress={() => setShowProviderConnection(false)}><Ionicons name="close" size={28} color={STEEL.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {showProviderConnection && <ProviderConnectionForm colors={STEEL} onConnected={async () => {if (!await refetchStats()) throw new Error('Statistics refresh failed');}} onImported={refreshAfterImport} onManual={() => {setShowProviderConnection(false);openRequestModal();}} />}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Record detail bottom sheet */}
      <Modal visible={!!selectedRecord} animationType="slide" transparent onRequestClose={() => setSelectedRecord(null)}>
        <Pressable accessible={false} style={styles.sheetOverlay} onPress={() => setSelectedRecord(null)}>
          <Pressable accessible={false} style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text variant="section" style={styles.sheetTitle} numberOfLines={2}>
                {selectedRecord?.title}
              </Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close record details" onPress={() => setSelectedRecord(null)} hitSlop={12}>
                <Ionicons name="close" size={28} color={STEEL.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.detailTabs}>
              {['summary', 'document', 'insights'].map((tab) => (
                <TouchableOpacity accessibilityRole="tab" accessibilityState={{selected:recordDetailTab===tab}} key={tab} style={styles.detailTab} onPress={() => setRecordDetailTab(tab)}>
                  <Text variant="body" style={[styles.detailTabText, recordDetailTab === tab && styles.detailTabTextActive]}>
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
                  <Row label="Date" value={formatRecordDate(selectedRecord.serviceDate)} />
                  <Row label="Type" value={labelForKind(selectedRecord.kind)} />
                  <Row label="Source" value={sourceLabel(selectedRecord.source)} />
                  {selectedRecord.aiSummary ? (
                    <View style={styles.aiSummaryCard}>
                      <Text variant="secondary" style={styles.aiSummaryHeader}>✦ AI Summary</Text>
                      <Text variant="body" style={styles.aiSummaryBody}>{selectedRecord.aiSummary}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {recordDetailTab === 'document' ? (
                <View style={styles.emptyDoc}>
                  <Ionicons name="document-text-outline" size={48} color={STEEL.textMuted} />
                  <Text variant="body" style={styles.emptyDocTitle}>No document file attached to this record.</Text>
                  <Text variant="secondary" style={styles.emptyDocSub}>Files uploaded by providers will appear here.</Text>
                </View>
              ) : null}
              {recordDetailTab === 'insights' ? (
                <View>
                  <Text variant="body" style={styles.insightsHint}>
                    Record insights are not available in the mobile app yet.
                  </Text>
                </View>
              ) : null}
            </ScrollView>
            <Text variant="secondary" style={styles.insightsHint}>
              Record sharing is not available in the mobile app yet.
            </Text>
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
                  <Text variant="section" style={styles.reqTitle}>Request Health Record</Text>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close record request" hitSlop={12} onPress={closeRequestModal}>
                    <Ionicons name="close" size={28} color={STEEL.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text variant="secondary" style={styles.reqSubtitle}>Select from your saved care team or enter a provider</Text>
                <Text variant="caption" style={styles.stepIndicator}>① Provider ——— 2 Details</Text>
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
                  {providerList.loading && <Text variant="secondary" style={styles.reqSubtitle}>Loading your care team…</Text>}
                  {!!providerList.error && <Text variant="secondary" style={styles.reqSubtitle}>{providerList.error}</Text>}
                  {!providerList.loading && !providerList.error && !filteredProviders.length && <Text variant="secondary" style={styles.reqSubtitle}>No matching care team members.</Text>}
                  {filteredProviders.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.providerRow}
                      onPress={() => {
                        setManualName(p.clinic||p.name);setManualDoctor(p.name);setManualEmail(p.email);
                        setRequestFlow('manual');
                      }}
                    >
                      <Ionicons name="business-outline" size={20} color={STEEL.textSecondary} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text variant="body" style={styles.providerName}>{p.name}</Text>
                        <Text variant="caption" style={styles.providerSub}>
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
                      <Text variant="body" style={styles.manualEntryTitle}>Enter provider details manually</Text>
                      <Text variant="caption" style={styles.manualEntrySub}>Send a request via email to any provider</Text>
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
                onSubmit={reviewCreate}
                busy={creating}
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
        <Pressable accessible={false} style={styles.sheetOverlay} onPress={() => setShowRequestDetail(false)}>
          <Pressable accessible={false} style={[styles.sheet, { maxHeight: '92%', paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            {selectedRequest ? (
              <>
                <View style={styles.reqDetailHeader}>
                  <View style={styles.reqDetailIconOrange}>
                    <Ionicons name="business" size={20} color={STEEL.onAction} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" style={styles.reqDetailDoctor}>{selectedRequest.doctorName}</Text>
                    <Text variant="secondary" style={styles.reqDetailClinic}>{selectedRequest.clinic}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowRequestDetail(false)}>
                    <Ionicons name="close" size={28} color={STEEL.textMuted} />
                  </TouchableOpacity>
                </View>
                {selectedRequest.expired && selectedRequest.status !== 'cancelled' ? (
                  <View style={styles.expiredBanner}>
                    <Ionicons name="warning" size={16} color={STEEL.orange} />
                    <Text variant="caption" style={styles.expiredText}>
                      Request Expired — The provider link is no longer valid. Use Resend Request to issue a new one.
                    </Text>
                  </View>
                ) : null}
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text variant="caption" style={styles.detailSectionLabel}>REQUESTED RECORDS</Text>
                  <View style={styles.pillRow}>
                    {(selectedRequest.recordTypes?.length
                      ? selectedRequest.recordTypes
                      : [selectedRequest.recordType]
                    ).map((t) => (
                      <View key={String(t)} style={styles.reqTypePill}>
                        <Text variant="caption" style={styles.reqTypePillText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                  <Text variant="caption" style={styles.detailSectionLabel}>MESSAGE TO PROVIDER</Text>
                  <View style={styles.messageBox}>
                    <Text variant="secondary" style={styles.messageText}>{selectedRequest.message}</Text>
                  </View>
                  <Text variant="caption" style={styles.detailSectionLabel}>TIMELINE</Text>
                  <Timeline t={selectedRequest.timeline} />
                  <Text variant="caption" style={styles.detailSectionLabel}>REQUEST DETAILS</Text>
                  <Row label="Status" value={selectedRequest.status} />
                  <Row label="Provider Email" value={selectedRequest.providerEmail || '—'} />
                  <Row label="Patient Name" value={selectedRequest.patientName || '—'} />
                  <Row label="Urgency" value={selectedRequest.urgency || '—'} />
                </ScrollView>
                <View style={styles.reqDetailFooter}>
                  {['pending','sent','opened','expired'].includes(selectedRequest.status) && <TouchableOpacity style={styles.resendBtn} activeOpacity={0.9} onPress={confirmResend} disabled={cancelling || resending || !['pending','sent','opened','expired'].includes(selectedRequest.status) || !selectedRequest.providerEmail}>
                    <Ionicons name="refresh" size={18} color={STEEL.onAction} />
                    <Text variant="body" style={styles.resendBtnText}>{resending?'Resending…':'Resend Request'}</Text>
                  </TouchableOpacity>}
                  {['pending','sent','failed'].includes(selectedRequest.status) && <TouchableOpacity
                    style={styles.trashBtn} disabled={cancelling||resending} accessibilityLabel={cancelling?'Cancelling request':'Cancel request'} accessibilityState={{disabled:cancelling||resending,busy:cancelling}}
                    onPress={confirmCancel}>
                    <Text variant="body" style={{color:STEEL.textSecondary}}>{cancelling?'Cancelling…':'Cancel request'}</Text>
                  </TouchableOpacity>}
                  <TouchableOpacity
                    style={styles.trashBtn}
                    accessibilityLabel="Hide request from this list"
                    onPress={() => {
                      setDismissedRequestIds((prev) => [...prev, selectedRequest.id]);
                      setShowRequestDetail(false);
                      setSelectedRequest(null);
                    }}
                  >
                    <Ionicons name="eye-off-outline" size={22} color={STEEL.textMuted} />
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
  const {STEEL,styles}=useContext(RecordsTheme);
  return (
    <View style={styles.kvRow}>
      <Text variant="caption" style={styles.kvLabel}>{label}</Text>
      <Text variant="body" style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function Timeline({ t }) {
  const {STEEL,styles}=useContext(RecordsTheme);
  if (!t) return null;
  return (
    <View style={styles.timeline}>
      <TimelineItem icon="document-text" title="Request Created" time={t.created} done />
      <TimelineItem icon="eye-outline" title="Opened by Provider" time={t.opened} done={!!t.opened} />
      <TimelineItem icon="checkmark-circle-outline" title="Records Submitted" time={t.submitted} done={!!t.submitted} last />
    </View>
  );
}

function TimelineItem({ icon, title, time, done, last }) {
  const {STEEL,styles}=useContext(RecordsTheme);
  return (
    <View style={[styles.tlRow, last ? null : styles.tlRowBorder]}>
      <View style={[styles.tlIcon, { backgroundColor: done ? STEEL.successBg : STEEL.surfaceMuted }]}>
        <Ionicons name={icon} size={16} color={done ? STEEL.success : STEEL.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="secondary" style={styles.tlTitle}>{title}</Text>
        <Text variant="caption" style={styles.tlTime}>{time || 'Pending'}</Text>
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
  const {STEEL,styles}=useContext(RecordsTheme);
  return (
    <>
      <View style={styles.reqHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={STEEL.textPrimary} />
        </TouchableOpacity>
        <Text variant="section" style={[styles.reqTitle, { flex: 1, textAlign: 'center' }]}>Request Health Record</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close record request" hitSlop={12} onPress={onClose}>
          <Ionicons name="close" size={28} color={STEEL.textMuted} />
        </TouchableOpacity>
      </View>
      <Text variant="secondary" style={styles.reqFromLine}>From {selectedProvider.name}</Text>
      <Text variant="caption" style={styles.stepIndicator}>✓ Provider ——— ② Details</Text>
      <View style={styles.selectedProviderBar}>
        <Ionicons name="business-outline" size={20} color={STEEL.textSecondary} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text variant="body" style={styles.providerName}>{selectedProvider.name}</Text>
          <Text variant="caption" style={styles.providerSub}>{selectedProvider.clinic}</Text>
        </View>
        <TouchableOpacity onPress={onBack}>
          <Text variant="body" style={styles.changeLink}>Change</Text>
        </TouchableOpacity>
      </View>
      <Text variant="caption" style={styles.blockLabel}>Record Types</Text>
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
              <Text variant="body" style={styles.typeSelectLabel}>{opt.label}</Text>
              <Text variant="caption" style={styles.typeSelectDesc}>{opt.desc}</Text>
            </View>
            {sel ? <Ionicons name="checkmark-circle" size={22} color={STEEL.accent} /> : null}
          </TouchableOpacity>
        );
      })}
      <Text variant="caption" style={styles.blockLabel}>Date Range (optional)</Text>
      <View style={styles.dateRow}>
        <TextInput style={styles.dateInput} placeholder="From" value={dateFrom} onChangeText={setDateFrom} placeholderTextColor={STEEL.textMuted} />
        <TextInput style={styles.dateInput} placeholder="To" value={dateTo} onChangeText={setDateTo} placeholderTextColor={STEEL.textMuted} />
      </View>
      <Text variant="caption" style={styles.blockLabel}>Priority</Text>
      <View style={styles.priorityRow}>
        <TouchableOpacity
          style={[styles.priorityCard, priority === 'routine' && styles.priorityCardActive]}
          onPress={() => setPriority('routine')}
        >
          <Ionicons name="time-outline" size={22} color={STEEL.accent} />
          <Text variant="body" style={styles.priorityTitle}>Routine</Text>
          <Text variant="caption" style={styles.prioritySub}>5-10 business days</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.priorityCard, priority === 'urgent' && styles.priorityCardActive]}
          onPress={() => setPriority('urgent')}
        >
          <Ionicons name="send-outline" size={22} color={STEEL.accent} />
          <Text variant="body" style={styles.priorityTitle}>Urgent</Text>
          <Text variant="caption" style={styles.prioritySub}>1-3 business days</Text>
        </TouchableOpacity>
      </View>
      <Text variant="caption" style={styles.blockLabel}>Message to Provider</Text>
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
          <Text variant="caption" style={styles.identityHeaderText}>IDENTITY VERIFICATION READY</Text>
        </View>
        <Text variant="secondary" style={styles.identityBody}>
          Your date of birth, phone, and email will be included with this request so the provider can verify your identity.
        </Text>
        <Text variant="secondary" style={styles.identityCheck}>✓ All verification fields complete</Text>
      </View>
      <TouchableOpacity style={styles.submitPurple} activeOpacity={0.9}>
        <Ionicons name="send" size={18} color={STEEL.onAction} />
        <Text variant="body" style={styles.submitPurpleText}>Submit Request</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backTextBtn} onPress={onBack}>
        <Text variant="body" style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </>
  );
}

function ManualRequestForm({
  onSubmit,
  busy,
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
  const {STEEL,styles}=useContext(RecordsTheme);
  return (
    <>
      <View style={styles.reqHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={STEEL.textPrimary} />
        </TouchableOpacity>
        <Text variant="section" style={[styles.reqTitle, { flex: 1, textAlign: 'center' }]}>Manual Request</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close record request" hitSlop={12} onPress={onClose}>
          <Ionicons name="close" size={28} color={STEEL.textMuted} />
        </TouchableOpacity>
      </View>
      <Text variant="secondary" style={styles.reqSubtitle}>{"Review the recipient and records before sending."}</Text>
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={18} color={STEEL.accent} />
        <Text variant="secondary" style={styles.infoBannerText}>
          {"We'll send a secure record request to the provider's email on your behalf."}
        </Text>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text variant="caption" style={styles.fieldLabel}>Provider / Facility Name *</Text>
        <TextInput style={styles.fieldInput} value={manualName} onChangeText={setManualName} placeholder="Name" placeholderTextColor={STEEL.textMuted} />
        <Text variant="caption" style={styles.fieldLabel}>{"Doctor's Name (optional)"}</Text>
        <TextInput style={styles.fieldInput} value={manualDoctor} onChangeText={setManualDoctor} placeholder="Doctor" placeholderTextColor={STEEL.textMuted} />
        <Text variant="caption" style={styles.fieldLabel}>{"Provider's Email Address *"}</Text>
        <TextInput
          style={styles.fieldInput}
          value={manualEmail}
          onChangeText={setManualEmail}
          placeholder="email@clinic.com"
          placeholderTextColor={STEEL.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text variant="caption" style={styles.blockLabel}>Record Types</Text>
        {RECORD_TYPE_OPTIONS.map((opt) => {
          const sel = manualTypes.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.typeSelectRow, sel && styles.typeSelectRowActive]}
              onPress={() => toggleType(opt.id)}
            >
              <View style={{ flex: 1 }}>
                <Text variant="body" style={styles.typeSelectLabel}>{opt.label}</Text>
                <Text variant="caption" style={styles.typeSelectDesc}>{opt.desc}</Text>
              </View>
              {sel ? <Ionicons name="checkmark-circle" size={22} color={STEEL.accent} /> : null}
            </TouchableOpacity>
          );
        })}
        <Text variant="caption" style={styles.blockLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          <TouchableOpacity
            style={[styles.priorityCard, manualPriority === 'routine' && styles.priorityCardActive]}
            onPress={() => setManualPriority('routine')}
          >
            <Ionicons name="time-outline" size={22} color={STEEL.accent} />
            <Text variant="body" style={styles.priorityTitle}>Routine</Text>
            <Text variant="caption" style={styles.prioritySub}>5-10 business days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.priorityCard, manualPriority === 'urgent' && styles.priorityCardActive]}
            onPress={() => setManualPriority('urgent')}
          >
            <Ionicons name="send-outline" size={22} color={STEEL.accent} />
            <Text variant="body" style={styles.priorityTitle}>Urgent</Text>
            <Text variant="caption" style={styles.prioritySub}>1-3 business days</Text>
          </TouchableOpacity>
        </View>
        <Text variant="caption" style={styles.blockLabel}>Message to Provider</Text>
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
        <TouchableOpacity style={styles.submitPurple} activeOpacity={0.9} onPress={onSubmit} disabled={busy}>
          <Ionicons name="send" size={18} color={STEEL.onAction} />
          <Text variant="body" style={styles.submitPurpleText}>{busy?'Sending…':'Review Request'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const createStyles = (STEEL,largeText=false) => StyleSheet.create({
  root: { flex: 1, backgroundColor: STEEL.canvas },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  headerRow: { alignItems: 'stretch', marginBottom: 12, gap: 12 },
  headerLeft: { minWidth: 0 },
  nowViewing: {
    ...typeStyles.caption,
    fontWeight: '600',
    color: STEEL.eyebrow,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pageTitle: { ...typeStyles.page, fontWeight: '800', color: STEEL.textPrimary },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  btnNavy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEEL.navy,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnNavyText: { flexShrink: 1, color: STEEL.onAction, fontWeight: '600', ...typeStyles.caption },
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
  btnOutlineText: { flexShrink: 1, fontWeight: '600', ...typeStyles.caption, color: STEEL.textPrimary },
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
  badgeOrangeText: { color: STEEL.onAction, ...typeStyles.caption, fontWeight: '800' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  inlineRequestError: {
    ...typeStyles.secondary,
    color: STEEL.danger,
    marginBottom: 10,

  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: STEEL.surface,
    borderWidth: 1,
    borderColor: STEEL.border,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statPillText: { color: STEEL.textSecondary, ...typeStyles.caption, fontWeight: '600', flexShrink: 1 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STEEL.successBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STEEL.successBorder,
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
    backgroundColor: STEEL.successAction,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  successIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: STEEL.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  successBannerBody: { flex: 1, minWidth: 0 },
  successTitle: { ...typeStyles.secondary, fontWeight: '700', color: STEEL.success },
  successSub: { ...typeStyles.caption, color: STEEL.success, marginTop: 2 },
  viewLinkBtn: { paddingHorizontal: 8 },
  viewLinkText: { ...typeStyles.secondary, fontWeight: '700', color: STEEL.success },
  dismissX: { ...typeStyles.title, color: STEEL.success, paddingHorizontal: 4 },
  section: { marginBottom: 14 },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pendingLabel: { ...typeStyles.caption, fontWeight: '700', color: STEEL.textMuted, letterSpacing: 1 },
  pendingBadge: { backgroundColor: STEEL.orange, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pendingBadgeText: { color: STEEL.onAction, ...typeStyles.caption, fontWeight: '800' },
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
  pendingDoctor: { ...typeStyles.body, fontWeight: '700', color: STEEL.textPrimary },
  pendingClinic: { ...typeStyles.caption, color: STEEL.textSecondary, marginTop: 2 },
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
  sentBadgeText: { ...typeStyles.caption, fontWeight: '600', color: STEEL.accent },
  pendingType: { ...typeStyles.caption, color: STEEL.textPrimary, marginTop: 8, fontWeight: '600' },
  pendingAgo: { ...typeStyles.caption, color: STEEL.textMuted, marginTop: 4 },
  pendingCardSkeleton: {
    width: 168,
    backgroundColor: STEEL.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
    gap: 8,
  },
  pendingSkeletonIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: STEEL.skeleton },
  pendingSkeletonLine: { height: 12, borderRadius: 6, backgroundColor: STEEL.skeleton, width: '90%' },
  pendingSkeletonLineShort: { height: 10, borderRadius: 5, backgroundColor: STEEL.skeleton, width: '55%' },
  pendingSkeletonLineTiny: { height: 10, borderRadius: 5, backgroundColor: STEEL.skeleton, width: '35%' },
  pendingSkeletonBadge: { height: 22, width: 52, borderRadius: 6, backgroundColor: STEEL.skeleton, marginTop: 4 },
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
  filterPillActive: { backgroundColor: STEEL.successAction, borderColor: STEEL.success },
  filterPillText: { ...typeStyles.secondary, fontWeight: '600', color: STEEL.textSecondary },
  filterPillTextActive: { color: STEEL.onAction },
  listSection: { gap: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 16 },
  emptyTitle: { ...typeStyles.section, fontWeight: '700', color: STEEL.textPrimary, marginTop: 12, textAlign: 'center' },
  emptySubtitle: { ...typeStyles.body, color: STEEL.textSecondary, marginTop: 8, textAlign: 'center', },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: STEEL.navy,
    borderRadius: 10,
  },
  retryText: { color: STEEL.onAction, fontWeight: '700', ...typeStyles.body },
  recordSkeletonCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
    backgroundColor: STEEL.surface,
  },
  recordSkeletonIcon: { width: 48, height: 48, borderRadius: 10, backgroundColor: STEEL.skeleton },
  recordSkeletonCol: { flex: 1, gap: 8 },
  recordSkeletonLine: { height: 14, borderRadius: 6, backgroundColor: STEEL.skeleton },
  recordSkeletonLineShort: { height: 12, borderRadius: 6, backgroundColor: STEEL.skeleton, width: '60%' },
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
  recordTitle: { ...typeStyles.body, fontWeight: '700', color: STEEL.textPrimary, flex: 1 },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEEL.infoBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sharedBadgeText: { ...typeStyles.caption, fontWeight: '700', color: STEEL.info },
  recordMeta: { ...typeStyles.secondary, color: STEEL.textSecondary, marginTop: 4 },
  aiRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-start' },
  aiBadge: { backgroundColor: STEEL.successBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  aiBadgeText: { ...typeStyles.caption, fontWeight: '800', color: STEEL.success },
  aiSnippet: { flex: 1, ...typeStyles.secondary, color: STEEL.textPrimary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagPill: { backgroundColor: STEEL.surfaceMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagPillText: { ...typeStyles.caption, color: STEEL.textSecondary, fontWeight: '500' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: STEEL.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '88%',
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: STEEL.skeleton, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  sheetTitle: { ...typeStyles.section, fontWeight: '800', color: STEEL.textPrimary, flex: 1, paddingRight: 12 },
  sheetClose: { ...typeStyles.page, color: STEEL.textMuted, },
  detailTabs: { flexDirection: largeText?'column':'row', borderBottomWidth: 1, borderBottomColor: STEEL.border, marginBottom: 12 },
  detailTab: { flex: largeText?0:1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  detailTabText: { ...typeStyles.body, fontWeight: '600', color: STEEL.textSecondary },
  detailTabTextActive: { color: STEEL.textPrimary },
  detailTabUnderline: { position: 'absolute', bottom: 0, height: 3, width: '60%', backgroundColor: STEEL.successAction, borderRadius: 2 },
  sheetBody: { maxHeight: 320 },
  kvRow: { marginBottom: 12 },
  kvLabel: { ...typeStyles.caption, color: STEEL.textMuted, marginBottom: 2 },
  kvValue: { ...typeStyles.body, fontWeight: '600', color: STEEL.textPrimary },
  aiSummaryCard: {
    backgroundColor: STEEL.successBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: STEEL.successBorder,
    marginTop: 8,
  },
  aiSummaryHeader: { ...typeStyles.secondary, fontWeight: '700', color: STEEL.success, marginBottom: 6 },
  aiSummaryBody: { ...typeStyles.body, color: STEEL.textPrimary, },
  emptyDoc: { alignItems: 'center', paddingVertical: 24 },
  emptyDocTitle: { ...typeStyles.body, fontWeight: '600', color: STEEL.textPrimary, textAlign: 'center', marginTop: 12 },
  emptyDocSub: { ...typeStyles.secondary, color: STEEL.textSecondary, textAlign: 'center', marginTop: 6, paddingHorizontal: 16 },
  generateInsightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEEL.successAction,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateInsightsText: { color: STEEL.onAction, fontWeight: '700', ...typeStyles.body },
  insightsHint: { ...typeStyles.secondary, color: STEEL.textSecondary, marginTop: 12, },
  shareRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEEL.successAction,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  shareRecordText: { color: STEEL.onAction, fontWeight: '700', ...typeStyles.body },
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
  reqTitle: { ...typeStyles.section, fontWeight: '800', color: STEEL.textPrimary },
  reqSubtitle: { ...typeStyles.secondary, color: STEEL.textSecondary, marginBottom: 8 },
  stepIndicator: { ...typeStyles.caption, color: STEEL.textMuted, marginBottom: 12, fontWeight: '600' },
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
    borderColor: STEEL.accentBorder,
  },
  searchPurpleInput: { flex: 1, ...typeStyles.body, color: STEEL.textPrimary },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: STEEL.border,
  },
  providerName: { ...typeStyles.body, fontWeight: '700', color: STEEL.textPrimary },
  providerSub: { ...typeStyles.caption, color: STEEL.textSecondary, marginTop: 2 },
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
  manualEntryTitle: { ...typeStyles.body, fontWeight: '700', color: STEEL.accent },
  manualEntrySub: { ...typeStyles.caption, color: STEEL.textSecondary, marginTop: 2 },
  reqFromLine: { ...typeStyles.secondary, color: STEEL.textSecondary, marginBottom: 8 },
  selectedProviderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: STEEL.surfaceMuted,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeLink: { ...typeStyles.body, fontWeight: '700', color: STEEL.accent },
  blockLabel: { ...typeStyles.caption, fontWeight: '700', color: STEEL.textMuted, marginBottom: 8, marginTop: 8 },
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
  typeSelectLabel: { ...typeStyles.body, fontWeight: '700', color: STEEL.textPrimary },
  typeSelectDesc: { ...typeStyles.caption, color: STEEL.textSecondary, marginTop: 2 },
  dateRow: { flexDirection: largeText?'column':'row', gap: 10 },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typeStyles.body,
    color: STEEL.textPrimary,
  },
  priorityRow: { flexDirection: largeText?'column':'row', gap: 10 },
  priorityCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  priorityCardActive: { borderColor: STEEL.accent, backgroundColor: STEEL.accentBg },
  priorityTitle: { ...typeStyles.body, fontWeight: '700', marginTop: 6, color: STEEL.textPrimary },
  prioritySub: { ...typeStyles.caption, color: STEEL.textSecondary, marginTop: 4, textAlign: 'center' },
  messageInput: {
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 12,
    padding: 12,
    ...typeStyles.body,
    color: STEEL.textPrimary,
    minHeight: 100,
    marginBottom: 12,
  },
  identityCard: {
    borderWidth: 1.5,
    borderColor: STEEL.success,
    borderRadius: 12,
    padding: 12,
    backgroundColor: STEEL.successBg,
    marginBottom: 12,
  },
  identityHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  identityHeaderText: { ...typeStyles.caption, fontWeight: '800', color: STEEL.success, letterSpacing: 0.5 },
  identityBody: { ...typeStyles.secondary, color: STEEL.textSecondary, },
  identityCheck: { ...typeStyles.secondary, fontWeight: '600', color: STEEL.success, marginTop: 8 },
  submitPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEEL.navy,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  submitPurpleText: { color: STEEL.onAction, fontWeight: '700', ...typeStyles.body },
  backTextBtn: { alignItems: 'center', paddingVertical: 8, marginBottom: 16 },
  backText: { ...typeStyles.body, fontWeight: '600', color: STEEL.accent },
  infoBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: STEEL.accentBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: STEEL.accentBorder,
  },
  infoBannerText: { flex: 1, ...typeStyles.secondary, color: STEEL.textPrimary, },
  fieldLabel: { ...typeStyles.caption, fontWeight: '600', color: STEEL.textSecondary, marginBottom: 4, marginTop: 8 },
  fieldInput: {
    borderWidth: 1,
    borderColor: STEEL.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typeStyles.body,
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
  reqDetailDoctor: { ...typeStyles.body, fontWeight: '800', color: STEEL.textPrimary },
  reqDetailClinic: { ...typeStyles.secondary, color: STEEL.textSecondary, marginTop: 2 },
  expiredBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: STEEL.orangeBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: STEEL.orangeBorder,
  },
  expiredText: { flex: 1, ...typeStyles.caption, color: STEEL.textPrimary, },
  detailSectionLabel: {
    ...typeStyles.caption,
    fontWeight: '800',
    color: STEEL.textMuted,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  reqTypePill: { backgroundColor: STEEL.surfaceMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  reqTypePillText: { ...typeStyles.caption, fontWeight: '600', color: STEEL.textSecondary },
  messageBox: { backgroundColor: STEEL.surfaceMuted, borderRadius: 10, padding: 12, marginBottom: 8 },
  messageText: { ...typeStyles.secondary, color: STEEL.textSecondary, },
  timeline: { marginBottom: 12 },
  tlRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'center' },
  tlRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: STEEL.skeleton },
  tlIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlTitle: { ...typeStyles.secondary, fontWeight: '700', color: STEEL.textPrimary },
  tlTime: { ...typeStyles.caption, color: STEEL.textMuted, marginTop: 2 },
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
  resendBtnText: { color: STEEL.onAction, fontWeight: '700', ...typeStyles.body },
  trashBtn: { padding: 10 },
});

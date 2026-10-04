import {useInsuranceMutation} from '../../../../packages/api-client/src/useInsuranceMutation';
import {insuranceProviderInitials,displayInsuranceMemberId,insuranceStatus,insuranceVerificationNotice,insuranceCoverageStatus,formatInsuranceDate} from '../../../../packages/api-client/src/insurance-status';
import {useInsuranceData} from '../hooks/useInsuranceData';
import {recordsColors} from '../theme/records';
import {typeStyles,control,space,radius} from '../theme/layout';
import {AppText as Text, AppTextInput} from '../components/ui/AppText';
import React, { useCallback, useState, useMemo, createContext, useContext } from 'react';
import {
  View,

  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const InsuranceTheme = createContext(null);
export default function InsuranceScreen({ darkMode = false, ...props }) {
  const theme = useMemo(() => {
    const STEEL = recordsColors(darkMode);
    return { STEEL, styles: createStyles(STEEL) };
  }, [darkMode]);
  return <InsuranceTheme.Provider value={theme}><InsuranceContent {...props} /></InsuranceTheme.Provider>;
}

function StatusBadge({ status }) {
  const { STEEL, styles } = useContext(InsuranceTheme);
  const statusInfo = insuranceStatus(status);
  const cfg = {label: statusInfo.label, bg: STEEL[statusInfo.tone+'Action'], icon: 'information-circle-outline'};
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={14} color={STEEL.onAction} />
      <Text variant="caption" style={styles.statusBadgeText}>{cfg.label}</Text>
    </View>
  );
}

function CoverageCardMobile({
  coverage,
  busy = false,
  onSaveMemberId,
  onSetPrimary,
  onStopCoverage,
  onResumeCoverage,
  onDelete,
}) {
  const { STEEL, styles } = useContext(InsuranceTheme);
  const [editingMember, setEditingMember] = useState(false);
  const [memberDraft, setMemberDraft] = useState('');
  const isStopped = coverage.coverageStatus === 'stopped';
  const badgeStatus = insuranceCoverageStatus(coverage);
  const startStr = formatInsuranceDate(coverage.effectiveStart);
  const endStr = coverage.effectiveEnd ? formatInsuranceDate(coverage.effectiveEnd) : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.providerLogoPlaceholder}>
            <Text variant="section" style={{color: STEEL.onAction, fontWeight: '700'}}>{insuranceProviderInitials(coverage.provider.name)}</Text>
          </View>
          <View style={styles.cardTitleBlock}>
            <View style={styles.nameRow}>
              <Text variant="section" style={styles.providerName} numberOfLines={2}>
                {coverage.provider.name}
              </Text>
              {isStopped ? (
                <View style={styles.pillStopped}>
                  <Text variant="caption" style={styles.pillStoppedText}>Stopped</Text>
                </View>
              ) : null}
              {!isStopped && coverage.isPrimary ? (
                <View style={styles.pillPrimary}>
                  <Ionicons name="star" size={12} color={STEEL.onAction} />
                  <Text variant="caption" style={styles.pillPrimaryText}>Primary</Text>
                </View>
              ) : null}
            </View>
            <Text variant="body" style={styles.planName} numberOfLines={2}>
              {coverage.planName}
            </Text>
          </View>
        </View>
        <StatusBadge status={badgeStatus} />
      </View>

      <View style={styles.fieldGrid}>
        <View style={[styles.fieldCell, editingMember && styles.memberEditing]}>
          <Text variant="caption" style={styles.fieldLabel}>Member ID</Text>
          <Text variant="body" style={styles.fieldValueMono}>{displayInsuranceMemberId(coverage.memberId)}</Text>
          {onSaveMemberId ? (editingMember ? (
            <View>
              <Text variant="body" style={styles.fieldLabel}>Member ID from your insurance card</Text>
              <AppTextInput accessibilityLabel="Member ID from your insurance card" value={memberDraft}
                onChangeText={setMemberDraft} editable={!busy} autoCorrect={false} autoCapitalize="none"
                style={[styles.memberInput, {color: STEEL.textPrimary, borderColor: STEEL.textMuted, backgroundColor: STEEL.surface}]} />
              <View style={styles.actionsRow}>
                <Pressable accessibilityRole="button" accessibilityState={{disabled: busy || !memberDraft.trim()}}
                  disabled={busy || !memberDraft.trim()} style={styles.actionBtn} onPress={async () => {
                    if (await onSaveMemberId(coverage, memberDraft)) {setEditingMember(false); setMemberDraft('');}
                  }}><Text style={styles.actionBtnText}>Save ID</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{disabled: busy}} style={styles.actionBtn}
                  onPress={() => {setEditingMember(false); setMemberDraft('');}}><Text style={styles.actionBtnText}>Cancel</Text></Pressable>
              </View>
            </View>
          ) : <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{disabled: busy}} style={styles.actionBtn}
            onPress={() => setEditingMember(true)}><Text style={styles.actionBtnText}>{coverage.memberId ? 'Update member ID' : 'Add member ID'}</Text></Pressable>) : null}
        </View>
        {coverage.groupNumber ? (
          <View style={styles.fieldCell}>
            <Text variant="caption" style={styles.fieldLabel}>Group Number</Text>
            <Text variant="body" style={styles.fieldValueMono}>{coverage.groupNumber}</Text>
          </View>
        ) : null}
        {coverage.bin ? (
          <View style={styles.fieldCell}>
            <Text variant="caption" style={styles.fieldLabel}>BIN</Text>
            <Text variant="body" style={styles.fieldValueMono}>{coverage.bin}</Text>
          </View>
        ) : null}
        {coverage.pcn ? (
          <View style={styles.fieldCell}>
            <Text variant="caption" style={styles.fieldLabel}>PCN</Text>
            <Text variant="body" style={styles.fieldValueMono}>{coverage.pcn}</Text>
          </View>
        ) : null}
      </View>

      <Text variant="caption" style={styles.effectiveLine}>
        Effective: {startStr}
        {endStr ? ` - ${endStr}` : ''}
      </Text>

      <View style={styles.actionsRow}>
        {!isStopped ? (
          <>
            {!coverage.isPrimary && onSetPrimary ? (
              <Pressable disabled={busy} accessibilityState={{disabled: busy}} style={styles.actionBtn} onPress={() => onSetPrimary(coverage)} accessibilityRole="button">
                <Ionicons name="star-outline" size={18} color={STEEL.textPrimary} />
                <Text variant="body" style={styles.actionBtnText}>Set Primary</Text>
              </Pressable>
            ) : null}
            {onStopCoverage ? (
              <Pressable disabled={busy} accessibilityState={{disabled: busy}} style={styles.actionBtnOrange} onPress={() => onStopCoverage(coverage)} accessibilityRole="button">
                <Ionicons name="stop-circle-outline" size={18} color={STEEL.warning} />
                <Text variant="body" style={styles.actionBtnOrangeText}>Mark Stopped</Text>
              </Pressable>
            ) : null}
          </>
        ) : onResumeCoverage ? (
          <Pressable disabled={busy} accessibilityState={{disabled: busy}} style={styles.actionBtnGreen} onPress={() => onResumeCoverage(coverage)} accessibilityRole="button">
            <Ionicons name="play-circle-outline" size={18} color={STEEL.success} />
            <Text variant="body" style={styles.actionBtnGreenText}>Mark Active</Text>
          </Pressable>
        ) : null}
        {onDelete ? (
          <Pressable disabled={busy} accessibilityState={{disabled: busy}} style={styles.actionBtnDelete} onPress={() => onDelete(coverage)} accessibilityRole="button">
            <Ionicons name="trash-outline" size={18} color={STEEL.dangerAction} />
            <Text variant="body" style={styles.actionBtnDeleteText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function InsuranceContent({ omitShellTitle = false, scrollFabProps = {} }) {
  const { STEEL, styles } = useContext(InsuranceTheme);
  const {coverages, loading, userId, error: loadError, refetch: loadCoverages} = useInsuranceData();
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}`;
    setToast({ id, message, type });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 4000);
  }, []);

  const {busy, run} = useInsuranceMutation(supabase, showToast, loadCoverages, () => setToast(null));
  const handleSetPrimary = coverage => run(userId, coverage.id, 'primary');
  const handleStopCoverage = coverage => run(userId, coverage.id, 'stop');
  const handleResumeCoverage = coverage => run(userId, coverage.id, 'resume');
  const handleDelete = coverage => {
    if (busy) return;
    Alert.alert('Remove saved coverage', 'Remove this saved coverage from Health Vault? This does not cancel your insurance.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: () => run(userId, coverage.id, 'remove')},
    ]);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      {...scrollFabProps}
    >
      {busy ? <Text variant="body" style={styles.emptyBody} accessibilityLiveRegion="polite">Updating saved coverage…</Text> : null}
      {toast ? (
        <View
          style={[
            styles.toast,
            toast.type === 'error' ? styles.toastError : styles.toastSuccess,
          ]}
        >
          <Ionicons
            name={toast.type === 'error' ? 'warning-outline' : 'checkmark-circle-outline'}
            size={20}
            color={toast.type === 'error' ? STEEL.danger : STEEL.success}
          />
          <Text variant="body" style={[styles.toastText, toast.type === 'error' ? styles.toastTextError : styles.toastTextSuccess]}>
            {toast.message}
          </Text>
          <Pressable onPress={() => setToast(null)} style={{minWidth:control.minTarget,minHeight:control.minTarget,alignItems:'center',justifyContent:'center'}} accessibilityRole="button" accessibilityLabel="Dismiss message">
            <Ionicons name="close" size={20} color={STEEL.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      {/* Always show intro: shell uses omitShellTitle so the top bar is the only title otherwise */}
      <View style={styles.hero}>
        {!omitShellTitle ? (
          <View style={styles.heroTitleRow}>
            <Ionicons name="shield-checkmark" size={28} color={STEEL.textPrimary} />
            <Text variant="title" style={styles.heroTitle}>Insurance</Text>
          </View>
        ) : null}
        <Text variant="body" style={[styles.heroSub, omitShellTitle && styles.heroSubOnly]}>
          Manage your saved insurance information
        </Text>
      </View>

      <Text style={styles.heroSub}>{insuranceVerificationNotice}</Text>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={STEEL.accent} />
        </View>
      ) : loadError ? (
        <View style={styles.emptyCard}>
          <Text variant="section" accessibilityRole="alert" style={styles.emptyTitle}>Unable to load insurance</Text>
          <Text variant="body" style={styles.emptyBody}>{loadError}</Text>
          <Pressable accessibilityRole="button" style={styles.actionBtn} onPress={() => loadCoverages()}>
            <Text style={styles.actionBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : coverages.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="shield-checkmark-outline" size={56} color={STEEL.textMuted} />
          {!userId ? (
            <>
              <Text variant="section" style={styles.emptyTitle}>Sign in to view insurance</Text>
              <Text variant="body" style={styles.emptyBody}>
                Your saved coverages load here when you are signed in with the same account as the Health Vault web app.
              </Text>
            </>
          ) : (
            <>
              <Text variant="section" style={styles.emptyTitle}>No insurance coverage added</Text>
              <Text variant="body" style={styles.emptyBody}>Use the Vault Assistant to add your insurance information</Text>
            </>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {coverages.map((c) => (
            <CoverageCardMobile
              onSaveMemberId={(coverage, value) => run(userId, coverage.id, 'memberId', value)}
              busy={busy}
              key={c.id}
              coverage={c}
              onSetPrimary={handleSetPrimary}
              onStopCoverage={handleStopCoverage}
              onResumeCoverage={handleResumeCoverage}
              onDelete={handleDelete}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (STEEL) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 20, paddingTop: 8 },
  hero: { marginBottom: 20 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  heroTitle: { ...typeStyles.title, fontWeight: '800', color: STEEL.textPrimary },
  heroSub: { ...typeStyles.body,  color: STEEL.textSecondary },
  heroSubOnly: { marginTop: 0 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  toastSuccess: { backgroundColor: STEEL.successBg, borderColor: STEEL.successBorder },
  toastError: { backgroundColor: STEEL.dangerBg, borderColor: STEEL.dangerBorder },
  toastText: { flex: 1, ...typeStyles.body, },
  toastTextSuccess: { color: STEEL.success },
  toastTextError: { color: STEEL.danger },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  emptyCard: {
    backgroundColor: STEEL.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: STEEL.border,
  },
  emptyTitle: { ...typeStyles.section, fontWeight: '700', color: STEEL.textPrimary, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptyBody: { ...typeStyles.body,  color: STEEL.textSecondary, textAlign: 'center' },
  list: { gap: 16 },
  card: {
    backgroundColor: STEEL.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: STEEL.border,
    overflow: 'hidden',
  },
  cardStopped: { opacity: 0.78 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    paddingBottom: 12,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 },
  providerLogo: { width: 48, height: 48, borderRadius: 10 },
  providerLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: STEEL.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 },
  providerName: { ...typeStyles.section, fontWeight: '700', color: STEEL.textPrimary, flexShrink: 1 },
  planName: { ...typeStyles.body, color: STEEL.textSecondary },
  pillStopped: { backgroundColor: STEEL.infoAction, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillStoppedText: { color: STEEL.onAction, ...typeStyles.caption, fontWeight: '700' },
  pillPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEEL.navy,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillPrimaryText: { color: STEEL.onAction, ...typeStyles.caption, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  statusBadgeText: { flexShrink: 1, color: STEEL.onAction, ...typeStyles.caption, fontWeight: '700' },
  memberEditing: {width: '100%'},
  memberInput: {borderWidth: control.border, borderRadius: radius.control, paddingHorizontal: space.md, minHeight: control.minTarget},
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  fieldCell: { width: '47%', minWidth: '42%' },
  fieldLabel: { ...typeStyles.caption, fontWeight: '600', color: STEEL.textSecondary, marginBottom: 4, textTransform: 'uppercase' },
  fieldValueMono: { ...typeStyles.body, fontWeight: '600', color: STEEL.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  effectiveLine: { ...typeStyles.caption, color: STEEL.textSecondary, paddingHorizontal: 16, paddingBottom: 12 },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: STEEL.border,
  },
  actionBtn: {
    minHeight: control.minTarget,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: STEEL.surfaceMuted,
  },
  actionBtnText: { flexShrink: 1, ...typeStyles.body, fontWeight: '600', color: STEEL.textPrimary },
  actionBtnOrange: {
    minHeight: control.minTarget,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: STEEL.warningBg,
  },
  actionBtnOrangeText: { flexShrink: 1, ...typeStyles.body, fontWeight: '600', color: STEEL.warning },
  actionBtnGreen: {
    minHeight: control.minTarget,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: STEEL.successBg,
  },
  actionBtnGreenText: { flexShrink: 1, ...typeStyles.body, fontWeight: '600', color: STEEL.success },
  actionBtnDelete: {
    minHeight: control.minTarget,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  actionBtnDeleteText: { flexShrink: 1, ...typeStyles.body, fontWeight: '600', color: STEEL.dangerAction },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const STEEL = {
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#4F46E5',
};

function maskMemberId(value) {
  const s = value == null ? '' : String(value);
  if (s.length <= 4) return s || '—';
  return '•'.repeat(Math.min(s.length - 4, 12)) + s.slice(-4);
}

function pickEmbeddedProvider(c) {
  const candidates = [c.provider, c.insurance_providers];
  for (const raw of candidates) {
    if (raw == null) continue;
    const p = Array.isArray(raw) ? raw[0] : raw;
    if (p && p.id) return p;
  }
  return null;
}

function normalizeVerificationStatus(raw) {
  const s = (raw == null ? 'connected' : String(raw)).toLowerCase().replace(/\s+/g, '_');
  if (s === 'needsattention') return 'needs_attention';
  if (['connected', 'verifying', 'needs_attention', 'expiring'].includes(s)) return s;
  return 'connected';
}

/** Merge raw coverage row with provider map (by provider_id). Never drops a row. */
function mapCoverageRow(c, providerById) {
  const embedded = pickEmbeddedProvider(c);
  const fromMap = c.provider_id ? providerById.get(c.provider_id) : null;
  const p = embedded || fromMap;
  const fallbackName = p?.name || 'Insurance provider';
  return {
    id: c.id,
    userId: c.user_id,
    providerId: c.provider_id,
    planName: c.plan_name || '—',
    memberId: c.member_id || '',
    memberIdHash: c.member_id_hash,
    groupNumber: c.group_number,
    bin: c.bin,
    pcn: c.pcn,
    relationship: c.relationship,
    effectiveStart: c.effective_start,
    effectiveEnd: c.effective_end,
    isPrimary: c.is_primary,
    verificationStatus: normalizeVerificationStatus(c.verification_status),
    lastVerifiedAt: c.last_verified_at,
    source: c.source,
    coverageStatus: c.coverage_status || 'active',
    stoppedAt: c.stopped_at,
    provider: {
      id: p?.id || c.provider_id,
      name: fallbackName,
      payerId: p?.payer_id,
      logoUrl: p?.logo_url,
      slug: p?.slug || 'unknown',
      isPopular: p?.is_popular,
    },
  };
}

function displayMemberId(coverage) {
  const raw = coverage.memberId || coverage.memberIdHash || '';
  return maskMemberId(raw);
}

const STATUS_BADGE = {
  connected: { label: 'Connected', bg: '#059669', icon: 'checkmark-circle' },
  verifying: { label: 'Verifying', bg: '#3B82F6', icon: 'time-outline' },
  needs_attention: { label: 'Needs Attention', bg: '#F59E0B', icon: 'alert-circle-outline' },
  expiring: { label: 'Expiring Soon', bg: '#EA580C', icon: 'calendar-outline' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || STATUS_BADGE.needs_attention;
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={14} color="#fff" />
      <Text style={styles.statusBadgeText}>{cfg.label}</Text>
    </View>
  );
}

function CoverageCardMobile({
  coverage,
  onSetPrimary,
  onRefreshVerification,
  onStopCoverage,
  onResumeCoverage,
  onDelete,
}) {
  const effectiveEndDate = coverage.effectiveEnd ? new Date(coverage.effectiveEnd) : null;
  const isExpiringSoon =
    effectiveEndDate && !Number.isNaN(effectiveEndDate.getTime())
      ? effectiveEndDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
      : false;
  const isStopped = coverage.coverageStatus === 'stopped';
  const badgeStatus = isExpiringSoon ? 'expiring' : coverage.verificationStatus;

  const startStr = coverage.effectiveStart
    ? new Date(coverage.effectiveStart).toLocaleDateString()
    : '—';
  const endStr =
    effectiveEndDate && !Number.isNaN(effectiveEndDate.getTime())
      ? effectiveEndDate.toLocaleDateString()
      : null;

  return (
    <View style={[styles.card, isStopped && styles.cardStopped]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          {coverage.provider.logoUrl ? (
            <Image source={{ uri: coverage.provider.logoUrl }} style={styles.providerLogo} />
          ) : (
            <View style={styles.providerLogoPlaceholder}>
              <Ionicons name="business-outline" size={22} color={STEEL.textSecondary} />
            </View>
          )}
          <View style={styles.cardTitleBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.providerName} numberOfLines={2}>
                {coverage.provider.name}
              </Text>
              {isStopped ? (
                <View style={styles.pillStopped}>
                  <Text style={styles.pillStoppedText}>Stopped</Text>
                </View>
              ) : null}
              {!isStopped && coverage.isPrimary ? (
                <View style={styles.pillPrimary}>
                  <Ionicons name="star" size={12} color="#fff" />
                  <Text style={styles.pillPrimaryText}>Primary</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.planName} numberOfLines={2}>
              {coverage.planName}
            </Text>
          </View>
        </View>
        <StatusBadge status={badgeStatus} />
      </View>

      <View style={styles.fieldGrid}>
        <View style={styles.fieldCell}>
          <Text style={styles.fieldLabel}>Member ID</Text>
          <Text style={styles.fieldValueMono}>{displayMemberId(coverage)}</Text>
        </View>
        {coverage.groupNumber ? (
          <View style={styles.fieldCell}>
            <Text style={styles.fieldLabel}>Group Number</Text>
            <Text style={styles.fieldValueMono}>{coverage.groupNumber}</Text>
          </View>
        ) : null}
        {coverage.bin ? (
          <View style={styles.fieldCell}>
            <Text style={styles.fieldLabel}>BIN</Text>
            <Text style={styles.fieldValueMono}>{coverage.bin}</Text>
          </View>
        ) : null}
        {coverage.pcn ? (
          <View style={styles.fieldCell}>
            <Text style={styles.fieldLabel}>PCN</Text>
            <Text style={styles.fieldValueMono}>{coverage.pcn}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.effectiveLine}>
        Effective: {startStr}
        {endStr ? ` - ${endStr}` : ''}
      </Text>

      <View style={styles.actionsRow}>
        {!isStopped ? (
          <>
            {!coverage.isPrimary && onSetPrimary ? (
              <Pressable style={styles.actionBtn} onPress={() => onSetPrimary(coverage)} accessibilityRole="button">
                <Ionicons name="star-outline" size={18} color={STEEL.textPrimary} />
                <Text style={styles.actionBtnText}>Set Primary</Text>
              </Pressable>
            ) : null}
            {onRefreshVerification ? (
              <Pressable
                style={styles.actionBtn}
                onPress={() => onRefreshVerification(coverage)}
                accessibilityRole="button"
              >
                <Ionicons name="refresh-outline" size={18} color={STEEL.textPrimary} />
                <Text style={styles.actionBtnText}>Verify</Text>
              </Pressable>
            ) : null}
            {onStopCoverage ? (
              <Pressable style={styles.actionBtnOrange} onPress={() => onStopCoverage(coverage)} accessibilityRole="button">
                <Ionicons name="stop-circle-outline" size={18} color="#C2410C" />
                <Text style={styles.actionBtnOrangeText}>Stop Coverage</Text>
              </Pressable>
            ) : null}
          </>
        ) : onResumeCoverage ? (
          <Pressable style={styles.actionBtnGreen} onPress={() => onResumeCoverage(coverage)} accessibilityRole="button">
            <Ionicons name="play-circle-outline" size={18} color="#15803D" />
            <Text style={styles.actionBtnGreenText}>Resume Coverage</Text>
          </Pressable>
        ) : null}
        {onDelete ? (
          <Pressable style={styles.actionBtnDelete} onPress={() => onDelete(coverage)} accessibilityRole="button">
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={styles.actionBtnDeleteText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function InsuranceScreen({ omitShellTitle = false, scrollFabProps = {} }) {
  const [coverages, setCoverages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}`;
    setToast({ id, message, type });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 4000);
  }, []);

  const loadCoverages = useCallback(
    async (uid) => {
      if (!uid) {
        setCoverages([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: rows, error } = await supabase
          .from('insurance_coverages')
          .select('*')
          .eq('user_id', uid)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;

        const list = rows || [];
        const providerIds = [...new Set(list.map((r) => r.provider_id).filter(Boolean))];
        const providerById = new Map();

        if (providerIds.length > 0) {
          const { data: providers, error: pErr } = await supabase
            .from('insurance_providers')
            .select('*')
            .in('id', providerIds);
          if (!pErr && providers) {
            providers.forEach((p) => providerById.set(p.id, p));
          }
        }

        setCoverages(list.map((r) => mapCoverageRow(r, providerById)));
      } catch (e) {
        console.error('Insurance load error', e);
        showToast('Failed to load insurance coverages', 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    let cancelled = false;

    const applySession = async (session) => {
      const uid = session?.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (uid) await loadCoverages(uid);
      else {
        setCoverages([]);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadCoverages]);

  const handleSetPrimary = async (coverage) => {
    try {
      await supabase.from('insurance_coverages').update({ is_primary: false }).eq('user_id', userId);
      const { error } = await supabase.from('insurance_coverages').update({ is_primary: true }).eq('id', coverage.id);
      if (error) throw error;
      showToast('Primary coverage updated', 'success');
      await loadCoverages(userId);
    } catch (e) {
      showToast('Failed to update primary coverage', 'error');
    }
  };

  const handleRefreshVerification = async (coverage) => {
    try {
      const { error } = await supabase
        .from('insurance_coverages')
        .update({
          verification_status: 'connected',
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', coverage.id);
      if (error) throw error;
      showToast('Coverage verified successfully', 'success');
      await loadCoverages(userId);
    } catch (e) {
      showToast('Failed to verify coverage', 'error');
    }
  };

  const handleDelete = (coverage) => {
    Alert.alert('Remove coverage', 'Are you sure you want to remove this coverage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('insurance_coverages').delete().eq('id', coverage.id);
            if (error) throw error;
            showToast('Coverage removed successfully', 'success');
            await loadCoverages(userId);
          } catch (e) {
            showToast('Failed to remove coverage', 'error');
          }
        },
      },
    ]);
  };

  const handleStopCoverage = async (coverage) => {
    try {
      const { error } = await supabase
        .from('insurance_coverages')
        .update({
          coverage_status: 'stopped',
          stopped_at: new Date().toISOString(),
          is_primary: false,
        })
        .eq('id', coverage.id);
      if (error) throw error;
      showToast('Coverage stopped successfully', 'success');
      await loadCoverages(userId);
    } catch (e) {
      showToast('Failed to stop coverage', 'error');
    }
  };

  const handleResumeCoverage = async (coverage) => {
    try {
      const { error } = await supabase
        .from('insurance_coverages')
        .update({
          coverage_status: 'active',
          stopped_at: null,
        })
        .eq('id', coverage.id);
      if (error) throw error;
      showToast('Coverage resumed successfully', 'success');
      await loadCoverages(userId);
    } catch (e) {
      showToast('Failed to resume coverage', 'error');
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      {...scrollFabProps}
    >
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
            color={toast.type === 'error' ? '#92400E' : '#166534'}
          />
          <Text style={[styles.toastText, toast.type === 'error' ? styles.toastTextError : styles.toastTextSuccess]}>
            {toast.message}
          </Text>
          <Pressable onPress={() => setToast(null)} hitSlop={12} accessibilityLabel="Dismiss">
            <Ionicons name="close" size={20} color={STEEL.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      {/* Always show intro: shell uses omitShellTitle so the top bar is the only title otherwise */}
      <View style={styles.hero}>
        {!omitShellTitle ? (
          <View style={styles.heroTitleRow}>
            <Ionicons name="shield-checkmark" size={28} color={STEEL.textPrimary} />
            <Text style={styles.heroTitle}>Insurance</Text>
          </View>
        ) : null}
        <Text style={[styles.heroSub, omitShellTitle && styles.heroSubOnly]}>
          Manage your insurance coverage and benefits
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={STEEL.accent} />
        </View>
      ) : coverages.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="shield-checkmark-outline" size={56} color={STEEL.textMuted} />
          {!userId ? (
            <>
              <Text style={styles.emptyTitle}>Sign in to view insurance</Text>
              <Text style={styles.emptyBody}>
                Your saved coverages load here when you are signed in with the same account as the Health Vault web app.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>No insurance coverage added</Text>
              <Text style={styles.emptyBody}>Use the Vault Assistant to add your insurance information</Text>
            </>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {coverages.map((c) => (
            <CoverageCardMobile
              key={c.id}
              coverage={c}
              onSetPrimary={handleSetPrimary}
              onRefreshVerification={handleRefreshVerification}
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

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 20, paddingTop: 8 },
  hero: { marginBottom: 20 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: STEEL.textPrimary },
  heroSub: { fontSize: 15, lineHeight: 22, color: STEEL.textSecondary },
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
  toastSuccess: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  toastError: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  toastText: { flex: 1, fontSize: 14, lineHeight: 20 },
  toastTextSuccess: { color: '#166534' },
  toastTextError: { color: '#92400E' },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  emptyCard: {
    backgroundColor: STEEL.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: STEEL.border,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: STEEL.textPrimary, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 15, lineHeight: 22, color: STEEL.textSecondary, textAlign: 'center' },
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
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 },
  providerName: { fontSize: 17, fontWeight: '700', color: STEEL.textPrimary, flexShrink: 1 },
  planName: { fontSize: 14, color: STEEL.textSecondary },
  pillStopped: { backgroundColor: '#64748B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillStoppedText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  pillPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEEL.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillPrimaryText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  fieldCell: { width: '47%', minWidth: '42%' },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: STEEL.textSecondary, marginBottom: 4, textTransform: 'uppercase' },
  fieldValueMono: { fontSize: 14, fontWeight: '600', color: STEEL.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  effectiveLine: { fontSize: 12, color: STEEL.textSecondary, paddingHorizontal: 16, paddingBottom: 12 },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: STEEL.textPrimary },
  actionBtnOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
  },
  actionBtnOrangeText: { fontSize: 14, fontWeight: '600', color: '#C2410C' },
  actionBtnGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
  },
  actionBtnGreenText: { fontSize: 14, fontWeight: '600', color: '#15803D' },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  actionBtnDeleteText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
});

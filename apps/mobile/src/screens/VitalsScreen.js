import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlatList, Modal, Platform, Pressable, View, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { previewAppleHealth, readAppleHealth } from '../lib/apple-health-import';
import { confirmHealthImport } from '../../../../packages/health-vault-mcp/src/health-imports.ts';
import { useVitals } from '../../../../packages/api-client/src/vitals/useVitals';
import { vitalDate, vitalLabel } from '../../../../packages/api-client/src/vitals/data';
import { groupVitals, relativeVitalTime, vitalBars, vitalFigure, vitalPresentation } from '../lib/vital-cards';
import { AppText } from '../components/ui/AppText';
import { NoticeBanner, useNotice } from '../components/ui/NoticeBanner';
import { AppButton, useAdaptiveLayout } from '../components/ui/AdaptiveControls';
import { recordsColors } from '../theme/records';
import { space, radius, control } from '../theme/layout';

function toneInk(colors, tone) {
  if (tone === 'accent') return { ink: colors.accent, wash: colors.accentBg };
  return { ink: colors[`${tone}Action`] || colors.accent, wash: colors[`${tone}Bg`] || colors.accentBg };
}

function Figure({ parts, colors }) {
  return <View style={styles.figure}>
    {parts.map((part, index) => <View key={`${part.unit}-${index}`} style={styles.figurePart}>
      {part.paired ? <AppText variant="title" style={{ color: colors.textMuted }}>/</AppText> : null}
      <AppText variant="page" style={{ color: colors.textPrimary }}>{part.value}</AppText>
      <AppText variant="body" style={[styles.unit, { color: colors.textSecondary }]}>{part.unit}</AppText>
    </View>)}
  </View>;
}

function Trend({ values, color, track }) {
  const bars = vitalBars(values);
  if (bars.length < 2) return null;
  return <View style={styles.trend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {bars.map((height, index) => <View key={index} style={[styles.bar, { height: 8 + height * 28, backgroundColor: index === bars.length - 1 ? color : track }]} />)}
  </View>;
}

function VitalCard({ row, colors, isNew = false, history = [], expanded = false, onPress }) {
  const presentation = vitalPresentation(row.metric);
  const { ink, wash } = toneInk(colors, presentation.tone);
  const parts = vitalFigure(row);
  const when = relativeVitalTime(row.observed_at || row.observedAt);
  const label = vitalLabel(row.metric);
  const summary = `${label}, ${parts.map((part) => `${part.value} ${part.unit}`).join(' ')}, ${when}${isNew ? ', new' : ''}`;
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={summary} accessibilityState={onPress ? { expanded } : undefined} onPress={onPress} disabled={!onPress} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={styles.cardTitle}>
      <View style={[styles.iconWrap, { backgroundColor: wash }]}>
        <Ionicons name={presentation.icon} size={16} color={ink} />
      </View>
      <AppText variant="label" style={{ color: ink, flexShrink: 1 }} numberOfLines={2}>{label}</AppText>
      {isNew ? <View style={[styles.badge, { backgroundColor: colors.accentBg }]}><AppText variant="caption" style={{ color: colors.accent, fontWeight: '700' }}>New</AppText></View> : null}
      <View style={styles.titleGap} />
      <AppText variant="caption" style={{ color: colors.textSecondary }}>{when}</AppText>
      {onPress ? <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.textMuted} /> : null}
    </View>
    <View style={styles.measureRow}>
      <Figure parts={parts} colors={colors} />
      <Trend values={history.map((item) => item.value)} color={ink} track={colors.skeleton} />
    </View>
    {expanded ? history.map((item) => <AppText key={item.id || item.observed_at} variant="caption" style={{ color: colors.textSecondary }}>{vitalDate(item.observed_at)} · {vitalFigure(item).map((part) => `${part.value} ${part.unit}`).join(' / ')}</AppText>) : null}
  </Pressable>;
}

function pendingItems(review) {
  const items = Array.isArray(review?.items) ? review.items : [];
  const marked = items.some((item) => item.importState === 'new' || item.importState === 'duplicate');
  return marked ? items.filter((item) => item.importState !== 'duplicate') : items;
}

export default function VitalsScreen({ darkMode = false, scrollFabProps = {} }) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const colors = recordsColors(darkMode);
  const layout = useAdaptiveLayout();
  const { rows, loading, error, refresh } = useVitals(supabase);
  const moreRef = useRef(null);
  const [review, setReview] = useState(null);
  const { notice, showNotice, dismissNotice } = useNotice();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuBox, setMenuBox] = useState({ top: insets.top + 64, right: layout.gutter });
  const [openMetric, setOpenMetric] = useState(null);
  const readyToAdd = pendingItems(review);
  const groups = useMemo(() => groupVitals(rows), [rows]);

  async function reviewAppleHealth(keepExisting = false, announce = false) {
    if (busy || saving) return;
    setBusy(true);
    dismissNotice();
    if (!keepExisting) setReview(null);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) throw new Error('Sign in to bring in Apple Health.');
      const samples = await readAppleHealth();
      const preview = await previewAppleHealth(supabase, data.user.id, samples);
      if (!preview) {
        setReview(null);
        if (announce) showNotice('Apple Health did not share any of these measurements.');
        return;
      }
      setReview(preview);
      if (announce) showNotice(pendingItems(preview).length ? 'Nothing has been added to Health Vault.' : 'These Apple Health measurements are already in Health Vault.');
    } catch (err) {
      showNotice(err?.message || 'Apple Health could not be read.', 'error');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (error) showNotice(error, 'error');
  }, [error, showNotice]);

  useEffect(() => {
    if (Platform.OS === 'ios') void reviewAppleHealth(false, false);
  }, []);

  async function refreshPage() {
    await Promise.all([refresh(), Platform.OS === 'ios' ? reviewAppleHealth(true, true) : Promise.resolve()]);
  }

  async function addReviewed() {
    if (busy || saving || !review?.proposalId || readyToAdd.length < 1) return;
    setSaving(true);
    dismissNotice();
    try {
      await confirmHealthImport(supabase, review.proposalId);
      setReview(null);
      showNotice('Those measurements are now in Health Vault.', 'success');
      await refresh();
    } catch (err) {
      showNotice(err?.message || 'Those measurements could not be added.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function openMenu() {
    const node = moreRef.current;
    if (!node?.measureInWindow) {
      setMenuOpen(true);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      setMenuBox({ top: y + height + space.xs, right: Math.max(space.sm, window.width - (x + width)) });
      setMenuOpen(true);
    });
  }

  function runMenuAction(action) {
    setMenuOpen(false);
    action();
  }

  const menuActions = [
    Platform.OS === 'ios' ? { label: busy ? 'Checking Apple Health…' : 'Review Apple Health', onPress: () => reviewAppleHealth(false, true), disabled: busy || saving } : null,
    { label: loading || busy ? 'Refreshing…' : 'Refresh', onPress: refreshPage, disabled: loading || busy || saving },
    review ? { label: 'Not now', onPress: () => { setReview(null); showNotice('Nothing was added to Health Vault.'); }, disabled: busy || saving } : null,
  ].filter(Boolean);

  return <View style={styles.screen}>
    <View style={[styles.titleRow, { paddingHorizontal: layout.gutter }]}>
      <AppText variant="page" style={{ color: colors.textPrimary, flex: 1 }}>Vitals</AppText>
      <View ref={moreRef} collapsable={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="More actions" accessibilityState={{ expanded: menuOpen }} onPress={openMenu} style={styles.more}>
          <Ionicons name="ellipsis-horizontal" size={control.icon} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
    {notice ? <NoticeBanner message={notice.message} tone={notice.tone} colors={colors} onDismiss={dismissNotice} /> : null}
    <FlatList style={styles.list} {...scrollFabProps} data={groups} keyExtractor={group => group.metric}
      refreshing={loading || busy} onRefresh={refreshPage}
      contentContainerStyle={[styles.content, { paddingHorizontal: layout.gutter, maxWidth: layout.contentMaxWidth, paddingBottom: space.lg + (readyToAdd.length > 0 ? space.xl : insets.bottom) }]}
      ListHeaderComponent={<View style={styles.header}>
        <AppText variant="section" style={{ color: colors.textPrimary }}>Latest</AppText>
        {readyToAdd.map((item, index) => <VitalCard key={`${item.metric}-${item.observedAt}-${index}`} row={item} colors={colors} isNew />)}
      </View>}
      ListEmptyComponent={!error && readyToAdd.length === 0 && <AppText accessibilityLiveRegion="polite" style={{ color: colors.textSecondary }}>{loading ? 'Loading measurements…' : 'No saved measurements yet. Measurements you add from Apple Health, or save through Health Vault, will appear here.'}</AppText>}
      renderItem={({ item }) => <VitalCard row={item.latest} colors={colors} history={item.readings} expanded={openMetric === item.metric} onPress={item.readings.length > 1 ? () => setOpenMetric((current) => current === item.metric ? null : item.metric) : undefined} />} />
    {readyToAdd.length > 0 ? <View style={[styles.addBar, { paddingHorizontal: layout.gutter, paddingBottom: Math.max(insets.bottom, space.md), backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <AppButton colors={colors} primary label={saving ? 'Adding…' : 'Add to Health Vault'} onPress={addReviewed} disabled={busy || saving} busy={saving} />
    </View> : null}
    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
      <View style={styles.screen}>
      <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} accessibilityLabel="Close actions" />
      <View style={[styles.menu, menuBox, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="menu">
        {menuActions.map((action) => <Pressable key={action.label} accessibilityRole="button" accessibilityState={{ disabled: action.disabled }} disabled={action.disabled} onPress={() => runMenuAction(action.onPress)} style={styles.menuItem}>
          <AppText variant="label" style={{ color: action.disabled ? colors.textMuted : colors.textPrimary }}>{action.label}</AppText>
        </Pressable>)}
      </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  titleGap: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', minHeight: control.minTarget, paddingTop: space.sm },
  more: { minWidth: control.minTarget, minHeight: control.minTarget, alignItems: 'center', justifyContent: 'center' },
  content: { paddingVertical: space.lg, width: '100%', alignSelf: 'center' },
  header: { gap: space.md, marginBottom: space.md },
  card: { padding: space.lg, gap: space.md, borderWidth: 1, borderRadius: radius.card, marginBottom: space.lg },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  measureRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md },
  figure: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', flex: 1, gap: space.md },
  figurePart: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs },
  unit: { marginBottom: 4 },
  trend: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 36 },
  bar: { width: 6, borderRadius: 3 },
  badge: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: space.xs },
  addBar: { borderTopWidth: 1, paddingTop: space.md },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.2)' },
  menu: { position: 'absolute', minWidth: 240, borderWidth: 1, borderRadius: radius.card, overflow: 'hidden' },
  menuItem: { minHeight: control.minTarget, justifyContent: 'center', paddingHorizontal: space.lg },
});

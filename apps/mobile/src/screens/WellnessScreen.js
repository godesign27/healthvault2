import {recordsColors} from '../theme/records';
import {typeStyles, control, space, radius} from '../theme/layout';
import {AppText as Text, AppTextInput} from '../components/ui/AppText';
import {NoticeBanner, useNotice} from '../components/ui/NoticeBanner';
import {latestDietMoment, latestSignalMoment, loadWellness, removeDietEntry, saveDietEntry, confirmDietEntry} from '../lib/wellnessData';
import {
  currentWellnessEnd,
  formatWellnessRange,
  isCurrentWellnessWindow,
  shiftWellnessEnd,
  wellnessBounds,
  wellnessEndContaining,
} from '../../../../packages/api-client/src/wellness-range';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, ScrollView, StyleSheet, ActivityIndicator, Pressable, RefreshControl, Modal, Alert, useWindowDimensions} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '@/lib/supabase';

const MEAL_LABELS = {breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack', drink: 'Drink', other: 'Other'};
const MEAL_FILTERS = [
  {id: 'all', label: 'All meals'},
  {id: 'breakfast', label: 'Breakfast'},
  {id: 'lunch', label: 'Lunch'},
  {id: 'dinner', label: 'Dinner'},
  {id: 'snack', label: 'Snack'},
  {id: 'drink', label: 'Drink'},
  {id: 'other', label: 'Other'},
];

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function dateLabel(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'});
}

function mealItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') return item;
    return [item?.name, item?.amount].filter(Boolean).join(' — ');
  }).filter(Boolean);
}

function foodsFromLines(text) {
  return text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [name, amount] = line.split(/\s+[—-]\s+/, 2);
    return {name: name.trim(), amount: amount?.trim() || null, notes: null};
  });
}

function displayTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
}

function sourceLabel(source) {
  if (source === 'chatgpt') return 'Added through ChatGPT';
  if (source === 'web') return 'Added in Health Vault';
  return 'User reported';
}

function statusLabel(status) {
  const value = status || 'confirmed';
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ');
}

function Rating({label, value, inverse = false, colors}) {
  const score = Number(value);
  const filled = inverse ? 6 - score : score;
  return <View style={stylesRating.item} accessibilityLabel={`${label}: ${Number.isFinite(score) ? score : 'not recorded'} out of 5`}>
    <View style={stylesRating.labelRow}>
      <Text variant="caption" style={{color: colors.textSecondary}}>{label}</Text>
      <Text variant="caption" style={{color: colors.textPrimary, fontWeight: '700'}}>{Number.isFinite(score) ? `${score}/5` : '—'}</Text>
    </View>
    <View style={stylesRating.track}>
      {[1, 2, 3, 4, 5].map((step) => <View key={step} style={[stylesRating.segment, {backgroundColor: Number.isFinite(score) && step <= filled ? colors.accent : colors.skeleton}]} />)}
    </View>
  </View>;
}

const stylesRating = StyleSheet.create({
  item: {width: '47%', gap: space.xs},
  labelRow: {flexDirection: 'row', justifyContent: 'space-between', gap: space.sm},
  track: {flexDirection: 'row', gap: space.xs},
  segment: {flex: 1, height: 6, borderRadius: 3},
});

export default function WellnessScreen({darkMode = false, omitShellTitle = false, scrollFabProps = {}}) {
  const STEEL = recordsColors(darkMode);
  const styles = useMemo(() => createStyles(STEEL), [STEEL]);
  const [tab, setTab] = useState('diet');
  const [mealFilter, setMealFilter] = useState('all');
  const [rangeEnd, setRangeEnd] = useState(() => currentWellnessEnd());
  const [diet, setDiet] = useState([]);
  const [latestDiet, setLatestDiet] = useState(null);
  const [latestSignal, setLatestSignal] = useState(null);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const {notice, showNotice, dismissNotice} = useNotice();
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [menuEntry, setMenuEntry] = useState(null);
  const [menuBox, setMenuBox] = useState({top: 0, right: space.md});
  const [logDraft, setLogDraft] = useState(null);
  const [logReview, setLogReview] = useState(null);
  const generation = useRef(0);
  const moreRefs = useRef(new Map());
  const window = useWindowDimensions();
  const bounds = useMemo(() => wellnessBounds(rangeEnd), [rangeEnd]);
  const showingCurrent = isCurrentWellnessWindow(rangeEnd);
  const rangeLabel = formatWellnessRange(bounds.start, bounds.end);

  const load = useCallback(async (isRefresh = false) => {
    const run = ++generation.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [result, latest, latestCheckIn] = await Promise.all([
        loadWellness(supabase, bounds.start.toISOString(), bounds.end.toISOString()),
        latestDietMoment(supabase),
        latestSignalMoment(supabase),
      ]);
      if (run !== generation.current) return;
      setDiet(result.diet);
      setSignals(result.signals);
      setLatestDiet(latest);
      setLatestSignal(latestCheckIn);
    } catch (err) {
      if (run !== generation.current) return;
      setDiet([]);
      setSignals([]);
      setLatestSignal(null);
      setError(err?.message || 'Wellness could not be loaded.');
    } finally {
      if (run === generation.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [bounds]);

  useEffect(() => { void load(false); }, [load]);

  const openEdit = (entry) => {
    setEditing(entry);
    setEditForm({
      mealType: entry.meal_type || 'snack',
      items: mealItems(entry.items).join('\n'),
      waterMl: entry.water_ml ? String(entry.water_ml) : '',
      notes: entry.notes || '',
    });
  };

  const saveEdit = async () => {
    if (!editing || !editForm || saving) return;
    const items = foodsFromLines(editForm.items);
    if (!items.length) {
      showNotice('Add at least one food or drink before saving.', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveDietEntry(supabase, editing.id, {
        meal_type: editForm.mealType,
        items,
        water_ml: editForm.waterMl ? Number(editForm.waterMl) : null,
        notes: editForm.notes.trim() || null,
        confirmation_status: 'confirmed',
      });
      setEditing(null);
      setEditForm(null);
      showNotice('Meal saved.', 'success');
      await load(true);
    } catch (err) {
      showNotice(err?.message || 'The meal could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openMealMenu = (entry) => {
    const node = moreRefs.current.get(entry.id);
    if (!node?.measureInWindow) {
      setMenuEntry(entry);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      setMenuBox({top: y + height + space.xs, right: Math.max(space.sm, window.width - (x + width))});
      setMenuEntry(entry);
    });
  };

  const confirmRemove = (entry) => {
    Alert.alert('Remove this meal', 'Remove this saved meal from Health Vault?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: async () => {
        setSaving(true);
        try {
          await removeDietEntry(supabase, entry.id);
          showNotice('Meal removed.', 'success');
          await load(true);
        } catch (err) {
          showNotice(err?.message || 'The meal could not be removed.', 'error');
        } finally {
          setSaving(false);
        }
      }},
    ]);
  };

  const startMealLog = () => {
    setLogReview(null);
    setLogDraft({mealType: 'breakfast', items: '', waterMl: '', notes: ''});
  };

  const reviewMealLog = () => {
    const items = foodsFromLines(logDraft?.items || '');
    if (!items.length) {
      showNotice('Add at least one food or drink before reviewing.', 'error');
      return;
    }
    const water = logDraft.waterMl.trim();
    const waterMl = water ? Number(water) : null;
    if (water && (!Number.isInteger(waterMl) || waterMl < 0)) {
      showNotice('Enter water in milliliters as a whole number.', 'error');
      return;
    }
    setLogReview({
      consumedAt: new Date().toISOString(),
      mealType: logDraft.mealType,
      items,
      waterMl,
      notes: logDraft.notes.trim() || null,
    });
  };

  const saveMealLog = async () => {
    if (!logReview || saving) return;
    setSaving(true);
    try {
      await confirmDietEntry(supabase, logReview);
      setLogDraft(null);
      setLogReview(null);
      showNotice('Meal saved.', 'success');
      await load(true);
    } catch (err) {
      showNotice(err?.message || 'The meal could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const visibleMeals = mealFilter === 'all' ? diet : diet.filter((entry) => entry.meal_type === mealFilter);
  const latestDietDate = latestDiet ? new Date(latestDiet) : null;
  const earlierMeals = Boolean(latestDietDate && !Number.isNaN(latestDietDate.getTime()) && latestDietDate.getTime() < bounds.start.getTime());
  const latestSignalDate = latestSignal ? new Date(latestSignal) : null;
  const earlierSignals = Boolean(latestSignalDate && !Number.isNaN(latestSignalDate.getTime()) && latestSignalDate.getTime() < bounds.start.getTime());
  const water = diet.reduce((sum, entry) => sum + (Number(entry.water_ml) || 0), 0);
  const uniqueFoods = new Set(diet.flatMap((entry) => (Array.isArray(entry.items) ? entry.items : []))
    .map((item) => (typeof item === 'string' ? item : item?.name)?.trim().toLowerCase())
    .filter(Boolean)).size;
  const groups = new Map();
  for (const entry of visibleMeals) {
    const key = localDateKey(entry.consumed_at);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }

  return (
    <View style={styles.screen}>
    {notice ? <NoticeBanner message={notice.message} tone={notice.tone} colors={STEEL} onDismiss={dismissNotice} /> : null}
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={STEEL.accent} />}
      {...scrollFabProps}
    >
      {!omitShellTitle ? <Text variant="title" style={styles.title}>Wellness</Text> : null}
      <Text variant="body" style={styles.sub}>Review your saved meals and daily check-ins. These entries support reflection and do not replace clinical or nutrition advice.</Text>
      <View style={styles.tabs} accessibilityRole="tablist">
        {[['diet', 'Diet Log'], ['signals', 'Life Signals']].map(([id, label]) => (
          <Pressable key={id} accessibilityRole="tab" accessibilityState={{selected: tab === id}}
            style={[styles.tab, tab === id && styles.tabOn]} onPress={() => setTab(id)}>
            <Text variant="body" style={tab === id ? styles.tabTextOn : styles.tabText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.range} accessibilityLabel="Date range">
        <Pressable accessibilityRole="button" accessibilityLabel="Previous 7 days" style={styles.rangeButton}
          onPress={() => setRangeEnd((end) => shiftWellnessEnd(end, 'earlier'))}>
          <Ionicons name="chevron-back" size={20} color={STEEL.textPrimary} />
        </Pressable>
        <Text variant="body" style={styles.rangeLabel}>{showingCurrent ? `Most recent 7 days, ${rangeLabel}` : rangeLabel}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next 7 days" accessibilityState={{disabled: showingCurrent}}
          disabled={showingCurrent} style={styles.rangeButton}
          onPress={() => setRangeEnd((end) => shiftWellnessEnd(end, 'later'))}>
          <Ionicons name="chevron-forward" size={20} color={showingCurrent ? STEEL.textMuted : STEEL.textPrimary} />
        </Pressable>
      </View>
      {loading ? <ActivityIndicator color={STEEL.accent} style={{marginTop: space.lg}} /> : null}
      {error ? (
        <View style={styles.card}>
          <Text accessibilityRole="alert" variant="section" style={styles.cardTitle}>Unable to load wellness</Text>
          <Text variant="body" style={styles.muted}>{error}</Text>
          <Pressable accessibilityRole="button" style={styles.retry} onPress={() => load(false)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {!loading && !error && tab === 'diet' ? (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="Log a meal" style={styles.retry} onPress={startMealLog}>
            <Text style={styles.retryText}>Log a meal</Text>
          </Pressable>
          <View style={styles.stats}>
            <View style={styles.stat}><Text variant="caption" style={styles.muted}>Meals</Text><Text variant="page" style={styles.cardTitle}>{diet.length}</Text></View>
            <View style={styles.stat}><Text variant="caption" style={styles.muted}>Foods</Text><Text variant="page" style={styles.cardTitle}>{uniqueFoods}</Text></View>
            <View style={styles.stat}><Text variant="caption" style={styles.muted}>Water</Text><Text variant="page" style={styles.cardTitle}>{water ? `${water.toLocaleString('en-US')}` : '—'}</Text><Text variant="caption" style={styles.muted}>{water ? 'mL' : 'Not logged'}</Text></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {MEAL_FILTERS.map((filter) => (
              <Pressable key={filter.id} accessibilityRole="button" accessibilityState={{selected: mealFilter === filter.id}}
                style={[styles.chip, mealFilter === filter.id && styles.chipOn]} onPress={() => setMealFilter(filter.id)}>
                <Text variant="caption" style={mealFilter === filter.id ? styles.chipTextOn : styles.chipText}>{filter.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {visibleMeals.length === 0 ? (
            <View style={styles.card}>
              <Text variant="section" style={styles.cardTitle}>{diet.length ? 'No matching meals' : 'No meals in these 7 days'}</Text>
              <Text variant="body" style={styles.muted}>
                {diet.length
                  ? 'Choose another meal filter to see the meals in this week.'
                  : earlierMeals
                    ? 'Saved meals are in an earlier week.'
                    : 'Meals saved on the Health Vault website appear here.'}
              </Text>
              {earlierMeals ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Show latest meals" style={styles.retry} onPress={() => setRangeEnd(wellnessEndContaining(new Date(latestDiet)))}>
                  <Text style={styles.retryText}>Show latest meals</Text>
                </Pressable>
              ) : null}
            </View>
          ) : [...groups.entries()].map(([key, entries]) => (
            <View key={key} style={styles.card}>
              <Text variant="section" style={styles.cardTitle}>{dateLabel(key)}</Text>
              {entries.map((entry) => (
                <View key={entry.id} style={styles.row}>
                  <View style={styles.mealTitle}>
                    <View style={styles.mealName}>
                      <Text variant="body" style={[styles.rowTitle, {flexShrink: 1}]}>{MEAL_LABELS[entry.meal_type] || 'Meal'}</Text>
                      <Text variant="caption" style={styles.muted}>{displayTime(entry.consumed_at)}</Text>
                    </View>
                    <View
                      ref={(node) => {
                        if (node) moreRefs.current.set(entry.id, node);
                        else moreRefs.current.delete(entry.id);
                      }}
                      collapsable={false}
                    >
                      <Pressable accessibilityRole="button" accessibilityLabel={`More actions for ${MEAL_LABELS[entry.meal_type] || 'meal'}`} accessibilityState={{expanded: menuEntry?.id === entry.id}} onPress={() => openMealMenu(entry)} style={styles.more}>
                        <Ionicons name="ellipsis-horizontal" size={control.icon} color={STEEL.textPrimary} />
                      </Pressable>
                    </View>
                  </View>
                  <Text variant="body" style={styles.muted}>{mealItems(entry.items).join(', ') || 'No foods listed'}</Text>
                  {entry.water_ml ? <Text variant="caption" style={styles.muted}>{entry.water_ml} mL water</Text> : null}
                  {entry.notes ? <Text variant="caption" style={styles.muted}>{entry.notes}</Text> : null}
                  <Text variant="caption" style={styles.muted}>{sourceLabel(entry.source)} · {statusLabel(entry.confirmation_status)}</Text>
                </View>
              ))}
            </View>
          ))}
          {diet.length > 0 ? (
            <View style={styles.card}>
              <Text variant="section" style={styles.cardTitle}>Pattern notes</Text>
              <Text variant="body" style={styles.muted}>Entries reflect only what you chose to report during these seven days.</Text>
              {water === 0 ? <Text variant="body" style={styles.muted}>No water amounts are currently recorded.</Text> : null}
              <Text variant="body" style={styles.muted}>Health Vault can help summarize patterns, but it does not estimate unlogged nutrients or prescribe a medical diet.</Text>
            </View>
          ) : null}
        </>
      ) : null}
      {!loading && !error && tab === 'signals' ? (
        signals.length === 0 ? (
          <View style={styles.card}>
            <Text variant="section" style={styles.cardTitle}>No Life Signals in these 7 days</Text>
            <Text variant="body" style={styles.muted}>
              {earlierSignals
                ? 'Saved check-ins are in an earlier week.'
                : showingCurrent
                  ? 'Life Signals saved on the Health Vault website appear here. Use the arrows to look at another week.'
                  : 'Use the arrows to look at another week.'}
            </Text>
            {earlierSignals ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Show latest check-ins" style={styles.retry} onPress={() => setRangeEnd(wellnessEndContaining(new Date(latestSignal)))}>
                <Text style={styles.retryText}>Show latest check-ins</Text>
              </Pressable>
            ) : null}
          </View>
        ) : signals.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <View style={styles.mealTitle}>
              <Text variant="section" style={styles.cardTitle}>{dateLabel(localDateKey(entry.recorded_at))}</Text>
              <Text variant="caption" style={styles.muted}>{displayTime(entry.recorded_at)} · {sourceLabel(entry.source)} · {statusLabel(entry.confirmation_status)}</Text>
            </View>
            <View style={styles.ratings}>
              <Rating label="Energy" value={entry.energy} colors={STEEL} />
              <Rating label="Sleep" value={entry.sleep} colors={STEEL} />
              <Rating label="Mood" value={entry.mood} colors={STEEL} />
              <Rating label="Stress" value={entry.stress} inverse colors={STEEL} />
              <Rating label="Pain" value={entry.pain} inverse colors={STEEL} />
            </View>
            {entry.note ? <Text variant="body" style={styles.muted}>{entry.note}</Text> : null}
          </View>
        ))
      ) : null}
      <Modal visible={Boolean(editing && editForm)} animationType="slide" onRequestClose={() => { if (!saving) { setEditing(null); setEditForm(null); } }}>
        <ScrollView contentContainerStyle={styles.editor} keyboardShouldPersistTaps="handled">
          <Text variant="title" style={styles.title}>Edit meal</Text>
          <View style={styles.filters}>
            {MEAL_FILTERS.filter((filter) => filter.id !== 'all').map((filter) => (
              <Pressable key={filter.id} accessibilityRole="button" accessibilityState={{selected: editForm?.mealType === filter.id}}
                style={[styles.chip, editForm?.mealType === filter.id && styles.chipOn]} onPress={() => setEditForm((form) => ({...form, mealType: filter.id}))}>
                <Text variant="caption" style={editForm?.mealType === filter.id ? styles.chipTextOn : styles.chipText}>{filter.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text variant="body" style={styles.muted}>Foods and drinks, one per line</Text>
          <AppTextInput accessibilityLabel="Foods and drinks" multiline value={editForm?.items || ''} onChangeText={(items) => setEditForm((form) => ({...form, items}))} style={styles.input} />
          <Text variant="body" style={styles.muted}>Water in milliliters</Text>
          <AppTextInput accessibilityLabel="Water in milliliters" keyboardType="number-pad" value={editForm?.waterMl || ''} onChangeText={(waterMl) => setEditForm((form) => ({...form, waterMl}))} style={styles.input} />
          <Text variant="body" style={styles.muted}>Notes</Text>
          <AppTextInput accessibilityLabel="Notes" multiline value={editForm?.notes || ''} onChangeText={(notes) => setEditForm((form) => ({...form, notes}))} style={styles.input} />
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityState={{disabled: saving}} disabled={saving} style={styles.retry} onPress={saveEdit}>
              <Text style={styles.retryText}>{saving ? 'Saving' : 'Save meal'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} style={styles.remove} onPress={() => { setEditing(null); setEditForm(null); }}>
              <Text style={styles.removeText}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
    <Modal visible={Boolean(menuEntry)} transparent animationType="fade" onRequestClose={() => setMenuEntry(null)}>
      <View style={styles.screen}>
        <Pressable style={styles.backdrop} onPress={() => setMenuEntry(null)} accessibilityLabel="Close actions" />
        <View style={[styles.menu, menuBox, {backgroundColor: STEEL.surface, borderColor: STEEL.border}]} accessibilityRole="menu">
          <Pressable accessibilityRole="button" style={styles.menuItem} onPress={() => { const entry = menuEntry; setMenuEntry(null); openEdit(entry); }}>
            <Text variant="label" style={styles.menuText}>Edit</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.menuItem} onPress={() => { const entry = menuEntry; setMenuEntry(null); confirmRemove(entry); }}>
            <Text variant="label" style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
    <Modal visible={Boolean(logDraft)} animationType="slide" onRequestClose={() => { if (!saving) { setLogDraft(null); setLogReview(null); } }}>
      <ScrollView contentContainerStyle={styles.editor} keyboardShouldPersistTaps="handled">
        <Text variant="title" style={styles.title}>{logReview ? 'Review meal' : 'Log a meal'}</Text>
        {logReview ? (
          <>
            <Text variant="body" style={styles.muted}>{MEAL_LABELS[logReview.mealType] || 'Meal'}</Text>
            <Text variant="body" style={styles.cardTitle}>{logReview.items.map((item) => item.amount ? `${item.name} — ${item.amount}` : item.name).join('\n')}</Text>
            {logReview.waterMl != null ? <Text variant="body" style={styles.muted}>{logReview.waterMl} mL water</Text> : null}
            {logReview.notes ? <Text variant="body" style={styles.muted}>{logReview.notes}</Text> : null}
            <Text variant="body" style={styles.muted}>Nothing is saved until you confirm.</Text>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Confirm meal" accessibilityState={{disabled: saving}} disabled={saving} style={styles.retry} onPress={saveMealLog}>
                <Text style={styles.retryText}>{saving ? 'Saving' : 'Confirm meal'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={saving} style={styles.remove} onPress={() => setLogReview(null)}>
                <Text style={styles.removeText}>Back</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.filters}>
              {MEAL_FILTERS.filter((filter) => filter.id !== 'all').map((filter) => (
                <Pressable key={filter.id} accessibilityRole="button" accessibilityState={{selected: logDraft?.mealType === filter.id}}
                  style={[styles.chip, logDraft?.mealType === filter.id && styles.chipOn]} onPress={() => setLogDraft((form) => ({...form, mealType: filter.id}))}>
                  <Text variant="caption" style={logDraft?.mealType === filter.id ? styles.chipTextOn : styles.chipText}>{filter.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text variant="body" style={styles.muted}>Foods and drinks, one per line</Text>
            <AppTextInput accessibilityLabel="Foods and drinks" multiline value={logDraft?.items || ''} onChangeText={(items) => setLogDraft((form) => ({...form, items}))} style={styles.input} />
            <Text variant="body" style={styles.muted}>Water in milliliters</Text>
            <AppTextInput accessibilityLabel="Water in milliliters" keyboardType="number-pad" value={logDraft?.waterMl || ''} onChangeText={(waterMl) => setLogDraft((form) => ({...form, waterMl}))} style={styles.input} />
            <Text variant="body" style={styles.muted}>Notes</Text>
            <AppTextInput accessibilityLabel="Notes" multiline value={logDraft?.notes || ''} onChangeText={(notes) => setLogDraft((form) => ({...form, notes}))} style={styles.input} />
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Review meal" style={styles.retry} onPress={reviewMealLog}>
                <Text style={styles.retryText}>Review meal</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.remove} onPress={() => setLogDraft(null)}>
                <Text style={styles.removeText}>Cancel</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </Modal>
    </View>
  );
}

function createStyles(STEEL) {
  return StyleSheet.create({
    screen: {flex: 1},
    scroll: {flex: 1, backgroundColor: STEEL.canvas},
    stats: {flexDirection: 'row', gap: space.sm, backgroundColor: STEEL.surface, borderRadius: radius.card, borderWidth: 1, borderColor: STEEL.border, padding: space.md},
    stat: {flex: 1, gap: space.xs},
    mealTitle: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm},
    mealName: {flex: 1, gap: 2},
    more: {minWidth: control.minTarget, minHeight: control.minTarget, alignItems: 'center', justifyContent: 'center'},
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.2)'},
    menu: {position: 'absolute', minWidth: 180, borderWidth: 1, borderRadius: radius.card, overflow: 'hidden'},
    menuItem: {minHeight: control.minTarget, justifyContent: 'center', paddingHorizontal: space.lg},
    menuText: {color: STEEL.textPrimary},
    ratings: {flexDirection: 'row', flexWrap: 'wrap', gap: space.md},
    content: {padding: space.lg, paddingBottom: 120, gap: space.md},
    title: {...typeStyles.title, color: STEEL.textPrimary},
    sub: {color: STEEL.textSecondary},
    muted: {color: STEEL.textSecondary},
    tabs: {flexDirection: 'row', gap: space.sm},
    tab: {minHeight: control.minTarget, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control, borderWidth: 1, borderColor: STEEL.border},
    tabOn: {backgroundColor: STEEL.accent},
    tabText: {color: STEEL.textPrimary},
    tabTextOn: {color: STEEL.onAction, fontWeight: '700'},
    range: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
    rangeButton: {minWidth: control.minTarget, minHeight: control.minTarget, alignItems: 'center', justifyContent: 'center'},
    rangeLabel: {flex: 1, textAlign: 'center', color: STEEL.textPrimary},
    filters: {flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingVertical: space.xs},
    chip: {minHeight: control.minTarget, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1, borderColor: STEEL.border},
    chipOn: {backgroundColor: STEEL.accent, borderColor: STEEL.accent},
    chipText: {color: STEEL.textPrimary},
    chipTextOn: {color: STEEL.onAction, fontWeight: '700'},
    card: {backgroundColor: STEEL.surface, borderRadius: radius.card, borderWidth: 1, borderColor: STEEL.border, padding: space.md, gap: space.sm},
    cardTitle: {color: STEEL.textPrimary},
    row: {gap: 2, paddingTop: space.sm},
    rowTitle: {color: STEEL.textPrimary, fontWeight: '700'},
    actions: {flexDirection: 'row', flexWrap: 'wrap', gap: space.sm},
    retry: {minHeight: control.minTarget, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.control, backgroundColor: STEEL.accent},
    retryText: {color: STEEL.onAction, fontWeight: '700'},
    remove: {minHeight: control.minTarget, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.control, borderWidth: 1, borderColor: STEEL.dangerBorder},
    removeText: {color: STEEL.dangerAction, fontWeight: '700'},
    editor: {padding: space.lg, gap: space.md, backgroundColor: STEEL.surface},
    input: {borderWidth: 1, borderColor: STEEL.border, borderRadius: radius.control, color: STEEL.textPrimary, backgroundColor: STEEL.surface, paddingHorizontal: space.md},
  });
}

import {typeStyles} from '../theme/layout';
import {AppText as Text,AppTextInput as TextInput} from '../components/ui/AppText';
import {NoticeBanner, useNotice} from '../components/ui/NoticeBanner';
import {recordsColors} from '../theme/records';
import {saveSignedInProfile} from '../lib/profile-settings';
import {supabase} from '../lib/supabase';
import React, { useEffect, useState } from 'react';
import {
  View,

  ScrollView,
  Pressable,
  StyleSheet,

  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AccountDataControls from '../components/account/AccountDataControls';

function settingsColors(darkMode) {
  const colors = recordsColors(darkMode);
  return { ...colors, borderStrong: colors.controlBorder, canvas: 'transparent' };
}

function splitName(full) {
  const t = (full || '').trim();
  if (!t) return { first: '', last: '' };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/**
 * Main-column profile settings (mirrors desktop Profile Settings intent).
 * Uses parent-managed profile object so shell avatar / drawer stay in sync.
 */
export default function ProfileSettingsScreen({
  omitShellTitle = false,
  scrollFabProps = {},
  darkShell = false,
  userProfile,
  onUpdateUserProfile,
  onClose,
  onSignOut,
}) {
  const T = settingsColors(darkShell);
  const { first: initialFirst, last: initialLast } = splitName(userProfile?.name);

  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [avatarUri, setAvatarUri] = useState(userProfile?.avatarUri || '');
  const [email] = useState(userProfile?.email || '');
  const [saving, setSaving] = useState(false);
  const {notice, showNotice, dismissNotice} = useNotice();

  useEffect(() => {
    const { first, last } = splitName(userProfile?.name);
    setFirstName(first);
    setLastName(last);
    setAvatarUri(userProfile?.avatarUri || '');
  }, [userProfile?.name, userProfile?.avatarUri]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to change your profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const saved = await saveSignedInProfile({
        client: supabase,
        fileSystem: FileSystem,
        env: {supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL, anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY},
        firstName,
        lastName,
        avatarUri,
      });
      onUpdateUserProfile?.(saved);
      showNotice('Profile updated.', 'success');
    } catch (error) {
      showNotice(error?.message || 'The profile could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: T.canvas }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...scrollFabProps}
    >
      {notice ? <NoticeBanner message={notice.message} tone={notice.tone} colors={T} onDismiss={dismissNotice} /> : null}
      {!omitShellTitle ? (
        <View style={styles.intro}>
          <Text variant="title" style={[styles.title, { color: T.textPrimary }]}>Profile Settings</Text>
          <Text variant="body" style={[styles.sub, { color: T.textSecondary }]}>
            Manage your account information and preferences.
          </Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
        <Text variant="body" style={[styles.cardTitle, { color: T.textPrimary }]}>Profile photo</Text>
        <Text variant="caption" style={[styles.cardHint, { color: T.textSecondary }]}>Your public avatar and identity</Text>
        <View style={styles.avatarBlock}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} accessibilityLabel="Profile" />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: T.surfaceMuted }]}>
                <Text variant="page" style={[styles.avatarLetters, { color: T.textSecondary }]}>
                  {(firstName[0] || '') + (lastName[0] || '') || '?'}
                </Text>
              </View>
            )}
            <Pressable
              onPress={pickImage}
              style={styles.uploadFab}
              accessibilityRole="button"
              accessibilityLabel="Upload profile photo"
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            </Pressable>
          </View>
          <Text variant="section" style={[styles.displayName, { color: T.textPrimary }]}>
            {`${firstName} ${lastName}`.trim() || '—'}
          </Text>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={14} color={T.textSecondary} />
            <Text variant="secondary" style={[styles.emailText, { color: T.textSecondary }]} numberOfLines={1}>
              {email || '—'}
            </Text>
          </View>
          <View style={styles.verifiedRow}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text variant="caption" style={[styles.verifiedText, { color: T.textSecondary }]}>Verified account</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
        <Text variant="body" style={[styles.cardTitle, { color: T.textPrimary }]}>Personal information</Text>
        <Text variant="caption" style={[styles.cardHint, { color: T.textSecondary }]}>Update your profile details</Text>
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text variant="caption" style={[styles.label, { color: T.textPrimary }]}>First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={T.textMuted}
              style={[styles.input, { color: T.textPrimary, borderColor: T.borderStrong, backgroundColor: T.surfaceMuted }]}
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text variant="caption" style={[styles.label, { color: T.textPrimary }]}>Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={T.textMuted}
              style={[styles.input, { color: T.textPrimary, borderColor: T.borderStrong, backgroundColor: T.surfaceMuted }]}
            />
          </View>
        </View>
      </View>

      <AccountDataControls colors={T} />

      {onSignOut ? (
        <Pressable
          onPress={onSignOut}
          style={[styles.signOutBtn, { borderColor: T.border, backgroundColor: T.surface }]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Ionicons name="log-out-outline" size={20} color={T.danger} />
          <Text variant="body" style={[styles.signOutText, { color: T.danger }]}>Sign out</Text>
        </Pressable>
      ) : null}

      <View style={styles.footerActions}>
        <Pressable onPress={onClose} style={styles.cancelBtn} accessibilityRole="button">
          <Text variant="body" style={[styles.cancelText, { color: T.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          accessibilityState={{disabled: saving}}
          style={[styles.saveBtn, { backgroundColor: T.accent }]}
          accessibilityRole="button"
          accessibilityLabel="Save profile changes"
        >
          <Text variant="body" style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  intro: { marginBottom: 20 },
  title: { ...typeStyles.title, fontWeight: '800', marginBottom: 6 },
  sub: { ...typeStyles.body, },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  cardTitle: { ...typeStyles.body, fontWeight: '700', marginBottom: 4 },
  cardHint: { ...typeStyles.caption, marginBottom: 16 },
  avatarBlock: { alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarImg: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetters: { ...typeStyles.page, fontWeight: '800' },
  uploadFab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  displayName: { ...typeStyles.section, fontWeight: '700', marginBottom: 4 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  emailText: { ...typeStyles.secondary, flex: 1 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  verifiedText: { ...typeStyles.caption, fontWeight: '600' },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1, minWidth: 0 },
  label: { ...typeStyles.caption, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typeStyles.body,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  signOutText: { ...typeStyles.body, fontWeight: '700' },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  cancelText: { ...typeStyles.body, fontWeight: '600' },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  saveBtnText: { color: '#fff', ...typeStyles.body, fontWeight: '700' },
});

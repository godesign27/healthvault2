import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const STEEL = {
  canvas: 'transparent',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#D1D5E0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#4F46E5',
  accentHover: '#4338CA',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
};

const STEEL_DARK = {
  canvas: 'transparent',
  surface: '#1E293B',
  surfaceMuted: '#334155',
  border: '#334155',
  borderStrong: '#475569',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  accent: '#818CF8',
  accentHover: '#A5B4FC',
  danger: '#F87171',
  dangerBg: 'rgba(248, 113, 113, 0.12)',
};

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
  const T = darkShell ? STEEL_DARK : STEEL;
  const { first: initialFirst, last: initialLast } = splitName(userProfile?.name);

  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [avatarUri, setAvatarUri] = useState(userProfile?.avatarUri || '');
  const [email] = useState(userProfile?.email || '');

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

  const handleSave = () => {
    const name = `${firstName} ${lastName}`.trim() || userProfile?.name || 'User';
    onUpdateUserProfile?.({
      name,
      email: userProfile?.email,
      avatarUri: avatarUri || userProfile?.avatarUri,
    });
    Alert.alert('Profile updated', 'Your changes have been saved.');
    onClose?.();
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: darkShell ? STEEL_DARK.canvas : STEEL.canvas }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...scrollFabProps}
    >
      {!omitShellTitle ? (
        <View style={styles.intro}>
          <Text style={[styles.title, { color: T.textPrimary }]}>Profile Settings</Text>
          <Text style={[styles.sub, { color: T.textSecondary }]}>
            Manage your account information and preferences.
          </Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
        <Text style={[styles.cardTitle, { color: T.textPrimary }]}>Profile photo</Text>
        <Text style={[styles.cardHint, { color: T.textSecondary }]}>Your public avatar and identity</Text>
        <View style={styles.avatarBlock}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} accessibilityLabel="Profile" />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: T.surfaceMuted }]}>
                <Text style={[styles.avatarLetters, { color: T.textSecondary }]}>
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
          <Text style={[styles.displayName, { color: T.textPrimary }]}>
            {`${firstName} ${lastName}`.trim() || '—'}
          </Text>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={14} color={T.textSecondary} />
            <Text style={[styles.emailText, { color: T.textSecondary }]} numberOfLines={1}>
              {email || '—'}
            </Text>
          </View>
          <View style={styles.verifiedRow}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={[styles.verifiedText, { color: T.textSecondary }]}>Verified account</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
        <Text style={[styles.cardTitle, { color: T.textPrimary }]}>Personal information</Text>
        <Text style={[styles.cardHint, { color: T.textSecondary }]}>Update your profile details</Text>
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={[styles.label, { color: T.textPrimary }]}>First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={T.textMuted}
              style={[styles.input, { color: T.textPrimary, borderColor: T.borderStrong, backgroundColor: T.surfaceMuted }]}
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={[styles.label, { color: T.textPrimary }]}>Last name</Text>
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

      {onSignOut ? (
        <Pressable
          onPress={onSignOut}
          style={[styles.signOutBtn, { borderColor: T.border, backgroundColor: T.surface }]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Ionicons name="log-out-outline" size={20} color={T.danger} />
          <Text style={[styles.signOutText, { color: T.danger }]}>Sign out</Text>
        </Pressable>
      ) : null}

      <View style={styles.footerActions}>
        <Pressable onPress={onClose} style={styles.cancelBtn} accessibilityRole="button">
          <Text style={[styles.cancelText, { color: T.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: T.accent }]}
          accessibilityRole="button"
          accessibilityLabel="Save profile changes"
        >
          <Text style={styles.saveBtnText}>Save changes</Text>
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
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 15, lineHeight: 22 },
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
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardHint: { fontSize: 12, marginBottom: 16 },
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
  avatarLetters: { fontSize: 36, fontWeight: '800' },
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
  displayName: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  emailText: { fontSize: 13, flex: 1 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  verifiedText: { fontSize: 12, fontWeight: '600' },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1, minWidth: 0 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
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
  signOutText: { fontSize: 15, fontWeight: '700' },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  cancelText: { fontSize: 15, fontWeight: '600' },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

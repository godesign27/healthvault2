import {recordsColors} from '../theme/records';
import {control, space, typeStyles} from '../theme/layout';
import {AppText as Text,AppTextInput as TextInput} from '../components/ui/AppText';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  AccessibilityInfo,


  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SteelSurfaceBackground } from '../components/SteelSurfaceBackground';

const colors = recordsColors(false);
const backdropColors = recordsColors(true);
const fill = StyleSheet.absoluteFillObject;

export default function LoginScreen({ onLogin, onRecovery, recovery = false, recoveryError = '', onSavePassword, onCancelRecovery }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [requestMode, setRequestMode] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [notice, setNotice] = useState('');
  const busy = useRef(false);
  const passwordRef = useRef(null);
  useEffect(() => {
    if (recovery) { setNotice(''); setError(''); setPassword(''); setConfirmation(''); }
    setRequestMode(false);
  }, [recovery]);
  useEffect(() => {
    const message = error || recoveryError || notice;
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [error, recoveryError, notice]);
  const handleLogin = async () => {
    if (busy.current) return;
    if (!recovery && !requestMode && (!email.trim() || !password)) {
      setError('Please enter your email and password.'); return;
    }
    busy.current = true; setLoading(true); setError(''); setNotice('');
    try {
      if (recovery) {
        await onSavePassword(password, confirmation);
        setPassword(''); setConfirmation('');
        setNotice('Password updated. Sign in with your new password.');
      } else if (requestMode) {
        await onRecovery(email);
        setNotice('If an account exists for this email, you will receive a recovery link. Open it on this device.');
      } else {
        const { error: signErr } = await onLogin(email, password);
        if (signErr) throw signErr;
      }
    } catch (err) { setError(err?.message || 'Unable to complete this request. Please try again.'); }
    finally { busy.current = false; setLoading(false); }
  };
  const cancelRecovery = async () => {
    if (busy.current) return;
    busy.current = true; setLoading(true);
    try { const result = await onCancelRecovery(); if (result?.error) throw result.error; }
    catch { setError('Unable to sign out. Please try again.'); }
    finally { busy.current = false; setLoading(false); }
  };

  return (
    <View style={styles.root}>
      <View style={fill} pointerEvents="none">
        <SteelSurfaceBackground dark />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.inner, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl }]}>
          <View style={styles.logoArea}>
            <Image
              source={require('../../assets/hv_logo-dark.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Health Vault"
            />
            <Text variant="body" style={styles.tagline}>AI Medical Assistant</Text>
          </View>

          <View style={styles.card}>
          <Text variant="title" style={styles.cardTitle}>{recovery ? 'Set new password' : requestMode ? 'Reset password' : 'Sign in'}</Text>
          <Text variant="body" style={styles.cardSubtitle}>Access your secure health records</Text>

          {error || recoveryError ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text variant="secondary" style={styles.errorText}>{error || recoveryError}</Text>
            </View>
          ) : null}

          {notice ? <Text variant="body" accessibilityLiveRegion="polite" style={styles.cardSubtitle}>{notice}</Text> : null}
          {!recovery ? <>
          <Text variant="secondary" style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              accessibilityLabel="Email"
              editable={!loading}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType={requestMode ? "done" : "next"}
              onSubmitEditing={requestMode ? handleLogin : () => passwordRef.current?.focus()}
            />
          </View>

          </> : null}
          {!requestMode || recovery ? <>
          <Text variant="secondary" style={styles.label}>{recovery ? 'New password (at least 12 characters)' : 'Password'}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              ref={passwordRef}
              accessibilityLabel={recovery ? "New password" : "Password"}
              editable={!loading}
              placeholder="Your password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete={recovery ? "new-password" : "password"}
              textContentType={recovery ? "newPassword" : "password"}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} accessibilityState={{disabled:loading}} disabled={loading} onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          </> : null}
          {recovery ? <>
            <Text variant="secondary" style={styles.label}>Confirm new password</Text>
            <View style={styles.inputWrapper}>
              <TextInput accessibilityLabel="Confirm new password" style={styles.input} secureTextEntry
                value={confirmation} onChangeText={setConfirmation} editable={!loading}
                textContentType="newPassword" autoComplete="new-password" onSubmitEditing={handleLogin} />
            </View>
          </> : null}
          <TouchableOpacity style={styles.forgotBtn} accessibilityRole="button" disabled={loading}
            accessibilityState={{disabled:loading}}
            onPress={recovery ? cancelRecovery : () => { setRequestMode(!requestMode); setError(''); setNotice(''); setPassword(''); }}>
            <Text variant="secondary" style={styles.forgotText}>{recovery ? 'Cancel and sign out' : requestMode ? 'Back to sign in' : 'Forgot password?'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={recovery ? 'Update password' : requestMode ? 'Send recovery link' : 'Sign in'}
            accessibilityState={{ disabled: loading || (recovery && !!recoveryError), busy: loading }}
            style={[styles.signInBtn, (loading || (recovery && !!recoveryError)) && styles.signInBtnDisabled]}
            onPress={handleLogin}
            disabled={loading || (recovery && !!recoveryError)}
          >
            {loading ? (
              <ActivityIndicator color={colors.onAction} size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color={colors.onAction} />
                <Text variant="body" style={styles.signInBtnText}>{recovery ? 'Update password' : requestMode ? 'Send recovery link' : 'Sign In'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed" size={12} color={backdropColors.textSecondary} />
          <Text variant="caption" style={styles.securityText}>Your personal health vault</Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  keyboard: { flex: 1, backgroundColor: 'transparent' },
  inner: { flexGrow: 1, paddingHorizontal: 24, gap: 24, zIndex: 1 },
  logoArea: { alignItems: 'center', gap: 10 },
  logoImage: {
    width: 220,
    height: 56,
    maxWidth: '100%',
  },
  tagline: { ...typeStyles.body, color: backdropColors.textPrimary, fontWeight: '500' },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 24 },
  cardTitle: { ...typeStyles.title, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { ...typeStyles.body, color: colors.textSecondary, marginBottom: 20 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { ...typeStyles.secondary, color: colors.danger, flex: 1 },
  label: { ...typeStyles.secondary, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.controlBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    backgroundColor: colors.surfaceMuted,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, minWidth: 0, ...typeStyles.body, color: colors.textPrimary, paddingVertical: 14 },
  eyeBtn: { minWidth: control.minTarget, minHeight: control.minTarget, alignItems: 'center', justifyContent: 'center' },
  forgotBtn: { minHeight: control.minTarget, justifyContent: 'center', alignSelf: 'flex-end', marginTop: -8, marginBottom: 20 },
  forgotText: { ...typeStyles.secondary, color: colors.accent, fontWeight: '500' },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    minHeight: control.minTarget,
  },
  signInBtnDisabled: { opacity: 0.6 },
  signInBtnText: { flexShrink: 1, textAlign: 'center', color: colors.onAction, ...typeStyles.body, fontWeight: '700' },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  securityText: { ...typeStyles.caption, color: backdropColors.textSecondary },
});

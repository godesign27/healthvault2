import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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

const fill = StyleSheet.absoluteFillObject;

export default function LoginScreen({ onLogin }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: signErr } = await onLogin(email, password);
    setLoading(false);
    if (signErr) {
      setError(signErr.message || 'Sign in failed. Please try again.');
    }
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
        <View style={[styles.inner, { paddingTop: insets.top }]}>
          <View style={styles.logoArea}>
            <Image
              source={require('../../assets/hv_logo-dark.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Health Vault"
            />
            <Text style={styles.tagline}>AI Medical Assistant</Text>
          </View>

          <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.cardSubtitle}>Access your secure health records</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn} accessibilityRole="button">
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color="white" />
                <Text style={styles.signInBtnText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed" size={12} color="#94A3B8" />
          <Text style={styles.securityText}>Your data is encrypted and HIPAA-compliant</Text>
        </View>
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  keyboard: { flex: 1, backgroundColor: 'transparent' },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 24, zIndex: 1 },
  logoArea: { alignItems: 'center', gap: 10 },
  logoImage: {
    width: 220,
    height: 56,
    maxWidth: '100%',
  },
  tagline: { fontSize: 14, color: '#C7D2FE', fontWeight: '500' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 24 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 20 },
  forgotText: { fontSize: 13, color: '#4F46E5', fontWeight: '500' },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 16,
  },
  signInBtnDisabled: { opacity: 0.6 },
  signInBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  securityText: { fontSize: 12, color: '#94A3B8' },
});

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'health_vault_pin_hash';
const MAX_PIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60_000;

export type BiometricSupportLevel =
  | 'face_id'
  | 'touch_id'
  | 'fingerprint'
  | 'pin_only'
  | 'none';

export async function getBiometricSupport(): Promise<BiometricSupportLevel> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return 'none';

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) return 'pin_only';

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face_id';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return typeof window !== 'undefined' ? 'touch_id' : 'fingerprint';
  }
  return 'pin_only';
}

export async function promptBiometric(reason = 'Confirm your identity to access Health Vault'): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: 'Use PIN instead',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'health_vault_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function setPin(pin: string): Promise<void> {
  if (!/^\d{4,6}$/.test(pin)) throw new Error('PIN must be 4–6 digits');
  const hash = await hashPin(pin);
  await SecureStore.setItemAsync(PIN_KEY, hash);
  await SecureStore.deleteItemAsync('pin_attempts');
  await SecureStore.deleteItemAsync('pin_lockout_until');
}

export async function hasPin(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored !== null;
}

export async function verifyPin(pin: string): Promise<{
  success: boolean;
  attemptsLeft?: number;
  lockedUntil?: number;
}> {
  const lockoutStr = await SecureStore.getItemAsync('pin_lockout_until');
  if (lockoutStr) {
    const lockedUntil = parseInt(lockoutStr, 10);
    if (Date.now() < lockedUntil) {
      return { success: false, lockedUntil };
    }
    await SecureStore.deleteItemAsync('pin_lockout_until');
    await SecureStore.deleteItemAsync('pin_attempts');
  }

  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) return { success: false };

  const hash = await hashPin(pin);
  if (hash === stored) {
    await SecureStore.deleteItemAsync('pin_attempts');
    return { success: true };
  }

  const attemptsStr = await SecureStore.getItemAsync('pin_attempts');
  const attempts = attemptsStr ? parseInt(attemptsStr, 10) + 1 : 1;
  if (attempts >= MAX_PIN_ATTEMPTS) {
    await SecureStore.setItemAsync('pin_lockout_until', String(Date.now() + LOCKOUT_DURATION_MS));
    await SecureStore.deleteItemAsync('pin_attempts');
    return { success: false, attemptsLeft: 0, lockedUntil: Date.now() + LOCKOUT_DURATION_MS };
  }
  await SecureStore.setItemAsync('pin_attempts', String(attempts));
  return { success: false, attemptsLeft: MAX_PIN_ATTEMPTS - attempts };
}

// Returns true if biometric passed. Returns false to signal UI should show PIN entry.
export async function authenticateWithVault(): Promise<boolean> {
  const support = await getBiometricSupport();

  if (support === 'face_id' || support === 'touch_id' || support === 'fingerprint') {
    const biometricResult = await promptBiometric();
    if (biometricResult) return true;
  }

  return false;
}

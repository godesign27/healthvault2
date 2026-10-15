import { requireNativeModule } from 'expo-modules-core';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { previewHealthImport } from '../../../../packages/health-vault-mcp/src/health-imports.ts';
import { buildAppleHealthImport } from './apple-health';

function ensureSubtle() {
  if (globalThis.crypto?.subtle?.digest) return;
  const current = globalThis.crypto ?? {};
  globalThis.crypto = {
    ...current,
    randomUUID: current.randomUUID ?? (() => Crypto.randomUUID()),
    subtle: {
      async digest(_algorithm, data) {
        const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
        return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
      },
    },
  };
}

export function appleHealthReader() {
  if (Platform.OS !== 'ios') return null;
  try {
    return requireNativeModule('AppleHealth');
  } catch {
    return null;
  }
}

export async function readAppleHealth() {
  const reader = appleHealthReader();
  if (!reader) {
    throw new Error(Platform.OS === 'ios'
      ? 'Apple Health is not in this installed version yet. Update the Health Vault app on this iPhone, then try again.'
      : 'Apple Health is available on iPhone.');
  }
  const result = await reader.readLatestVitals();
  if (!result?.available) throw new Error('Apple Health is not available on this iPhone.');
  return result.samples ?? [];
}

export async function previewAppleHealth(client, userId, samples) {
  ensureSubtle();
  const input = buildAppleHealthImport(samples, Crypto.randomUUID());
  if (!input) return null;
  return previewHealthImport(client, userId, input);
}

import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { HealthVaultClient } from '@health-vault/api-client';
import { supabase } from './supabase';
import { savePickedRecord } from './record-upload-core';

export async function uploadPickedRecord(asset, kind) {
  const { data: { session } } = await supabase.auth.getSession();
  const ownerId = session?.user.id;
  if (!ownerId) throw new Error('Sign in before uploading.');
  const client = new HealthVaultClient({
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    getAccessToken: async () => {
      const { data: { session: current } } = await supabase.auth.getSession();
      if (current?.user.id !== ownerId) throw new Error('Your account changed. Select the file again after signing in.');
      return current.access_token;
    },
  });
  return savePickedRecord({asset, kind, ownerId, fileSystem: FileSystem, client,
    digest: value => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value)});
}

import { typeStyles } from '../../theme/layout';
import { AppText as Text, AppTextInput as TextInput } from '../ui/AppText';
import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../lib/supabase';
import {
  fetchAccountExport,
  isOpenDeletionRequest,
  loadLatestDeletionRequest,
  presentAccountExport,
  submitDeletionRequest,
} from '../../lib/account-data';

export default function AccountDataControls({ colors, client = supabase }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [request, setRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const locked = useRef(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const latest = await loadLatestDeletionRequest(client);
        if (mounted) setRequest(latest);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load account controls.');
      } finally {
        if (mounted) setLoadingRequest(false);
      }
    })();
    return () => { mounted = false; };
  }, [client]);

  async function download() {
    if (locked.current) return;
    locked.current = true;
    setBusy('export');
    setError('');
    setNotice('');
    try {
      const payload = await fetchAccountExport(client);
      await presentAccountExport({ fileSystem: FileSystem, share: Share, platform: Platform.OS, payload });
      setNotice('Your download is ready. Keep this file private. It contains your health information.');
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Unable to download your data.');
    } finally {
      locked.current = false;
      setBusy(null);
    }
  }

  async function requestDeletion() {
    if (locked.current || confirmation !== 'DELETE' || loadingRequest) return;
    locked.current = true;
    setBusy('delete');
    setError('');
    setNotice('');
    try {
      const receipt = await submitDeletionRequest(client, confirmation);
      setRequest(receipt);
      setShowReview(false);
      setConfirmation('');
      setNotice('Deletion request received. Your account remains active while the request is reviewed.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to confirm your request.');
    } finally {
      locked.current = false;
      setBusy(null);
    }
  }

  const pending = isOpenDeletionRequest(request);
  const requestedAt = request?.requested_at ? new Date(request.requested_at).toLocaleString() : '';

  return (
    <View accessibilityLabel="Your account data" style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text variant="body" style={[styles.cardTitle, { color: colors.textPrimary }]}>Your account data</Text>
      <Text variant="caption" style={[styles.cardHint, { color: colors.textSecondary }]}>
        Download your personal structured Vault data as JSON, including saved form answers and wellness entries. Original files, images, and PDFs stay with their records. A deletion request is reviewed. It does not erase your data, stop sharing, or sign you out.
      </Text>
      <Pressable
        onPress={download}
        disabled={!!busy}
        accessibilityRole="button"
        accessibilityLabel="Download My Data"
        accessibilityState={{ disabled: !!busy, busy: busy === 'export' }}
        style={[styles.button, { borderColor: colors.border, backgroundColor: colors.surfaceMuted, opacity: busy ? 0.5 : 1 }]}
      >
        <Text variant="body" style={[styles.buttonText, { color: colors.textPrimary }]}>
          {busy === 'export' ? 'Preparing download…' : 'Download My Data'}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => { setShowReview(true); setError(''); setNotice(''); }}
        disabled={!!busy || pending || loadingRequest}
        accessibilityRole="button"
        accessibilityLabel={pending ? 'Deletion request pending' : 'Request Account Deletion'}
        accessibilityState={{ disabled: !!busy || pending || loadingRequest }}
        style={[styles.button, { borderColor: colors.border, backgroundColor: colors.surfaceMuted, opacity: busy || pending || loadingRequest ? 0.5 : 1 }]}
      >
        <Text variant="body" style={[styles.buttonText, { color: colors.textPrimary }]}>
          {loadingRequest ? 'Checking deletion requests…' : pending ? 'Deletion request pending' : 'Request Account Deletion'}
        </Text>
      </Pressable>
      {request ? (
        <View accessibilityRole="summary" style={styles.status}>
          <Text variant="secondary" style={{ color: colors.textSecondary }}>Request status: {request.status}</Text>
          <Text variant="secondary" style={{ color: colors.textSecondary }}>Reference: {request.id}</Text>
          {requestedAt ? <Text variant="secondary" style={{ color: colors.textSecondary }}>Requested {requestedAt}</Text> : null}
          {request.user_message ? <Text variant="secondary" style={{ color: colors.textSecondary }}>{request.user_message}</Text> : null}
          {pending ? <Text variant="secondary" style={{ color: colors.textSecondary }}>Your account and data have not been deleted. Review status appears here.</Text> : null}
        </View>
      ) : null}
      {showReview ? (
        <View style={[styles.review, { borderColor: colors.border }]}>
          <Text variant="body" style={[styles.reviewTitle, { color: colors.textPrimary }]}>Review your deletion request</Text>
          <Text variant="secondary" style={{ color: colors.textSecondary }}>
            This submits a request for review. Download what you need first. The review decides what must be kept before anything is erased.
          </Text>
          <Text variant="caption" style={[styles.label, { color: colors.textPrimary }]}>Type DELETE to request review</Text>
          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            editable={!busy}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Type DELETE to request review"
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderStrong, backgroundColor: colors.surface }]}
          />
          <View style={styles.reviewActions}>
            <Pressable
              onPress={requestDeletion}
              disabled={!!busy || confirmation !== 'DELETE'}
              accessibilityRole="button"
              accessibilityLabel="Submit deletion request"
              accessibilityState={{ disabled: !!busy || confirmation !== 'DELETE' }}
              style={[styles.button, styles.reviewButton, { borderColor: colors.border, backgroundColor: colors.surfaceMuted, opacity: busy || confirmation !== 'DELETE' ? 0.5 : 1 }]}
            >
              <Text variant="body" style={[styles.buttonText, { color: colors.textPrimary }]}>
                {busy === 'delete' ? 'Submitting…' : 'Submit deletion request'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setShowReview(false); setConfirmation(''); }}
              disabled={!!busy}
              accessibilityRole="button"
              accessibilityLabel="Cancel deletion request"
              style={[styles.button, styles.reviewButton, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
            >
              <Text variant="body" style={[styles.buttonText, { color: colors.textPrimary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {error ? <Text variant="secondary" accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: colors.textPrimary }}>{error}</Text> : null}
      {notice ? <Text variant="secondary" accessibilityLiveRegion="polite" style={{ color: colors.textPrimary }}>{notice}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 16 },
  cardTitle: { ...typeStyles.body, fontWeight: '700', marginBottom: 4 },
  cardHint: { ...typeStyles.caption, marginBottom: 16 },
  button: { minHeight: 48, justifyContent: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  buttonText: { ...typeStyles.body, fontWeight: '600' },
  status: { gap: 4, marginBottom: 10 },
  review: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10, gap: 8 },
  reviewTitle: { ...typeStyles.body, fontWeight: '700' },
  label: { ...typeStyles.caption, fontWeight: '600', marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, ...typeStyles.body },
  reviewActions: { gap: 8 },
  reviewButton: { marginBottom: 0 },
});

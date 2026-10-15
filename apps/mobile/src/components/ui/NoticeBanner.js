import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { space, radius, control } from '../../theme/layout';

function noticeTone(colors, tone) {
  switch (tone) {
    case 'success':
      return { ink: colors.success, wash: colors.successBg, border: colors.successBorder, icon: 'checkmark-circle' };
    case 'error':
      return { ink: colors.danger, wash: colors.dangerBg, border: colors.dangerBorder, icon: 'alert-circle' };
    case 'info':
      return { ink: colors.info, wash: colors.infoBg, border: colors.infoBorder, icon: 'information-circle' };
    default:
      return { ink: colors.info, wash: colors.infoBg, border: colors.infoBorder, icon: 'information-circle' };
  }
}

export function useNotice() {
  const [notice, setNotice] = useState(null);
  const showNotice = useCallback((message, tone = 'info') => {
    setNotice({ message, tone });
  }, []);
  const dismissNotice = useCallback(() => setNotice(null), []);
  useEffect(() => {
    if (!notice || notice.tone === 'error') return undefined;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  return { notice, showNotice, dismissNotice };
}

export function NoticeBanner({ message, tone = 'info', colors, onDismiss }) {
  const palette = noticeTone(colors, tone);
  return <View accessibilityRole={tone === 'error' ? 'alert' : undefined} accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'} style={[styles.banner, { backgroundColor: palette.wash, borderColor: palette.border }]}>
    <Ionicons name={palette.icon} size={22} color={palette.ink} />
    <AppText variant="body" style={{ color: palette.ink, flex: 1 }}>{message}</AppText>
    <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={onDismiss} style={styles.dismiss}>
      <Ionicons name="close" size={control.icon} color={palette.ink} />
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginHorizontal: space.lg, marginBottom: space.sm, paddingLeft: space.md, paddingVertical: space.sm, borderWidth: 1, borderRadius: radius.card },
  dismiss: { minWidth: control.minTarget, minHeight: control.minTarget, alignItems: 'center', justifyContent: 'center' },
});

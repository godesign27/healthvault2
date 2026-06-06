import React from 'react';
import { View, StyleSheet } from 'react-native';

const fill = StyleSheet.absoluteFillObject;

/**
 * Steel canvas matching web `theme.steel.css` intent (teal/indigo washes on #fafafa;
 * midnight + aurora in dark). Pure `View` layers — no native gradient module, so this
 * runs in Expo Go / Metro without rebuilding the dev client.
 */
export function SteelSurfaceBackground({ dark }) {
  if (dark) {
    return (
      <View style={[fill, styles.belowChrome]} pointerEvents="none" importantForAccessibility="no">
        <View style={[fill, { backgroundColor: '#060a12' }]} />
        <View style={[styles.blob, styles.darkBaseBand]} />
        <View style={[styles.blob, styles.darkIndigoTop]} />
        <View style={[styles.blob, styles.darkTealLt]} />
        <View style={[styles.blob, styles.darkIndigoRt]} />
        <View style={[styles.blob, styles.darkTealFloor]} />
        <View style={[styles.blob, styles.darkIndigoBl]} />
      </View>
    );
  }

  return (
    <View style={[fill, styles.belowChrome]} pointerEvents="none" importantForAccessibility="no">
      <View style={[fill, { backgroundColor: '#fafafa' }]} />
      <View style={[styles.blob, styles.lightTealTl]} />
      <View style={[styles.blob, styles.lightIndigoTr]} />
      <View style={[styles.blob, styles.lightTealBr]} />
      <View style={[styles.blob, styles.lightIndigoBl]} />
      <View style={[styles.blob, styles.lightGridVeil]} />
    </View>
  );
}

const styles = StyleSheet.create({
  belowChrome: {
    zIndex: 0,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
  },
  /* ─── Light Steel (approx. web radials) ─── */
  lightTealTl: {
    width: '95%',
    height: '58%',
    top: '-18%',
    left: '-28%',
    borderRadius: 9999,
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
  },
  lightIndigoTr: {
    width: '88%',
    height: '52%',
    top: '-16%',
    right: '-26%',
    borderRadius: 9999,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  lightTealBr: {
    width: '92%',
    height: '56%',
    bottom: '-14%',
    right: '-24%',
    borderRadius: 9999,
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
  },
  lightIndigoBl: {
    width: '85%',
    height: '50%',
    bottom: '-12%',
    left: '-22%',
    borderRadius: 9999,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  lightGridVeil: {
    ...fill,
    backgroundColor: 'rgba(15, 23, 42, 0.025)',
    opacity: 0.9,
  },
  /* ─── Dark Steel (midnight + aurora blobs) ─── */
  darkBaseBand: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 16, 32, 0.55)',
  },
  darkIndigoTop: {
    width: '140%',
    height: '50%',
    top: '-25%',
    left: '-20%',
    borderRadius: 9999,
    backgroundColor: 'rgba(79, 70, 229, 0.32)',
  },
  darkTealLt: {
    width: '85%',
    height: '62%',
    top: '-8%',
    left: '-38%',
    borderRadius: 9999,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
  },
  darkIndigoRt: {
    width: '78%',
    height: '54%',
    top: '-6%',
    right: '-32%',
    borderRadius: 9999,
    backgroundColor: 'rgba(129, 140, 248, 0.2)',
  },
  darkTealFloor: {
    width: '120%',
    height: '48%',
    bottom: '-18%',
    left: '-10%',
    borderRadius: 9999,
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  darkIndigoBl: {
    width: '72%',
    height: '50%',
    bottom: '-8%',
    left: '-28%',
    borderRadius: 9999,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
});

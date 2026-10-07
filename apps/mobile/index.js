import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import {typeStyles, control, adaptiveLayout} from './src/theme/layout';
import {recordsColors} from './src/theme/records';
import {AppText as Text,AppTextInput as TextInput,RevealText} from './src/components/ui/AppText';
import { AppRegistry } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  View,

  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  useWindowDimensions,

  Alert,
  ActivityIndicator,
  AccessibilityInfo,
  findNodeHandle,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAssistant } from './src/hooks/useAssistant';
import { useReduceMotion } from './src/hooks/useReduceMotion';
import { modalAnimation } from './src/lib/modal-motion';
import { useAuth } from './src/hooks/useAuth';
import { useVaultStats } from './src/hooks/useVaultStats';
import { formatCareDate } from './src/lib/careDates';
import { useProfile } from './src/hooks/useProfile';
import LoginScreen from './src/screens/LoginScreen';
import CareScreen from './src/screens/CareScreen';
import NetworkScreen from './src/screens/NetworkScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import MedicalScreen from './src/screens/MedicalScreen';
import MedicalProfileScreen from './src/screens/MedicalProfileScreen';
import VitalsScreen from './src/screens/VitalsScreen';
import InsuranceScreen from './src/screens/InsuranceScreen';
import ProfileSettingsScreen from './src/screens/ProfileSettingsScreen';
import { SteelSurfaceBackground } from './src/components/SteelSurfaceBackground';

const NAVY = '#0f172a';
const CORAL = '#E53935';

/** Steel surface tokens (mobile shell) — canvas matches web `[data-surface="steel"]` base #fafafa */
const STEEL = {
  canvas: '#fafafa',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceRaised: '#FFFFFF',
  stroke: '#E2E8F0',
  strokeStrong: '#D1D5E0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#4F46E5',
  accentSoft: '#EEF2FF',
  navy: '#0F172A',
  assistantIcon: '#6B1524',
  assistantIconEnd: '#8B1A1A',
  fabBg: '#0F172A',
  overlay: 'rgba(15, 23, 42, 0.45)',
};

const DRAWER_WIDTH = '88%';

const NAV_MAIN = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home-outline' },
  { key: 'medical-profile', label: 'Medical Profile', icon: 'person-outline' },
  { key: 'care', label: 'Care', icon: 'heart-outline' },
  { key: 'network', label: 'Network', icon: 'people-outline' },
  { key: 'insurance', label: 'Insurance', icon: 'shield-outline' },
  { key: 'records', label: 'Records', icon: 'document-text-outline' },
  { key: 'medical', label: 'Medical Forms', icon: 'clipboard-outline' },
  { key: 'vitals', label: 'Vitals', icon: 'pulse-outline' },
];

const NAV_ACCOUNT = [
  { key: 'dark-mode', label: 'Dark Mode', icon: 'moon-outline' },
];

const QUICK_PROMPTS = [
  'Summarize my latest lab results',
  "What's my next appointment?",
  'Log my blood pressure',
  'Explain my new prescription',
];

function useStackedLayout() {
  const { width, fontScale } = useWindowDimensions();
  return adaptiveLayout(width, fontScale).stack;
}

function shellUserInitials(userProfile) {
  const name = (userProfile?.name || '').trim();
  const email = (userProfile?.email || '').trim();
  const fromWords = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => (part[0] ? part[0].toUpperCase() : ''))
    .join('');
  if (fromWords) return fromWords;
  if (email.length >= 2) return email.slice(0, 2).toUpperCase();
  return '?';
}

function titleForRoute(route) {
  if (route === 'profile-settings') return 'Profile Settings';
  const all = [...NAV_MAIN, ...NAV_ACCOUNT];
  const hit = all.find((n) => n.key === route);
  return hit ? hit.label : 'Health Vault';
}

function AppTopBar({ darkShell, onMenuPress, onLogoPress, userProfile, onAvatarPress, onAssistantPress, menuButtonRef, assistantButtonRef }) {
  const insets = useSafeAreaInsets();
  const bg = darkShell ? '#1E293B' : STEEL.surface;
  const border = darkShell ? '#334155' : STEEL.stroke;

  return (
    <View
      style={[
        styles.topBar,
        {
          paddingTop: insets.top + 8,
          backgroundColor: bg,
          borderBottomColor: border,
        },
      ]}
    >
      <View style={styles.topBarSide}>
      <Pressable
        ref={menuButtonRef}
        style={[styles.hamburgerBtn, { backgroundColor: darkShell ? '#334155' : STEEL.navy }]}
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        <Ionicons name="menu" size={22} color="#fff" />
      </Pressable>
      </View>
      <Pressable
        onPress={onLogoPress}
        accessibilityRole="button"
        accessibilityLabel="Go to Dashboard"
        style={styles.topBarLogoHit}
      >
        <Image
          source={darkShell ? require('./assets/hv_logo-dark.png') : require('./assets/hv_logo-light.png')}
          style={styles.topBarLogo}
          resizeMode="contain"
          accessible={false}
        />
      </Pressable>
      <View style={[styles.topBarSide, styles.topBarSideEnd]}>
      <View style={styles.topBarActions}>
      <Pressable
        onPress={onAvatarPress}
        accessibilityRole="button"
        accessibilityLabel="Open profile settings"
        style={styles.topBarAvatarWrap}
        disabled={!onAvatarPress}
      >
            {userProfile?.avatarUri ? (
              <Image
                source={{ uri: userProfile.avatarUri }}
                style={styles.topBarAvatarImg}
                accessibilityLabel={userProfile?.name || userProfile?.email}
              />
            ) : (
              <View style={[styles.topBarAvatarImg, styles.topBarAvatarInitials]}>
                <Text variant="caption" maxFontSizeMultiplier={1.2} style={styles.topBarAvatarInitialsText}>
                  {shellUserInitials(userProfile)}
                </Text>
              </View>
            )}
      </Pressable>
      <Pressable
        ref={assistantButtonRef}
        onPress={onAssistantPress}
        accessibilityRole="button"
        accessibilityLabel="Open Vault Assistant"
        style={[styles.assistantBtn, { backgroundColor: darkShell ? '#334155' : STEEL.navy }]}
      >
        <Ionicons name="sparkles" size={22} color="#fff" />
      </Pressable>
      </View>
      </View>
    </View>
  );
}

function AppDrawer({
  visible,
  onClose,
  activeRoute,
  onSelectRoute,
  darkShell,
  onToggleDarkShell,
  userProfile,
  onFooterProfilePress,
  signOut,
  onDismiss,
}) {
  const closeButtonRef = useRef(null);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const stack = useStackedLayout();
  const colors = recordsColors(darkShell);
  const panelBg = colors.surfaceMuted;
  const text = colors.textPrimary;
  const muted = colors.textSecondary;
  const activeCardBg = colors.surface;
  const stroke = colors.border;
  const [signingOut, setSigningOut] = useState(false);
  const signingOutRef = useRef(false);
  const [signOutError, setSignOutError] = useState(null);
  const handleSignOut = async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    setSigningOut(true); setSignOutError(null);
    try { await signOut(); onClose(); }
    catch { setSignOutError('Unable to sign out. Please try again.'); }
    finally { signingOutRef.current = false; setSigningOut(false); }
  };

  const Row = ({ item }) => {
    const isActive = item.key === 'dark-mode' ? darkShell : activeRoute === item.key;
    return (
    <Pressable
      accessibilityRole={item.key === 'dark-mode' ? 'switch' : 'button'}
      accessibilityLabel={item.label}
      accessibilityState={item.key === 'dark-mode' ? { checked: darkShell } : { selected: isActive }}
      onPress={() => {
        if (item.key === 'dark-mode') {
          onToggleDarkShell();
          return;
        }
        onSelectRoute(item.key);
        onClose();
      }}
      style={[
        styles.drawerRow,
        stack && styles.drawerRowStacked,
        isActive && [styles.drawerRowActive, { backgroundColor: activeCardBg, borderColor: stroke }],
      ]}
    >
      <Ionicons name={item.icon} size={22} color={isActive ? colors.accent : muted} />
      <Text variant="body" style={[styles.drawerRowLabel, stack && styles.drawerRowLabelStacked, { color: text }, isActive && { fontWeight: '700', color: darkShell ? '#fff' : STEEL.text }]}>
        {item.label}
      </Text>
    </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType={modalAnimation(reduceMotion, 'fade')} onRequestClose={onClose}
      onShow={() => {
        const target = closeButtonRef.current && findNodeHandle(closeButtonRef.current);
        if (target != null) AccessibilityInfo.setAccessibilityFocus(target);
      }}
      onDismiss={onDismiss}>
      <View style={styles.drawerModalRoot} accessibilityViewIsModal onAccessibilityEscape={onClose}>
        <View style={[styles.drawerPanel, { width: stack ? '100%' : DRAWER_WIDTH, backgroundColor: panelBg, paddingTop: insets.top + 12 }]}>
          <View style={[styles.drawerHeader, { borderBottomColor: stroke }]}>
            <View style={styles.drawerHeaderLeft}>
              <Image
                source={darkShell ? require('./assets/hv_logo-dark.png') : require('./assets/hv_logo-light.png')}
                style={styles.drawerLogo}
                resizeMode="contain"
                accessibilityLabel="Health Vault"
              />
              <View style={styles.drawerTitleBlock}>
                <Text variant="section" style={[styles.drawerBrand, { color: text }]}>Health Vault</Text>
                <Text variant="caption" style={[styles.drawerBrandSub, { color: muted }]}>AI Medical Assistant</Text>
              </View>
            </View>
            <Pressable ref={closeButtonRef} style={[styles.drawerCloseCircle, { borderColor: stroke }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu">
              <Ionicons name="close" size={22} color={muted} />
            </Pressable>
          </View>

          <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
            {NAV_MAIN.map((item) => (
              <Row key={item.key} item={item} />
            ))}

            <Text variant="caption" style={[styles.drawerSectionLabel, { color: STEEL.accent }]}>ACCOUNT</Text>
            {NAV_ACCOUNT.map((item) => (
              <Row key={item.key} item={item} />
            ))}

            {signOut ? (
              <Pressable
                style={[styles.drawerRow, stack && styles.drawerRowStacked, { marginTop: 8 }]}
                onPress={handleSignOut}
                disabled={signingOut}
                accessibilityState={{ disabled: signingOut, busy: signingOut }}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                <Ionicons name="log-out-outline" size={22} color={colors.dangerAction} />
                <Text variant="body" style={[styles.drawerRowLabel, stack && styles.drawerRowLabelStacked, { color: colors.dangerAction, flex: 1 }]}>{signingOut ? 'Signing out…' : 'Sign Out'}</Text>
              </Pressable>
            ) : null}
            {signOutError && <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ color: colors.danger }}>{signOutError}</Text>}
          </ScrollView>

          <View style={[styles.drawerFooter, { paddingBottom: insets.bottom + 12, borderTopColor: stroke }]}>
            <Pressable
              onPress={onFooterProfilePress}
              accessibilityRole="button"
              accessibilityLabel="Open profile settings"
              style={[
                styles.drawerProfileCard,
                stack && styles.drawerProfileCardStacked,
                { backgroundColor: activeCardBg, borderColor: stroke },
                activeRoute === 'profile-settings' && [
                  styles.drawerRowActive,
                  { backgroundColor: activeCardBg, borderColor: stroke },
                ],
              ]}
            >
              {userProfile?.avatarUri ? (
                <Image
                  source={{ uri: userProfile.avatarUri }}
                  style={styles.drawerProfilePhoto}
                  accessibilityLabel={userProfile?.name || userProfile?.email}
                />
              ) : (
                <View style={[styles.drawerProfilePhoto, styles.drawerProfileInitials]}>
                  <Text variant="body" maxFontSizeMultiplier={1.2} style={styles.drawerProfileInitialsText}>
                    {shellUserInitials(userProfile)}
                  </Text>
                </View>
              )}
              <View style={stack ? styles.drawerProfileTextColStacked : styles.drawerProfileTextCol}>
                <Text variant="body" style={[styles.drawerProfileName, { color: text }]}>
                  {userProfile?.name}
                </Text>
                <Text variant="secondary" style={[styles.drawerProfileEmail, { color: muted }]}>
                  {userProfile?.email}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={muted} />
            </Pressable>
          </View>
        </View>
        <Pressable style={styles.drawerBackdrop} onPress={onClose} accessible={false} importantForAccessibility="no" />
      </View>
    </Modal>
  );
}

function VaultAssistantSheet({ visible, onClose, onDismiss, contextTitle }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const closeButtonRef = useRef(null);
  const [message, setMessage] = useState('');
  const chat=useAssistant(contextTitle);
  useEffect(()=>setMessage(''),[chat.ownerId]);
  async function submit(){if(await chat.send(message))setMessage('');}

  return (
    <Modal visible={visible} transparent animationType={modalAnimation(reduceMotion, 'slide')} onRequestClose={onClose}
      onShow={() => {
        const focusClose = () => {
          const target = closeButtonRef.current && findNodeHandle(closeButtonRef.current);
          if (target != null) AccessibilityInfo.setAccessibilityFocus(target);
        };
        focusClose();
        setTimeout(focusClose, 250);
      }}
      onDismiss={onDismiss}>
      <View style={styles.asstModalRoot} accessibilityViewIsModal onAccessibilityEscape={onClose}>
        <Pressable style={styles.asstBackdrop} onPress={onClose} accessible={false} importantForAccessibility="no" />
        <View style={[styles.asstSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.asstHandle} />
        <View style={styles.asstHeaderRow}>
          <View style={styles.asstIconCircle}>
            <Ionicons name="sparkles" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="section" style={styles.asstTitle}>Vault Assistant</Text>
            <Text variant="secondary" style={styles.asstContext}>Context: {contextTitle}</Text>
          </View>
          <Pressable ref={closeButtonRef} style={styles.asstCloseOutline} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close assistant">
            <Ionicons name="close" size={22} color={STEEL.accent} />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View style={styles.asstHero}>
            <View style={styles.asstHeroIcon}>
              <Ionicons name="sparkles" size={28} color={STEEL.text} />
            </View>
            <Text variant="section" style={styles.asstHeadline}>Ask anything about your health</Text>
            <Text variant="body" style={styles.asstSub}>
              Ask about your saved records, medications, insurance, and care team. This chat cannot change or share your data.
            </Text>
          </View>

          {['Show my health records', 'List my medications', 'Show my insurance coverage', 'Who is on my care team?'].map((p) => (
            <Pressable key={p} style={styles.asstPromptPill} disabled={chat.busy} onPress={()=>setMessage(p)}>
              <Text variant="body" style={styles.asstPromptText}>{p}</Text>
            </Pressable>
          ))}
          {chat.messages.map((item,index)=><View key={index} style={styles.asstPromptPill}>
            <Text variant="body" style={styles.asstPromptText}>{item.role==='user'?'You':'Vault Assistant'}: {item.content}</Text>
          </View>)}
          {chat.busy && <Text variant="body" style={styles.asstSub}>Checking your Vault…</Text>}
          {!!chat.error && <Text variant="body" accessibilityLiveRegion="polite" style={styles.asstSub}>{chat.error}</Text>}
        </ScrollView>

        <View style={styles.asstInputRow}>
          <Ionicons name="mic-outline" size={22} color={STEEL.textSecondary} />
          <TextInput
            style={styles.asstInput}
            placeholder="Message Vault Assistant…"
            placeholderTextColor={STEEL.textMuted}
            value={message}
            onChangeText={setMessage}
            editable={!chat.busy}
            maxLength={8000}
            onSubmitEditing={submit}
          />
          <Pressable style={styles.asstSendBtn} accessibilityLabel="Send message" disabled={chat.busy || !message.trim()} onPress={submit}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
        <Text variant="caption" style={styles.asstDisclaimer}>AI may be inaccurate — verify medical decisions with your provider.</Text>
      </View>
      </View>
    </Modal>
  );
}

function StatCard({ icon, title, value, subtitle, iconBg, iconColor, stacked }) {
  return (
    <View style={[styles.statCard, stacked && styles.statCardStacked]}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text variant="caption" style={styles.statTitle}>{title}</Text>
      <Text variant="title" style={styles.statValue}>{value}</Text>
      <Text variant="caption" style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );
}

function MedicalIdCardMobile({ medicalID, profileLoading, profileError }) {
  const stack = useStackedLayout();
  const showPlaceholder = profileLoading || !!profileError;
  const allergyList = Array.isArray(medicalID?.allergies)
    ? medicalID.allergies
    : typeof medicalID?.allergies === 'string'
      ? [medicalID.allergies]
      : [];

  const nameText = showPlaceholder ? '—' : medicalID?.fullName || 'Your name';
  const dobText = showPlaceholder
    ? '—'
    : medicalID?.dateOfBirth
      ? formatCareDate(medicalID.dateOfBirth)
      : 'Date of birth — add in profile';
  const initialsText = showPlaceholder ? '?' : medicalID?.initials || '?';
  const bloodText = showPlaceholder ? '—' : medicalID?.bloodType || '—';
  const allergiesText = showPlaceholder
    ? '—'
    : allergyList.length > 0
      ? allergyList.join(', ')
      : 'None on file';

  return (
    <View style={styles.medCard}>
      <Text variant="caption" style={styles.medCardLabel}>Medical ID Card</Text>
      <View style={styles.medAvatar}>
        <Text variant="page" style={styles.medAvatarText}>{initialsText}</Text>
      </View>
      <Text variant="section" style={styles.medName}>{nameText}</Text>
      <Text variant="secondary" style={styles.medMeta}>{dobText}</Text>
      {profileError && !profileLoading ? (
        <Text variant="caption" style={styles.medInlineError}>{profileError}</Text>
      ) : null}
      <View style={styles.medDivider} />
      <View style={[styles.medRow, stack && styles.medRowStacked]}>
        <Text variant="secondary" style={styles.medMuted}>Blood type</Text>
        <Text variant="secondary" style={[styles.medStrong, stack && styles.medStrongStacked]}>{bloodText}</Text>
      </View>
      <View style={[styles.medRow, stack && styles.medRowStacked]}>
        <Text variant="secondary" style={styles.medMuted}>Allergies</Text>
        <RevealText variant="secondary" style={[styles.medStrong, stack && styles.medStrongStacked]} numberOfLines={2}>{allergiesText}</RevealText>
      </View>
    </View>
  );
}

function DashboardScreen({ onNavigate, omitShellTitle = false, scrollFabProps = {} }) {
  const stack = useStackedLayout();
  const { medicalID, loading: profileLoading, error: profileError } = useProfile();
  const { stats, loading: statsLoading, error: statsError } = useVaultStats();
  // Total records count
  const totalRecords = stats?.totalRecords ?? 0;
  // Connected providers
  const connectedProviders = stats?.connectedProviders ?? 0;
  // Last synced (format the ISO date string)
  const lastSyncedLabel = stats?.lastSyncedAt
    ? new Date(stats.lastSyncedAt).toLocaleDateString()
    : 'Never';
  const healthSubtitle = statsError ? 'Unable to load records' : statsLoading
    ? 'Loading…'
    : totalRecords === 0
      ? 'No records yet'
      : `${connectedProviders} connected · Last sync ${lastSyncedLabel}`;

  return (
    <ScrollView
      style={styles.screenScroll}
      contentContainerStyle={styles.screenScrollContent}
      showsVerticalScrollIndicator={false}
      {...scrollFabProps}
    >
      {!omitShellTitle ? (
        <View style={styles.dashIntro}>
          <View style={[styles.dashTitleRow, stack && styles.dashTitleRowStacked]}>
            <Ionicons name="home" size={26} color={NAVY} />
            <Text variant="title" style={styles.dashTitle}>Dashboard</Text>
          </View>
          <Text variant="body" style={styles.dashWelcome}>{"Welcome back! Here's your health overview."}</Text>
        </View>
      ) : null}

      <View style={styles.bentoGrid}>
        <MedicalIdCardMobile
          medicalID={medicalID}
          profileLoading={profileLoading}
          profileError={profileError}
        />

        <View style={[styles.statGrid, stack && styles.statGridStacked]}>
          {statsLoading ? (
            [0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.statCard, stack && styles.statCardStacked, styles.statCardSkeleton]}>
                <View style={styles.statSkeletonIcon} />
                <View style={styles.statSkeletonLine} />
                <View style={styles.statSkeletonLineShort} />
                <View style={styles.statSkeletonLineTall} />
              </View>
            ))
          ) : (
            <>
              <StatCard
                stacked={stack}
                icon="document-text"
                title="Health Records"
                value={statsError ? '—' : String(stats?.totalRecords ?? 0)}
                subtitle={healthSubtitle}
                iconBg="#EEF2FF"
                iconColor="#4F46E5"
              />
              <StatCard
                stacked={stack}
                icon="pulse"
                title="Medical Forms"
                value="—"
                subtitle="View in Medical Forms"
                iconBg="#ECFDF5"
                iconColor="#059669"
              />
              <StatCard
                stacked={stack}
                icon="calendar"
                title="Appointments"
                value="—"
                subtitle="View in Care"
                iconBg="#FFFBEB"
                iconColor="#D97706"
              />
              <StatCard
                stacked={stack}
                icon="medkit"
                title="Medications"
                value="—"
                subtitle="View in Care"
                iconBg="#FFF1F2"
                iconColor="#E11D48"
              />
            </>
          )}
        </View>
        {statsError && !statsLoading ? (
          <Text variant="secondary" style={styles.dashStatsError}>{statsError}</Text>
        ) : null}

        <View style={styles.panelCard}>
          <View style={styles.panelHead}>
            <View style={styles.panelIconWrap}>
              <Ionicons name="sparkles" size={18} color="#4F46E5" />
            </View>
            <Text variant="section" style={styles.panelTitle}>Quick Actions</Text>
          </View>
          <Text variant="secondary" style={styles.panelSub}>Common tasks to manage your health data</Text>
          <Pressable style={styles.btnPrimary} accessibilityRole="button" onPress={() => onNavigate('medical')}>
            <Ionicons name="document-text" size={18} color="#fff" />
            <Text variant="body" style={styles.btnPrimaryText}>Open Medical Forms</Text>
          </Pressable>
          <Pressable style={styles.btnOutline} accessibilityRole="button" onPress={() => onNavigate('care')}>
            <View style={styles.btnOutlineLeft}>
              <Ionicons name="pulse" size={18} color={NAVY} />
              <Text variant="body" style={styles.btnOutlineText}>Open Care</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
          <Pressable style={styles.btnOutline} accessibilityRole="button" onPress={() => onNavigate('records')}>
            <View style={styles.btnOutlineLeft}>
              <Ionicons name="calendar" size={18} color={NAVY} />
              <Text variant="body" style={styles.btnOutlineText}>Open Records</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
        </View>

      </View>
    </ScrollView>
  );
}

function PlaceholderTab({ title, scrollFabProps = {} }) {
  return (
    <ScrollView
      style={styles.screenScroll}
      contentContainerStyle={styles.screenScrollContent}
      showsVerticalScrollIndicator={false}
      {...scrollFabProps}
    >
      <Text variant="caption" style={styles.nowViewing}>NOW VIEWING</Text>
      <Text variant="page" style={styles.dashboardHeading}>{title}</Text>
      <Text variant="body" style={styles.comingSoon}>Coming soon</Text>
    </ScrollView>
  );
}

function AppShell({ signOut, user }) {
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const assistantButtonRef = useRef(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [darkShell, setDarkShell] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: '', email: '', avatarUri: '' });

  useEffect(() => {
    if (!user) return;
    const userEmail = user.email || '';
    const userName =
      user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split('@')[0] || 'Account';
    setUserProfile((prev) => ({
      name: userName,
      email: userEmail,
      avatarUri: user.user_metadata?.avatar_url || prev.avatarUri || '',
    }));
  }, [user]);

  const omit = false;
  const fabScrollProps = {};
  let body = null;
  switch (activeRoute) {
    case 'dashboard':
      body = <DashboardScreen onNavigate={setActiveRoute} omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'care':
      body = <CareScreen darkMode={darkShell} omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'network':
      body = <NetworkScreen omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'records':
      body = <RecordsScreen darkMode={darkShell} omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'medical-profile':
      body = <MedicalProfileScreen omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'medical':
      body = <MedicalScreen darkMode={darkShell} omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'profile-settings':
      body = (
        <ProfileSettingsScreen
          omitShellTitle={omit}
          scrollFabProps={fabScrollProps}
          darkShell={darkShell}
          userProfile={userProfile}
          onUpdateUserProfile={(patch) => setUserProfile((u) => ({ ...u, ...patch }))}
          onClose={() => setActiveRoute('dashboard')}
          onSignOut={async () => {
            await signOut();
            setActiveRoute('dashboard');
          }}
        />
      );
      break;
    case 'vitals':
      body = <VitalsScreen darkMode={darkShell} omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'insurance':
      body = <InsuranceScreen darkMode={darkShell} omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    default:
      body = <PlaceholderTab title={titleForRoute(activeRoute)} scrollFabProps={fabScrollProps} />;
  }

  const topTitle = titleForRoute(activeRoute);

  return (
    <View style={styles.root}>
      <SteelSurfaceBackground dark={darkShell} />
      <View style={styles.shellForeground}>
      <View style={styles.flex} accessibilityElementsHidden={drawerOpen || assistantOpen}
        importantForAccessibility={drawerOpen || assistantOpen ? 'no-hide-descendants' : 'auto'}>
      <AppTopBar
        menuButtonRef={menuButtonRef}
        assistantButtonRef={assistantButtonRef}
        darkShell={darkShell}
        onMenuPress={() => setDrawerOpen(true)}
        onLogoPress={() => setActiveRoute('dashboard')}
        userProfile={userProfile}
        onAvatarPress={() => setActiveRoute('profile-settings')}
        onAssistantPress={() => setAssistantOpen(true)}
      />
      <View style={styles.body}>{body}</View>

      </View>
      <AppDrawer
        onDismiss={() => {
          const target = menuButtonRef.current && findNodeHandle(menuButtonRef.current);
          if (target != null) AccessibilityInfo.setAccessibilityFocus(target);
        }}
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeRoute={activeRoute}
        onSelectRoute={setActiveRoute}
        darkShell={darkShell}
        onToggleDarkShell={() => setDarkShell((d) => !d)}
        userProfile={userProfile}
        onFooterProfilePress={() => {
          setActiveRoute('profile-settings');
          setDrawerOpen(false);
        }}
        signOut={signOut}
      />

      <VaultAssistantSheet
        visible={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onDismiss={() => {
          const focusAssistant = () => {
            const target = assistantButtonRef.current && findNodeHandle(assistantButtonRef.current);
            if (target != null) AccessibilityInfo.setAccessibilityFocus(target);
          };
          focusAssistant();
          setTimeout(focusAssistant, 250);
        }}
        contextTitle={topTitle}
      />
      </View>
    </View>
  );
}

function AuthGate() {
  const { session, loading, signIn, signOut, recovery, recoveryError, requestRecovery, completeRecovery } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <SteelSurfaceBackground dark />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <ActivityIndicator size="large" color="white" />
          <Text variant="body" style={{ color: '#C7D2FE', marginTop: 12, ...typeStyles.body }}>Loading your vault...</Text>
        </View>
      </View>
    );
  }

  if (!session || recovery) {
    return <LoginScreen onLogin={signIn} onRecovery={requestRecovery} recovery={recovery} recoveryError={recoveryError} onSavePassword={completeRecovery} onCancelRecovery={signOut} />;
  }

  return <AppShell signOut={signOut} user={session.user} />;
}

function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AuthGate />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, position: 'relative', backgroundColor: 'transparent' },
  shellForeground: { flex: 1, zIndex: 1 },
  body: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarLogoHit: {
    width: control.minTarget,
    height: control.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarLogo: {
    width: 36,
    height: 36,
  },
  topBarSide: { flex: 1 },
  topBarSideEnd: { alignItems: 'flex-end' },
  hamburgerBtn: {
    width: control.minTarget,
    height: control.minTarget,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assistantBtn: {
    width: control.minTarget,
    height: control.minTarget,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarAvatarWrap: {
    width: control.minTarget,
    height: control.minTarget,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.strokeStrong,
  },
  topBarAvatarImg: { width: '100%', height: '100%' },
  topBarAvatarInitials: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  topBarAvatarInitialsText: { ...typeStyles.caption, fontWeight: '800', color: STEEL.navy },
  drawerModalRoot: { flex: 1, flexDirection: 'row' },
  drawerBackdrop: { flex: 1, backgroundColor: STEEL.overlay },
  drawerPanel: {
    borderTopLeftRadius: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  drawerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  drawerLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  drawerTitleBlock: { flex: 1, minWidth: 0 },
  drawerBrand: { ...typeStyles.section, fontWeight: '800' },
  drawerBrandSub: { ...typeStyles.caption, fontWeight: '600', marginTop: 2 },
  drawerCloseCircle: {
    width: control.minTarget,
    height: control.minTarget,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  drawerScroll: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  drawerRow: {
    minHeight: control.minTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  drawerRowStacked: { flexDirection: 'column', alignItems: 'stretch' },
  drawerRowLabelStacked: { width: '100%' },
  drawerRowActive: {
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  drawerRowLabel: { ...typeStyles.body, flex: 1 },
  drawerSectionLabel: {
    ...typeStyles.caption,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  drawerFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  drawerProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  drawerProfileCardStacked: { flexDirection: 'column', alignItems: 'stretch' },
  drawerProfilePhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: STEEL.surfaceMuted,
  },
  drawerProfileInitials: { alignItems: 'center', justifyContent: 'center' },
  drawerProfileInitialsText: { ...typeStyles.body, fontWeight: '800', color: STEEL.text },
  drawerProfileTextCol: { flex: 1, minWidth: 0 },
  drawerProfileTextColStacked: { width: '100%', minWidth: 0 },
  drawerProfileName: { ...typeStyles.body, fontWeight: '700' },
  drawerProfileEmail: { ...typeStyles.secondary, fontWeight: '500', marginTop: 3 },
  asstModalRoot: { flex: 1, justifyContent: 'flex-end' },
  asstBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  asstSheet: {
    backgroundColor: STEEL.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '88%',
  },
  asstHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: STEEL.strokeStrong,
    marginBottom: 12,
  },
  asstHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  asstIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: STEEL.assistantIcon,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  asstTitle: { ...typeStyles.section, fontWeight: '800', color: STEEL.text },
  asstContext: { ...typeStyles.secondary, color: STEEL.textSecondary, marginTop: 2 },
  asstCloseOutline: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STEEL.surface,
  },
  asstHero: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  asstHeroIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: STEEL.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  asstHeadline: {
    ...typeStyles.section,
    fontWeight: '800',
    color: STEEL.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  asstSub: {
    ...typeStyles.body,
    color: STEEL.textSecondary,
    textAlign: 'center',

    marginBottom: 16,
  },
  asstPromptPill: {
    borderWidth: 1,
    borderColor: STEEL.stroke,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: STEEL.surface,
  },
  asstPromptText: { ...typeStyles.body, fontWeight: '600', color: STEEL.text },
  asstInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: STEEL.stroke,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: STEEL.surfaceMuted,
    marginTop: 8,
  },
  asstInput: { flex: 1, ...typeStyles.body, color: STEEL.text, paddingVertical: 6 },
  asstSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: STEEL.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  asstDisclaimer: {
    ...typeStyles.caption,
    color: STEEL.textMuted,
    textAlign: 'center',
    marginTop: 10,

  },
  screenScroll: { flex: 1, backgroundColor: 'transparent' },
  screenScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  dashIntro: { marginBottom: 20 },
  dashTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  dashTitleRowStacked: { alignItems: 'flex-start' },
  dashTitle: { ...typeStyles.title, fontWeight: '700', color: NAVY },
  dashWelcome: { ...typeStyles.body, color: '#64748b', },
  bentoGrid: { gap: 16 },
  medCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  medCardLabel: {
    ...typeStyles.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#64748b',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  medAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  medAvatarText: { ...typeStyles.page, fontWeight: '700', color: '#64748b' },
  medName: {
    ...typeStyles.section,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
    marginBottom: 4,
  },
  medMeta: { ...typeStyles.secondary, color: '#94a3b8', textAlign: 'center', marginBottom: 16 },
  medDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0', marginBottom: 12 },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  medRowStacked: { flexDirection: 'column', alignItems: 'stretch' },
  medMuted: { ...typeStyles.secondary, color: '#64748b', flexShrink: 0 },
  medStrong: { ...typeStyles.secondary, flex: 1, minWidth: 0, fontWeight: '600', color: NAVY, textAlign: 'right' },
  medStrongStacked: { textAlign: 'left' },
  medInlineError: { ...typeStyles.caption, color: '#EF4444', marginTop: 6, },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statGridStacked: { flexDirection: 'column' },
  statCardStacked: { width: '100%', minWidth: '100%' },
  statCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
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
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statTitle: { ...typeStyles.caption, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  statValue: { ...typeStyles.title, fontWeight: '800', color: NAVY, marginBottom: 2 },
  statSubtitle: { ...typeStyles.caption, color: '#94a3b8' },
  statCardSkeleton: { minHeight: 118 },
  statSkeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  statSkeletonLine: {
    height: 10,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    width: '55%',
    marginBottom: 8,
  },
  statSkeletonLineShort: {
    height: 10,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    width: '40%',
    marginBottom: 12,
  },
  statSkeletonLineTall: { height: 22, borderRadius: 4, backgroundColor: '#E2E8F0', width: '38%' },
  dashStatsError: { color: '#EF4444', ...typeStyles.secondary, marginTop: 10, },
  panelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
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
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  panelIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: { ...typeStyles.section, fontWeight: '700', color: NAVY },
  panelSub: { ...typeStyles.secondary, color: '#64748b', marginBottom: 14 },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600', ...typeStyles.body },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 8,
  },
  btnOutlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnOutlineText: { ...typeStyles.body, fontWeight: '600', color: NAVY },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentTextCol: { flex: 1, minWidth: 0 },
  recentTitle: { ...typeStyles.body, fontWeight: '600', color: NAVY },
  recentSubtitle: { ...typeStyles.caption, color: '#64748b', marginTop: 2 },
  recentTime: { ...typeStyles.caption, color: '#94a3b8', marginLeft: 4 },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  viewAllText: { ...typeStyles.body, fontWeight: '600', color: '#2563eb' },
  nowViewing: {
    color: CORAL,
    ...typeStyles.caption,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dashboardHeading: {
    ...typeStyles.page,
    fontWeight: '800',
    color: NAVY,
  },
  comingSoon: {
    marginTop: 8,
    ...typeStyles.body,
    color: '#64748b',
  },
});

AppRegistry.registerComponent('main', () => App);

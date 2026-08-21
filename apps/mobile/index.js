import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from './src/hooks/useAuth';
import { useVaultStats } from './src/hooks/useVaultStats';
import { useProfile } from './src/hooks/useProfile';
import LoginScreen from './src/screens/LoginScreen';
import CareScreen from './src/screens/CareScreen';
import NetworkScreen from './src/screens/NetworkScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import MedicalScreen from './src/screens/MedicalScreen';
import MedicalProfileScreen from './src/screens/MedicalProfileScreen';
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
  { key: 'design-system', label: 'Design System', icon: 'color-palette-outline' },
  { key: 'marketing', label: 'Marketing Site', icon: 'globe-outline' },
  { key: 'dark-mode', label: 'Dark Mode', icon: 'moon-outline' },
];

const QUICK_PROMPTS = [
  'Summarize my latest lab results',
  "What's my next appointment?",
  'Log my blood pressure',
  'Explain my new prescription',
];

const FAB_SIZE = 56;
const FAB_GAP = 20;

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

function AppTopBar({ title, darkShell, onMenuPress, userProfile, onAvatarPress }) {
  const insets = useSafeAreaInsets();
  const bg = darkShell ? '#1E293B' : STEEL.surface;
  const fg = darkShell ? '#F8FAFC' : STEEL.text;
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
      <Pressable
        style={[styles.hamburgerBtn, { backgroundColor: darkShell ? '#334155' : STEEL.navy }]}
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        <Ionicons name="menu" size={22} color="#fff" />
      </Pressable>
      <Text style={[styles.topBarTitle, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
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
                <Text style={styles.topBarAvatarInitialsText}>
                  {shellUserInitials(userProfile)}
                </Text>
              </View>
            )}
      </Pressable>
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
}) {
  const insets = useSafeAreaInsets();
  const panelBg = darkShell ? '#0F172A' : STEEL.surfaceMuted;
  const text = darkShell ? '#F1F5F9' : STEEL.text;
  const muted = darkShell ? '#94A3B8' : STEEL.textSecondary;
  const activeCardBg = darkShell ? '#1E293B' : STEEL.surfaceRaised;
  const stroke = darkShell ? '#334155' : STEEL.stroke;

  const Row = ({ item }) => {
    const isActive = item.key === 'dark-mode' ? darkShell : activeRoute === item.key;
    return (
    <Pressable
      onPress={() => {
        if (item.key === 'dark-mode') {
          onToggleDarkShell();
          return;
        }
        if (item.key === 'design-system' || item.key === 'marketing' || item.key === 'medical-profile' || item.key === 'insurance' || item.key === 'vitals') {
          onSelectRoute(item.key);
          onClose();
          return;
        }
        onSelectRoute(item.key);
        onClose();
      }}
      style={[
        styles.drawerRow,
        isActive && [styles.drawerRowActive, { backgroundColor: activeCardBg, borderColor: stroke }],
      ]}
    >
      <Ionicons name={item.icon} size={22} color={isActive ? STEEL.accent : muted} />
      <Text style={[styles.drawerRowLabel, { color: text }, isActive && { fontWeight: '700', color: darkShell ? '#fff' : STEEL.text }]}>
        {item.label}
      </Text>
    </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.drawerModalRoot}>
        <View style={[styles.drawerPanel, { width: DRAWER_WIDTH, backgroundColor: panelBg, paddingTop: insets.top + 12 }]}>
          <View style={[styles.drawerHeader, { borderBottomColor: stroke }]}>
            <View style={styles.drawerHeaderLeft}>
              <Image
                source={darkShell ? require('./assets/hv_logo-dark.png') : require('./assets/hv_logo-light.png')}
                style={styles.drawerLogo}
                resizeMode="contain"
                accessibilityLabel="Health Vault"
              />
              <View style={styles.drawerTitleBlock}>
                <Text style={[styles.drawerBrand, { color: text }]}>Health Vault</Text>
                <Text style={[styles.drawerBrandSub, { color: muted }]}>AI Medical Assistant</Text>
              </View>
            </View>
            <Pressable style={[styles.drawerCloseCircle, { borderColor: stroke }]} onPress={onClose}>
              <Ionicons name="close" size={22} color={muted} />
            </Pressable>
          </View>

          <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
            {NAV_MAIN.map((item) => (
              <Row key={item.key} item={item} />
            ))}

            <Text style={[styles.drawerSectionLabel, { color: STEEL.accent }]}>ACCOUNT</Text>
            {NAV_ACCOUNT.map((item) => (
              <Row key={item.key} item={item} />
            ))}

            {signOut ? (
              <Pressable
                style={[styles.drawerRow, { marginTop: 8 }]}
                onPress={async () => {
                  await signOut();
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={[styles.drawerRowLabel, { color: '#EF4444', flex: 1 }]}>Sign Out</Text>
              </Pressable>
            ) : null}
          </ScrollView>

          <View style={[styles.drawerFooter, { paddingBottom: insets.bottom + 12, borderTopColor: stroke }]}>
            <Pressable
              onPress={onFooterProfilePress}
              accessibilityRole="button"
              accessibilityLabel="Open profile settings"
              style={[
                styles.drawerProfileCard,
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
                  <Text style={styles.drawerProfileInitialsText}>
                    {shellUserInitials(userProfile)}
                  </Text>
                </View>
              )}
              <View style={styles.drawerProfileTextCol}>
                <Text style={[styles.drawerProfileName, { color: text }]} numberOfLines={1}>
                  {userProfile?.name}
                </Text>
                <Text style={[styles.drawerProfileEmail, { color: muted }]} numberOfLines={1}>
                  {userProfile?.email}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={muted} />
            </Pressable>
          </View>
        </View>
        <Pressable style={styles.drawerBackdrop} onPress={onClose} accessibilityLabel="Close menu" />
      </View>
    </Modal>
  );
}

function VaultAssistantSheet({ visible, onClose, contextTitle }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.asstModalRoot}>
        <Pressable style={styles.asstBackdrop} onPress={onClose} />
        <View style={[styles.asstSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.asstHandle} />
        <View style={styles.asstHeaderRow}>
          <View style={styles.asstIconCircle}>
            <Ionicons name="sparkles" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.asstTitle}>Vault Assistant</Text>
            <Text style={styles.asstContext}>Context: {contextTitle}</Text>
          </View>
          <Pressable style={styles.asstCloseOutline} onPress={onClose} accessibilityLabel="Close assistant">
            <Ionicons name="close" size={22} color={STEEL.accent} />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View style={styles.asstHero}>
            <View style={styles.asstHeroIcon}>
              <Ionicons name="sparkles" size={28} color={STEEL.text} />
            </View>
            <Text style={styles.asstHeadline}>Ask anything about your health</Text>
            <Text style={styles.asstSub}>
              Get summaries, log entries, prep for appointments — all grounded in your vault.
            </Text>
          </View>

          {QUICK_PROMPTS.map((p) => (
            <Pressable key={p} style={styles.asstPromptPill}>
              <Text style={styles.asstPromptText}>{p}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.asstInputRow}>
          <Ionicons name="mic-outline" size={22} color={STEEL.textSecondary} />
          <TextInput
            style={styles.asstInput}
            placeholder="Message Vault Assistant…"
            placeholderTextColor={STEEL.textMuted}
            value={message}
            onChangeText={setMessage}
          />
          <Pressable style={styles.asstSendBtn}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.asstDisclaimer}>AI may be inaccurate — verify medical decisions with your provider.</Text>
      </View>
      </View>
    </Modal>
  );
}

function StatCard({ icon, title, value, subtitle, iconBg, iconColor }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );
}

function RecentRow({ icon, title, subtitle, time, iconBg, iconColor }) {
  return (
    <View style={styles.recentRow}>
      <View style={[styles.recentIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.recentTextCol}>
        <Text style={styles.recentTitle}>{title}</Text>
        <Text style={styles.recentSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.recentTime}>{time}</Text>
    </View>
  );
}

function MedicalIdCardMobile({ medicalID, profileLoading, profileError }) {
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
      ? new Date(medicalID.dateOfBirth).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
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
      <Text style={styles.medCardLabel}>Medical ID Card</Text>
      <View style={styles.medAvatar}>
        <Text style={styles.medAvatarText}>{initialsText}</Text>
      </View>
      <Text style={styles.medName}>{nameText}</Text>
      <Text style={styles.medMeta}>{dobText}</Text>
      {profileError && !profileLoading ? (
        <Text style={styles.medInlineError}>{profileError}</Text>
      ) : null}
      <View style={styles.medDivider} />
      <View style={styles.medRow}>
        <Text style={styles.medMuted}>Blood type</Text>
        <Text style={styles.medStrong}>{bloodText}</Text>
      </View>
      <View style={styles.medRow}>
        <Text style={styles.medMuted}>Allergies</Text>
        <Text style={styles.medStrong}>{allergiesText}</Text>
      </View>
    </View>
  );
}

function DashboardScreen({ omitShellTitle = false, scrollFabProps = {} }) {
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
  const healthSubtitle = statsLoading
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
          <View style={styles.dashTitleRow}>
            <Ionicons name="home" size={26} color={NAVY} />
            <Text style={styles.dashTitle}>Dashboard</Text>
          </View>
          <Text style={styles.dashWelcome}>{"Welcome back! Here's your health overview."}</Text>
        </View>
      ) : null}

      <View style={styles.bentoGrid}>
        <MedicalIdCardMobile
          medicalID={medicalID}
          profileLoading={profileLoading}
          profileError={profileError}
        />

        <View style={styles.statGrid}>
          {statsLoading ? (
            [0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.statCard, styles.statCardSkeleton]}>
                <View style={styles.statSkeletonIcon} />
                <View style={styles.statSkeletonLine} />
                <View style={styles.statSkeletonLineShort} />
                <View style={styles.statSkeletonLineTall} />
              </View>
            ))
          ) : (
            <>
              <StatCard
                icon="document-text"
                title="Health Records"
                value={String(stats?.totalRecords ?? 0)}
                subtitle={healthSubtitle}
                iconBg="#EEF2FF"
                iconColor="#4F46E5"
              />
              <StatCard
                icon="pulse"
                title="Medical Forms"
                value="—"
                subtitle="View in Medical Forms"
                iconBg="#ECFDF5"
                iconColor="#059669"
              />
              <StatCard
                icon="calendar"
                title="Appointments"
                value="0"
                subtitle="None scheduled"
                iconBg="#FFFBEB"
                iconColor="#D97706"
              />
              <StatCard
                icon="medkit"
                title="Medications"
                value="0"
                subtitle="None on file"
                iconBg="#FFF1F2"
                iconColor="#E11D48"
              />
            </>
          )}
        </View>
        {statsError && !statsLoading ? (
          <Text style={styles.dashStatsError}>{statsError}</Text>
        ) : null}

        <View style={styles.panelCard}>
          <View style={styles.panelHead}>
            <View style={styles.panelIconWrap}>
              <Ionicons name="sparkles" size={18} color="#4F46E5" />
            </View>
            <Text style={styles.panelTitle}>Quick Actions</Text>
          </View>
          <Text style={styles.panelSub}>Common tasks to manage your health data</Text>
          <Pressable style={styles.btnPrimary}>
            <Ionicons name="document-text" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>Download Medical Forms</Text>
          </Pressable>
          <Pressable style={styles.btnOutline}>
            <View style={styles.btnOutlineLeft}>
              <Ionicons name="pulse" size={18} color={NAVY} />
              <Text style={styles.btnOutlineText}>View Care History</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
          <Pressable style={styles.btnOutline}>
            <View style={styles.btnOutlineLeft}>
              <Ionicons name="calendar" size={18} color={NAVY} />
              <Text style={styles.btnOutlineText}>Schedule Appointment</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
        </View>

        <View style={styles.panelCard}>
          <View style={styles.panelHead}>
            <View style={styles.panelIconWrap}>
              <Ionicons name="pulse" size={18} color="#4F46E5" />
            </View>
            <Text style={styles.panelTitle}>Recent Activity</Text>
          </View>
          <Text style={styles.panelSub}>Your latest health updates</Text>
          <RecentRow
            icon="heart"
            title="Annual Physical Examination"
            subtitle="Completed with Dr. Sarah Johnson"
            time="2 days ago"
            iconBg="#FFF1F2"
            iconColor="#E11D48"
          />
          <RecentRow
            icon="pulse"
            title="Lab Results Updated"
            subtitle="Complete Blood Count (CBC) - Normal"
            time="5 days ago"
            iconBg="#ECFDF5"
            iconColor="#059669"
          />
          <RecentRow
            icon="medkit"
            title="Prescription Refilled"
            subtitle="Albuterol Inhaler - 3 refills remaining"
            time="1 week ago"
            iconBg="#EEF2FF"
            iconColor="#4F46E5"
          />
          <Pressable style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>View All Activity</Text>
            <Ionicons name="arrow-forward" size={16} color="#2563eb" />
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
      <Text style={styles.nowViewing}>NOW VIEWING</Text>
      <Text style={styles.dashboardHeading}>{title}</Text>
      <Text style={styles.comingSoon}>Coming soon</Text>
    </ScrollView>
  );
}

function AppShell({ signOut, user }) {
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [darkShell, setDarkShell] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: '', email: '', avatarUri: '' });
  const insets = useSafeAreaInsets();
  const fabBottom = insets.bottom + FAB_GAP;

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

  const fabOpacity = useRef(new Animated.Value(1)).current;
  const fabRevealTimer = useRef(null);

  const fabScrollProps = useMemo(
    () => ({
      onScrollBeginDrag: () => {
        if (fabRevealTimer.current) clearTimeout(fabRevealTimer.current);
        Animated.timing(fabOpacity, {
          toValue: 0.12,
          duration: 180,
          useNativeDriver: true,
        }).start();
      },
      onScrollEndDrag: () => {
        if (fabRevealTimer.current) clearTimeout(fabRevealTimer.current);
        fabRevealTimer.current = setTimeout(() => {
          Animated.timing(fabOpacity, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }).start();
        }, 220);
      },
      onMomentumScrollEnd: () => {
        if (fabRevealTimer.current) clearTimeout(fabRevealTimer.current);
        Animated.timing(fabOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }).start();
      },
      scrollEventThrottle: 32,
    }),
    [fabOpacity]
  );

  useEffect(() => {
    if (fabRevealTimer.current) clearTimeout(fabRevealTimer.current);
    fabOpacity.setValue(1);
  }, [activeRoute, fabOpacity]);

  const omit = true;
  let body = null;
  switch (activeRoute) {
    case 'dashboard':
      body = <DashboardScreen omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'care':
      body = <CareScreen omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'network':
      body = <NetworkScreen omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'records':
      body = <RecordsScreen omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'medical-profile':
      body = <MedicalProfileScreen omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    case 'medical':
      body = <MedicalScreen omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
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
    case 'insurance':
      body = <InsuranceScreen omitShellTitle={omit} scrollFabProps={fabScrollProps} />;
      break;
    default:
      body = <PlaceholderTab title={titleForRoute(activeRoute)} scrollFabProps={fabScrollProps} />;
  }

  const topTitle = titleForRoute(activeRoute);

  return (
    <View style={styles.root}>
      <SteelSurfaceBackground dark={darkShell} />
      <View style={styles.shellForeground}>
      <AppTopBar
        title={topTitle}
        darkShell={darkShell}
        onMenuPress={() => setDrawerOpen(true)}
        userProfile={userProfile}
        onAvatarPress={() => setActiveRoute('profile-settings')}
      />
      <View style={styles.body}>{body}</View>

      {activeRoute !== 'profile-settings' ? (
      <Animated.View
        style={[styles.fab, { bottom: fabBottom, opacity: fabOpacity }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.fabInner}
          onPress={() => setAssistantOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open Vault Assistant"
        >
          <Ionicons name="sparkles" size={26} color="#fff" />
        </Pressable>
      </Animated.View>
      ) : null}

      <AppDrawer
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
        contextTitle={topTitle}
      />
      </View>
    </View>
  );
}

function AuthGate() {
  const { session, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <SteelSurfaceBackground dark />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <ActivityIndicator size="large" color="white" />
          <Text style={{ color: '#C7D2FE', marginTop: 12, fontSize: 14 }}>Loading your vault...</Text>
        </View>
      </View>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={signIn} />;
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
  hamburgerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  topBarAvatarWrap: {
    width: 40,
    height: 40,
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
  topBarAvatarInitialsText: { fontSize: 12, fontWeight: '800', color: STEEL.navy },
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
  drawerBrand: { fontSize: 18, fontWeight: '800' },
  drawerBrandSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  drawerCloseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  drawerScroll: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  drawerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
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
  drawerRowLabel: { fontSize: 15, flex: 1 },
  drawerSectionLabel: {
    fontSize: 11,
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
  drawerProfilePhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: STEEL.surfaceMuted,
  },
  drawerProfileInitials: { alignItems: 'center', justifyContent: 'center' },
  drawerProfileInitialsText: { fontSize: 16, fontWeight: '800', color: STEEL.text },
  drawerProfileTextCol: { flex: 1, minWidth: 0 },
  drawerProfileName: { fontSize: 15, fontWeight: '700' },
  drawerProfileEmail: { fontSize: 13, fontWeight: '500', marginTop: 3 },
  fab: {
    position: 'absolute',
    right: FAB_GAP,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: STEEL.fabBg,
    zIndex: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 10 },
    }),
  },
  fabInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: FAB_SIZE / 2,
  },
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
  asstTitle: { fontSize: 18, fontWeight: '800', color: STEEL.text },
  asstContext: { fontSize: 13, color: STEEL.textSecondary, marginTop: 2 },
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
    fontSize: 19,
    fontWeight: '800',
    color: STEEL.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  asstSub: {
    fontSize: 14,
    color: STEEL.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
  asstPromptText: { fontSize: 14, fontWeight: '600', color: STEEL.text },
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
  asstInput: { flex: 1, fontSize: 15, color: STEEL.text, paddingVertical: 6 },
  asstSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: STEEL.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  asstDisclaimer: {
    fontSize: 11,
    color: STEEL.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  screenScroll: { flex: 1, backgroundColor: 'transparent' },
  screenScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  dashIntro: { marginBottom: 20 },
  dashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dashTitle: { fontSize: 24, fontWeight: '700', color: NAVY },
  dashWelcome: { fontSize: 15, color: '#64748b', lineHeight: 22 },
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
    fontSize: 11,
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
  medAvatarText: { fontSize: 32, fontWeight: '700', color: '#64748b' },
  medName: {
    fontSize: 20,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
    marginBottom: 4,
  },
  medMeta: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 16 },
  medDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0', marginBottom: 12 },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  medMuted: { fontSize: 13, color: '#64748b' },
  medStrong: { fontSize: 13, fontWeight: '600', color: NAVY },
  medInlineError: { fontSize: 12, color: '#EF4444', marginTop: 6, lineHeight: 16 },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
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
  statTitle: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: NAVY, marginBottom: 2 },
  statSubtitle: { fontSize: 12, color: '#94a3b8' },
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
  dashStatsError: { color: '#EF4444', fontSize: 13, marginTop: 10, lineHeight: 18 },
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
  panelTitle: { fontSize: 17, fontWeight: '700', color: NAVY },
  panelSub: { fontSize: 13, color: '#64748b', marginBottom: 14 },
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
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
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
  btnOutlineText: { fontSize: 14, fontWeight: '600', color: NAVY },
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
  recentTitle: { fontSize: 14, fontWeight: '600', color: NAVY },
  recentSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  recentTime: { fontSize: 11, color: '#94a3b8', marginLeft: 4 },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  nowViewing: {
    color: CORAL,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dashboardHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: NAVY,
  },
  comingSoon: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748b',
  },
});

AppRegistry.registerComponent('main', () => App);

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProviders } from '../hooks/useProviders';

const STEEL = {
  canvas: 'transparent',
  surface: '#FFFFFF',
  border: '#D1D5E0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#4F46E5',
  accentBg: '#EEF2FF',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
};

// Avatar background colors cycling by initials
const AVATAR_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];
function avatarColor(name) {
  const i = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}
function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/* MOCK_FALLBACK: mockCareTeam + mockDirectory — replaced by useProviders(). */

const specialtyFilters = [
  'All',
  'Primary Care',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'OB/GYN',
];

const mockPreferredPharmacy = {
  name: 'Lakeside Pharmacy',
  chain: 'Lakeside',
  address: '789 Lake Dr, Springfield, IL 62703',
  phone: '(555) 555-1234',
  network: 'in',
  services: ['Pickup', 'Delivery'],
};

const mockOtherPharmacies = [
  {
    id: 'p1',
    name: 'Target Pharmacy',
    chain: 'Target',
    phone: '(555) 456-7890',
    address: '321 Pine Rd',
    network: 'out',
  },
  {
    id: 'p2',
    name: 'Walgreens',
    chain: 'Walgreens',
    phone: '(555) 234-5678',
    address: '456 Oak Ave',
    network: 'out',
  },
  {
    id: 'p3',
    name: 'CVS Pharmacy',
    chain: 'CVS',
    phone: '(555) 123-4567',
    address: '1234 Main Street, Springfield, IL 60010',
    service: 'Pickup',
    network: 'out',
  },
];

function NetworkBadge({ type }) {
  if (type === 'in') {
    return (
      <View style={[styles.badge, { backgroundColor: STEEL.successBg }]}>
        <Ionicons name="checkmark-circle-outline" size={11} color={STEEL.success} />
        <Text style={[styles.badgeText, { color: STEEL.success }]}>In-Network</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: STEEL.dangerBg }]}>
      <Ionicons name="close-circle-outline" size={11} color={STEEL.danger} />
      <Text style={[styles.badgeText, { color: STEEL.danger }]}>Out-of-Network</Text>
    </View>
  );
}

function RoleBadge({ role }) {
  const color = role === 'Primary' ? STEEL.accent : '#8B5CF6';
  return (
    <View style={[styles.roleBadge, { backgroundColor: color }]}>
      <Text style={styles.roleBadgeText}>{role}</Text>
    </View>
  );
}

function ProviderCard({ provider, showSave }) {
  const bg = avatarColor(provider.name);
  const ini = initials(provider.name);
  return (
    <View style={styles.card}>
      <View style={styles.providerCardTop}>
        {showSave ? (
          <View style={[styles.avatar, { backgroundColor: bg }]}>
            <Text style={styles.avatarText}>{ini}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1, marginLeft: showSave ? 10 : 0 }}>
          <View style={styles.providerNameRow}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <NetworkBadge type={provider.network} />
          </View>
          {provider.role && !showSave ? <RoleBadge role={provider.role} /> : null}
          <Text style={styles.providerSpecialty}>{provider.specialty}</Text>
          {provider.clinic ? (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={13} color={STEEL.textMuted} />
              <Text style={styles.infoText}>{provider.clinic}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={13} color={STEEL.textMuted} />
            <Text style={styles.infoText}>{provider.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={13} color={STEEL.textMuted} />
            <Text style={styles.infoText}>{provider.phone}</Text>
          </View>
          {provider.languages ? (
            <View style={styles.infoRow}>
              <Ionicons name="language-outline" size={13} color={STEEL.textMuted} />
              <Text style={styles.infoText}>{provider.languages}</Text>
            </View>
          ) : null}
          {provider.lastVisit ? (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={13} color={STEEL.textMuted} />
              <Text style={styles.infoText}>Last visit: {provider.lastVisit}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {showSave ? (
        <View style={styles.cardFooter}>
          <View style={styles.acceptingRow}>
            {provider.accepting ? (
              <Text style={[styles.acceptingText, { color: STEEL.success }]}>Accepting patients</Text>
            ) : (
              <Text style={styles.notAcceptingText}>Not accepting</Text>
            )}
            <Text style={styles.distanceText}>{provider.distance || '—'}</Text>
          </View>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85}>
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.saveBtnText}>Save to My Network</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.removeBtn} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={14} color={STEEL.danger} />
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PharmacyCard({ pharmacy, isPreferred }) {
  return (
    <View style={[styles.card, isPreferred && styles.preferredCard]}>
      {isPreferred ? (
        <View style={styles.preferredHeader}>
          <Ionicons name="star" size={16} color={STEEL.warning} />
          <Text style={styles.preferredTitle}>Your Preferred Pharmacy</Text>
        </View>
      ) : null}
      <View style={styles.providerNameRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.providerName}>{pharmacy.name}</Text>
          <Text style={styles.providerSpecialty}>{pharmacy.chain}</Text>
        </View>
        <NetworkBadge type={pharmacy.network} />
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={13} color={STEEL.textMuted} />
        <Text style={styles.infoText}>{pharmacy.phone}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={13} color={STEEL.textMuted} />
        <Text style={styles.infoText}>{pharmacy.address}</Text>
      </View>
      {pharmacy.service ? (
        <View style={styles.infoRow}>
          <Ionicons name="cube-outline" size={13} color={STEEL.textMuted} />
          <Text style={styles.infoText}>{pharmacy.service}</Text>
        </View>
      ) : null}
      {pharmacy.services ? (
        <View style={styles.servicesRow}>
          {pharmacy.services.map((s) => (
            <View key={s} style={styles.servicePill}>
              <Text style={styles.servicePillText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {!isPreferred ? (
        <View style={styles.pharmacyFooter}>
          <TouchableOpacity style={styles.setPreferredBtn} activeOpacity={0.85}>
            <Ionicons name="star-outline" size={13} color={STEEL.textSecondary} />
            <Text style={styles.setPreferredText}>Set Preferred</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeBtnInline} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={14} color={STEEL.danger} />
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default function NetworkScreen({ omitShellTitle = false, scrollFabProps = {} }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('providers');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const { careTeam, directory, loading, error, refetch } = useProviders();

  const filteredDirectory = useMemo(() => {
    return directory.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        activeFilter === 'All' ||
        p.specialty.toLowerCase().includes(activeFilter.toLowerCase().replace(' care', ''));
      return matchesSearch && matchesFilter;
    });
  }, [directory, searchQuery, activeFilter]);

  const teamAll = careTeam.all ?? [];
  const showTeamSkeleton = loading && teamAll.length === 0;
  const showTeamEmpty = !loading && teamAll.length === 0;

  return (
    <View style={styles.container}>
      {!omitShellTitle ? (
        <View style={styles.pageHeader}>
          <Text style={styles.nowViewing}>NOW VIEWING</Text>
          <Text style={styles.pageTitle}>Network</Text>
        </View>
      ) : null}

      <View style={styles.mainTabs}>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'providers' && styles.mainTabActive]}
          onPress={() => setActiveTab('providers')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="pulse-outline"
            size={14}
            color={activeTab === 'providers' ? STEEL.accent : STEEL.textSecondary}
          />
          <Text style={[styles.mainTabText, activeTab === 'providers' && styles.mainTabTextActive]}>
            Providers & Specialists
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'pharmacies' && styles.mainTabActive]}
          onPress={() => setActiveTab('pharmacies')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="medkit-outline"
            size={14}
            color={activeTab === 'pharmacies' ? STEEL.accent : STEEL.textSecondary}
          />
          <Text style={[styles.mainTabText, activeTab === 'pharmacies' && styles.mainTabTextActive]}>
            Pharmacies
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#4F46E5" />
        }
        {...scrollFabProps}
      >
        {activeTab === 'providers' ? (
          <>
            {error ? <Text style={styles.inlineError}>{error}</Text> : null}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="people-outline" size={18} color={STEEL.accent} />
                <Text style={styles.sectionTitle}>Your Care Team</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{careTeam.all?.length ?? 0}</Text>
                </View>
              </View>
            </View>

            {showTeamSkeleton ? (
              <>
                <View style={styles.teamSkeletonCard} />
                <View style={styles.teamSkeletonCard} />
              </>
            ) : showTeamEmpty ? (
              <View style={[styles.card, styles.emptyState]}>
                <Ionicons name="people-outline" size={28} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No providers connected yet</Text>
                <Text style={styles.emptySubtitle}>Connect a provider to see your care team here</Text>
              </View>
            ) : (
              <>
                {careTeam.primaryCare?.length ? (
                  <>
                    <Text style={styles.groupLabel}>PRIMARY CARE</Text>
                    {careTeam.primaryCare.map((p) => (
                      <ProviderCard key={p.id} provider={p} showSave={false} />
                    ))}
                  </>
                ) : null}
                {careTeam.specialists?.length ? (
                  <>
                    <Text style={styles.groupLabel}>SPECIALISTS</Text>
                    {careTeam.specialists.map((p) => (
                      <ProviderCard key={p.id} provider={p} showSave={false} />
                    ))}
                  </>
                ) : null}
              </>
            )}

            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="pulse-outline" size={18} color={STEEL.success} />
                <Text style={styles.sectionTitle}>Aetna In-Network Directory</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Showing providers matched to your connected Aetna plan</Text>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={16} color={STEEL.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, specialty, or clinic..."
                placeholderTextColor={STEEL.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              nestedScrollEnabled
            >
              {specialtyFilters.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>
                    {f}
                    {f === 'All' ? ` ${directory.length}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.resultsCount}>{filteredDirectory.length} providers found</Text>

            {filteredDirectory.map((p) => (
              <ProviderCard key={p.id} provider={p} showSave={true} />
            ))}
          </>
        ) : (
          <>
            <Text style={styles.groupLabel}>YOUR ADDRESSES</Text>
            <Text style={styles.groupSubLabel}>Used to find nearby pharmacies</Text>
            <View style={[styles.card, styles.dashedCard]}>
              <Ionicons name="location-outline" size={28} color={STEEL.textMuted} />
              <Text style={styles.emptyTitle}>Add your first address</Text>
              <Text style={styles.emptySubtitle}>
                Home, second home, or work — used to find pharmacies near you
              </Text>
            </View>

            <PharmacyCard pharmacy={mockPreferredPharmacy} isPreferred />

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="location-outline" size={18} color={STEEL.danger} />
                <Text style={styles.sectionTitle}>Nearby Pharmacies</Text>
              </View>
            </View>
            <View style={[styles.card, styles.emptyState]}>
              <Ionicons name="location-outline" size={28} color={STEEL.textMuted} />
              <Text style={styles.emptyTitle}>Add an address to see nearby pharmacies</Text>
              <Text style={styles.emptySubtitle}>
                Use the address section above, or add a pharmacy manually.
              </Text>
              <View style={styles.emptyActions}>
                <TouchableOpacity style={styles.addAddressBtn} activeOpacity={0.85}>
                  <Ionicons name="add" size={14} color="#fff" />
                  <Text style={styles.addAddressBtnText}>Add Address</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85}>
                  <Text style={styles.addPharmacyLink}>+ Add Pharmacy</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.groupLabel}>OTHER SAVED PHARMACIES</Text>
            {mockOtherPharmacies.map((p) => (
              <PharmacyCard key={p.id} pharmacy={p} isPreferred={false} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: STEEL.canvas },
  pageHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  nowViewing: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E53935',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  pageTitle: { fontSize: 32, fontWeight: '800', color: STEEL.textPrimary },
  mainTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: STEEL.border,
    paddingHorizontal: 16,
  },
  mainTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mainTabActive: { borderBottomColor: STEEL.accent },
  mainTabText: { fontSize: 14, fontWeight: '500', color: STEEL.textSecondary },
  mainTabTextActive: { color: STEEL.accent, fontWeight: '600' },
  scroll: { flex: 1 },
  sectionHeader: { marginTop: 16, marginBottom: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: STEEL.textPrimary },
  sectionSubtitle: { fontSize: 13, color: STEEL.textSecondary, marginTop: 2 },
  countBadge: {
    backgroundColor: STEEL.accentBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: { fontSize: 12, fontWeight: '600', color: STEEL.accent },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: STEEL.textMuted,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
  },
  groupSubLabel: { fontSize: 13, color: STEEL.textSecondary, marginBottom: 8 },
  card: {
    backgroundColor: STEEL.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  preferredCard: { borderWidth: 1.5, borderColor: '#86EFAC' },
  dashedCard: {
    borderWidth: 1.5,
    borderColor: STEEL.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
  },
  providerCardTop: { flexDirection: 'row' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 8,
  },
  providerName: { fontSize: 15, fontWeight: '700', color: STEEL.textPrimary, flex: 1 },
  providerSpecialty: { fontSize: 13, color: STEEL.textSecondary, marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  infoText: { fontSize: 13, color: STEEL.textSecondary, flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  roleBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: STEEL.border,
  },
  acceptingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  acceptingText: { fontSize: 13, fontWeight: '500' },
  notAcceptingText: { fontSize: 13, color: STEEL.textSecondary },
  distanceText: { fontSize: 13, color: STEEL.textMuted },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEEL.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: STEEL.border,
    width: '100%',
    justifyContent: 'flex-end',
  },
  removeBtnInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removeBtnText: { color: STEEL.danger, fontSize: 13, fontWeight: '500' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: STEEL.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: STEEL.textPrimary },
  filterRow: { marginBottom: 10, flexGrow: 0 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STEEL.border,
  },
  filterPillActive: { backgroundColor: STEEL.accent, borderColor: STEEL.accent },
  filterPillText: { fontSize: 13, fontWeight: '500', color: STEEL.textSecondary },
  filterPillTextActive: { color: '#FFFFFF' },
  resultsCount: { fontSize: 13, color: STEEL.textSecondary, marginBottom: 8 },
  teamSkeletonCard: {
    height: 120,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  inlineError: { fontSize: 13, color: '#EF4444', marginBottom: 10, lineHeight: 18 },
  preferredHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  preferredTitle: { fontSize: 15, fontWeight: '700', color: STEEL.textPrimary },
  servicesRow: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  servicePill: {
    backgroundColor: STEEL.successBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  servicePillText: { fontSize: 12, fontWeight: '500', color: STEEL.success },
  pharmacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: STEEL.border,
  },
  setPreferredBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  setPreferredText: { fontSize: 13, color: STEEL.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: STEEL.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: STEEL.textSecondary, textAlign: 'center', lineHeight: 18 },
  emptyActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: STEEL.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addAddressBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  addPharmacyLink: { fontSize: 14, color: STEEL.textSecondary, fontWeight: '500' },
});

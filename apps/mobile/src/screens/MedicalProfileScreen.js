import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const STEEL = {
  canvas: 'transparent',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#4F46E5',
  blueBg: '#EFF6FF',
  blueIcon: '#2563EB',
  emeraldBg: '#ECFDF5',
  emeraldIcon: '#059669',
  amberBg: '#FFFBEB',
  amberIcon: '#D97706',
  roseBg: '#FFF1F2',
  roseIcon: '#E11D48',
};

const INTRO =
  'Your medical profile gives you and your healthcare providers a complete picture of your current health. Keep your conditions, medications, allergies, and immunizations organized in one secure place — always up to date and ready to share.';

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatCard({ label, count, sublabel, icon, iconBg, iconColor }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      </View>
      <Text style={styles.statCount}>{count}</Text>
      {sublabel ? <Text style={styles.statSub}>{sublabel}</Text> : null}
    </View>
  );
}

function SectionHeader({ title, description }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDesc}>{description}</Text>
    </View>
  );
}

function EmptyState({ icon, title, body }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name={icon} size={44} color={STEEL.textMuted} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function MedicalIdCardMobile({ profile, loading }) {
  const [showMore, setShowMore] = useState(false);

  const displayName =
    profile.firstName || profile.lastName
      ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      : null;
  const initials = displayName
    ? `${(profile.firstName || '?')[0]}${(profile.lastName || '?')[0]}`.toUpperCase()
    : '?';

  const dobText = profile.dateOfBirth
    ? formatDate(profile.dateOfBirth)
    : '—';

  const allergiesText =
    profile.allergies.length > 0
      ? `${profile.allergies.slice(0, 3).join(', ')}${
          profile.allergies.length > 3 ? ` +${profile.allergies.length - 3}` : ''
        }`
      : 'None on file';

  const conditionsText =
    profile.conditions.length > 0
      ? `${profile.conditions.slice(0, 2).join(', ')}${
          profile.conditions.length > 2 ? ` +${profile.conditions.length - 2}` : ''
        }`
      : 'None on file';

  const organText =
    profile.organDonor === null || profile.organDonor === undefined
      ? 'Not specified'
      : profile.organDonor
        ? 'Yes'
        : 'No';

  return (
    <View style={styles.idCard}>
      <Text style={styles.idCardKicker}>Medical ID Card</Text>

      {loading ? (
        <ActivityIndicator style={styles.idSpinner} color={STEEL.accent} />
      ) : profile.profilePhoto ? (
        <Image source={{ uri: profile.profilePhoto }} style={styles.idAvatarImg} accessibilityLabel={displayName || 'Profile'} />
      ) : (
        <View style={styles.idAvatarPlaceholder}>
          <Text style={styles.idAvatarLetters}>{initials}</Text>
        </View>
      )}

      <Text style={styles.idName}>{loading ? '…' : displayName || 'Your Name'}</Text>

      <View style={styles.idRow}>
        <Text style={styles.idRowLabel}>Date of Birth</Text>
        <Text style={styles.idRowValue}>{loading ? '…' : dobText}</Text>
      </View>
      <View style={styles.idDivider} />
      <View style={styles.idRow}>
        <Text style={styles.idRowLabel}>Allergies</Text>
        <Text style={[styles.idRowValue, styles.idRowValueShrink]} numberOfLines={2}>
          {loading ? '…' : allergiesText}
        </Text>
      </View>
      <View style={styles.idDivider} />
      <View style={styles.idRow}>
        <Text style={styles.idRowLabel}>Medical Conditions</Text>
        <Text style={[styles.idRowValue, styles.idRowValueShrink]} numberOfLines={2}>
          {loading ? '…' : conditionsText}
        </Text>
      </View>
      <View style={styles.idDivider} />
      <View style={styles.idRow}>
        <Text style={styles.idRowLabel}>Organ Donor</Text>
        <Text style={styles.idRowValue}>{loading ? '…' : organText}</Text>
      </View>

      {showMore ? (
        <View style={styles.idMoreBlock}>
          <View style={styles.idDividerStrong} />
          <View style={styles.idRow}>
            <Text style={styles.idRowLabel}>Blood Type</Text>
            <Text style={styles.idRowValue}>{loading ? '…' : profile.bloodType || 'Unknown'}</Text>
          </View>
          <View style={styles.idDivider} />
          <View style={styles.idRow}>
            <Text style={styles.idRowLabel}>Emergency Contact</Text>
            <Text style={[styles.idRowValue, styles.idRowValueShrink]} numberOfLines={3}>
              {loading
                ? '…'
                : profile.emergencyContactName
                  ? `${profile.emergencyContactName}${
                      profile.emergencyContactPhone ? ` · ${profile.emergencyContactPhone}` : ''
                    }`
                  : 'Not on file'}
            </Text>
          </View>
        </View>
      ) : null}

      <Pressable onPress={() => setShowMore((s) => !s)} style={styles.idToggle} accessibilityRole="button">
        <Ionicons name={showMore ? 'chevron-up' : 'chevron-down'} size={18} color={STEEL.accent} />
        <Text style={styles.idToggleText}>Show {showMore ? 'Less' : 'More'}</Text>
      </Pressable>
    </View>
  );
}

function statusBadgeStyle(status) {
  if (status === 'Active') return { bg: '#D1FAE5', text: '#047857' };
  if (status === 'In remission') return { bg: '#DBEAFE', text: '#1D4ED8' };
  return { bg: '#F1F5F9', text: STEEL.textSecondary };
}

function severityBadgeStyle(sev) {
  if (sev === 'Severe') return { bg: '#FEE2E2', text: '#B91C1C' };
  if (sev === 'Moderate') return { bg: '#FEF3C7', text: '#B45309' };
  return { bg: '#FEF9C3', text: '#A16207' };
}

export default function MedicalProfileScreen({ omitShellTitle = false, scrollFabProps = {} }) {
  const [conditions, setConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [immunizations, setImmunizations] = useState([]);
  const [idProfile, setIdProfile] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    profilePhoto: null,
    bloodType: null,
    organDonor: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    allergies: [],
    conditions: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setConditions([]);
        setMedications([]);
        setAllergies([]);
        setImmunizations([]);
        setIdProfile({
          firstName: '',
          lastName: '',
          dateOfBirth: null,
          profilePhoto: null,
          bloodType: null,
          organDonor: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
          allergies: [],
          conditions: [],
        });
        setLoading(false);
        return;
      }

      const [conditionsRes, medicationsRes, allergiesRes, immunizationsRes, userProfileRes, patientProfileRes] =
        await Promise.all([
          supabase.from('conditions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('medications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('allergies').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('immunizations').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('user_profiles').select('first_name, last_name, date_of_birth, profile_photo_url').eq('user_id', userId).maybeSingle(),
          supabase.from('patient_profiles').select('blood_type, organ_donor, emergency_contact_name, emergency_contact_phone').eq('user_id', userId).maybeSingle(),
        ]);

      if (conditionsRes.error) throw conditionsRes.error;
      if (medicationsRes.error) throw medicationsRes.error;
      if (allergiesRes.error) throw allergiesRes.error;
      if (immunizationsRes.error) throw immunizationsRes.error;

      const condData = conditionsRes.data || [];
      const medData = medicationsRes.data || [];
      const allergyData = allergiesRes.data || [];
      const immData = immunizationsRes.data || [];

      setConditions(condData);
      setMedications(medData);
      setAllergies(allergyData);
      setImmunizations(immData);

      const up = userProfileRes.error ? null : userProfileRes.data;
      const pp = patientProfileRes.error ? null : patientProfileRes.data;
      setIdProfile({
        firstName: up?.first_name || '',
        lastName: up?.last_name || '',
        dateOfBirth: up?.date_of_birth || null,
        profilePhoto: up?.profile_photo_url || null,
        bloodType: pp?.blood_type || null,
        organDonor: pp?.organ_donor ?? null,
        emergencyContactName: pp?.emergency_contact_name || null,
        emergencyContactPhone: pp?.emergency_contact_phone || null,
        allergies: allergyData.map((a) => a.allergen).filter(Boolean),
        conditions: condData.map((c) => c.name).filter(Boolean),
      });
    } catch (e) {
      console.error('Medical profile load error', e);
      setLoadError('Could not load your medical profile. Pull to refresh or try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const activeConditions = conditions.filter((c) => c.status === 'Active' || !c.status);
  const severeAllergies = allergies.filter((a) => a.severity === 'Severe');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      {...scrollFabProps}
    >
      {!omitShellTitle ? (
        <View style={styles.hero}>
          <View style={styles.heroTitleRow}>
            <Ionicons name="person" size={26} color={STEEL.textPrimary} />
            <Text style={styles.heroTitle}>Medical Profile</Text>
          </View>
          <Text style={styles.heroIntro}>{INTRO}</Text>
        </View>
      ) : null}

      {loadError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={20} color="#B45309" />
          <Text style={styles.errorBannerText}>{loadError}</Text>
        </View>
      ) : null}

      <MedicalIdCardMobile profile={idProfile} loading={loading} />

      <View style={styles.statGrid}>
        <StatCard
          label="Conditions"
          count={conditions.length}
          sublabel={`${activeConditions.length} active`}
          icon="medkit-outline"
          iconBg={STEEL.blueBg}
          iconColor={STEEL.blueIcon}
        />
        <StatCard
          label="Medications"
          count={medications.length}
          sublabel={`${medications.length} active`}
          icon="bandage-outline"
          iconBg={STEEL.emeraldBg}
          iconColor={STEEL.emeraldIcon}
        />
        <StatCard
          label="Allergies"
          count={allergies.length}
          sublabel={`${severeAllergies.length} severe`}
          icon="warning-outline"
          iconBg={STEEL.amberBg}
          iconColor={STEEL.amberIcon}
        />
        <StatCard
          label="Immunizations"
          count={immunizations.length}
          sublabel="Up to date"
          icon="shield-checkmark-outline"
          iconBg={STEEL.roseBg}
          iconColor={STEEL.roseIcon}
        />
      </View>

      <SectionHeader
        title="Current Health"
        description="A summary of your active health conditions and ongoing issues. Add, update, or attach physician notes as your health changes."
      />
      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={STEEL.accent} />
          <Text style={styles.loadingText}>Loading conditions…</Text>
        </View>
      ) : conditions.length === 0 ? (
        <EmptyState
          icon="medkit-outline"
          title="No conditions added"
          body="Use the Vault Assistant to add known diagnoses and ongoing issues."
        />
      ) : (
        conditions.map((condition) => {
          const st = statusBadgeStyle(condition.status);
          return (
            <View key={condition.id} style={styles.listCard}>
              <View style={styles.listCardHead}>
                <View style={[styles.listIcon, { backgroundColor: STEEL.blueBg }]}>
                  <Ionicons name="medkit-outline" size={20} color={STEEL.blueIcon} />
                </View>
                <View style={styles.listCardTitleCol}>
                  <Text style={styles.listCardTitle}>{condition.name}</Text>
                  {condition.status ? (
                    <View style={[styles.badge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.badgeText, { color: st.text }]}>{condition.status}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {condition.diagnosed_on || condition.managing_physician ? (
                <View style={styles.listMeta}>
                  {condition.diagnosed_on ? (
                    <Text style={styles.listMetaLine}>
                      <Text style={styles.listMetaStrong}>Diagnosed: </Text>
                      {formatDate(condition.diagnosed_on)}
                    </Text>
                  ) : null}
                  {condition.managing_physician ? (
                    <Text style={styles.listMetaLine}>
                      <Text style={styles.listMetaStrong}>Managing Physician: </Text>
                      {condition.managing_physician}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {condition.notes ? <Text style={styles.listNotes}>{condition.notes}</Text> : null}
            </View>
          );
        })
      )}

      <SectionHeader
        title="Medications"
        description="Track your prescriptions and supplements in one place. Stay on top of refills, dosages, and physician instructions."
      />
      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={STEEL.accent} />
        </View>
      ) : medications.length === 0 ? (
        <EmptyState
          icon="bandage-outline"
          title="No medications tracked"
          body="Use the Vault Assistant to add prescriptions and supplements."
        />
      ) : (
        medications.map((med) => (
          <View key={med.id} style={styles.listCard}>
            <View style={styles.listCardHead}>
              <View style={[styles.listIcon, { backgroundColor: STEEL.emeraldBg }]}>
                <Ionicons name="bandage-outline" size={20} color={STEEL.emeraldIcon} />
              </View>
              <View style={styles.listCardTitleCol}>
                <Text style={styles.listCardTitle}>{med.name}</Text>
                {med.dosage ? <Text style={styles.listCardSub}>{med.dosage}</Text> : null}
              </View>
            </View>
            {med.frequency || med.prescribed_by || med.start_date ? (
              <View style={styles.listMeta}>
                {med.frequency ? (
                  <Text style={styles.listMetaLine}>
                    <Text style={styles.listMetaStrong}>Frequency: </Text>
                    {med.frequency}
                  </Text>
                ) : null}
                {med.prescribed_by ? (
                  <Text style={styles.listMetaLine}>
                    <Text style={styles.listMetaStrong}>Prescribed By: </Text>
                    {med.prescribed_by}
                  </Text>
                ) : null}
                {med.start_date ? (
                  <Text style={styles.listMetaLine}>
                    <Text style={styles.listMetaStrong}>Started: </Text>
                    {formatDate(med.start_date)}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {med.notes ? <Text style={styles.listNotes}>{med.notes}</Text> : null}
          </View>
        ))
      )}

      <SectionHeader
        title="Allergies"
        description="List any allergies and their reactions to help avoid unwanted exposure and ensure safe treatment plans."
      />
      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={STEEL.accent} />
        </View>
      ) : allergies.length === 0 ? (
        <EmptyState
          icon="warning-outline"
          title="No allergies listed"
          body="Use the Vault Assistant to record allergens and reactions."
        />
      ) : (
        allergies.map((allergy) => {
          const sev = severityBadgeStyle(allergy.severity);
          return (
            <View key={allergy.id} style={styles.listCard}>
              <View style={styles.listCardHead}>
                <View style={[styles.listIcon, { backgroundColor: STEEL.amberBg }]}>
                  <Ionicons name="warning-outline" size={20} color={STEEL.amberIcon} />
                </View>
                <View style={styles.listCardTitleCol}>
                  <Text style={styles.listCardTitle}>{allergy.allergen}</Text>
                  {allergy.severity ? (
                    <View style={[styles.badge, { backgroundColor: sev.bg }]}>
                      <Text style={[styles.badgeText, { color: sev.text }]}>{allergy.severity}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {allergy.reaction || allergy.diagnosed_on ? (
                <View style={styles.listMeta}>
                  {allergy.reaction ? (
                    <Text style={styles.listMetaLine}>
                      <Text style={styles.listMetaStrong}>Reaction: </Text>
                      {allergy.reaction}
                    </Text>
                  ) : null}
                  {allergy.diagnosed_on ? (
                    <Text style={styles.listMetaLine}>
                      <Text style={styles.listMetaStrong}>Diagnosed: </Text>
                      {formatDate(allergy.diagnosed_on)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {allergy.notes ? <Text style={styles.listNotes}>{allergy.notes}</Text> : null}
            </View>
          );
        })
      )}

      <SectionHeader
        title="Immunizations"
        description="Record your vaccines and boosters for quick verification and reminders when something's due."
      />
      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={STEEL.accent} />
        </View>
      ) : immunizations.length === 0 ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title="No immunizations recorded"
          body="Use the Vault Assistant to log vaccines and boosters."
        />
      ) : (
        immunizations.map((imm) => (
          <View key={imm.id} style={styles.listCard}>
            <View style={styles.listCardHead}>
              <View style={[styles.listIcon, { backgroundColor: STEEL.roseBg }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={STEEL.roseIcon} />
              </View>
              <View style={styles.listCardTitleCol}>
                <Text style={styles.listCardTitle}>{imm.vaccine}</Text>
              </View>
            </View>
            {imm.administered_on || imm.provider || imm.lot_number || imm.next_dose ? (
              <View style={styles.listMeta}>
                {imm.administered_on ? (
                  <Text style={styles.listMetaLine}>
                    <Text style={styles.listMetaStrong}>Administered: </Text>
                    {formatDate(imm.administered_on)}
                  </Text>
                ) : null}
                {imm.provider ? (
                  <Text style={styles.listMetaLine}>
                    <Text style={styles.listMetaStrong}>Provider: </Text>
                    {imm.provider}
                  </Text>
                ) : null}
                {imm.lot_number ? (
                  <Text style={styles.listMetaLine}>
                    <Text style={styles.listMetaStrong}>Lot Number: </Text>
                    {imm.lot_number}
                  </Text>
                ) : null}
                {imm.next_dose ? (
                  <Text style={styles.listMetaLine}>
                    <Text style={styles.listMetaStrong}>Next Dose: </Text>
                    {formatDate(imm.next_dose)}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {imm.notes ? <Text style={styles.listNotes}>{imm.notes}</Text> : null}
          </View>
        ))
      )}

      <SectionHeader
        title="Preventive Care"
        description="Stay proactive with your health. Add screenings, checkups, or care reminders recommended by your provider or the Health Vault assistant."
      />
      <EmptyState
        icon="calendar-outline"
        title="No preventive care items"
        body="Use the Vault Assistant to add screenings and checkups."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 20, paddingTop: 8 },
  hero: { marginBottom: 20 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: STEEL.textPrimary },
  heroIntro: { fontSize: 15, lineHeight: 22, color: STEEL.textSecondary },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  errorBannerText: { flex: 1, fontSize: 14, color: '#92400E', lineHeight: 20 },
  idCard: {
    backgroundColor: STEEL.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: STEEL.border,
  },
  idCardKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: STEEL.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  idSpinner: { marginVertical: 16 },
  idAvatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    marginBottom: 12,
  },
  idAvatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: STEEL.border,
  },
  idAvatarLetters: { fontSize: 32, fontWeight: '800', color: STEEL.textSecondary },
  idName: {
    fontSize: 20,
    fontWeight: '800',
    color: STEEL.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6 },
  idRowLabel: { fontSize: 14, color: STEEL.textSecondary, flexShrink: 0, marginRight: 12 },
  idRowValue: { fontSize: 14, fontWeight: '600', color: STEEL.textPrimary, textAlign: 'right', flex: 1 },
  idRowValueShrink: { flexShrink: 1 },
  idDivider: { height: StyleSheet.hairlineWidth, backgroundColor: STEEL.border, marginVertical: 4 },
  idDividerStrong: { height: StyleSheet.hairlineWidth, backgroundColor: '#CBD5E1', marginVertical: 12 },
  idMoreBlock: { marginTop: 4 },
  idToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
  },
  idToggleText: { fontSize: 14, fontWeight: '600', color: STEEL.accent },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  statCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: STEEL.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: STEEL.border,
    marginBottom: 4,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  statLabel: { fontSize: 13, fontWeight: '600', color: STEEL.textSecondary },
  statIconWrap: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statCount: { fontSize: 28, fontWeight: '800', color: STEEL.textPrimary },
  statSub: { fontSize: 13, color: STEEL.textSecondary, marginTop: 2 },
  sectionHeader: { marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: STEEL.textPrimary, marginBottom: 6 },
  sectionDesc: { fontSize: 14, lineHeight: 20, color: STEEL.textSecondary },
  loadingCard: {
    backgroundColor: STEEL.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: STEEL.border,
    marginBottom: 12,
  },
  loadingText: { marginTop: 10, fontSize: 14, color: STEEL.textSecondary },
  emptyCard: {
    backgroundColor: STEEL.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: STEEL.border,
    marginBottom: 12,
  },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: STEEL.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 14, lineHeight: 20, color: STEEL.textSecondary, textAlign: 'center' },
  listCard: {
    backgroundColor: STEEL.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: STEEL.border,
    marginBottom: 12,
  },
  listCardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  listIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  listCardTitleCol: { flex: 1, minWidth: 0 },
  listCardTitle: { fontSize: 17, fontWeight: '700', color: STEEL.textPrimary },
  listCardSub: { fontSize: 14, color: STEEL.textSecondary, marginTop: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginTop: 6 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  listMeta: { marginTop: 12, gap: 6 },
  listMetaLine: { fontSize: 14, color: STEEL.textSecondary, lineHeight: 20 },
  listMetaStrong: { fontWeight: '700', color: STEEL.textPrimary },
  listNotes: { marginTop: 10, fontSize: 14, lineHeight: 20, color: STEEL.textSecondary },
});

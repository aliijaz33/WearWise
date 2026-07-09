/**
 * ProfileScreen - user profile, wardrobe stats, editable preferences, and logout.
 *
 * Lets the user edit their display name, default occasion, and style
 * preferences. Shows a breakdown of their wardrobe by category and a
 * summary of saved outfits by occasion.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, Header, Button, Input, Chip } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import { useWardrobe } from '@context/WardrobeContext';
import { useSavedOutfits } from '@context/SavedOutfitsContext';
import { useToast } from '@components/ui';
import { CATEGORIES, OCCASIONS, STYLE_PREFERENCES } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList>;

export function ProfileScreen({ navigation }: Props) {
  const { profile, user, signOut, updateProfile } = useAuth();
  const { items } = useWardrobe();
  const { outfits } = useSavedOutfits();
  const { show: showToast } = useToast();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [defaultOccasion, setDefaultOccasion] = useState<string | null>(
    profile?.preferences?.default_occasion ?? null,
  );
  const [stylePrefs, setStylePrefs] = useState<string[]>(
    profile?.preferences?.style_preferences ?? [],
  );
  const [saving, setSaving] = useState(false);

  const initials = useMemo(() => {
    const name = profile?.full_name?.trim();
    if (!name) return 'U';
    return name
      .split(' ')
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, [profile?.full_name]);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return '';
    return new Date(profile.created_at).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [profile?.created_at]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((c) => (counts[c.id] = 0));
    items.forEach((i) => {
      counts[i.category] = (counts[i.category] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  const occasionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    outfits.forEach((o) => {
      counts[o.occasion] = (counts[o.occasion] ?? 0) + 1;
    });
    return counts;
  }, [outfits]);

  const toggleStyle = useCallback((s: string) => {
    setStylePrefs((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const ok = await updateProfile({
      full_name: fullName.trim() || null,
      preferences: {
        style_preferences: stylePrefs,
        default_occasion: defaultOccasion,
      },
    });
    setSaving(false);
    if (ok) {
      setEditing(false);
      showToast('Profile updated', 'success');
    } else {
      showToast('Could not update profile. Please try again.', 'error');
    }
  }, [fullName, stylePrefs, defaultOccasion, updateProfile, showToast]);

  const handleCancel = useCallback(() => {
    setFullName(profile?.full_name ?? '');
    setDefaultOccasion(profile?.preferences?.default_occasion ?? null);
    setStylePrefs(profile?.preferences?.style_preferences ?? []);
    setEditing(false);
  }, [profile]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }, [signOut]);

  return (
    <Screen scroll>
      <Header title='Profile' />

      {/* Profile header card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {profile?.full_name || 'WearWise User'}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {profile?.email || user?.email || ''}
          </Text>
          {memberSince ? (
            <Text style={styles.memberSince}>Member since {memberSince}</Text>
          ) : null}
        </View>
        {!editing && (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name='create-outline'
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Edit form */}
      {editing && (
        <View style={styles.editCard}>
          <Input
            label='Display Name'
            value={fullName}
            onChangeText={setFullName}
            placeholder='Your name'
            autoCapitalize='words'
          />

          <Text style={styles.fieldLabel}>Default Occasion</Text>
          <Text style={styles.fieldHint}>
            Used for quick outfit generation on the Home screen.
          </Text>
          <View style={styles.chipRow}>
            <Chip
              label='None'
              selected={defaultOccasion === null}
              onPress={() => setDefaultOccasion(null)}
              color={theme.colors.textSecondary}
              size='sm'
            />
            {OCCASIONS.map((o) => (
              <Chip
                key={o}
                label={o}
                selected={defaultOccasion === o}
                onPress={() =>
                  setDefaultOccasion((prev) => (prev === o ? null : o))
                }
                color={theme.colors.primary}
                size='sm'
              />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Style Preferences</Text>
          <Text style={styles.fieldHint}>
            Influences how outfits are scored and ranked.
          </Text>
          <View style={styles.chipRow}>
            {STYLE_PREFERENCES.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={stylePrefs.includes(s)}
                onPress={() => toggleStyle(s)}
                color={theme.colors.accent}
                size='sm'
              />
            ))}
          </View>

          <View style={styles.editActions}>
            <Button
              title='Cancel'
              onPress={handleCancel}
              variant='ghost'
              style={styles.cancelBtn}
            />
            <Button
              title='Save'
              onPress={handleSave}
              loading={saving}
              style={styles.saveBtn}
            />
          </View>
        </View>
      )}

      {/* Wardrobe stats */}
      <Text style={styles.sectionTitle}>Wardrobe Breakdown</Text>
      <View style={styles.statsCard}>
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] ?? 0;
          const max = Math.max(
            ...CATEGORIES.map((c) => categoryCounts[c.id] ?? 0),
            1,
          );
          const pct = (count / max) * 100;
          return (
            <View key={cat.id} style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: cat.color }]} />
              <Text style={styles.statLabel}>{cat.label}</Text>
              <View style={styles.statBarBg}>
                <View
                  style={[
                    styles.statBarFill,
                    { width: `${pct}%`, backgroundColor: cat.color },
                  ]}
                />
              </View>
              <Text style={styles.statCount}>{count}</Text>
            </View>
          );
        })}
      </View>

      {/* Saved outfits summary */}
      <Text style={styles.sectionTitle}>Saved Outfits by Occasion</Text>
      <View style={styles.statsCard}>
        {outfits.length === 0 ? (
          <Text style={styles.emptyStatsText}>
            No saved outfits yet. Generate and save looks in the Creator.
          </Text>
        ) : (
          OCCASIONS.filter((o) => (occasionCounts[o] ?? 0) > 0).map((o) => (
            <View key={o} style={styles.occasionRow}>
              <Text style={styles.occasionLabel}>{o}</Text>
              <Text style={styles.occasionCount}>{occasionCounts[o]}</Text>
            </View>
          ))
        )}
      </View>

      {/* Sign out */}
      <Button
        title='Sign Out'
        onPress={handleSignOut}
        variant='outline'
        icon={
          <Ionicons
            name='log-out-outline'
            size={18}
            color={theme.colors.error}
            style={{ marginRight: 8 }}
          />
        }
        textStyle={{ color: theme.colors.error }}
        style={styles.signOutBtn}
      />

      <Text style={styles.versionText}>WearWise v1.0.0</Text>
    </Screen>
  );
}

// ---- Styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  avatarText: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textInverse,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  profileEmail: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  memberSince: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  editCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fieldLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  fieldHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  saveBtn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.sm,
  },
  statLabel: {
    width: 90,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
  },
  statBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 4,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statCount: {
    width: 28,
    textAlign: 'right',
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  occasionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  occasionLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  occasionCount: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  emptyStatsText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  signOutBtn: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    borderColor: theme.colors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xxxl,
  },
});

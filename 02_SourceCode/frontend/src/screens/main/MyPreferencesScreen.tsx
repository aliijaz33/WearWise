/**
 * MyPreferencesScreen - user default occasion preference.
 *
 * Separate from the Outfit Creator: this is the user's *standing* default
 * occasion preference persisted to profile.preferences and used as the
 * default when generating outfits.
 *
 * Root uses SafeAreaView (react-native-safe-area-context) with edges={['top']}
 * so the status-bar inset is handled natively and content never clips behind
 * a fixed header.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Loading } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@components/ui';
import { OCCASIONS } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPreferences'>;

export function MyPreferencesScreen({ navigation }: Props) {
  const { profile, updateProfile } = useAuth();
  const { show: showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const existingOccasion = useMemo(
    () => profile?.preferences?.default_occasion ?? null,
    [profile?.preferences],
  );

  const [defaultOccasion, setDefaultOccasion] = useState<string | null>(
    existingOccasion,
  );

  const selectOccasion = useCallback((o: string) => {
    setDefaultOccasion((prev) => (prev === o ? null : o));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const ok = await updateProfile({
      preferences: {
        style_preferences: profile?.preferences?.style_preferences ?? [],
        default_occasion: defaultOccasion,
      },
    });
    setSaving(false);
    showToast(
      ok ? 'Preferences saved' : 'Could not save preferences',
      ok ? 'info' : 'error',
    );
    if (ok) navigation.goBack();
  }, [
    defaultOccasion,
    profile?.preferences?.style_preferences,
    updateProfile,
    showToast,
    navigation,
  ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ---- Inline header (back button + centered title) ---- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name='chevron-back' size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Preferences</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Saving indicator sits just below the header while a save is in flight. */}
      {saving && <Loading label='Saving…' />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Default occasion */}
        <Text style={styles.sectionTitle}>Default Occasion</Text>
        <Text style={styles.sectionDesc}>
          The Outfit Creator will pre-select this occasion for you.
        </Text>
        <View style={styles.chipRow}>
          {OCCASIONS.map((o) => {
            const selected = defaultOccasion === o;
            return (
              <TouchableOpacity
                key={o}
                onPress={() => selectOccasion(o)}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  selected
                    ? {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      }
                    : {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: selected
                        ? theme.colors.textInverse
                        : theme.colors.text,
                    },
                  ]}
                >
                  {o}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Button
            title='Save Preferences'
            onPress={handleSave}
            loading={saving}
            fullWidth
            icon={
              !saving ? (
                <Ionicons
                  name='checkmark-circle'
                  size={20}
                  color={theme.colors.textInverse}
                  style={styles.btnIcon}
                />
              ) : undefined
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: { flex: 1 },
  // ---- Inline header ----
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl + 40,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.relaxed(theme.typography.sizes.sm),
    marginBottom: theme.spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.chip,
    borderWidth: 1,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  chipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  footer: {
    marginTop: theme.spacing.xxl,
  },
  btnIcon: { marginRight: theme.spacing.sm },
});

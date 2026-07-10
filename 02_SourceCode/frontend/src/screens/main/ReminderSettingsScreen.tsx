/**
 * ReminderSettingsScreen - notification preferences with Switch toggles.
 *
 * The master toggle maps to profile.notification_enabled. Additional reminder
 * toggles (daily outfit, weekly wardrobe review) are stored locally for now
 * and can be promoted to the profile schema when push notifications are wired.
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
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReminderSettings'>;

interface ReminderRow {
  key: string;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

const REMINDERS: ReminderRow[] = [
  {
    key: 'master',
    title: 'Push Notifications',
    desc: 'Enable all WearWise notifications on this device.',
    icon: 'notifications-outline',
    iconColor: theme.colors.primary,
    iconBg: theme.colors.primarySoft,
  },
  {
    key: 'daily',
    title: 'Daily Outfit Reminder',
    desc: 'Get a suggested outfit every morning based on the weather.',
    icon: 'sunny-outline',
    iconColor: theme.colors.warning,
    iconBg: '#FFF4E5',
  },
  {
    key: 'weekly',
    title: 'Weekly Wardrobe Review',
    desc: 'A weekly summary of your wardrobe and saved outfits.',
    icon: 'calendar-outline',
    iconColor: theme.colors.info,
    iconBg: '#E8F2FF',
  },
  {
    key: 'unused',
    title: 'Unused Items Alert',
    desc: 'Remind me about wardrobe items I haven\u2019t worn in a while.',
    icon: 'alert-circle-outline',
    iconColor: theme.colors.accent,
    iconBg: theme.colors.accentSoft,
  },
];

export function ReminderSettingsScreen({ navigation }: Props) {
  const { profile } = useAuth();

  const masterEnabled = useMemo(
    () => profile?.notification_enabled ?? true,
    [profile?.notification_enabled],
  );

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    master: masterEnabled,
    daily: masterEnabled,
    weekly: false,
    unused: false,
  });

  // Toggles are visual-only for now (no backend action is triggered).
  // The switches update local state so the UI reflects the user's choice,
  // but nothing is persisted until push notifications are wired up.
  const toggle = useCallback((key: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
    // When turning master off, disable sub-toggles visually.
    if (key === 'master' && !value) {
      setToggles((prev) => ({
        ...prev,
        daily: false,
        weekly: false,
        unused: false,
      }));
    }
  }, []);

  const handleSave = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ---- Inline header (back button + centered title) ---- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name='chevron-back' size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminder Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Choose which reminders you'd like to receive. You can change these
          anytime.
        </Text>

        {REMINDERS.map((row, idx) => {
          const isMaster = row.key === 'master';
          const masterOff = !toggles.master;
          const disabled = !isMaster && masterOff;
          return (
            <View key={row.key}>
              <View
                style={[
                  styles.row,
                  disabled && styles.rowDisabled,
                  idx === REMINDERS.length - 1 && styles.rowLast,
                ]}
              >
                <View style={[styles.rowIcon, { backgroundColor: row.iconBg }]}>
                  <Ionicons name={row.icon} size={20} color={row.iconColor} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{row.title}</Text>
                  <Text style={styles.rowDesc}>{row.desc}</Text>
                </View>
                <Switch
                  value={toggles[row.key]}
                  onValueChange={(v) => toggle(row.key, v)}
                  disabled={disabled}
                  trackColor={{
                    false: theme.colors.divider,
                    true: theme.colors.primary,
                  }}
                  thumbColor={theme.colors.surface}
                  ios_backgroundColor={theme.colors.divider}
                />
              </View>
              {idx < REMINDERS.length - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </View>
          );
        })}

        <View style={styles.footer}>
          <Button
            title='Done'
            onPress={handleSave}
            fullWidth
            icon={
              <Ionicons
                name='checkmark'
                size={20}
                color={theme.colors.textInverse}
                style={styles.btnIcon}
              />
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
    marginBottom: theme.spacing.sm,
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
  intro: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.relaxed(theme.typography.sizes.sm),
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rowBody: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  rowTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.normal(theme.typography.sizes.xs),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.divider,
  },
  footer: {
    marginTop: theme.spacing.xxl,
  },
  btnIcon: { marginRight: theme.spacing.sm },
});

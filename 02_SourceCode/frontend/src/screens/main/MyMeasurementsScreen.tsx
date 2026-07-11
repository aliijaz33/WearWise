// MyMeasurementsScreen - body measurements form persisted to profile.measurements.

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Input, Button, Loading } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@components/ui';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';
import type { Measurements } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MyMeasurements'>;

interface FieldDef {
  key: keyof Measurements;
  label: string;
  placeholder: string;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FIELDS: FieldDef[] = [
  {
    key: 'height',
    label: 'Height',
    placeholder: 'e.g. 170',
    unit: 'cm',
    icon: 'resize-outline',
  },
  {
    key: 'chest',
    label: 'Chest',
    placeholder: 'e.g. 90',
    unit: 'cm',
    icon: 'ellipse-outline',
  },
  {
    key: 'waist',
    label: 'Waist',
    placeholder: 'e.g. 75',
    unit: 'cm',
    icon: 'remove-circle-outline',
  },
  {
    key: 'hips',
    label: 'Hips',
    placeholder: 'e.g. 95',
    unit: 'cm',
    icon: 'radio-button-off-outline',
  },
  {
    key: 'shoe_size',
    label: 'Shoe Size',
    placeholder: 'e.g. 42',
    unit: 'EU',
    icon: 'footsteps-outline',
  },
];

export function MyMeasurementsScreen({ navigation }: Props) {
  const { profile, updateProfile } = useAuth();
  const { show: showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const initial = useMemo<Measurements>(
    () =>
      profile?.measurements ?? {
        height: null,
        chest: null,
        waist: null,
        hips: null,
        shoe_size: null,
      },
    [profile?.measurements],
  );

  const [values, setValues] = useState<Record<keyof Measurements, string>>({
    height: initial.height ?? '',
    chest: initial.chest ?? '',
    waist: initial.waist ?? '',
    hips: initial.hips ?? '',
    shoe_size: initial.shoe_size ?? '',
  });

  const setValue = useCallback((key: keyof Measurements, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const measurements: Measurements = {
      height: values.height.trim() || null,
      chest: values.chest.trim() || null,
      waist: values.waist.trim() || null,
      hips: values.hips.trim() || null,
      shoe_size: values.shoe_size.trim() || null,
    };
    const ok = await updateProfile({ measurements });
    setSaving(false);
    showToast(
      ok ? 'Measurements saved' : 'Could not save measurements',
      ok ? 'info' : 'error',
    );
    if (ok) navigation.goBack();
  }, [values, updateProfile, showToast, navigation]);

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
        <Text style={styles.headerTitle}>My Measurements</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Saving indicator sits just below the header while a save is in flight. */}
      {saving && <Loading label='Saving…' />}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
        >
          <Text style={styles.intro}>
            Help the outfit generator pick the best-fitting looks. These are
            optional but improve recommendations.
          </Text>

          {FIELDS.map((f) => (
            <View key={f.key} style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <Ionicons
                  name={f.icon}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.fieldBody}>
                <Input
                  label={`${f.label} (${f.unit})`}
                  placeholder={f.placeholder}
                  value={values[f.key]}
                  onChangeText={(t) => setValue(f.key, t)}
                  keyboardType='numeric'
                  returnKeyType='next'
                />
              </View>
            </View>
          ))}

          <View style={styles.footer}>
            <Button
              title='Save Measurements'
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: { flex: 1 },
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
  intro: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.relaxed(theme.typography.sizes.sm),
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIcon: {
    width: 40,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  fieldBody: { flex: 1 },
  footer: {
    marginTop: theme.spacing.xl,
  },
  btnIcon: { marginRight: theme.spacing.sm },
});

// CreatorScreen - Outfit Creator.

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, Header, Button, EmptyState, useToast } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import { useWardrobe } from '@context/WardrobeContext';
import { generateOutfit } from '@services/outfitGenerator';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList>;

// The 15 occasion cards shown in the choose-occasion grid.
interface OccasionOption {
  label: string;
  value: string;
  icon: string;
  // Branded icon color (used when the card is NOT selected).
  color: string;
}

const CREATOR_OCCASIONS: OccasionOption[] = [
  { label: 'Party', value: 'Party', icon: 'party-popper', color: '#FF9900' },
  { label: 'Casual', value: 'Casual', icon: 'hanger', color: '#5D38F5' },
  { label: 'Work', value: 'Work', icon: 'briefcase-outline', color: '#A0826D' },
  { label: 'Date', value: 'Date Night', icon: 'heart', color: '#FF3B30' },
  { label: 'Wedding', value: 'Wedding', icon: 'ring', color: '#C77DFF' },
  { label: 'College', value: 'College', icon: 'school', color: '#6A0DAD' },
  {
    label: 'Festival',
    value: 'Festival',
    icon: 'diamond-stone',
    color: '#00B5AD',
  },
  { label: 'Vacation', value: 'Vacation', icon: 'palm-tree', color: '#FFB300' },
  {
    label: 'Interview',
    value: 'Interview',
    icon: 'account-tie',
    color: '#546E7A',
  },
  { label: 'Gym', value: 'Workout', icon: 'dumbbell', color: '#FF5C5C' },
  { label: 'Brunch', value: 'Brunch', icon: 'coffee', color: '#4A90D9' },
  { label: 'Travel', value: 'Travel', icon: 'airplane', color: '#4FC3F7' },
  { label: 'Formal', value: 'Formal', icon: 'tie', color: '#1A237E' },
  {
    label: 'Night Out',
    value: 'Night Out',
    icon: 'weather-night',
    color: '#4B0082',
  },
  {
    label: 'Others',
    value: 'Others',
    icon: 'view-grid-outline',
    color: '#616161',
  },
];

export function CreatorScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const { items, loading } = useWardrobe();
  const { show: showToast } = useToast();

  const [occasion, setOccasion] = useState<string | null>(
    profile?.preferences?.default_occasion ?? null,
  );
  const [generating, setGenerating] = useState(false);

  const hasItems = items.length > 0;

  const handleGenerate = useCallback(() => {
    if (!occasion) {
      showToast('Please select an occasion first', 'info');
      return;
    }
    if (items.length === 0) {
      showToast('Add some items to your wardrobe first', 'info');
      return;
    }

    setGenerating(true);

    // Defer to next tick so the spinner can render before the (fast) compute.
    setTimeout(() => {
      const result = generateOutfit(items, {
        occasion,
        weather: null,
        style_preferences: [],
      });
      setGenerating(false);

      if (!result) {
        showToast(
          `Could not build an outfit for ${occasion}. Try adding more items tagged for that occasion, or pick a different occasion.`,
          'error',
        );
        return;
      }
      navigation.navigate('OutfitResult', { generated: result });
    }, 50);
  }, [occasion, items, navigation, showToast]);

  if (loading && items.length === 0) {
    return (
      <Screen scroll={false}>
        <Header
          title='Outfit Creator'
          transparent
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your wardrobe…</Text>
        </View>
      </Screen>
    );
  }

  if (!hasItems) {
    return (
      <Screen scroll={false}>
        <Header
          title='Outfit Creator'
          transparent
          onBack={() => navigation.goBack()}
        />
        <View style={styles.emptyWrap}>
          <EmptyState
            icon='shirt-outline'
            title='Your wardrobe is empty'
            message='Add a few items to your wardrobe and come back to generate stylish outfits.'
            action={
              <Button
                title='Add Item'
                onPress={() => navigation.navigate('AddItem')}
              />
            }
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      {/* 1. Header: centered title, back-arrow (left), no subtitle */}
      <Header
        title='Outfit Creator'
        transparent
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1: Choose Occasion (5-column grid) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHOOSE OCCASION</Text>
          <View style={styles.occasionGrid}>
            {CREATOR_OCCASIONS.map((opt) => {
              const selected = occasion === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setOccasion(selected ? null : opt.value)}
                  activeOpacity={0.7}
                  style={[
                    styles.occasionCard,
                    selected && styles.occasionCardSelected,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      opt.icon as keyof typeof MaterialCommunityIcons.glyphMap
                    }
                    size={30}
                    color={selected ? theme.colors.textInverse : opt.color}
                  />
                  <Text
                    style={[
                      styles.occasionLabel,
                      selected && styles.occasionLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>

                  {/* White circle badge with purple checkmark at top-right when selected */}
                  {selected && (
                    <View style={styles.checkBadge}>
                      <Ionicons
                        name='checkmark'
                        size={10}
                        color={theme.colors.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Primary action: full-width solid purple Generate Outfit button */}
        <View style={styles.generateWrap}>
          <Button
            title='Generate Outfit'
            onPress={handleGenerate}
            disabled={!occasion || generating}
            loading={generating}
            fullWidth
            icon={
              !generating ? (
                <MaterialCommunityIcons
                  name='creation'
                  size={20}
                  color={theme.colors.textInverse}
                  style={{ marginRight: 8 }}
                />
              ) : undefined
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  occasionCard: {
    width: '18%',
    aspectRatio: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  occasionCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  occasionLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  occasionLabelSelected: {
    color: theme.colors.textInverse,
    fontWeight: theme.typography.weights.semibold,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateWrap: {
    marginTop: theme.spacing.sm,
  },
});

/**
 * OutfitResultScreen - displays a generated outfit with rationale,
 * regenerate, and save-to-wardrobe actions.
 *
 * Receives a GeneratedOutfit via route params from HomeScreen or CreatorScreen.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, Header, Button } from '@components/ui';
import { useWardrobe } from '@context/WardrobeContext';
import { useSavedOutfits } from '@context/SavedOutfitsContext';
import { useToast } from '@components/ui';
import { regenerateOutfit } from '@services/outfitGenerator';
import { getCategory } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';
import type { GeneratedOutfit, WardrobeItem } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OutfitResult'>;

/** A single slot in the outfit composition. */
interface Slot {
  label: string;
  item: WardrobeItem | null;
  required: boolean;
  icon: string;
  color: string;
}

export function OutfitResultScreen({ navigation, route }: Props) {
  const { items } = useWardrobe();
  const { addOutfit } = useSavedOutfits();
  const { show: showToast } = useToast();

  const initial = route.params?.generated;
  const [outfit, setOutfit] = useState<GeneratedOutfit | null>(initial ?? null);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const request = useMemo(
    () =>
      outfit
        ? {
            occasion: outfit.occasion,
            weather: outfit.weather,
            style_preferences: outfit.style_preferences,
          }
        : null,
    [outfit],
  );

  const slots: Slot[] = useMemo(() => {
    if (!outfit) return [];
    const dressPath = !!outfit.dress;
    const arr: Slot[] = [];

    if (dressPath) {
      arr.push({
        label: 'Dress',
        item: outfit.dress,
        required: true,
        icon: 'dress',
        color: getCategory('dresses')?.color ?? theme.colors.primary,
      });
    } else {
      arr.push({
        label: 'Top',
        item: outfit.top,
        required: true,
        icon: 'tshirt-crew',
        color: getCategory('tops')?.color ?? theme.colors.primary,
      });
      arr.push({
        label: 'Bottom',
        item: outfit.bottom,
        required: true,
        icon: 'jeans',
        color: getCategory('bottoms')?.color ?? theme.colors.primary,
      });
    }
    arr.push({
      label: 'Shoes',
      item: outfit.shoes,
      required: true,
      icon: 'shoe-sneaker',
      color: getCategory('shoes')?.color ?? theme.colors.primary,
    });
    arr.push({
      label: 'Bag',
      item: outfit.bag,
      required: false,
      icon: 'bag-personal',
      color: getCategory('bags')?.color ?? theme.colors.primary,
    });
    // Show first accessory as a representative slot.
    arr.push({
      label: 'Accessory',
      item: outfit.accessories[0] ?? null,
      required: false,
      icon: 'necklace',
      color: getCategory('accessories')?.color ?? theme.colors.primary,
    });
    return arr;
  }, [outfit]);

  const handleRegenerate = useCallback(() => {
    if (!request) return;
    setRegenerating(true);
    // Defer so the spinner can render before the (fast) compute.
    setTimeout(() => {
      const next = regenerateOutfit(items, request, outfit ?? undefined);
      setRegenerating(false);
      if (!next) {
        showToast(
          'Could not generate a different combination. Try adding more items.',
          'error',
        );
        return;
      }
      setOutfit(next);
      setSaved(false);
      showToast('Here is a fresh combination', 'info');
    }, 50);
  }, [request, items, outfit, showToast]);

  const handleSave = useCallback(async () => {
    if (!outfit || saved) return;
    setSaving(true);
    const created = await addOutfit({
      occasion: outfit.occasion,
      weather: outfit.weather,
      style_preferences: outfit.style_preferences,
      rationale: outfit.rationale,
      item_ids: outfit.item_ids,
    });
    setSaving(false);
    if (created) {
      setSaved(true);
      showToast('Outfit saved to your collection', 'success');
    } else {
      showToast('Could not save the outfit. Please try again.', 'error');
    }
  }, [outfit, saved, addOutfit, showToast]);

  const handleItemPress = useCallback(
    (item: WardrobeItem) => {
      navigation.navigate('ItemDetail', { itemId: item.id });
    },
    [navigation],
  );

  if (!outfit) {
    // No outfit was passed (e.g. deep-linked). Send the user back to the Creator.
    return (
      <Screen scroll={false}>
        <Header title='Outfit' onBack={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <Ionicons
            name='sparkles-outline'
            size={48}
            color={theme.colors.textMuted}
          />
          <Text style={styles.emptyTitle}>No outfit to show</Text>
          <Text style={styles.emptyText}>
            Head to the Creator to generate a new outfit.
          </Text>
          <Button
            title='Go to Creator'
            onPress={() => navigation.getParent()?.navigate('Creator' as any)}
            style={styles.emptyBtn}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header
        title='Your Outfit'
        subtitle={`${outfit.occasion}${outfit.weather ? ' • ' + outfit.weather : ''}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Outfit composition grid */}
        <View style={styles.grid}>
          {slots.map((slot, idx) => (
            <OutfitSlot
              key={`${slot.label}-${idx}`}
              slot={slot}
              onPress={
                slot.item ? () => handleItemPress(slot.item!) : undefined
              }
            />
          ))}
        </View>

        {/* Extra accessories note */}
        {outfit.accessories.length > 1 && (
          <Text style={styles.extraNote}>
            +{outfit.accessories.length - 1} more accessory
            {outfit.accessories.length - 1 > 1 ? 'ies' : ''} included
          </Text>
        )}

        {/* Style tags */}
        {outfit.style_preferences.length > 0 && (
          <View style={styles.tagsRow}>
            {outfit.style_preferences.map((s) => (
              <View key={s} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rationale */}
        <View style={styles.rationaleCard}>
          <View style={styles.rationaleHeader}>
            <Ionicons
              name='bulb-outline'
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.rationaleTitle}>Why this outfit</Text>
          </View>
          <Text style={styles.rationaleText}>{outfit.rationale}</Text>
        </View>
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Button
          title='Regenerate'
          onPress={handleRegenerate}
          variant='outline'
          loading={regenerating}
          disabled={saving}
          icon={
            !regenerating ? (
              <Ionicons
                name='refresh-outline'
                size={18}
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
            ) : undefined
          }
          style={styles.regenBtn}
        />
        <Button
          title={saved ? 'Saved' : 'Save Outfit'}
          onPress={handleSave}
          loading={saving}
          disabled={saved || regenerating}
          icon={
            !saving && !saved ? (
              <Ionicons
                name={saved ? 'checkmark' : 'bookmark-outline'}
                size={18}
                color={theme.colors.textInverse}
                style={{ marginRight: 8 }}
              />
            ) : saved ? (
              <Ionicons
                name='checkmark'
                size={18}
                color={theme.colors.textInverse}
                style={{ marginRight: 8 }}
              />
            ) : undefined
          }
          style={styles.saveBtn}
        />
      </View>
    </Screen>
  );
}

// ---- OutfitSlot sub-component ---------------------------------------------

interface OutfitSlotProps {
  slot: Slot;
  onPress?: () => void;
}

function OutfitSlot({ slot, onPress }: OutfitSlotProps) {
  const { item, label, required, icon, color } = slot;
  const { width } = useWindowDimensions();
  const SLOT_SIZE = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      style={[styles.slot, { width: SLOT_SIZE, height: SLOT_SIZE }]}
    >
      {item ? (
        <>
          <Image
            source={{ uri: item.image_url }}
            style={styles.slotImage}
            resizeMode='cover'
          />
          <View style={[styles.slotBadge, { backgroundColor: color }]}>
            <Text style={styles.slotBadgeText}>{label}</Text>
          </View>
        </>
      ) : (
        <View style={styles.slotEmpty}>
          <Ionicons
            name={icon as any}
            size={32}
            color={theme.colors.textMuted}
          />
          <Text style={styles.slotEmptyLabel}>{label}</Text>
          <Text style={styles.slotEmptyHint}>
            {required ? 'Required' : 'Optional'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---- Styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxxl,
  },
  emptyTitle: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  emptyText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyBtn: {
    minWidth: 180,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slot: {
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  slotBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.pill,
  },
  slotBadgeText: {
    color: theme.colors.textInverse,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  slotEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    borderRadius: theme.radius.lg,
  },
  slotEmptyLabel: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  slotEmptyHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  extraNote: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  tag: {
    backgroundColor: theme.colors.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primaryDark,
  },
  rationaleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rationaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  rationaleTitle: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  rationaleText: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  regenBtn: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  saveBtn: {
    flex: 1.4,
  },
});

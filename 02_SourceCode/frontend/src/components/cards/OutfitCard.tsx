// OutfitCard - premium saved-outfit row card.

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getCategory } from '@constants/index';
import { theme } from '@theme/theme';
import type { SavedOutfit, WardrobeItem } from '@/types';

interface OutfitCardProps {
  outfit: SavedOutfit;
  itemsById: Record<string, WardrobeItem>;
  onPress?: (outfit: SavedOutfit) => void;
  onToggleFavorite?: (outfit: SavedOutfit) => void;
  onOpenMenu?: (outfit: SavedOutfit) => void;
  style?: ViewStyle;
}

// Ordered category slots for the small thumbnail row (after the Tops image).
const SMALL_SLOTS: Array<{
  category: WardrobeItem['category'];
  label: string;
}> = [
  { category: 'bottoms', label: 'Bottoms' },
  { category: 'shoes', label: 'Shoes' },
  { category: 'bags', label: 'Bags' },
  { category: 'accessories', label: 'Accessories' },
];

export function OutfitCard({
  outfit,
  itemsById,
  onPress,
  onToggleFavorite,
  onOpenMenu,
  style,
}: OutfitCardProps) {
  // Resolve the referenced items.
  const resolved = useMemo(
    () =>
      outfit.item_ids
        .map((id) => itemsById[id])
        .filter(Boolean) as WardrobeItem[],
    [outfit.item_ids, itemsById],
  );

  // Primary 'Tops' item for the big left slot. Falls back to a dress if the
  // outfit uses a dress instead of a separate top.
  const topItem = useMemo(
    () =>
      resolved.find((i) => i.category === 'tops') ??
      resolved.find((i) => i.category === 'dresses') ??
      null,
    [resolved],
  );

  // Remaining items grouped by category for the small thumbnail row.
  const smallItems = useMemo(() => {
    const map: Record<string, WardrobeItem | undefined> = {};
    SMALL_SLOTS.forEach((slot) => {
      map[slot.category] = resolved.find((i) => i.category === slot.category);
    });
    return map;
  }, [resolved]);

  const dateLabel = useMemo(() => {
    try {
      return new Date(outfit.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [outfit.created_at]);

  const displayName = outfit.name?.trim() || outfit.occasion;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(outfit)}
      style={[styles.card, style]}
    >
      {/* LEFT: tall primary Tops image */}
      <View style={styles.leftSlot}>
        {topItem?.image_url ? (
          <Image
            source={{ uri: topItem.image_url }}
            style={styles.leftImage}
            resizeMode='cover'
          />
        ) : (
          <View style={styles.leftPlaceholder}>
            <Ionicons
              name='shirt-outline'
              size={32}
              color={theme.colors.textMuted}
            />
          </View>
        )}
      </View>

      {/* RIGHT: name + actions + date + small thumbnails */}
      <View style={styles.rightCol}>
        {/* Name + date grouped together so the date sits right under the name
            (rightCol uses space-between to push this group to the top and the
            thumbnail row to the bottom). */}
        <View style={styles.nameDateWrap}>
          {/* Top line: name (left) + heart + three-dots (right, absolute) */}
          <View style={styles.topLine}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => onToggleFavorite?.(outfit)}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 4 }}
                style={styles.iconBtn}
              >
                <Ionicons
                  name={outfit.is_favorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={
                    outfit.is_favorite
                      ? theme.colors.primary
                      : theme.colors.textMuted
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onOpenMenu?.(outfit)}
                hitSlop={{ top: 12, bottom: 12, left: 4, right: 8 }}
                style={styles.iconBtn}
              >
                <Ionicons
                  name='ellipsis-vertical'
                  size={18}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Second line: formatted date */}
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        {/* Bottom row: small thumbnails in strict order */}
        <View style={styles.thumbRow}>
          {SMALL_SLOTS.map((slot) => {
            const item = smallItems[slot.category];
            // Accessories slot only renders when an accessory exists.
            if (slot.category === 'accessories' && !item) return null;
            const cat = getCategory(slot.category);
            return (
              <View key={slot.category} style={styles.thumb}>
                {item?.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.thumbImage}
                    resizeMode='cover'
                  />
                ) : (
                  <View
                    style={[
                      styles.thumbPlaceholder,
                      {
                        backgroundColor:
                          (cat?.color ?? theme.colors.primary) + '18',
                      },
                    ]}
                  >
                    <Ionicons
                      name='shirt-outline'
                      size={12}
                      color={cat?.color ?? theme.colors.primary}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---- Styles ----------------------------------------------------------------

const LEFT_WIDTH = 96;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xxl, // 16px generous radius
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  leftSlot: {
    width: LEFT_WIDTH,
    height: LEFT_WIDTH + 28, // tall, vertically prominent
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.primarySoft,
  },
  leftImage: {
    width: '100%',
    height: '100%',
  },
  leftPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightCol: {
    flex: 1,
    marginLeft: theme.spacing.md,
    paddingVertical: 2,
    justifyContent: 'space-between',
  },
  nameDateWrap: {
    // Keeps the outfit name and the saved date tightly grouped together so
    // the date sits directly under the name (rightCol uses space-between to
    // push this group to the top and the thumbnail row to the bottom).
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.tight(theme.typography.sizes.lg),
    marginRight: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: theme.spacing.xs,
  },
  date: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 1,
    lineHeight: theme.typography.lineHeights.normal(theme.typography.sizes.sm),
  },
  thumbRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.primarySoft,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

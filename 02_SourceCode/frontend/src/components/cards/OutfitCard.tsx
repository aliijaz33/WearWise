/**
 * OutfitCard - displays a saved outfit with thumbnail images of its items.
 * Used in the Saved Outfits list and Home screen.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@theme/theme';
import { getCategory } from '@constants/index';
import type { SavedOutfit, WardrobeItem } from '@/types';

interface OutfitCardProps {
  outfit: SavedOutfit;
  /** Resolved items keyed by id (from wardrobe context). */
  itemsById?: Record<string, WardrobeItem>;
  onPress?: (outfit: SavedOutfit) => void;
  onDelete?: (outfit: SavedOutfit) => void;
  style?: ViewStyle;
}

export function OutfitCard({
  outfit,
  itemsById = {},
  onPress,
  onDelete,
  style,
}: OutfitCardProps) {
  const resolved = outfit.item_ids
    .map((id) => itemsById[id])
    .filter(Boolean) as WardrobeItem[];

  const dateLabel = new Date(outfit.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(outfit)}
      style={[styles.card, style]}
    >
      <View style={styles.thumbRow}>
        {resolved.slice(0, 4).map((item, idx) => {
          const cat = getCategory(item.category);
          return (
            <View
              key={item.id}
              style={[
                styles.thumb,
                { marginLeft: idx === 0 ? 0 : -theme.spacing.md },
                { zIndex: 10 - idx },
              ]}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.thumbImage}
                />
              ) : (
                <View
                  style={[
                    styles.thumbPlaceholder,
                    { backgroundColor: cat?.color + '22' },
                  ]}
                >
                  <Ionicons
                    name='shirt'
                    size={16}
                    color={cat?.color ?? theme.colors.primary}
                  />
                </View>
              )}
            </View>
          );
        })}
        {resolved.length === 0 ? (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name='shirt' size={16} color={theme.colors.textMuted} />
          </View>
        ) : null}
        {resolved.length > 4 ? (
          <View
            style={[
              styles.thumb,
              styles.moreThumb,
              { marginLeft: -theme.spacing.md },
            ]}
          >
            <Text style={styles.moreText}>+{resolved.length - 4}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.occasion} numberOfLines={1}>
            {outfit.occasion}
          </Text>
          {onDelete ? (
            <TouchableOpacity
              onPress={() => onDelete(outfit)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.deleteBtn}
            >
              <Ionicons
                name='trash-outline'
                size={18}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {outfit.weather ? (
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Ionicons
                name='cloud-outline'
                size={11}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.tagText}>{outfit.weather}</Text>
            </View>
          </View>
        ) : null}

        {outfit.rationale ? (
          <Text style={styles.rationale} numberOfLines={2}>
            {outfit.rationale}
          </Text>
        ) : null}

        <Text style={styles.date}>{dateLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: theme.colors.surface,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  moreThumb: {
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primaryDark,
  },
  body: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  occasion: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  deleteBtn: {
    padding: theme.spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    marginRight: theme.spacing.xs,
  },
  tagText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginLeft: 3,
  },
  rationale: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: theme.spacing.sm,
  },
  date: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
});

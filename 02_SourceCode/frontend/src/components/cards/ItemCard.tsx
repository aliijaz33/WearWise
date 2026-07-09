/**
 * ItemCard - compact wardrobe item card for the 3-column grid.
 * Shows only the product image inside a rounded white card with a subtle
 * shadow and a vertical three-dots menu (top-right) that opens an action
 * sheet with Edit / Delete options.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@theme/theme';
import type { WardrobeItem } from '@/types';

interface ItemCardProps {
  item: WardrobeItem;
  onPress?: (item: WardrobeItem) => void;
  onEdit?: (item: WardrobeItem) => void;
  onDelete?: (item: WardrobeItem) => void;
  style?: ViewStyle;
}

export function ItemCard({
  item,
  onPress,
  onEdit,
  onDelete,
  style,
}: ItemCardProps) {
  const { width } = useWindowDimensions();
  // Three-column grid: screen padding (lg each side) + two gaps (sm each).
  const cardWidth = (width - theme.spacing.lg * 2 - theme.spacing.sm * 2) / 3;

  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  const handleEdit = () => {
    setMenuOpen(false);
    onEdit?.(item);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(item);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress?.(item)}
        style={[styles.card, { width: cardWidth, height: cardWidth }, style]}
      >
        <View style={styles.imageWrap}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name='shirt' size={32} color={theme.colors.textMuted} />
            </View>
          )}
        </View>

        {/* Vertical three-dots options menu trigger */}
        {(onEdit || onDelete) && (
          <TouchableOpacity
            onPress={openMenu}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.menuBtn}
          >
            <MaterialCommunityIcons
              name='dots-vertical'
              size={18}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Action sheet for edit / delete */}
      <Modal
        visible={menuOpen}
        transparent
        animationType='fade'
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            {onEdit && (
              <TouchableOpacity
                style={styles.sheetItem}
                activeOpacity={0.7}
                onPress={handleEdit}
              >
                <MaterialCommunityIcons
                  name='pencil-outline'
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.sheetItemText}>Edit Item</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[styles.sheetItem, styles.sheetItemDanger]}
                activeOpacity={0.7}
                onPress={handleDelete}
              >
                <MaterialCommunityIcons
                  name='trash-can-outline'
                  size={20}
                  color={theme.colors.error}
                />
                <Text
                  style={[styles.sheetItemText, styles.sheetItemTextDanger]}
                >
                  Delete Item
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.sheetItem, styles.sheetCancel]}
              activeOpacity={0.7}
              onPress={closeMenu}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  imageWrap: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surfaceAlt,
    padding: 6,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 17, 69, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    paddingBottom: 8,
    paddingHorizontal: theme.spacing.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginVertical: theme.spacing.sm,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  sheetItemText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  sheetItemDanger: {},
  sheetItemTextDanger: {
    color: theme.colors.error,
  },
  sheetCancel: {
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingVertical: theme.spacing.md,
  },
  sheetCancelText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
});

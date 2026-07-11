// ItemDetailScreen - full read-only view of a single wardrobe item.

import React, { useCallback, useMemo } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Screen,
  Header,
  Button,
  EmptyState,
  Loading,
  CategoryIcon,
  useToast,
} from '@components/ui';
import { useWardrobe } from '@context/WardrobeContext';
import { getCategory } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';
import type { WardrobeItem } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

const { width } = Dimensions.get('window');
const PHOTO_HEIGHT = width * 1.1;

export function ItemDetailScreen({ navigation, route }: Props) {
  const { getById, deleteItem, loading } = useWardrobe();
  const { show: showToast } = useToast();

  const itemId = route.params?.itemId;
  const item: WardrobeItem | undefined = itemId ? getById(itemId) : undefined;

  const cat = useMemo(
    () => (item ? getCategory(item.category) : undefined),
    [item],
  );
  const accent = cat?.color ?? theme.colors.primary;

  const handleEdit = useCallback(() => {
    if (!item) return;
    navigation.navigate('AddItem', { itemId: item.id });
  }, [item, navigation]);

  const handleDelete = useCallback(() => {
    if (!item) return;
    Alert.alert(
      'Delete Item',
      `Remove "${item.type}" from your wardrobe? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteItem(item.id);
            if (ok) {
              showToast('Item deleted', 'success');
              navigation.goBack();
            } else {
              showToast('Could not delete item. Try again.', 'error');
            }
          },
        },
      ],
    );
  }, [item, deleteItem, showToast, navigation]);

  // ---- Loading state -------------------------------------------------------
  if (loading && !item) {
    return (
      <Screen scroll={false}>
        <Header title='Item Details' onBack={() => navigation.goBack()} />
        <Loading fullscreen label='Loading item…' />
      </Screen>
    );
  }

  // ---- Not found state ------------------------------------------------------
  if (!item) {
    return (
      <Screen scroll={false}>
        <Header title='Item Details' onBack={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <EmptyState
            icon='alert-circle-outline'
            title='Item not found'
            message="This item may have been deleted or isn't available right now."
            action={
              <Button
                title='Back to Wardrobe'
                onPress={() => navigation.goBack()}
                variant='outline'
              />
            }
          />
        </View>
      </Screen>
    );
  }

  const addedDate = new Date(item.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Screen scroll>
      <Header
        title='Item Details'
        onBack={() => navigation.goBack()}
        right={
          <Button
            title='Edit'
            onPress={handleEdit}
            variant='ghost'
            style={styles.editBtn}
            textStyle={styles.editBtnText}
          />
        }
      />

      {/* ---- Hero photo ---- */}
      <View style={styles.photoWrap}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.photo}
            resizeMode='cover'
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons
              name='shirt-outline'
              size={64}
              color={theme.colors.textMuted}
            />
          </View>
        )}
        <View style={[styles.categoryPill, { backgroundColor: accent }]}>
          <CategoryIcon
            category={item.category}
            size={14}
            filled
            style={styles.categoryPillIcon}
          />
          <Text style={styles.categoryPillText}>
            {cat?.label ?? item.category}
          </Text>
        </View>
      </View>

      {/* ---- Title row ---- */}
      <View style={styles.titleRow}>
        <Text style={styles.type}>{item.type}</Text>
        <View style={styles.colorRow}>
          {item.color_hex && item.color_hex !== 'linear-gradient' ? (
            <View
              style={[
                styles.colorDot,
                {
                  backgroundColor: item.color_hex,
                  borderColor:
                    item.color_hex.toLowerCase() === '#ffffff'
                      ? theme.colors.border
                      : 'transparent',
                },
              ]}
            />
          ) : (
            <Ionicons
              name='color-palette-outline'
              size={16}
              color={theme.colors.textMuted}
            />
          )}
          <Text style={styles.colorText}>{item.color}</Text>
        </View>
      </View>

      {/* ---- Occasions ---- */}
      {item.occasions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Occasions</Text>
          <View style={styles.chipRow}>
            {item.occasions.map((occ) => (
              <View key={occ} style={styles.occasionChip}>
                <Text style={styles.occasionChipText}>{occ}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Occasions</Text>
          <Text style={styles.emptyValue}>No occasions tagged</Text>
        </View>
      )}

      {/* ---- Season ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Season</Text>
        <View style={styles.metaRow}>
          <Ionicons name={seasonIcon(item.season)} size={18} color={accent} />
          <Text style={styles.metaText}>{item.season ?? 'All Seasons'}</Text>
        </View>
      </View>

      {/* ---- Notes ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notes</Text>
        {item.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        ) : (
          <Text style={styles.emptyValue}>No notes added</Text>
        )}
      </View>

      {/* ---- Added date ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Added</Text>
        <Text style={styles.dateText}>{addedDate}</Text>
      </View>

      {/* ---- Actions ---- */}
      <View style={styles.actions}>
        <Button
          title='Edit Item'
          onPress={handleEdit}
          variant='outline'
          fullWidth
          icon={
            <Ionicons
              name='create-outline'
              size={20}
              color={theme.colors.primary}
              style={styles.btnIcon}
            />
          }
        />
        <Button
          title='Delete Item'
          onPress={handleDelete}
          variant='danger'
          fullWidth
          icon={
            <Ionicons
              name='trash-outline'
              size={20}
              color={theme.colors.textInverse}
              style={styles.btnIcon}
            />
          }
        />
      </View>
    </Screen>
  );
}

// Maps a season string to an appropriate Ionicons icon name.
function seasonIcon(season: string | null): keyof typeof Ionicons.glyphMap {
  switch ((season ?? '').toLowerCase()) {
    case 'summer':
      return 'sunny-outline';
    case 'winter':
      return 'snow-outline';
    case 'spring':
      return 'flower-outline';
    case 'fall':
      return 'leaf-outline';
    default:
      return 'calendar-outline';
  }
}

const styles = StyleSheet.create({
  editBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    minHeight: 36,
  },
  editBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },

  emptyWrap: {
    flex: 1,
  },

  // ---- Photo ----
  photoWrap: {
    position: 'relative',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
    ...theme.shadows.md,
  },
  photo: {
    width: '100%',
    height: PHOTO_HEIGHT,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  categoryPill: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    ...theme.shadows.sm,
  },
  categoryPillIcon: {
    marginRight: theme.spacing.xs,
  },
  categoryPillText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textInverse,
  },

  // ---- Title ----
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  type: {
    flex: 1,
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    marginRight: theme.spacing.xs,
  },
  colorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },

  // ---- Sections ----
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  emptyValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },

  // ---- Occasion chips ----
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  occasionChip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  occasionChipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primaryDark,
  },

  // ---- Meta rows ----
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium,
    marginLeft: theme.spacing.sm,
  },

  // ---- Notes ----
  notesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: theme.spacing.md,
  },
  notesText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    lineHeight: 22,
  },

  // ---- Date ----
  dateText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },

  // ---- Actions ----
  actions: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  btnIcon: {
    marginRight: theme.spacing.sm,
  },
});

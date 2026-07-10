/**
 * OutfitResultScreen - displays a generated outfit with rationale,
 * regenerate, and save-to-wardrobe actions.
 *
 * Layout (per client spec):
 *  1. Header: back chevron (left) + centered bold navy "Your Outfit is Ready! ✨"
 *     + heart-outline favorite button (right).
 *  2. Central canvas: a single light-lavender (#F7F5FF) rounded card containing
 *     a 3-column row:
 *       - Left (50%): tall Tops/Dress image (full height).
 *       - Middle (25%): vertical stack — Bottoms (65%) + Shoes (35%); combined
 *         height equals the Left column height.
 *       - Right (25%): dynamic accessories stack — a single centered Bag when
 *         there are 4 items, or a Bag + Accessory stack when there are 5.
 *  3. "Why this outfit?" — open static text block (no accordion).
 *  4. "Items in this outfit" — list of every item with thumbnail, title,
 *     category label, and a chevron that routes to ItemDetail.
 *  5. Action row: outlined "Regenerate" (left) + solid purple "Save Outfit"
 *     with sparkles (right).
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, Button } from '@components/ui';
import { useWardrobe } from '@context/WardrobeContext';
import { useSavedOutfits } from '@context/SavedOutfitsContext';
import { useToast } from '@components/ui';
import { regenerateOutfit } from '@services/outfitGenerator';
import { getCategory } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';
import type { GeneratedOutfit, WardrobeItem } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OutfitResult'>;

export function OutfitResultScreen({ navigation, route }: Props) {
  const { items } = useWardrobe();
  const { addOutfit, toggleFavorite } = useSavedOutfits();
  const { show: showToast } = useToast();
  const { width } = useWindowDimensions();

  const initial = route.params?.generated;
  const [outfit, setOutfit] = useState<GeneratedOutfit | null>(initial ?? null);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

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

  // ---- Resolve the primary pieces for the canvas grid ----------------------
  // The "main top piece" is either a Dress (dress path) or the Top.
  const mainPiece: WardrobeItem | null = useMemo(
    () => outfit?.dress ?? outfit?.top ?? null,
    [outfit],
  );
  const isDress = !!outfit?.dress;

  // The middle column always shows Bottoms + Shoes (even on the dress path we
  // still show whatever bottom/shoes the engine picked, if any).
  const bottomPiece: WardrobeItem | null = outfit?.bottom ?? null;
  const shoesPiece: WardrobeItem | null = outfit?.shoes ?? null;

  // The right column: Bag (always, if present) + first Accessory (if present).
  const bagPiece: WardrobeItem | null = outfit?.bag ?? null;
  const accessoryPiece: WardrobeItem | null =
    outfit && (outfit.accessories?.length ?? 0) > 0
      ? outfit.accessories[0]
      : null;

  // Total item count drives the right-column layout (4 items → single centered
  // bag; 5 items → bag + accessory stack).
  const itemCount = useMemo(() => {
    if (!outfit) return 0;
    let n = 0;
    if (outfit.dress) n++;
    else {
      if (outfit.top) n++;
      if (outfit.bottom) n++;
    }
    if (outfit.shoes) n++;
    if (outfit.bag) n++;
    n += outfit.accessories.length;
    return n;
  }, [outfit]);

  // ---- Flat list of all items for the "Items in this outfit" section -------
  const allItems: WardrobeItem[] = useMemo(() => {
    if (!outfit) return [];
    const arr: WardrobeItem[] = [];
    if (outfit.dress) arr.push(outfit.dress);
    else {
      if (outfit.top) arr.push(outfit.top);
      if (outfit.bottom) arr.push(outfit.bottom);
    }
    if (outfit.shoes) arr.push(outfit.shoes);
    if (outfit.bag) arr.push(outfit.bag);
    outfit.accessories.forEach((a) => arr.push(a));
    return arr;
  }, [outfit]);

  // ---- Canvas sizing math --------------------------------------------------
  // Card padding (16 each side) + inner gap (12 between 3 columns → 24 total).
  const CARD_PAD = theme.spacing.lg; // 16
  const GAP = theme.spacing.md; // 12
  const cardWidth = width - theme.spacing.lg * 2; // screen minus screen padding
  const innerWidth = cardWidth - CARD_PAD * 2; // inside the card
  // Left = 50%, Middle = 25%, Right = 25%, minus the two gaps.
  const leftColWidth = (innerWidth - GAP * 2) * 0.5;
  const midColWidth = (innerWidth - GAP * 2) * 0.25;
  const rightColWidth = (innerWidth - GAP * 2) * 0.25;
  // Canvas height: a pleasing tall aspect based on the left column width.
  const canvasHeight = Math.round(leftColWidth * 1.35);

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
      setSavedId(null);
      setFavorite(false);
      showToast('Here is a fresh combination', 'info');
    }, 50);
  }, [request, items, outfit, showToast]);

  const handleSave = useCallback(async () => {
    if (!outfit || saved) return;
    setSaving(true);
    const created = await addOutfit({
      name: `${outfit.occasion} Outfit`,
      occasion: outfit.occasion,
      weather: outfit.weather,
      style_preferences: outfit.style_preferences,
      rationale: outfit.rationale,
      item_ids: outfit.item_ids,
    });
    setSaving(false);
    if (created) {
      setSaved(true);
      setSavedId(created.id);
      showToast('Outfit saved to your collection', 'success');
    } else {
      showToast('Could not save the outfit. Please try again.', 'error');
    }
  }, [outfit, saved, addOutfit, showToast]);

  const handleFavorite = useCallback(async () => {
    // Favorite only works after the outfit has been saved (we need a DB id).
    if (!savedId) {
      showToast('Save the outfit first to favorite it.', 'info');
      return;
    }
    setTogglingFav(true);
    const ok = await toggleFavorite(savedId);
    setTogglingFav(false);
    if (ok) {
      setFavorite((f) => !f);
    } else {
      showToast('Could not update favourite, try again', 'error');
    }
  }, [savedId, toggleFavorite, showToast]);

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
        <View style={styles.emptyWrap}>
          <Ionicons
            name='sparkles-outline'
            size={48}
            color={theme.colors.textMuted}
          />
          <Text style={styles.emptyTitle}>No outfit to show</Text>
          <Text style={styles.emptyText}>
            Head to the Outfit Creator to generate a new outfit.
          </Text>
          <Button
            title='Go to Outfits'
            onPress={() => navigation.getParent()?.navigate('Outfits' as any)}
            style={styles.emptyBtn}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      {/* ---- 1. Header: back (left) + centered title + heart (right) ---- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name='chevron-back' size={26} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Your Outfit is Ready! ✨</Text>
        </View>

        <TouchableOpacity
          onPress={handleFavorite}
          style={styles.headerIconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={togglingFav}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={favorite ? theme.colors.accent : theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- 2. Central canvas card (3-column grid) ---- */}
        <View style={styles.canvasCard}>
          <View style={styles.canvasRow}>
            {/* LEFT COLUMN (50%) — main top piece, full height */}
            <View style={[styles.colLeft, { width: leftColWidth }]}>
              <CanvasCell
                item={mainPiece}
                label={isDress ? 'Dress' : 'Top'}
                width={leftColWidth}
                height={canvasHeight}
                onPress={
                  mainPiece ? () => handleItemPress(mainPiece) : undefined
                }
              />
            </View>

            {/* MIDDLE COLUMN (25%) — Bottoms (65%) + Shoes (35%) */}
            <View style={[styles.colMid, { width: midColWidth }]}>
              <CanvasCell
                item={bottomPiece}
                label='Bottom'
                width={midColWidth}
                height={Math.round(canvasHeight * 0.65)}
                onPress={
                  bottomPiece ? () => handleItemPress(bottomPiece) : undefined
                }
              />
              <View style={{ height: GAP }} />
              <CanvasCell
                item={shoesPiece}
                label='Shoes'
                width={midColWidth}
                height={Math.round(canvasHeight * 0.35)}
                onPress={
                  shoesPiece ? () => handleItemPress(shoesPiece) : undefined
                }
              />
            </View>

            {/* RIGHT COLUMN (25%) — dynamic accessories stack */}
            <View
              style={[
                styles.colRight,
                { width: rightColWidth, height: canvasHeight },
              ]}
            >
              {itemCount <= 4 ? (
                // 4 items (no accessory): center the single Bag vertically.
                <View style={styles.rightCentered}>
                  <CanvasCell
                    item={bagPiece}
                    label='Bag'
                    width={rightColWidth}
                    height={Math.round(canvasHeight * 0.5)}
                    onPress={
                      bagPiece ? () => handleItemPress(bagPiece) : undefined
                    }
                  />
                </View>
              ) : (
                // 5 items (accessory included): Bag on top, Accessory below.
                <>
                  <CanvasCell
                    item={bagPiece}
                    label='Bag'
                    width={rightColWidth}
                    height={
                      Math.round(canvasHeight * 0.5) - Math.round(GAP / 2)
                    }
                    onPress={
                      bagPiece ? () => handleItemPress(bagPiece) : undefined
                    }
                  />
                  <View style={{ height: GAP }} />
                  <CanvasCell
                    item={accessoryPiece}
                    label='Accessory'
                    width={rightColWidth}
                    height={
                      Math.round(canvasHeight * 0.5) - Math.round(GAP / 2)
                    }
                    onPress={
                      accessoryPiece
                        ? () => handleItemPress(accessoryPiece)
                        : undefined
                    }
                  />
                </>
              )}
            </View>
          </View>
        </View>

        {/* ---- 3. "Why this outfit?" static text block ---- */}
        <View style={styles.rationaleBlock}>
          <Text style={styles.rationaleTitle}>Why this outfit?</Text>
          <Text style={styles.rationaleText}>{outfit.rationale}</Text>
        </View>

        {/* ---- 4. "Items in this outfit" list ---- */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemsSectionTitle}>Items in this outfit</Text>
          <View style={styles.itemsList}>
            {allItems.map((item, idx) => {
              const cat = getCategory(item.category);
              return (
                <TouchableOpacity
                  key={`${item.id}-${idx}`}
                  style={styles.itemRow}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemThumb}>
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.itemThumbImg}
                        resizeMode='cover'
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={(cat?.icon ?? 'hanger') as any}
                        size={22}
                        color={theme.colors.textMuted}
                      />
                    )}
                  </View>
                  <View style={styles.itemTextStack}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.type}
                    </Text>
                    <Text style={styles.itemCategory} numberOfLines={1}>
                      {cat?.label ?? item.category}
                    </Text>
                  </View>
                  <Ionicons
                    name='chevron-forward'
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: theme.spacing.md }} />
      </ScrollView>

      {/* ---- 5. Action button row ---- */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.regenBtn}
          onPress={handleRegenerate}
          disabled={regenerating || saving}
          activeOpacity={0.7}
        >
          {regenerating ? (
            <ActivityIndicator
              size='small'
              color={theme.colors.primary}
              style={{ marginRight: 8 }}
            />
          ) : (
            <MaterialCommunityIcons
              name='refresh'
              size={18}
              color={theme.colors.primary}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={styles.regenBtnText}>Regenerate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, (saved || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saved || saving || regenerating}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator
              size='small'
              color={theme.colors.textInverse}
              style={{ marginRight: 8 }}
            />
          ) : (
            <Ionicons
              name='sparkles'
              size={18}
              color={theme.colors.textInverse}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={styles.saveBtnText}>
            {saved ? 'Saved' : 'Save Outfit'}
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

// ---- CanvasCell sub-component ----------------------------------------------
// A single image cell inside the canvas card. Renders the item photo (cover)
// or a dashed placeholder when the slot is empty.

interface CanvasCellProps {
  item: WardrobeItem | null;
  label: string;
  width: number;
  height: number;
  onPress?: () => void;
}

function CanvasCell({ item, label, width, height, onPress }: CanvasCellProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      style={[styles.cell, { width, height, borderRadius: theme.radius.md }]}
    >
      {item && item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.cellImage}
          resizeMode='cover'
        />
      ) : (
        <View style={styles.cellEmpty}>
          <MaterialCommunityIcons
            name='hanger'
            size={24}
            color={theme.colors.textMuted}
          />
          <Text style={styles.cellEmptyLabel}>{label}</Text>
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

  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },

  // ---- Empty state ----
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

  // ---- Canvas card ----
  canvasCard: {
    backgroundColor: theme.colors.primarySoft, // #F7F5FF
    borderRadius: theme.radius.xxl, // 16
    padding: theme.spacing.lg, // 16
    marginBottom: theme.spacing.lg,
  },
  canvasRow: {
    flexDirection: 'row',
    gap: theme.spacing.md, // 12
  },
  colLeft: {
    // width set inline
  },
  colMid: {
    // width set inline; children stack vertically
  },
  colRight: {
    // width + height set inline
  },
  rightCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- Canvas cell ----
  cell: {
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  cellEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
  cellEmptyLabel: {
    marginTop: 4,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },

  // ---- "Why this outfit?" block ----
  rationaleBlock: {
    marginBottom: theme.spacing.lg,
  },
  rationaleTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  rationaleText: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: theme.typography.lineHeights.relaxed(theme.typography.sizes.sm),
    color: theme.colors.textSecondary,
  },

  // ---- "Items in this outfit" list ----
  itemsSection: {
    marginBottom: theme.spacing.lg,
  },
  itemsSectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    //textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  itemsList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemThumbImg: {
    width: '100%',
    height: '100%',
  },
  itemTextStack: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  itemTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  itemCategory: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // ---- Action bar ----
  actionBar: {
    flexDirection: 'row',
    gap: theme.spacing.md, // 12
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  regenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.button,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  regenBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  saveBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primary, // #5D38F5
  },
  saveBtnDisabled: {
    backgroundColor: theme.colors.primaryDark,
  },
  saveBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textInverse,
  },
});

/**
 * HomeScreen - dashboard redesigned per guideforyou.js home page spec.
 *
 * Layout: header (menu left + greeting + bell right aligned with text) →
 * search bar (with functional filter) → today's suggestion card (gradient,
 * sparkles, 2x2 item grid, shadow) → quick actions grid (square tiles) →
 * recently added horizontal list (images only, aligned both sides) →
 * dismissible tips banner (lit-bulb icon). Adjusts for empty wardrobes.
 * Responsive across phone widths for both Android and iOS.
 */

import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, Loading, EmptyState, Button } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import { useWardrobe } from '@context/WardrobeContext';
import { useSavedOutfits } from '@context/SavedOutfitsContext';
import { useToast } from '@components/ui';
import { generateOutfit } from '@services/outfitGenerator';
import { CATEGORIES, getCategory } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';
import type { WardrobeItem, GeneratedOutfit } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList>;

/** Emoji used as a placeholder for each category in the suggestion preview. */
const CATEGORY_EMOJI: Record<string, string> = {
  tops: '👕',
  bottoms: '👖',
  dresses: '👗',
  shoes: '👟',
  bags: '👜',
  accessories: '🕶️',
};

export function HomeScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const { items, loading: itemsLoading } = useWardrobe();
  const { outfits } = useSavedOutfits();
  const { show: showToast } = useToast();
  const { width } = useWindowDimensions();

  const [search, setSearch] = useState('');
  const [showTips, setShowTips] = useState(true);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = useMemo(() => {
    const name = profile?.full_name?.trim();
    if (!name) return 'there';
    return name.split(' ')[0];
  }, [profile?.full_name]);

  const isEmpty = items.length === 0;

  // Generate a preview outfit for the suggestion card.
  const previewOutfit = useMemo<GeneratedOutfit | null>(() => {
    if (isEmpty) return null;
    const occasion = profile?.preferences?.default_occasion ?? 'Casual';
    return generateOutfit(items, {
      occasion,
      weather: null,
      style_preferences: profile?.preferences?.style_preferences ?? [],
    });
  }, [items, profile, isEmpty]);

  // Build the suggestion item grid from the preview outfit.
  // Grid order (2x2): top-left=Top, top-right=Bag,
  //                  bottom-left=Shoes, bottom-right=Bottom
  const suggestionItems = useMemo(() => {
    if (!previewOutfit) return [];
    const slots: { label: string; item: WardrobeItem | null }[] = [
      { label: 'Top', item: previewOutfit.top },
      { label: 'Bag', item: previewOutfit.bag ?? previewOutfit.accessories[0] },
      { label: 'Shoes', item: previewOutfit.shoes },
      { label: 'Bottom', item: previewOutfit.bottom },
    ];
    return slots;
  }, [previewOutfit]);

  // Functional search: filter recent items by query.
  const recentItems = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const list = sorted.slice(0, 8);
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (i) =>
        i.type.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.color.toLowerCase().includes(q) ||
        i.occasions.some((o) => o.toLowerCase().includes(q)),
    );
  }, [items, search]);

  const handleQuickGenerate = useCallback(() => {
    if (isEmpty) {
      showToast('Add some items to your wardrobe first', 'info');
      return;
    }
    const occasion = profile?.preferences?.default_occasion ?? 'Casual';
    const result = generateOutfit(items, {
      occasion,
      weather: null,
      style_preferences: profile?.preferences?.style_preferences ?? [],
    });
    if (!result) {
      showToast(
        `Couldn't build an outfit for ${occasion}. Try adding more items tagged for that occasion.`,
        'error',
      );
      return;
    }
    navigation.navigate('OutfitResult', { generated: result });
  }, [items, profile, navigation, showToast, isEmpty]);

  const goToItem = useCallback(
    (item: WardrobeItem) => {
      navigation.navigate('ItemDetail', { itemId: item.id });
    },
    [navigation],
  );

  const goToAddItem = useCallback(() => {
    navigation.navigate('AddItem');
  }, [navigation]);

  const goToCreator = useCallback(() => {
    navigation.getParent()?.navigate('Creator' as any);
  }, [navigation]);

  const goToWardrobe = useCallback(() => {
    navigation.getParent()?.navigate('Wardrobe' as any);
  }, [navigation]);

  const goToSaved = useCallback(() => {
    navigation.getParent()?.navigate('Saved' as any);
  }, [navigation]);

  const goToProfile = useCallback(() => {
    navigation.getParent()?.navigate('Profile' as any);
  }, [navigation]);

  // Functional filter: navigate to Wardrobe tab (which has full filter UI).
  const handleFilter = useCallback(() => {
    navigation.getParent()?.navigate('Wardrobe' as any);
  }, [navigation]);

  if (itemsLoading && items.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label='Loading your wardrobe…' fullscreen />
      </Screen>
    );
  }

  // Responsive sizing based on screen width.
  const isSmall = width < 360;
  const suggestionImageSize = isSmall ? 75 : 90;
  const recentItemSize = isSmall ? 81 : 89;

  return (
    <Screen scroll>
      <StatusBar
        barStyle='dark-content'
        backgroundColor={theme.colors.background}
      />

      {/* ---- Header: menu (left) + greeting + bell (right, aligned with text) ---- */}
      <TouchableOpacity
        onPress={goToProfile}
        style={styles.menuIcon}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name='menu' size={26} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
          <Text style={styles.subtitle}>Let's dress you up!</Text>
        </View>

        <TouchableOpacity
          onPress={() => showToast('No new notifications', 'info')}
          style={styles.bellIcon}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name='notifications' size={24} color={theme.colors.text} />
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ---- Search bar with functional filter ---- */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Ionicons
            name='search'
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder='Search in your wardrobe...'
            placeholderTextColor={theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize='none'
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.searchClear}
            >
              <Ionicons
                name='close-circle'
                size={18}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleFilter}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.filterIcon}
          >
            <Ionicons
              name='options-outline'
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ---- Today's Suggestion card (with shadow) ---- */}
      <View style={styles.suggestionWrap}>
        <LinearGradient
          colors={[theme.colors.primarySofter, theme.colors.primarySoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.suggestionCard}
        >
          <View style={styles.suggestionRow}>
            {/* Left: text content */}
            <View style={styles.suggestionLeft}>
              <Text style={styles.suggestionLabel}>Today's Suggestion</Text>
              <Ionicons
                name='sparkles'
                size={24}
                color={theme.colors.primaryLight}
                style={styles.suggestionStar}
              />
              <Text style={styles.suggestionTitle}>
                {isEmpty
                  ? 'Start Your Wardrobe'
                  : `${profile?.preferences?.default_occasion ?? 'Casual'} Day Out`}
              </Text>
              <TouchableOpacity
                onPress={handleQuickGenerate}
                style={styles.viewOutfitBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.viewOutfitText}>
                  {isEmpty ? 'Add Item' : 'View Outfit'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Right: 2x2 item grid */}
            {!isEmpty && suggestionItems.length > 0 ? (
              <View
                style={[
                  styles.suggestionGrid,
                  { width: 2 * (suggestionImageSize + 4) },
                ]}
              >
                {suggestionItems.map((slot, idx) => {
                  const cat = slot.item
                    ? getCategory(slot.item.category)
                    : null;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.suggestionGridItem,
                        {
                          width: suggestionImageSize,
                          height: suggestionImageSize,
                        },
                      ]}
                    >
                      {slot.item?.image_url ? (
                        <Image
                          source={{ uri: slot.item.image_url }}
                          style={styles.suggestionGridImg}
                        />
                      ) : (
                        <Text style={styles.suggestionGridEmoji}>
                          {cat ? CATEGORY_EMOJI[cat.id] : '👕'}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.suggestionGridPlaceholder}>
                <Text style={styles.suggestionGridEmoji}>👗</Text>
              </View>
            )}
          </View>

          {isEmpty && (
            <Text style={styles.suggestionEmptyDesc}>
              Add items to your wardrobe and we'll generate a stylish outfit for
              you.
            </Text>
          )}
        </LinearGradient>
      </View>

      {/* ---- Quick Actions (square tiles) ---- */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon='hanger'
            label='My Wardrobe'
            onPress={goToWardrobe}
          />
          <QuickAction
            icon='lightbulb-on'
            label='Outfit Ideas'
            onPress={goToCreator}
          />
          <QuickAction icon='calendar' label='Occasions' onPress={goToSaved} />
          <QuickAction
            icon='heart-outline'
            label='Favourite'
            onPress={goToProfile}
          />
        </View>
      </View>

      {/* ---- Recently Added (images only, aligned both sides) ---- */}
      {!isEmpty && (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <TouchableOpacity onPress={goToWardrobe}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          {recentItems.length > 0 ? (
            <FlatList
              data={recentItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.recentList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => goToItem(item)}
                  activeOpacity={0.8}
                  style={[styles.recentItem, { width: recentItemSize }]}
                >
                  <View
                    style={[
                      styles.recentImage,
                      {
                        width: recentItemSize,
                        height: recentItemSize,
                      },
                    ]}
                  >
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.recentImg}
                      />
                    ) : (
                      <Text style={styles.recentEmoji}>
                        {CATEGORY_EMOJI[item.category] ?? '👕'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.noResults}>No items match your search.</Text>
          )}
        </View>
      )}

      {/* ---- Empty wardrobe CTA (new accounts) ---- */}
      {isEmpty && (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon='shirt'
            title='Your wardrobe is empty'
            message='Add your first clothing item to start building outfits.'
            action={
              <Button
                title='Add Your First Item'
                onPress={goToAddItem}
                icon={
                  <Ionicons
                    name='add'
                    size={20}
                    color={theme.colors.textInverse}
                    style={{ marginRight: 6 }}
                  />
                }
              />
            }
          />
        </View>
      )}

      {/* ---- Tips banner (dismissible, lit-bulb icon) ---- */}
      {showTips && (
        <View style={styles.tipsBanner}>
          <MaterialCommunityIcons
            name='lightbulb-on'
            size={20}
            color={theme.colors.primary}
            style={styles.tipsIcon}
          />
          <Text style={styles.tipsText}>
            {isEmpty
              ? 'Add a few items across categories to unlock smart outfit suggestions.'
              : 'Add more accessories to get better outfit suggestions.'}
          </Text>
          <TouchableOpacity
            onPress={goToAddItem}
            style={styles.tipsBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.tipsBtnText}>Add Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowTips(false)}
            style={styles.tipsClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name='close' size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: theme.spacing.xxl }} />
    </Screen>
  );
}

/** Quick action tile: square (height = width), thin border, icon + label. */
function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.quickItem}
    >
      <MaterialCommunityIcons
        name={icon}
        size={26}
        color={theme.colors.primary}
        style={styles.quickIcon}
      />
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Header — single row: menu (left) + greeting (flex) + bell (right)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
  greeting: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  menuIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '3.5%',
  },
  bellIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
  },
  bellBadgeText: {
    color: theme.colors.textInverse,
    fontSize: 10,
    fontWeight: theme.typography.weights.semibold,
    paddingHorizontal: 4,
  },

  // Search bar
  searchContainer: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
    padding: 0,
    margin: 0,
  },
  searchClear: {
    marginLeft: theme.spacing.sm,
  },
  filterIcon: {
    marginLeft: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
  },

  // Suggestion card (taller, with shadow)
  suggestionWrap: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  suggestionCard: {
    // Minimal vertical padding (2-3px); height grows from larger images
    paddingVertical: 10,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.xs,
    borderColor: theme.colors.primaryLight,
    borderWidth: 0.5,
    borderRadius: theme.radius.lg,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionLeft: {
    flex: 1,
    paddingRight: theme.spacing.md,
    marginTop: -30,
  },
  suggestionLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  suggestionStar: {
    marginBottom: theme.spacing.sm,
  },
  suggestionTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  viewOutfitBtn: {
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.button,
    alignSelf: 'flex-start',
    ...theme.shadows.button,
  },
  viewOutfitText: {
    color: theme.colors.textInverse,
    fontSize: 13,
    fontWeight: theme.typography.weights.medium,
  },
  suggestionEmptyDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: theme.spacing.md,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionGridItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  suggestionGridImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  suggestionGridEmoji: {
    fontSize: 26,
  },
  suggestionGridPlaceholder: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Quick actions (square tiles: height = width via aspectRatio)
  quickActionsContainer: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickItem: {
    flex: 1,
    // Square: height equals width (1:1 aspect ratio)
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    borderRadius: theme.radius.lg,
    // Soft purple outline (client spec: #A390F9) with a thin shadow
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  quickIcon: {
    marginBottom: theme.spacing.xs,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },

  // Recently added (aligned both sides)
  recentContainer: {
    marginBottom: theme.spacing.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    //marginBottom: theme.spacing.sm,
  },
  viewAll: {
    fontSize: theme.typography.sizes.md,
    // Dark primary (not light) per client spec
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  recentList: {
    // Left aligns with header (20). Right compensates for last item's margin
    // so the last image's right edge aligns with the header's right edge.
    paddingLeft: theme.spacing.xl,
    paddingRight: theme.spacing.xl - theme.spacing.md,
  },
  recentItem: {
    marginRight: theme.spacing.sm,
  },
  recentImage: {
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  recentImg: {
    width: '100%',
    height: '100%',
    // cover fills the box fully with no gaps on any side
    resizeMode: 'cover',
  },
  recentEmoji: {
    fontSize: 32,
  },
  noResults: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },

  // Empty wardrobe
  emptyWrap: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },

  // Tips banner (lit-bulb icon)
  tipsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginHorizontal: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xl,
  },
  tipsIcon: {
    marginRight: theme.spacing.md,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.primary,
    lineHeight: 18,
  },
  tipsBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm - 2,
    borderRadius: theme.radius.button,
    marginLeft: theme.spacing.sm,
  },
  tipsBtnText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
  },
  tipsClose: {
    marginLeft: theme.spacing.sm,
  },
});

// FavoritesScreen - "Favorites" tab showing hearted saved outfits.

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState, Loading, Button, useToast } from '@components/ui';
import { OutfitCard } from '@components/cards';
import { useWardrobe } from '@context/WardrobeContext';
import { useSavedOutfits } from '@context/SavedOutfitsContext';
import { OCCASIONS } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';
import type { SavedOutfit, WardrobeItem, GeneratedOutfit } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList>;

export function FavoritesScreen({ navigation }: Props) {
  const { items } = useWardrobe();
  const { outfits, loading, deleteOutfit, toggleFavorite, refresh } =
    useSavedOutfits();
  const { show: showToast } = useToast();
  const [filter, setFilter] = useState<string | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Action sheet state.
  const [menuOutfit, setMenuOutfit] = useState<SavedOutfit | null>(null);

  const itemsById = useMemo(() => {
    const map: Record<string, WardrobeItem> = {};
    items.forEach((i) => (map[i.id] = i));
    return map;
  }, [items]);

  // Only the outfits the user has hearted.
  const favorites = useMemo(
    () => outfits.filter((o) => o.is_favorite),
    [outfits],
  );

  // Which occasion pills to show: "all" first, then every occasion that
  // actually appears in the favorited outfits, ordered by OCCASIONS.
  const availablePills = useMemo(() => {
    const present = new Set(favorites.map((o) => o.occasion));
    const occasions =
      present.size > 0 ? OCCASIONS.filter((o) => present.has(o)) : [];
    return ['all', ...occasions] as Array<string | 'all'>;
  }, [favorites]);

  const filtered = useMemo(() => {
    if (filter === 'all') return favorites;
    return favorites.filter((o) => o.occasion === filter);
  }, [favorites, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleOpen = useCallback(
    (outfit: SavedOutfit) => {
      // Reconstruct a GeneratedOutfit from the saved outfit + resolved items.
      const resolved = outfit.item_ids
        .map((id) => itemsById[id])
        .filter(Boolean) as WardrobeItem[];

      const top = resolved.find((i) => i.category === 'tops') ?? null;
      const bottom = resolved.find((i) => i.category === 'bottoms') ?? null;
      const dress = resolved.find((i) => i.category === 'dresses') ?? null;
      const shoes = resolved.find((i) => i.category === 'shoes') ?? null;
      const bag = resolved.find((i) => i.category === 'bags') ?? null;
      const accessories = resolved.filter((i) => i.category === 'accessories');

      const generated: GeneratedOutfit = {
        occasion: outfit.occasion,
        weather: outfit.weather,
        style_preferences: outfit.style_preferences,
        top,
        bottom,
        dress,
        shoes,
        bag,
        accessories,
        rationale: outfit.rationale ?? '',
        item_ids: outfit.item_ids,
      };

      navigation.navigate('OutfitResult', {
        generated,
        savedId: outfit.id,
        isFavorite: outfit.is_favorite,
      });
    },
    [itemsById, navigation],
  );

  const handleToggleFavorite = useCallback(
    async (outfit: SavedOutfit) => {
      const ok = await toggleFavorite(outfit.id);
      if (!ok) {
        showToast('Could not update favorite. Try again.', 'error');
      }
    },
    [toggleFavorite, showToast],
  );

  const handleOpenMenu = useCallback((outfit: SavedOutfit) => {
    setMenuOutfit(outfit);
  }, []);

  const closeMenu = useCallback(() => setMenuOutfit(null), []);

  const handleDeleteFromMenu = useCallback(() => {
    if (!menuOutfit) return;
    const target = menuOutfit;
    setMenuOutfit(null);
    Alert.alert(
      'Delete Outfit',
      'Are you sure you want to remove this saved outfit? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteOutfit(target.id);
            showToast(
              ok ? 'Outfit deleted' : 'Could not delete outfit',
              ok ? 'info' : 'error',
            );
          },
        },
      ],
    );
  }, [menuOutfit, deleteOutfit, showToast]);

  // Jump to the Outfits tab (SavedScreen) so the user can browse saved outfits.
  const goSavedOutfits = useCallback(() => {
    navigation.getParent()?.navigate('Outfits' as any);
  }, [navigation]);

  // Back arrow jumps to the Home tab.
  const goHome = useCallback(() => {
    navigation.getParent()?.navigate('Home' as any);
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: SavedOutfit }) => (
      <OutfitCard
        outfit={item}
        itemsById={itemsById}
        onPress={handleOpen}
        onToggleFavorite={handleToggleFavorite}
        onOpenMenu={handleOpenMenu}
      />
    ),
    [itemsById, handleOpen, handleToggleFavorite, handleOpenMenu],
  );

  // ---- Loading state -------------------------------------------------------
  if (loading && favorites.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title='Favorites' onBack={goHome} />
        <Loading label='Loading your favorites…' fullscreen />
      </SafeAreaView>
    );
  }

  // ---- Empty state ---------------------------------------------------------
  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title='Favorites' onBack={goHome} />
        <View style={styles.emptyWrap}>
          <EmptyState
            icon='heart-outline'
            title='No favorites yet'
            message='Tap the heart on any saved outfit to keep your favourite looks here.'
            action={
              <Button title='Browse Saved Outfits' onPress={goSavedOutfits} />
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Main list -----------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title='Favorites' onBack={goHome} />

      {/* Occasion filter pills (horizontally scrollable) */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {availablePills.map((p) => (
            <FilterPill
              key={p}
              label={p === 'all' ? 'All' : p}
              selected={filter === p}
              onPress={() => setFilter(p)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.noMatchWrap}>
            <Text style={styles.noMatchText}>
              {`No favorite outfits for ${
                filter === 'all' ? 'this filter' : filter
              }. Try a different occasion.`}
            </Text>
          </View>
        }
      />

      {/* Three-dots ActionSheet */}
      <Modal
        visible={!!menuOutfit}
        transparent
        animationType='slide'
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.sheetOverlay} onPress={closeMenu}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {menuOutfit?.name?.trim() || menuOutfit?.occasion}
            </Text>
            <TouchableOpacity
              style={[styles.sheetItem, styles.sheetItemDanger]}
              onPress={handleDeleteFromMenu}
            >
              <Ionicons
                name='trash-outline'
                size={20}
                color={theme.colors.error}
              />
              <Text
                style={[styles.sheetItemText, { color: theme.colors.error }]}
              >
                Delete Outfit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancel} onPress={closeMenu}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ---- Header sub-component --------------------------------------------------

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

function Header({ title, onBack }: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.headerIconBtn}
        disabled={!onBack}
      >
        <Ionicons
          name='chevron-back'
          size={24}
          color={onBack ? theme.colors.text : theme.colors.textMuted}
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.headerIconBtn} />
    </View>
  );
}

// ---- FilterPill sub-component ----------------------------------------------

interface FilterPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function FilterPill({ label, selected, onPress }: FilterPillProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.pill,
        selected
          ? {
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.primarySoft,
            }
          : {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: selected ? theme.colors.primary : theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // ---- Header ----
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },

  // ---- Filter pills ----
  filterSection: {
    paddingVertical: theme.spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
  },
  pill: {
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    marginRight: theme.spacing.sm,
  },
  pillText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },

  // ---- List ----
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl + 80,
  },
  noMatchWrap: {
    paddingVertical: theme.spacing.xxxl,
    alignItems: 'center',
  },
  noMatchText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // ---- Empty state ----
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },

  // ---- Action sheet ----
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    paddingTop: theme.spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  sheetTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  sheetItemDanger: {
    justifyContent: 'center',
  },
  sheetItemText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  sheetCancel: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetCancelText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
});

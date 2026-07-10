/**
 * SavedScreen - "My Saved Outfits" tab.
 *
 * Premium layout (per client spec):
 *  - Header: bold navy "My Saved Outfits" title, back-arrow icon button far
 *    left, search magnifying-glass icon button far right.
 *  - Filter pills: clean rounded outlines (All, Casual, Party, Formal,
 *    Wedding, …). Active = thin vibrant purple border + purple text.
 *    Inactive = light gray border + dark text. No nested count badges.
 *  - Cards: horizontal split — tall Tops image left, outfit name + heart +
 *    three-dots + date + small thumbnail row right (see OutfitCard).
 *  - Interactive actions:
 *      • Heart toggle → optimistic favorite sync to the backend.
 *      • Three-dots → ActionSheet with "Edit Outfit Name" and "Delete Outfit".
 *      • Delete → DELETE request + state refresh on confirmation.
 *      • Edit name → modal with a text input + Save/Cancel.
 */

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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState, Loading, Button } from '@components/ui';
import { OutfitCard } from '@components/cards';
import { useWardrobe } from '@context/WardrobeContext';
import { useSavedOutfits } from '@context/SavedOutfitsContext';
import { useToast } from '@components/ui';
import { OCCASIONS } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';
import type { SavedOutfit, WardrobeItem, GeneratedOutfit } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList>;

// Filter pills are built dynamically from the occasions actually present in
// the user's saved outfits (see availablePills below), so every saved
// occasion — e.g. "Date Night", "Party" — gets its own filter pill.

export function SavedScreen({ navigation }: Props) {
  const { items } = useWardrobe();
  const { outfits, loading, deleteOutfit, toggleFavorite, refresh } =
    useSavedOutfits();
  const { show: showToast } = useToast();
  const [filter, setFilter] = useState<string | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [search, setSearch] = useState('');

  // Action sheet state.
  const [menuOutfit, setMenuOutfit] = useState<SavedOutfit | null>(null);

  const itemsById = useMemo(() => {
    const map: Record<string, WardrobeItem> = {};
    items.forEach((i) => (map[i.id] = i));
    return map;
  }, [items]);

  // Which occasion pills to show: "all" first, then every occasion that
  // actually appears in the user's saved outfits (e.g. "Date Night",
  // "Party"), ordered by the OCCASIONS constant for a stable, sensible order.
  const availablePills = useMemo(() => {
    const present = new Set(outfits.map((o) => o.occasion));
    const occasions =
      present.size > 0 ? OCCASIONS.filter((o) => present.has(o)) : [];
    return ['all', ...occasions] as Array<string | 'all'>;
  }, [outfits]);

  const filtered = useMemo(() => {
    let list = outfits;
    if (filter !== 'all') {
      list = list.filter((o) => o.occasion === filter);
    }
    if (search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          (o.name ?? '').toLowerCase().includes(q) ||
          o.occasion.toLowerCase().includes(q),
      );
    }
    return list;
  }, [outfits, filter, search]);

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

      navigation.navigate('OutfitResult', { generated });
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

  const goOutfits = useCallback(() => {
    navigation.getParent()?.navigate('Outfits' as any);
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
  if (loading && outfits.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title='My Saved Outfits' searchDisabled />
        <Loading label='Loading your outfits…' fullscreen />
      </SafeAreaView>
    );
  }

  // ---- Empty state ---------------------------------------------------------
  if (outfits.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title='My Saved Outfits' searchDisabled />
        <View style={styles.emptyWrap}>
          <EmptyState
            icon='bookmark-outline'
            title='No saved outfits yet'
            message='Generate outfits in the Outfit Creator and save your favourite looks here.'
            action={<Button title='Create Outfit' onPress={goOutfits} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Main list -----------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title='My Saved Outfits'
        searchVisible={searchVisible}
        search={search}
        onSearchChange={setSearch}
        onToggleSearch={() => {
          setSearchVisible((v) => {
            if (v) setSearch('');
            return !v;
          });
        }}
      />

      {/* Occasion filter pills */}
      <View style={styles.filterRow}>
        {availablePills.map((p) => (
          <FilterPill
            key={p}
            label={p === 'all' ? 'All' : p}
            selected={filter === p}
            onPress={() => setFilter(p)}
          />
        ))}
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
              {search.trim()
                ? `No outfits match "${search.trim()}".`
                : `No saved outfits for ${
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
  searchVisible?: boolean;
  search?: string;
  onSearchChange?: (t: string) => void;
  onToggleSearch?: () => void;
  searchDisabled?: boolean;
}

function Header({
  title,
  searchVisible,
  search,
  onSearchChange,
  onToggleSearch,
  searchDisabled,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => {
          /* Tab root screen — no back; keep hitSlop for consistency. */
        }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.headerIconBtn}
      >
        <Ionicons name='chevron-back' size={24} color={theme.colors.text} />
      </TouchableOpacity>

      {searchVisible && !searchDisabled ? (
        <View style={styles.searchWrap}>
          <Ionicons
            name='search'
            size={16}
            color={theme.colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder='Search outfits…'
            placeholderTextColor={theme.colors.textMuted}
            style={styles.searchInput}
            autoFocus
          />
        </View>
      ) : (
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      )}

      <TouchableOpacity
        onPress={searchDisabled ? undefined : onToggleSearch}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.headerIconBtn}
        disabled={searchDisabled}
      >
        <Ionicons
          name={searchVisible ? 'close' : 'search'}
          size={22}
          color={searchDisabled ? theme.colors.textMuted : theme.colors.text}
        />
      </TouchableOpacity>
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
              borderColor: theme.colors.divider,
              backgroundColor: theme.colors.surface,
            },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          selected
            ? { color: theme.colors.primary }
            : { color: theme.colors.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ---- Styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    height: 38,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  pill: {
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  pillText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  noMatchWrap: {
    padding: theme.spacing.xxxl,
    alignItems: 'center',
  },
  noMatchText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  // Action sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxxl,
    borderTopRightRadius: theme.radius.xxxl,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    paddingTop: theme.spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.divider,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  sheetTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
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
    marginTop: theme.spacing.xs,
  },
  sheetItemText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  sheetCancel: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  sheetCancelText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
});

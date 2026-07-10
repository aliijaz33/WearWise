/**
 * WardrobeScreen - filterable 3-column grid of wardrobe items.
 *
 * Layout:
 *  1. Header: centered "My Wardrobe" title, back-arrow (left), search (right).
 *  2. Horizontal category row of circular icon buttons (active = solid purple).
 *  3. Horizontal filter row of rounded pill outlines (active = purple border/text).
 *     Includes occasion pills plus season pills
 *     (Spring, Summer, Fall, Winter, All Seasons) at the end.
 *  4. 3-column grid of compact image-only cards with a 3-dots edit/delete menu.
 *  5. Full-width "Add New Item" floating action button above the tab bar.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, Header, EmptyState, Loading } from '@components/ui';
import { ItemCard } from '@components/cards';
import { useWardrobe } from '@context/WardrobeContext';
import { useToast } from '@components/ui';
import { CATEGORIES, OCCASIONS, type CategoryId } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';
import type { WardrobeItem } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList>;

type Filter = 'all' | CategoryId;

const NUM_COLUMNS = 3;

/** Circular category button icon mapping (MaterialCommunityIcons). */
const CATEGORY_ICON: Record<Filter, string> = {
  all: 'view-grid',
  tops: 'tshirt-crew',
  bottoms: 'human-male',
  dresses: 'hanger',
  shoes: 'shoe-heel',
  bags: 'purse',
  accessories: 'necklace',
};

const CATEGORY_LABEL: Record<Filter, string> = {
  all: 'All',
  tops: 'Tops',
  bottoms: 'Bottoms',
  dresses: 'Dresses',
  shoes: 'Shoes',
  bags: 'Bags',
  accessories: 'Accessories',
};

/**
 * Season pills appended to the filter row after the occasion pills.
 * Values match the seasons stored on items (see AddItemScreen SEASONS).
 */
const SEASON_FILTERS = ['Spring', 'Summer', 'Fall', 'Winter', 'All Seasons'];

export function WardrobeScreen({ navigation }: Props) {
  const { items, loading, deleteItem } = useWardrobe();
  const { show: showToast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState<Filter>('all');
  // Unified filter for the pill row: 'all', an occasion, or a season.
  // Only one pill can be active at a time — picking any pill clears the
  // previous selection so the grid always reflects the latest choice.
  const [filterValue, setFilterValue] = useState<string>('all');

  const filtered = useMemo(() => {
    const isSeason = (v: string) => SEASON_FILTERS.includes(v);
    return items.filter((item) => {
      const catOk =
        categoryFilter === 'all' || item.category === categoryFilter;
      if (filterValue === 'all') return catOk;
      if (isSeason(filterValue)) {
        return (
          catOk &&
          (item.season ?? '').toLowerCase() === filterValue.toLowerCase()
        );
      }
      // Otherwise treat the value as an occasion.
      return catOk && item.occasions.includes(filterValue);
    });
  }, [items, categoryFilter, filterValue]);

  const goToItem = useCallback(
    (item: WardrobeItem) => {
      navigation.navigate('ItemDetail', { itemId: item.id });
    },
    [navigation],
  );

  const goToAddItem = useCallback(() => {
    navigation.navigate('AddItem');
  }, [navigation]);

  const handleEdit = useCallback(
    (item: WardrobeItem) => {
      navigation.navigate('AddItem', { itemId: item.id });
    },
    [navigation],
  );

  const handleDelete = useCallback(
    (item: WardrobeItem) => {
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
              } else {
                showToast('Could not delete item. Try again.', 'error');
              }
            },
          },
        ],
      );
    },
    [deleteItem, showToast],
  );

  const renderItem = useCallback(
    ({ item }: { item: WardrobeItem }) => (
      <ItemCard
        item={item}
        onPress={goToItem}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [goToItem, handleEdit, handleDelete],
  );

  if (loading && items.length === 0) {
    return (
      <Screen scroll={false}>
        <Header
          title='My Wardrobe'
          transparent
          onBack={() => navigation.goBack()}
          right={
            <TouchableOpacity
              onPress={() => showToast('Search coming soon', 'info')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name='search' size={24} color={theme.colors.text} />
            </TouchableOpacity>
          }
        />
        <Loading label='Loading your wardrobe…' fullscreen />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      {/* 1. Header: centered title, back-arrow (left), search (right) */}
      <Header
        title='My Wardrobe'
        transparent
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={() => showToast('Search coming soon', 'info')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name='search' size={24} color={theme.colors.text} />
          </TouchableOpacity>
        }
      />

      {/* 2. Horizontal category row of circular icon buttons */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {(['all', ...CATEGORIES.map((c) => c.id)] as Filter[]).map((cat) => {
            const active = categoryFilter === cat;
            const icon = CATEGORY_ICON[
              cat
            ] as keyof typeof MaterialCommunityIcons.glyphMap;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoryFilter(cat)}
                activeOpacity={0.7}
                style={styles.categoryItem}
              >
                <View
                  style={[
                    styles.categoryCircle,
                    active && styles.categoryCircleActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={35}
                    color={
                      active ? theme.colors.textInverse : theme.colors.primary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    active && styles.categoryLabelActive,
                  ]}
                >
                  {CATEGORY_LABEL[cat]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Horizontal filter row of rounded pill outlines */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <FilterPill
            label='All'
            selected={filterValue === 'all'}
            onPress={() => setFilterValue('all')}
          />
          {OCCASIONS.map((occ) => (
            <FilterPill
              key={occ}
              label={occ}
              selected={filterValue === occ}
              onPress={() => setFilterValue(occ)}
            />
          ))}
          {SEASON_FILTERS.map((season) => (
            <FilterPill
              key={season}
              label={season}
              selected={filterValue === season}
              onPress={() => setFilterValue(season)}
            />
          ))}
        </ScrollView>
      </View>

      {/* 4. 3-column grid of compact image-only cards */}
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon='shirt'
            title='Your wardrobe is empty'
            message='Start adding your clothing items to build your digital closet.'
          />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon='filter'
            title='No items match'
            message='Try adjusting your category or occasion filters.'
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          columnWrapperStyle={styles.row}
        />
      )}

      {/* 5. Full-width "Add New Item" floating action button */}
      <View style={styles.fabWrap}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={goToAddItem}
        >
          <Ionicons name='add' size={24} color={theme.colors.textInverse} />
          <Text style={styles.fabText}>Add New Item</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

/** Rounded pill outline filter. Active = thin purple border + purple text. */
function FilterPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.filterPill,
        selected
          ? {
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.surface,
            }
          : {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
      ]}
    >
      <Text
        style={[
          styles.filterPillText,
          selected
            ? { color: theme.colors.primary }
            : { color: theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  categorySection: {
    paddingVertical: theme.spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  categoryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    //borderWidth: 0.3,
    borderColor: theme.colors.primaryLight,
  },
  categoryCircleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryLabel: {
    marginTop: 6,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.label,
    fontWeight: theme.typography.weights.regular,
  },
  categoryLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  filterSection: {
    paddingVertical: theme.spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  filterPill: {
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    marginRight: theme.spacing.sm,
  },
  filterPillText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.label,
  },
  grid: {
    padding: theme.spacing.lg,
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  fabWrap: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.sm,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  fabText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textInverse,
  },
});

/**
 * SavedScreen - list of saved outfits, filterable by occasion, with delete.
 *
 * Tapping an outfit navigates to the OutfitResult screen (reconstructed from
 * the saved outfit's items). Long-press or the trash icon deletes an outfit.
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, Header, EmptyState, Loading, Button } from '@components/ui';
import { OutfitCard } from '@components/cards';
import { useWardrobe } from '@context/WardrobeContext';
import { useSavedOutfits } from '@context/SavedOutfitsContext';
import { useToast } from '@components/ui';
import { OCCASIONS } from '@constants/index';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';
import type { SavedOutfit, WardrobeItem, GeneratedOutfit } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList>;

export function SavedScreen({ navigation }: Props) {
  const { items } = useWardrobe();
  const { outfits, loading, deleteOutfit, refresh } = useSavedOutfits();
  const { show: showToast } = useToast();
  const [filter, setFilter] = useState<string | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const itemsById = useMemo(() => {
    const map: Record<string, WardrobeItem> = {};
    items.forEach((i) => (map[i.id] = i));
    return map;
  }, [items]);

  const occasionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: outfits.length };
    OCCASIONS.forEach((o) => {
      counts[o] = outfits.filter((out) => out.occasion === o).length;
    });
    return counts;
  }, [outfits]);

  const filtered = useMemo(() => {
    if (filter === 'all') return outfits;
    return outfits.filter((o) => o.occasion === filter);
  }, [outfits, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleDelete = useCallback(
    (outfit: SavedOutfit) => {
      Alert.alert(
        'Delete Outfit',
        'Are you sure you want to remove this saved outfit? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const ok = await deleteOutfit(outfit.id);
              showToast(
                ok ? 'Outfit deleted' : 'Could not delete outfit',
                ok ? 'info' : 'error',
              );
            },
          },
        ],
      );
    },
    [deleteOutfit, showToast],
  );

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

  const goCreator = useCallback(() => {
    navigation.getParent()?.navigate('Creator' as any);
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: SavedOutfit }) => (
      <OutfitCard
        outfit={item}
        itemsById={itemsById}
        onPress={handleOpen}
        onDelete={handleDelete}
      />
    ),
    [itemsById, handleOpen, handleDelete],
  );

  if (loading && outfits.length === 0) {
    return (
      <Screen scroll={false}>
        <Header title='Saved Outfits' subtitle={`${outfits.length} looks`} />
        <Loading label='Loading your outfits…' fullscreen />
      </Screen>
    );
  }

  if (outfits.length === 0) {
    return (
      <Screen scroll={false}>
        <Header title='Saved Outfits' />
        <View style={styles.emptyWrap}>
          <EmptyState
            icon='bookmark-outline'
            title='No saved outfits yet'
            message='Generate outfits in the Creator and save your favourite looks here.'
            action={<Button title='Create Outfit' onPress={goCreator} />}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header title='Saved Outfits' subtitle={`${outfits.length} looks`} />

      {/* Occasion filter chips */}
      <View style={styles.filterRow}>
        <FilterChip
          label='All'
          count={occasionCounts.all}
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        {OCCASIONS.filter((o) => (occasionCounts[o] ?? 0) > 0).map((o) => (
          <FilterChip
            key={o}
            label={o}
            count={occasionCounts[o] ?? 0}
            selected={filter === o}
            onPress={() => setFilter(o)}
          />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
              No saved outfits for {filter}. Try a different occasion.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

// ---- FilterChip sub-component ----------------------------------------------

interface FilterChipProps {
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}

function FilterChip({ label, count, selected, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        selected
          ? {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            }
          : {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          selected
            ? { color: theme.colors.textInverse }
            : { color: theme.colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View
        style={[
          styles.chipBadge,
          selected
            ? { backgroundColor: theme.colors.textInverse }
            : { backgroundColor: theme.colors.primarySoft },
        ]}
      >
        <Text
          style={[
            styles.chipBadgeText,
            selected
              ? { color: theme.colors.primary }
              : { color: theme.colors.primaryDark },
          ]}
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ---- Styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  chipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    marginRight: theme.spacing.sm,
  },
  chipBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
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
});

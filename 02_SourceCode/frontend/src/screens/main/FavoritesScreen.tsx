/**
 * FavoritesScreen - placeholder for the Favorites tab.
 *
 * Shows favorited wardrobe items / outfits. Currently an empty state until a
 * favorites backend (is_favorite flag on wardrobe_items / saved_outfits) is
 * wired up. The "Favorites" count on the Profile "My Stats" section reads from
 * this screen's data source once implemented.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, Header, EmptyState, Button } from '@components/ui';
import { theme } from '@theme/theme';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList>;

export function FavoritesScreen({ navigation }: Props) {
  const goWardrobe = () => {
    navigation.getParent()?.navigate('Wardrobe' as any);
  };

  return (
    <Screen scroll={false}>
      <Header title='Favorites' />
      <View style={styles.emptyWrap}>
        <EmptyState
          icon='heart-outline'
          title='No favorites yet'
          message='Tap the heart on any wardrobe item or saved outfit to keep your favourite looks here.'
          action={<Button title='Browse Wardrobe' onPress={goWardrobe} />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});

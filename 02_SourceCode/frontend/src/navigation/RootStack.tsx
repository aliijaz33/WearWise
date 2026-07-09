/**
 * RootStack - wraps the MainTabs + modal/pushed screens (AddItem, OutfitResult, ItemDetail).
 * WardrobeProvider + SavedOutfitsProvider wrap the authenticated area so all
 * main screens and modal screens share the same wardrobe / saved-outfit state.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainTabs } from './MainTabs';
import { AddItemScreen } from '@screens/main/AddItemScreen';
import { OutfitResultScreen } from '@screens/main/OutfitResultScreen';
import { ItemDetailScreen } from '@screens/main/ItemDetailScreen';
import { WardrobeProvider } from '@context/WardrobeContext';
import { SavedOutfitsProvider } from '@context/SavedOutfitsContext';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <WardrobeProvider>
      <SavedOutfitsProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name='Main' component={MainTabs} />
          <Stack.Screen
            name='AddItem'
            component={AddItemScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name='OutfitResult' component={OutfitResultScreen} />
          <Stack.Screen name='ItemDetail' component={ItemDetailScreen} />
        </Stack.Navigator>
      </SavedOutfitsProvider>
    </WardrobeProvider>
  );
}

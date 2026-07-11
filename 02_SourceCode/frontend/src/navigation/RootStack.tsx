// RootStack - wraps MainTabs + modal/pushed screens with shared providers.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainTabs } from './MainTabs';
import { AddItemScreen } from '@screens/main/AddItemScreen';
import { OutfitResultScreen } from '@screens/main/OutfitResultScreen';
import { ItemDetailScreen } from '@screens/main/ItemDetailScreen';
import { CreatorScreen } from '@screens/main/CreatorScreen';
import { MyMeasurementsScreen } from '@screens/main/MyMeasurementsScreen';
import { MyPreferencesScreen } from '@screens/main/MyPreferencesScreen';
import { ReminderSettingsScreen } from '@screens/main/ReminderSettingsScreen';
import { HelpSupportScreen } from '@screens/main/HelpSupportScreen';
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
          <Stack.Screen name='AddItem' component={AddItemScreen} />
          <Stack.Screen name='OutfitResult' component={OutfitResultScreen} />
          <Stack.Screen name='ItemDetail' component={ItemDetailScreen} />
          <Stack.Screen name='Creator' component={CreatorScreen} />
          <Stack.Screen
            name='MyMeasurements'
            component={MyMeasurementsScreen}
          />
          <Stack.Screen name='MyPreferences' component={MyPreferencesScreen} />
          <Stack.Screen
            name='ReminderSettings'
            component={ReminderSettingsScreen}
          />
          <Stack.Screen name='HelpSupport' component={HelpSupportScreen} />
        </Stack.Navigator>
      </SavedOutfitsProvider>
    </WardrobeProvider>
  );
}

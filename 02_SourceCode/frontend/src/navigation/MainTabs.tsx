/**
 * MainTabs - bottom tab navigation: Home, Wardrobe, Creator, Saved, Profile.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '@screens/main/HomeScreen';
import { WardrobeScreen } from '@screens/main/WardrobeScreen';
import { CreatorScreen } from '@screens/main/CreatorScreen';
import { SavedScreen } from '@screens/main/SavedScreen';
import { ProfileScreen } from '@screens/main/ProfileScreen';
import { theme } from '@theme/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { active: IconName; inactive: IconName }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Wardrobe: { active: 'grid', inactive: 'grid-outline' },
  Creator: { active: 'sparkles', inactive: 'sparkles-outline' },
  Saved: { active: 'bookmark', inactive: 'bookmark-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName='Home'
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.divider,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name as keyof MainTabParamList];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name='Home' component={HomeScreen} />
      <Tab.Screen name='Wardrobe' component={WardrobeScreen} />
      <Tab.Screen name='Creator' component={CreatorScreen} />
      <Tab.Screen name='Saved' component={SavedScreen} />
      <Tab.Screen name='Profile' component={ProfileScreen} />
    </Tab.Navigator>
  );
}

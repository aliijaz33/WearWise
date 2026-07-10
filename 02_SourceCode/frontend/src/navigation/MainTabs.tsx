/**
 * MainTabs - bottom tab navigation: Home, Wardrobe, Outfits, Favorites, Profile.
 *
 * Tab mapping (per client spec):
 *  - Home      → HomeScreen        (clean outline house — Feather 'home')
 *  - Wardrobe  → WardrobeScreen    (line-art clothes hanger — Feather 'loader' fallback not used; MaterialCommunityIcons 'hanger')
 *  - Outfits   → SavedScreen       (unfilled line-art t-shirt — MaterialCommunityIcons 'tshirt-crew-outline')
 *  - Favorites → FavoritesScreen   (standard line heart — Feather 'heart')
 *  - Profile   → ProfileScreen     (active = solid filled purple circle w/ white avatar; inactive = outline)
 *
 * Design notes (floating rounded tab bar):
 *  - The bar floats above the screen content with horizontal margins, large
 *    corner radius, and a soft purple shadow — matching the client design.
 *  - Active state is indicated ONLY by color (icon + label → brand purple).
 *    There is NO bottom dot indicator.
 *  - Each of the 5 tabs is distributed evenly (flex: 1) inside a
 *    space-around row, with content centered vertically.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '@screens/main/HomeScreen';
import { WardrobeScreen } from '@screens/main/WardrobeScreen';
import { SavedScreen } from '@screens/main/SavedScreen';
import { FavoritesScreen } from '@screens/main/FavoritesScreen';
import { ProfileScreen } from '@screens/main/ProfileScreen';
import { theme } from '@theme/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ACTIVE = theme.colors.primary; // #5D38F5
const INACTIVE = theme.colors.textMuted; // #B0ACBF

/**
 * Profile tab icon.
 * - Active: solid filled purple circle with a crisp white human avatar
 *   outline centered inside it.
 * - Inactive: a plain line-art person outline in the muted color.
 */
function ProfileTabIcon({
  focused,
  color,
  size,
}: {
  focused: boolean;
  color: string;
  size: number;
}) {
  if (focused) {
    // Solid purple disc with white avatar glyph centered inside.
    const disc = size + 6;
    return (
      <View
        style={[
          styles.profileDisc,
          { width: disc, height: disc, borderRadius: disc / 2 },
        ]}
      >
        <Ionicons
          name='person'
          size={size - 6}
          color={theme.colors.textInverse}
        />
      </View>
    );
  }
  return <Ionicons name='person-outline' size={size} color={color} />;
}

export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName='Home'
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarShowLabel: true,
        // Label: small, semibold, sits just under the icon.
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: theme.typography.weights.semibold,
          marginTop: 2,
        },
        // Each tab item takes equal width and centers its content.
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 6,
        },
        tabBarIconStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        // Floating, rounded tab bar with soft purple shadow.
        tabBarStyle: {
          position: 'absolute',
          bottom: 18,
          left: 16,
          right: 16,
          height: 68,
          backgroundColor: theme.colors.surface,
          borderRadius: 28,
          borderTopWidth: 0,
          borderColor: 'transparent',
          paddingTop: 6,
          paddingBottom: 6,
          paddingHorizontal: 8,
          ...(Platform.select({
            ios: {
              shadowColor: '#5D38F5',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.18,
              shadowRadius: 16,
            },
            android: {
              elevation: 12,
            },
          }) as object),
        },
        tabBarIcon: ({ color, size, focused }) => {
          switch (route.name) {
            case 'Home':
              // Outline when inactive, filled when active.
              return (
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={size}
                  color={color}
                />
              );
            case 'Wardrobe':
              // Hanger is inherently line-art (no filled variant); color
              // change indicates the active state.
              return (
                <MaterialCommunityIcons
                  name='hanger'
                  size={size}
                  color={color}
                />
              );
            case 'Outfits':
              // Filled t-shirt when active, outline when inactive.
              return (
                <MaterialCommunityIcons
                  name={focused ? 'tshirt-crew' : 'tshirt-crew-outline'}
                  size={size}
                  color={color}
                />
              );
            case 'Favorites':
              // Filled heart when active, outline when inactive.
              return (
                <Ionicons
                  name={focused ? 'heart' : 'heart-outline'}
                  size={size}
                  color={color}
                />
              );
            case 'Profile':
              return (
                <ProfileTabIcon focused={focused} color={color} size={size} />
              );
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen name='Home' component={HomeScreen} />
      <Tab.Screen name='Wardrobe' component={WardrobeScreen} />
      <Tab.Screen name='Outfits' component={SavedScreen} />
      <Tab.Screen name='Favorites' component={FavoritesScreen} />
      <Tab.Screen name='Profile' component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  profileDisc: {
    backgroundColor: ACTIVE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

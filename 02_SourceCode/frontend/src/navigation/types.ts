/**
 * Navigation type definitions for React Navigation.
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { GeneratedOutfit } from '@/types';

// ---- Auth Stack -----------------------------------------------------------
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
};

export type WelcomeScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Welcome'
>;
export type LoginScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
>;
export type SignupScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Signup'
>;

// ---- Main Tabs ------------------------------------------------------------
export type MainTabParamList = {
  Home: undefined;
  Wardrobe: undefined;
  Outfits: undefined;
  Favorites: undefined;
  Profile: undefined;
};

export type HomeTabProps = BottomTabScreenProps<MainTabParamList, 'Home'>;
export type WardrobeTabProps = BottomTabScreenProps<
  MainTabParamList,
  'Wardrobe'
>;
export type OutfitsTabProps = BottomTabScreenProps<MainTabParamList, 'Outfits'>;
export type FavoritesTabProps = BottomTabScreenProps<
  MainTabParamList,
  'Favorites'
>;
export type ProfileTabProps = BottomTabScreenProps<MainTabParamList, 'Profile'>;

// ---- Root Stack (wraps tabs + modal screens) -----------------------------
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AddItem: { itemId?: string } | undefined;
  OutfitResult:
    | { generated: GeneratedOutfit; savedId?: string; isFavorite?: boolean }
    | undefined;
  ItemDetail: { itemId: string };
  Creator: undefined;
  MyMeasurements: undefined;
  MyPreferences: undefined;
  ReminderSettings: undefined;
  HelpSupport: undefined;
};

export type AddItemScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'AddItem'
>;
export type OutfitResultScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'OutfitResult'
>;
export type ItemDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ItemDetail'
>;
export type CreatorScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Creator'
>;
export type MyMeasurementsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'MyMeasurements'
>;
export type MyPreferencesScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'MyPreferences'
>;
export type ReminderSettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ReminderSettings'
>;
export type HelpSupportScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'HelpSupport'
>;

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
  Creator: undefined;
  Saved: undefined;
  Profile: undefined;
};

export type HomeTabProps = BottomTabScreenProps<MainTabParamList, 'Home'>;
export type WardrobeTabProps = BottomTabScreenProps<
  MainTabParamList,
  'Wardrobe'
>;
export type CreatorTabProps = BottomTabScreenProps<MainTabParamList, 'Creator'>;
export type SavedTabProps = BottomTabScreenProps<MainTabParamList, 'Saved'>;
export type ProfileTabProps = BottomTabScreenProps<MainTabParamList, 'Profile'>;

// ---- Root Stack (wraps tabs + modal screens) -----------------------------
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AddItem: { itemId?: string } | undefined;
  OutfitResult: { generated: GeneratedOutfit } | undefined;
  ItemDetail: { itemId: string };
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

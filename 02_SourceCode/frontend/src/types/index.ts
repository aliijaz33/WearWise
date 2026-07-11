// WearWise TypeScript domain types (mirror the Supabase database schema).

import type { CategoryId } from '@constants/index';

export interface Measurements {
  height: string | null;
  chest: string | null;
  waist: string | null;
  hips: string | null;
  shoe_size: string | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  profile_picture_url: string | null;
  measurements: Measurements | null;
  notification_enabled: boolean | null;
  preferences: {
    style_preferences: string[];
    default_occasion: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  category: CategoryId;
  type: string;
  color: string;
  color_hex: string | null;
  occasions: string[];
  season: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WardrobeItemInput {
  image_url: string;
  category: CategoryId;
  type: string;
  color: string;
  color_hex: string | null;
  occasions: string[];
  season: string | null;
  notes: string | null;
}

export interface SavedOutfit {
  id: string;
  user_id: string;
  // Optional custom display name (defaults to the occasion label).
  name: string | null;
  occasion: string;
  weather: string | null;
  style_preferences: string[];
  rationale: string | null;
  // Ordered item references: top, bottom, dress, shoes, bag, accessories
  item_ids: string[];
  // Heart toggle — synced to the saved_outfits table.
  is_favorite: boolean;
  created_at: string;
}

export interface SavedOutfitInput {
  // Optional custom display name. Falls back to the occasion label.
  name?: string | null;
  occasion: string;
  weather: string | null;
  style_preferences: string[];
  rationale: string | null;
  item_ids: string[];
}

// Partial update payload for a saved outfit (edit name / toggle favorite).
export interface SavedOutfitUpdate {
  name?: string | null;
  is_favorite?: boolean;
}

// A generated (not yet saved) outfit returned by the recommendation engine.
export interface GeneratedOutfit {
  occasion: string;
  weather: string | null;
  style_preferences: string[];
  top: WardrobeItem | null;
  bottom: WardrobeItem | null;
  dress: WardrobeItem | null;
  shoes: WardrobeItem | null;
  bag: WardrobeItem | null;
  accessories: WardrobeItem[];
  rationale: string;
  item_ids: string[];
}

export interface OutfitRequest {
  occasion: string;
  weather: string | null;
  style_preferences: string[];
}

export interface UserStats {
  totalItems: number;
  itemsByCategory: Record<CategoryId, number>;
  totalOutfits: number;
  outfitsByOccasion: Record<string, number>;
}

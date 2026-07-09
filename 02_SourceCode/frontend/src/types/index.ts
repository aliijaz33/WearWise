/**
 * WearWise TypeScript domain types.
 * These mirror the Supabase database schema (see backend/supabase/migrations).
 */

import type { CategoryId } from '@constants/index';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
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
  occasion: string;
  weather: string | null;
  style_preferences: string[];
  rationale: string | null;
  /** Ordered item references: top, bottom, dress, shoes, bag, accessories */
  item_ids: string[];
  created_at: string;
}

export interface SavedOutfitInput {
  occasion: string;
  weather: string | null;
  style_preferences: string[];
  rationale: string | null;
  item_ids: string[];
}

/** A generated (not yet saved) outfit returned by the recommendation engine. */
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

/**
 * Saved Outfits service - persist & retrieve generated outfits.
 */

import { supabase } from './supabase';
import type { SavedOutfit, SavedOutfitInput } from '@/types';

export const savedOutfitsService = {
  async list(userId: string): Promise<SavedOutfit[]> {
    const { data, error } = await supabase
      .from('saved_outfits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as SavedOutfit[];
  },

  async create(
    userId: string,
    input: SavedOutfitInput,
  ): Promise<SavedOutfit | null> {
    const { data, error } = await supabase
      .from('saved_outfits')
      .insert({ ...input, user_id: userId })
      .select()
      .single();

    if (error || !data) return null;
    return data as SavedOutfit;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('saved_outfits')
      .delete()
      .eq('id', id);
    return !error;
  },
};

// Wardrobe service - CRUD for wardrobe items + photo upload to Supabase Storage.

import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import { STORAGE_BUCKET } from '@constants/index';
import type { WardrobeItem, WardrobeItemInput } from '@/types';

function userIdPath(userId: string): string {
  return `${userId}`;
}

export const wardrobeService = {
  // Upload a photo to the user's folder in the item-photos bucket (base64 → ArrayBuffer).
  async uploadPhoto(
    userId: string,
    uri: string,
    mimeType: string,
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${userIdPath(userId)}/${fileName}`;
      const contentType = mimeType || 'image/jpeg';

      // Read the local file as base64, then decode to an ArrayBuffer.
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, arrayBuffer, {
          contentType,
          upsert: false,
          cacheControl: '3600',
        });

      if (uploadError) {
        // eslint-disable-next-line no-console
        console.warn('[WearWise] Photo upload failed:', uploadError.message);
        return { url: null, error: uploadError.message };
      }

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return { url: data.publicUrl, error: null };
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.warn('[WearWise] Photo upload exception:', e?.message ?? e);
      return { url: null, error: e?.message ?? 'Upload failed' };
    }
  },

  async list(userId: string): Promise<WardrobeItem[]> {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[WearWise] list items error:', error.message);
      return [];
    }
    return (data as WardrobeItem[]) ?? [];
  },

  async create(
    userId: string,
    input: WardrobeItemInput,
  ): Promise<WardrobeItem | null> {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert({ ...input, user_id: userId })
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[WearWise] create item error:', error.message);
      return null;
    }
    return data as WardrobeItem;
  },

  async update(
    id: string,
    updates: Partial<WardrobeItemInput>,
  ): Promise<WardrobeItem | null> {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[WearWise] update item error:', error.message);
      return null;
    }
    return data as WardrobeItem;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', id);
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[WearWise] delete item error:', error.message);
      return false;
    }
    return true;
  },

  async getByIds(ids: string[]): Promise<WardrobeItem[]> {
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .in('id', ids);

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[WearWise] getByIds error:', error.message);
      return [];
    }
    return (data as WardrobeItem[]) ?? [];
  },
};

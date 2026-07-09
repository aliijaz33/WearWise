/**
 * Supabase client initialization.
 * Uses EXPO_PUBLIC_ env vars (inlined by Expo at build time) and SecureStore
 * for persistent auth sessions on both iOS and Android.
 *
 * SecureStore has a ~2048 byte value limit. Supabase session tokens can
 * exceed this, so we split large values across multiple keys (chunking).
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[WearWise] Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in .env',
  );
}

/**
 * Maximum byte size for a single SecureStore value.
 * SecureStore enforces a ~2048 byte limit, so we stay safely under it.
 */
const CHUNK_SIZE = 1800;

/** Prefix used to mark a value that has been split into chunks. */
const CHUNK_COUNT_SUFFIX = '__chunk_count';
const CHUNK_INDEX_SUFFIX = '__chunk_';

/**
 * Stores a value in SecureStore, automatically splitting it into chunks
 * when it exceeds the SecureStore byte limit (~2048 bytes).
 */
async function secureSetItem(key: string, value: string): Promise<void> {
  // Remove any previously stored chunks for this key.
  await secureRemoveItem(key);

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  // Value is too large – split into chunks.
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  await SecureStore.setItemAsync(
    `${key}${CHUNK_COUNT_SUFFIX}`,
    String(chunks.length),
  );
  for (let i = 0; i < chunks.length; i++) {
    await SecureStore.setItemAsync(
      `${key}${CHUNK_INDEX_SUFFIX}${i}`,
      chunks[i],
    );
  }
}

/**
 * Retrieves a value from SecureStore, reassembling chunks if necessary.
 */
async function secureGetItem(key: string): Promise<string | null> {
  // Check whether this key was chunked.
  const countStr = await SecureStore.getItemAsync(
    `${key}${CHUNK_COUNT_SUFFIX}`,
  ).catch(() => null);

  if (countStr) {
    const count = parseInt(countStr, 10);
    if (Number.isNaN(count) || count <= 0) {
      // Corrupt metadata – fall back to direct read.
      return await SecureStore.getItemAsync(key).catch(() => null);
    }
    let assembled = '';
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(
        `${key}${CHUNK_INDEX_SUFFIX}${i}`,
      ).catch(() => null);
      if (chunk === null) {
        // Missing chunk – data is corrupt.
        return null;
      }
      assembled += chunk;
    }
    return assembled;
  }

  // Not chunked – read directly.
  return await SecureStore.getItemAsync(key).catch(() => null);
}

/**
 * Removes a value (and any associated chunks) from SecureStore.
 */
async function secureRemoveItem(key: string): Promise<void> {
  const countStr = await SecureStore.getItemAsync(
    `${key}${CHUNK_COUNT_SUFFIX}`,
  ).catch(() => null);

  if (countStr) {
    const count = parseInt(countStr, 10);
    if (!Number.isNaN(count) && count > 0) {
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(
          `${key}${CHUNK_INDEX_SUFFIX}${i}`,
        ).catch(() => {});
      }
    }
    await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(
      () => {},
    );
  }

  await SecureStore.deleteItemAsync(key).catch(() => {});
}

/**
 * Custom storage adapter backed by expo-secure-store (Keychain on iOS,
 * Keystore on Android) with automatic chunking for large values.
 * Falls back to localStorage on web.
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    try {
      return await secureGetItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await secureSetItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await secureRemoveItem(key);
  },
};

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

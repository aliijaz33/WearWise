/**
 * WardrobeContext - shared wardrobe item state across Home, Wardrobe, Creator.
 * Loads items once and exposes refresh/add/update/delete helpers.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { wardrobeService } from '@services/wardrobeService';
import { useAuth } from './AuthContext';
import type { WardrobeItem, WardrobeItemInput } from '@/types';

interface WardrobeContextValue {
  items: WardrobeItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (input: WardrobeItemInput) => Promise<WardrobeItem | null>;
  updateItem: (
    id: string,
    updates: Partial<WardrobeItemInput>,
  ) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  getById: (id: string) => WardrobeItem | undefined;
}

const WardrobeContext = createContext<WardrobeContextValue | undefined>(
  undefined,
);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const data = await wardrobeService.list(user.id);
    setItems(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (input: WardrobeItemInput): Promise<WardrobeItem | null> => {
      if (!user) return null;
      const created = await wardrobeService.create(user.id, input);
      if (created) {
        setItems((prev) => [created, ...prev]);
      }
      return created;
    },
    [user],
  );

  const updateItem = useCallback(
    async (
      id: string,
      updates: Partial<WardrobeItemInput>,
    ): Promise<boolean> => {
      const updated = await wardrobeService.update(id, updates);
      if (updated) {
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
        return true;
      }
      return false;
    },
    [],
  );

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    const ok = await wardrobeService.remove(id);
    if (ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
    return ok;
  }, []);

  const getById = useCallback(
    (id: string) => items.find((i) => i.id === id),
    [items],
  );

  return (
    <WardrobeContext.Provider
      value={{
        items,
        loading,
        refresh,
        addItem,
        updateItem,
        deleteItem,
        getById,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe(): WardrobeContextValue {
  const ctx = useContext(WardrobeContext);
  if (!ctx)
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  return ctx;
}

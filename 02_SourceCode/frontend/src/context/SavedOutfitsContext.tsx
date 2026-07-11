// SavedOutfitsContext - shared saved outfits state across Home, Saved, Creator.

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { savedOutfitsService } from '@services/savedOutfitsService';
import { useAuth } from './AuthContext';
import type { SavedOutfit, SavedOutfitInput, SavedOutfitUpdate } from '@/types';

interface SavedOutfitsContextValue {
  outfits: SavedOutfit[];
  loading: boolean;
  refresh: () => Promise<void>;
  addOutfit: (input: SavedOutfitInput) => Promise<SavedOutfit | null>;
  updateOutfit: (id: string, patch: SavedOutfitUpdate) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
  deleteOutfit: (id: string) => Promise<boolean>;
}

const SavedOutfitsContext = createContext<SavedOutfitsContextValue | undefined>(
  undefined,
);

export function SavedOutfitsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setOutfits([]);
      return;
    }
    setLoading(true);
    const data = await savedOutfitsService.list(user.id);
    setOutfits(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addOutfit = useCallback(
    async (input: SavedOutfitInput): Promise<SavedOutfit | null> => {
      if (!user) return null;
      const created = await savedOutfitsService.create(user.id, input);
      if (created) {
        setOutfits((prev) => [created, ...prev]);
      }
      return created;
    },
    [user],
  );

  const updateOutfit = useCallback(
    async (id: string, patch: SavedOutfitUpdate): Promise<boolean> => {
      const updated = await savedOutfitsService.update(id, patch);
      if (updated) {
        setOutfits((prev) =>
          prev.map((o) => (o.id === id ? { ...o, ...updated } : o)),
        );
      }
      return !!updated;
    },
    [],
  );

  const toggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistic update: flip the heart immediately, then sync; roll back on failure.
      const current = outfits.find((o) => o.id === id);
      if (!current) return false;
      const nextVal = !current.is_favorite;
      setOutfits((prev) =>
        prev.map((o) => (o.id === id ? { ...o, is_favorite: nextVal } : o)),
      );
      const updated = await savedOutfitsService.update(id, {
        is_favorite: nextVal,
      });
      if (!updated) {
        // Roll back.
        setOutfits((prev) =>
          prev.map((o) => (o.id === id ? { ...o, ...current } : o)),
        );
        return false;
      }
      return true;
    },
    [outfits],
  );

  const deleteOutfit = useCallback(async (id: string): Promise<boolean> => {
    const ok = await savedOutfitsService.remove(id);
    if (ok) {
      setOutfits((prev) => prev.filter((o) => o.id !== id));
    }
    return ok;
  }, []);

  return (
    <SavedOutfitsContext.Provider
      value={{
        outfits,
        loading,
        refresh,
        addOutfit,
        updateOutfit,
        toggleFavorite,
        deleteOutfit,
      }}
    >
      {children}
    </SavedOutfitsContext.Provider>
  );
}

export function useSavedOutfits(): SavedOutfitsContextValue {
  const ctx = useContext(SavedOutfitsContext);
  if (!ctx)
    throw new Error(
      'useSavedOutfits must be used within a SavedOutfitsProvider',
    );
  return ctx;
}

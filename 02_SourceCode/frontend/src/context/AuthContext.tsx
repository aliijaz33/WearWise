// AuthContext - manages the Supabase session, profile, and auth actions.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@services/supabase';
import { authService } from '@services/authService';
import type { Profile } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  initializing: boolean;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    updates: Partial<
      Pick<
        Profile,
        | 'full_name'
        | 'avatar_url'
        | 'profile_picture_url'
        | 'measurements'
        | 'notification_enabled'
        | 'preferences'
      >
    >,
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  const user = session?.user ?? null;

  // Loads the profile for a user (retries for trigger race; manual fallback if missing).
  const loadProfile = useCallback(async (userId: string) => {
    let p: Profile | null = null;

    // Retry up to 3 times — the profile trigger may lag slightly behind the auth event.
    for (let attempt = 0; attempt < 3; attempt++) {
      p = await authService.getProfile(userId);
      if (p) break;
      await new Promise((r) => setTimeout(r, 400));
    }

    // Fallback: create the profile from session metadata if the trigger didn't fire.
    if (!p) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const fullName =
          (authUser.user_metadata?.full_name as string | undefined) ??
          (authUser.user_metadata?.name as string | undefined) ??
          null;
        const { data: created } = await supabase
          .from('profiles')
          .upsert(
            {
              id: authUser.id,
              email: authUser.email ?? '',
              full_name: fullName,
            },
            { onConflict: 'id' },
          )
          .select()
          .single();
        p = (created as Profile) ?? null;
      }
    }

    setProfile(p);
  }, []);

  // Restore session on mount + subscribe to auth changes.
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
      setInitializing(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { error } = await authService.signIn(email, password);
    setLoading(false);
    return { error };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      setLoading(true);
      const { error } = await authService.signUp(email, password, fullName);
      setLoading(false);
      return { error };
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    const { error } = await authService.resetPassword(email);
    setLoading(false);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    await authService.signOut();
    setProfile(null);
    setSession(null);
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const updateProfile = useCallback(
    async (
      updates: Partial<
        Pick<
          Profile,
          | 'full_name'
          | 'avatar_url'
          | 'profile_picture_url'
          | 'measurements'
          | 'notification_enabled'
          | 'preferences'
        >
      >,
    ): Promise<boolean> => {
      if (!user) return false;
      const updated = await authService.updateProfile(user.id, updates);
      if (updated) {
        setProfile(updated);
        return true;
      }

      // Fallback: upsert the profile row so the save never silently fails.
      const { data: created } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email ?? '',
            ...updates,
          },
          { onConflict: 'id' },
        )
        .select()
        .single();
      if (created) {
        setProfile(created as Profile);
        return true;
      }
      return false;
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      initializing,
      loading,
      signIn,
      signUp,
      resetPassword,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [
      session,
      user,
      profile,
      initializing,
      loading,
      signIn,
      signUp,
      resetPassword,
      signOut,
      refreshProfile,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

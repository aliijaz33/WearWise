/**
 * Auth service - wraps Supabase auth + profile operations.
 */

import { supabase } from './supabase';
import type { Profile } from '@/types';

export interface AuthResult {
  user: { id: string; email: string } | null;
  error: string | null;
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Invalid email or password.';
  }
  if (
    m.includes('already registered') ||
    m.includes('already been registered') ||
    m.includes('already in use')
  ) {
    return 'An account with this email already exists.';
  }
  if (m.includes('email')) {
    return 'Please enter a valid email address.';
  }
  if (m.includes('password') && m.includes('at least')) {
    return 'Password must be at least 6 characters.';
  }
  return message || 'Something went wrong. Please try again.';
}

export const authService = {
  async signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      return { user: null, error: mapAuthError(error.message) };
    }

    if (!data.user) {
      return {
        user: null,
        error: 'Unable to create account. Please try again.',
      };
    }

    // Supabase returns a user object even when the email is already
    // registered (when email confirmation is enabled). In that case the
    // `identities` array is empty, meaning no new identity was created.
    // We treat this as a duplicate-email error.
    if (
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      return {
        user: null,
        error:
          'This email is already registered. Please log in or use a different email.',
      };
    }

    return {
      user: { id: data.user.id, email: data.user.email ?? email },
      error: null,
    };
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { user: null, error: mapAuthError(error.message) };
    }

    if (!data.user) {
      return { user: null, error: 'Unable to sign in. Please try again.' };
    }

    return {
      user: { id: data.user.id, email: data.user.email ?? email },
      error: null,
    };
  },

  /**
   * Sign in with Google OAuth. Opens the native browser / auth flow and
   * returns to the app via a deep link.
   */
  async signInWithGoogle(): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'wearwise://auth-callback',
      },
    });

    if (error) {
      return { user: null, error: mapAuthError(error.message) };
    }

    // OAuth redirects away from the app; the session is established via
    // the onAuthStateChange listener once the user returns.
    return { user: null, error: null };
  },

  /**
   * Sign in with Apple OAuth (iOS). Opens the native Sign in with Apple flow.
   */
  async signInWithApple(): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'wearwise://auth-callback',
      },
    });

    if (error) {
      return { user: null, error: mapAuthError(error.message) };
    }

    return { user: null, error: null };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getProfile(userId: string): Promise<Profile | null> {
    // Use maybeSingle() instead of single(): single() throws when no row
    // exists (e.g. the signup trigger hasn't created the profile yet),
    // whereas maybeSingle() simply returns null.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[WearWise] getProfile error:', error.message);
      return null;
    }
    return (data as Profile) ?? null;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'preferences'>>,
  ): Promise<Profile | null> {
    // First try a plain UPDATE. If the profile row doesn't exist yet
    // (trigger didn't fire), this returns 0 rows and we fall back to an
    // upsert so the save never silently fails.
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (data) return data as Profile;

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[WearWise] updateProfile error:', error.message);
    }

    // Fallback: row may not exist – upsert it with the supplied updates.
    const { data: created, error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates }, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (upsertError) {
      // eslint-disable-next-line no-console
      console.warn(
        '[WearWise] updateProfile upsert error:',
        upsertError.message,
      );
      return null;
    }
    return (created as Profile) ?? null;
  },

  async resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
    );
    if (error) return { error: mapAuthError(error.message) };
    return { error: null };
  },
};

// Auth service - wraps Supabase auth + profile operations.

import { supabase } from './supabase';
import type { Profile } from '@/types';

// Base URL of the Netlify-hosted auth pages (email verification + password reset).
// Deploy the web-auth folder to Netlify and update this URL.
const AUTH_SITE_URL = 'https://wearwise-auth.netlify.app';

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
        emailRedirectTo: AUTH_SITE_URL,
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

    // Empty identities array means the email is already registered (duplicate-email error).
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

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getProfile(userId: string): Promise<Profile | null> {
    // maybeSingle() returns null instead of throwing when no profile row exists yet.
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
  ): Promise<Profile | null> {
    // Try a plain UPDATE first; fall back to upsert if the profile row doesn't exist yet.
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
      { redirectTo: `${AUTH_SITE_URL}/reset-password` },
    );
    if (error) return { error: mapAuthError(error.message) };
    return { error: null };
  },
};

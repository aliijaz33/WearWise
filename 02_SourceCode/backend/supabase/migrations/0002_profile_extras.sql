-- ============================================================================
-- WearWise - Profile extras migration
-- ============================================================================
-- Adds profile_picture_url, measurements, and notification_enabled columns
-- to the profiles table for existing databases. The 0001_init.sql migration
-- already includes these columns for fresh installs, so this is idempotent
-- and safe to run on databases that already have them.
-- ============================================================================

-- profile_picture_url: dedicated avatar photo URL (separate from OAuth avatar_url)
alter table public.profiles
  add column if not exists profile_picture_url text;

-- measurements: nested object { height, chest, waist, hips, shoe_size }
alter table public.profiles
  add column if not exists measurements jsonb
  default '{"height": null, "chest": null, "waist": null, "hips": null, "shoe_size": null}'::jsonb;

-- notification_enabled: master toggle for reminder/push notifications
alter table public.profiles
  add column if not exists notification_enabled boolean default true;

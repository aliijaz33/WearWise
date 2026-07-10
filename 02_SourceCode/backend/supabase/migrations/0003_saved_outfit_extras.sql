-- ============================================================================
-- WearWise - Saved Outfit extras: name + is_favorite
-- ============================================================================
-- Adds two columns to saved_outfits so each saved look can have a custom
-- display name and a favorite flag (heart toggle on the Saved Outfits screen).
-- Idempotent: safe to run multiple times.
-- ----------------------------------------------------------------------------

-- name: optional custom outfit name (defaults to the occasion label).
alter table public.saved_outfits
  add column if not exists name text;

-- is_favorite: heart toggle. Defaults to false.
alter table public.saved_outfits
  add column if not exists is_favorite boolean not null default false;

-- Backfill existing rows with a friendly default name based on occasion.
update public.saved_outfits
  set name = occasion
  where name is null;

-- Index for quickly listing a user's favourite outfits.
create index if not exists idx_saved_outfits_user_favorite
  on public.saved_outfits(user_id, is_favorite);

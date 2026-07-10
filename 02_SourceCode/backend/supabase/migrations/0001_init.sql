-- ============================================================================
-- WearWise - Database Schema (Supabase / PostgreSQL)
-- ============================================================================
-- Run this in the Supabase SQL Editor (or via `supabase db push`).
-- Creates: profiles, wardrobe_items, saved_outfits tables + storage + RLS.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- PROFILES
-- One row per auth user. Created automatically on signup via trigger.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  profile_picture_url text,
  measurements jsonb default '{"height": null, "chest": null, "waist": null, "hips": null, "shoe_size": null}'::jsonb,
  notification_enabled boolean default true,
  preferences jsonb default '{"style_preferences": [], "default_occasion": null}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- WARDROBE ITEMS
-- A user's uploaded clothing/shoes/bags/accessories.
-- category is constrained to the six fixed categories.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'wardrobe_category' and n.nspname = 'public'
  ) then
    create type public.wardrobe_category as enum
      ('tops', 'bottoms', 'dresses', 'shoes', 'bags', 'accessories');
  end if;
end$$;

create table if not exists public.wardrobe_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  category public.wardrobe_category not null,
  type text not null,
  color text not null,
  color_hex text,
  occasions text[] not null default '{}',
  season text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wardrobe_items_user_id on public.wardrobe_items(user_id);
create index if not exists idx_wardrobe_items_category on public.wardrobe_items(category);
create index if not exists idx_wardrobe_items_user_category on public.wardrobe_items(user_id, category);

-- ----------------------------------------------------------------------------
-- SAVED OUTFITS
-- A persisted generated outfit: occasion + referenced item set.
-- ----------------------------------------------------------------------------
create table if not exists public.saved_outfits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occasion text not null,
  weather text,
  style_preferences text[] not null default '{}',
  rationale text,
  item_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_saved_outfits_user_id on public.saved_outfits(user_id);
create index if not exists idx_saved_outfits_user_occasion on public.saved_outfits(user_id, occasion);

-- ----------------------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- ----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_wardrobe_items_updated_at on public.wardrobe_items;
create trigger trg_wardrobe_items_updated_at
  before update on public.wardrobe_items
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- AUTO-CREATE PROFILE ON SIGNUP
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- BACKFILL PROFILES FOR EXISTING AUTH USERS
-- Users created BEFORE this trigger existed (e.g. during testing) won't have a
-- profile row. This inserts one for every auth.users row that is missing it.
-- Safe to run multiple times (idempotent).
-- ----------------------------------------------------------------------------
insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.saved_outfits enable row level security;

-- Profiles: a user can see & edit only their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Wardrobe items: full CRUD for the owner only.
drop policy if exists "items_select_own" on public.wardrobe_items;
create policy "items_select_own"
  on public.wardrobe_items for select
  using (auth.uid() = user_id);

drop policy if exists "items_insert_own" on public.wardrobe_items;
create policy "items_insert_own"
  on public.wardrobe_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "items_update_own" on public.wardrobe_items;
create policy "items_update_own"
  on public.wardrobe_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "items_delete_own" on public.wardrobe_items;
create policy "items_delete_own"
  on public.wardrobe_items for delete
  using (auth.uid() = user_id);

-- Saved outfits: full CRUD for the owner only.
drop policy if exists "outfits_select_own" on public.saved_outfits;
create policy "outfits_select_own"
  on public.saved_outfits for select
  using (auth.uid() = user_id);

drop policy if exists "outfits_insert_own" on public.saved_outfits;
create policy "outfits_insert_own"
  on public.saved_outfits for insert
  with check (auth.uid() = user_id);

drop policy if exists "outfits_update_own" on public.saved_outfits;
create policy "outfits_update_own"
  on public.saved_outfits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "outfits_delete_own" on public.saved_outfits;
create policy "outfits_delete_own"
  on public.saved_outfits for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- STORAGE BUCKET (item photos)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

-- Storage policies: users manage only their own folder.
drop policy if exists "item_photos_select" on storage.objects;
create policy "item_photos_select"
  on storage.objects for select
  using (bucket_id = 'item-photos');

drop policy if exists "item_photos_insert" on storage.objects;
create policy "item_photos_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "item_photos_update" on storage.objects;
create policy "item_photos_update"
  on storage.objects for update
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "item_photos_delete" on storage.objects;
create policy "item_photos_delete"
  on storage.objects for delete
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

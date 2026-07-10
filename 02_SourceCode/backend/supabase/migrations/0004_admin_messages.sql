-- ============================================================================
-- WearWise - Admin messages table (Help & Support contact form)
-- ============================================================================
-- Stores the subject + message submitted by users from the Help & Support
-- screen so an admin can review them later. Idempotent: safe to re-run.
-- ----------------------------------------------------------------------------

create table if not exists public.admin (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_user_id on public.admin(user_id);
create index if not exists idx_admin_created_at on public.admin(created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- A user can INSERT their own support messages. Only service-role / admins
-- can read them (no select policy for anon/authenticated users), so the
-- messages stay private to the WearWise admin team.
-- ============================================================================
alter table public.admin enable row level security;

drop policy if exists "admin_insert_own" on public.admin;
create policy "admin_insert_own"
  on public.admin for insert
  with check (auth.uid() = user_id);

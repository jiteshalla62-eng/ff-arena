-- FF ARENA database schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 role text not null default 'player' check (role in ('player','admin')),
 created_at timestamptz not null default now()
);
create table if not exists public.tournaments (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 mode text not null check (mode in ('Solo','Duo','Squad')),
 map_name text not null default 'Bermuda',
 entry_fee integer not null default 0 check (entry_fee >= 0),
 prize_pool integer not null default 0 check (prize_pool >= 0),
 starts_at timestamptz not null,
 slots_total integer not null default 48 check (slots_total > 0),
 slots_filled integer not null default 0 check (slots_filled >= 0),
 description text,
 is_published boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.registrations (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null references public.profiles(id) on delete cascade,
 tournament_id uuid not null references public.tournaments(id) on delete cascade,
 player_name text not null,
 game_uid text not null,
 team_name text,
 mode text not null check (mode in ('Solo','Duo','Squad')),
 status text not null default 'pending_payment' check (status in ('pending_payment','payment_review','approved','rejected')),
 payment_reference text,
 created_at timestamptz not null default now(),
 unique(player_id,tournament_id)
);
create table if not exists public.tournament_rooms (
 tournament_id uuid primary key references public.tournaments(id) on delete cascade,
 room_id text not null,
 room_password text not null,
 updated_at timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,display_name) values(new.id, coalesce(new.raw_user_meta_data->>'display_name','Player')) on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.registrations enable row level security;
alter table public.tournament_rooms enable row level security;
drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select using (id=auth.uid() or public.is_admin());
drop policy if exists "profiles update own display only via app" on public.profiles;
create policy "profiles update own" on public.profiles for update using (id=auth.uid()) with check (id=auth.uid() and role='player');
drop policy if exists "published tournaments visible" on public.tournaments;
create policy "published tournaments visible" on public.tournaments for select using (is_published=true or public.is_admin());
drop policy if exists "admins manage tournaments" on public.tournaments;
create policy "admins manage tournaments" on public.tournaments for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "players read own registrations" on public.registrations;
create policy "players read own registrations" on public.registrations for select using (player_id=auth.uid() or public.is_admin());
drop policy if exists "players create own registrations" on public.registrations;
create policy "players create own registrations" on public.registrations for insert with check (player_id=auth.uid() and status='pending_payment' and payment_reference is null);
drop policy if exists "players submit payment reference" on public.registrations;
create policy "players submit payment reference" on public.registrations for update using (player_id=auth.uid() and status in ('pending_payment','payment_review')) with check (player_id=auth.uid() and status='payment_review');
drop policy if exists "admins manage registrations" on public.registrations;
create policy "admins manage registrations" on public.registrations for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "approved players see room" on public.tournament_rooms;
create policy "approved players see room" on public.tournament_rooms for select using (public.is_admin() or exists(select 1 from public.registrations r where r.tournament_id=tournament_rooms.tournament_id and r.player_id=auth.uid() and r.status='approved'));
drop policy if exists "admins manage rooms" on public.tournament_rooms;
create policy "admins manage rooms" on public.tournament_rooms for all using (public.is_admin()) with check (public.is_admin());
-- IMPORTANT: After creating your own account, promote the host account using its auth user UUID:
-- update public.profiles set role='admin' where id='YOUR-AUTH-USER-UUID';

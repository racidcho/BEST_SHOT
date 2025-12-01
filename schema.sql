-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Participants Table
create table if not exists public.participants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  selected_count int not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. Photos Table
create table if not exists public.photos (
  id serial primary key,
  url text not null,
  thumbnail_url text, -- Optional, can be same as url for now
  created_at timestamptz not null default now()
);

-- 3. Selections Table
create table if not exists public.selections (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references public.participants(id) on delete cascade,
  photo_id int references public.photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(participant_id, photo_id) -- Prevent duplicate selection of same photo by same user
);

-- 4. Insert Participants (Fixed Codes)
insert into public.participants (name, code) values
  ('조창근', 'CK-7A2B'),
  ('도연수', 'YS-9X1Z'),
  ('반영명', 'YM-3K5L'),
  ('조성순', 'SS-8P2Q'),
  ('이승희', 'SH-4M9N'),
  ('도근우', 'GW-2J6H'),
  ('도예진', 'YJ-5R8T')
on conflict (code) do nothing;

-- 5. Insert Photos
insert into public.photos (url) values
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/200977.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/201099.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/201108.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/201305.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/201385.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/201459.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/201623.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/201881.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/201975.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202069.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202102.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202140.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202165.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202193.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202355.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202417.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202446.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202484.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202494.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202549.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202627.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/202654.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/308723.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/308756.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/308899.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/308923.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/308959.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/308976.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/309004.jpg'),
  ('https://raw.githubusercontent.com/racidcho/image-hosting/refs/heads/main/main_image/309097.jpg');

-- 6. Enable RLS (Optional, but good practice. For now, we allow public read/write for simplicity or define policies)
alter table public.participants enable row level security;
alter table public.photos enable row level security;
alter table public.selections enable row level security;

-- Policy: Allow public access for this MVP (since we use code for auth, we can refine this later)
-- Ideally, we should restrict updates to the participant with the correct code.
-- For now, let's allow all operations for anon to get it working, then tighten.
create policy "Enable read access for all users" on public.participants for select using (true);
create policy "Enable update for all users" on public.participants for update using (true); -- Needed to update selection count

create policy "Enable read access for all users" on public.photos for select using (true);

create policy "Enable insert for all users" on public.selections for insert with check (true);
create policy "Enable read for all users" on public.selections for select using (true);
create policy "Enable delete for all users" on public.selections for delete using (true);

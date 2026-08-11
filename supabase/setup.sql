-- =============================================================================
-- Театр теней Мии — полный setup для нового проекта Supabase
-- Вставьте этот файл целиком в: Supabase → SQL Editor → Run
-- =============================================================================

create extension if not exists "pgcrypto";

-- Types
do $$ begin
  create type public.show_status as enum ('draft', 'published', 'archived', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.seat_status as enum ('available', 'blocked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.booking_status as enum ('reserved', 'cancelled', 'checked_in');
exception when duplicate_object then null;
end $$;

-- Shows
create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null default '',
  description text not null default '',
  poster_url text,
  hero_url text,
  date date not null,
  start_time time not null,
  duration_minutes int not null default 25,
  venue text not null default '',
  status public.show_status not null default 'draft',
  capacity int not null default 0,
  row_count int not null default 3 check (row_count > 0 and row_count <= 20),
  seats_per_row int not null default 5 check (seats_per_row > 0 and seats_per_row <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seats
create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  row_label text not null,
  seat_number int not null,
  status public.seat_status not null default 'available',
  created_at timestamptz not null default now(),
  unique (show_id, row_label, seat_number)
);

-- Bookings (reservations)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  booking_code text not null unique,
  guest_name text not null,
  guest_contact text,
  status public.booking_status not null default 'reserved',
  created_at timestamptz not null default now(),
  checked_in_at timestamptz
);

create table if not exists public.booking_seats (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  seat_id uuid not null references public.seats (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (booking_id, seat_id)
);

create index if not exists seats_show_id_idx on public.seats (show_id);
create index if not exists bookings_show_id_idx on public.bookings (show_id);
create index if not exists bookings_code_idx on public.bookings (booking_code);
create index if not exists shows_status_date_idx on public.shows (status, date);

-- Double-booking protection
create or replace function public.seat_is_free(p_seat_id uuid, p_except_booking uuid default null)
returns boolean
language sql
stable
as $$
  select not exists (
    select 1
    from public.booking_seats bs
    join public.bookings b on b.id = bs.booking_id
    where bs.seat_id = p_seat_id
      and b.status in ('reserved', 'checked_in')
      and (p_except_booking is null or b.id <> p_except_booking)
  );
$$;

create or replace function public.enforce_seat_not_double_booked()
returns trigger
language plpgsql
as $$
begin
  if not public.seat_is_free(new.seat_id, new.booking_id) then
    raise exception 'seat already reserved' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_booking_seats_no_double on public.booking_seats;
create trigger trg_booking_seats_no_double
before insert or update on public.booking_seats
for each row execute function public.enforce_seat_not_double_booked();

-- Atomic reserve (public + admin)
create or replace function public.reserve_seats(
  p_show_id uuid,
  p_seat_ids uuid[],
  p_guest_name text,
  p_guest_contact text default null,
  p_admin boolean default false
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_code text;
  v_seat_id uuid;
  v_show public.shows;
begin
  if p_guest_name is null or length(trim(p_guest_name)) = 0 then
    raise exception 'guest name required';
  end if;
  if p_seat_ids is null or array_length(p_seat_ids, 1) is null then
    raise exception 'seats required';
  end if;

  select * into v_show from public.shows where id = p_show_id for update;
  if v_show is null then
    raise exception 'show not found';
  end if;
  if v_show.status in ('cancelled', 'archived') then
    raise exception 'show cancelled';
  end if;
  if not p_admin and v_show.status <> 'published' then
    raise exception 'show not found';
  end if;

  perform 1 from public.seats
  where show_id = p_show_id and id = any(p_seat_ids)
  for update;

  if (
    select count(*) from public.seats
    where show_id = p_show_id and id = any(p_seat_ids) and status = 'available'
  ) <> array_length(p_seat_ids, 1) then
    raise exception 'seat unavailable' using errcode = '23505';
  end if;

  foreach v_seat_id in array p_seat_ids loop
    if not public.seat_is_free(v_seat_id) then
      raise exception 'seat already reserved' using errcode = '23505';
    end if;
  end loop;

  v_code := 'MIA-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 4));

  insert into public.bookings (show_id, booking_code, guest_name, guest_contact, status)
  values (p_show_id, v_code, trim(p_guest_name), nullif(trim(p_guest_contact), ''), 'reserved')
  returning * into v_booking;

  insert into public.booking_seats (booking_id, seat_id)
  select v_booking.id, unnest(p_seat_ids);

  return v_booking;
end;
$$;

grant execute on function public.reserve_seats(uuid, uuid[], text, text, boolean) to anon, authenticated;

-- Capacity + auto-create seats
create or replace function public.set_show_capacity()
returns trigger
language plpgsql
as $$
begin
  if new.capacity is null or new.capacity = 0 then
    new.capacity := new.row_count * new.seats_per_row;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_show_capacity on public.shows;
create trigger trg_set_show_capacity
before insert or update on public.shows
for each row execute function public.set_show_capacity();

create or replace function public.create_seats_for_show()
returns trigger
language plpgsql
as $$
declare
  r int;
  s int;
  label text;
begin
  for r in 0..new.row_count - 1 loop
    label := chr(65 + r);
    for s in 1..new.seats_per_row loop
      insert into public.seats (show_id, row_label, seat_number)
      values (new.id, label, s)
      on conflict do nothing;
    end loop;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_create_seats_for_show on public.shows;
create trigger trg_create_seats_for_show
after insert on public.shows
for each row execute function public.create_seats_for_show();

-- RLS
alter table public.shows enable row level security;
alter table public.seats enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_seats enable row level security;

drop policy if exists "Public read published shows" on public.shows;
create policy "Public read published shows"
  on public.shows for select
  using (status = 'published' or auth.role() = 'authenticated');

drop policy if exists "Admin manage shows" on public.shows;
create policy "Admin manage shows"
  on public.shows for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Public read seats of published shows" on public.seats;
create policy "Public read seats of published shows"
  on public.seats for select
  using (
    exists (
      select 1 from public.shows s
      where s.id = show_id and (s.status = 'published' or auth.role() = 'authenticated')
    )
  );

drop policy if exists "Admin manage seats" on public.seats;
create policy "Admin manage seats"
  on public.seats for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Admin read bookings" on public.bookings;
create policy "Admin read bookings"
  on public.bookings for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admin manage bookings" on public.bookings;
create policy "Admin manage bookings"
  on public.bookings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Admin read booking_seats" on public.booking_seats;
create policy "Admin read booking_seats"
  on public.booking_seats for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admin manage booking_seats" on public.booking_seats;
create policy "Admin manage booking_seats"
  on public.booking_seats for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage bucket for posters
insert into storage.buckets (id, name, public)
values ('show-assets', 'show-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read show-assets" on storage.objects;
create policy "Public read show-assets"
  on storage.objects for select
  using (bucket_id = 'show-assets');

drop policy if exists "Authenticated upload show-assets" on storage.objects;
create policy "Authenticated upload show-assets"
  on storage.objects for insert
  with check (bucket_id = 'show-assets' and auth.role() = 'authenticated');

drop policy if exists "Authenticated update show-assets" on storage.objects;
create policy "Authenticated update show-assets"
  on storage.objects for update
  using (bucket_id = 'show-assets' and auth.role() = 'authenticated');

-- Optional demo seed (skip if slug already exists)
insert into public.shows (
  title, slug, short_description, description, date, start_time,
  duration_minutes, venue, status, row_count, seats_per_row, capacity
)
select
  'Лесная история',
  'lesnaya-istoriya',
  'Маленькая история о дружбе, храбрости и лунном свете.',
  'В ночном лесу просыпаются тени зверей. Маленькая история о храбрости, дружбе и лунном свете.',
  '2026-08-15',
  '18:00',
  25,
  'Домашний театр теней',
  'published',
  4,
  5,
  20
where not exists (select 1 from public.shows where slug = 'lesnaya-istoriya');

-- Extend shows for admin/booking system

alter type public.show_status add value if not exists 'cancelled';

alter table public.shows
  add column if not exists short_description text not null default '',
  add column if not exists hero_url text,
  add column if not exists capacity int;

update public.shows
set capacity = coalesce(capacity, row_count * seats_per_row)
where capacity is null;

alter table public.shows
  alter column capacity set default 0;

-- Storage bucket note: create "show-assets" in Supabase dashboard (public read)
-- policies for authenticated upload should be set in dashboard or via storage API

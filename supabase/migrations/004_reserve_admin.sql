-- Atomic reserve: support admin manual booking + cancelled shows

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

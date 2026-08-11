import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  Booking,
  BookingSeat,
  BookingStatus,
  BookingWithSeats,
  Seat,
  SeatWithAvailability,
  Show,
  ShowStatus,
} from "@/lib/types";
import type { CreateShowInput, ReserveInput, ReserveResult, UpdateShowInput } from "@/lib/db/local";

function db() {
  return createServiceClient();
}

function mapShow(row: Record<string, unknown>): Show {
  const rowCount = Number(row.row_count);
  const seatsPerRow = Number(row.seats_per_row);
  const time = String(row.start_time ?? "").slice(0, 5);
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    short_description: String(row.short_description ?? ""),
    description: String(row.description ?? ""),
    poster_url: (row.poster_url as string | null) ?? null,
    hero_url: (row.hero_url as string | null) ?? null,
    date: String(row.date).slice(0, 10),
    start_time: time,
    duration_minutes: Number(row.duration_minutes),
    venue: String(row.venue ?? ""),
    status: row.status as ShowStatus,
    capacity: Number(row.capacity ?? rowCount * seatsPerRow),
    row_count: rowCount,
    seats_per_row: seatsPerRow,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapSeat(row: Record<string, unknown>): Seat {
  return {
    id: String(row.id),
    show_id: String(row.show_id),
    row_label: String(row.row_label),
    seat_number: Number(row.seat_number),
    status: row.status as Seat["status"],
    created_at: String(row.created_at),
  };
}

function mapBooking(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    show_id: String(row.show_id),
    booking_code: String(row.booking_code),
    guest_name: String(row.guest_name),
    guest_contact: (row.guest_contact as string | null) ?? null,
    status: row.status as BookingStatus,
    created_at: String(row.created_at),
    checked_in_at: (row.checked_in_at as string | null) ?? null,
  };
}

export function generateBookingCode(): string {
  return `MIA-${randomBytes(2).toString("hex").toUpperCase()}`;
}

import { isSupabaseEnvReady } from "@/lib/supabase/env";

export function isSupabaseConfigured(): boolean {
  return isSupabaseEnvReady();
}

export async function listPublishedShows(): Promise<Show[]> {
  const { data, error } = await db()
    .from("shows")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapShow(r));
}

export async function listAllShows(): Promise<Show[]> {
  const { data, error } = await db()
    .from("shows")
    .select("*")
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapShow(r));
}

export async function getShowBySlug(slug: string): Promise<Show | null> {
  const { data, error } = await db().from("shows").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? mapShow(data) : null;
}

export async function getShowById(id: string): Promise<Show | null> {
  const { data, error } = await db().from("shows").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapShow(data) : null;
}

export async function getUpcomingShow(): Promise<Show | null> {
  const shows = await listPublishedShows();
  return shows[0] ?? null;
}

export async function getSeatsForShow(showId: string): Promise<SeatWithAvailability[]> {
  const supabase = db();
  const { data: seats, error } = await supabase
    .from("seats")
    .select("*")
    .eq("show_id", showId)
    .order("row_label")
    .order("seat_number");
  if (error) throw error;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, guest_name, booking_code, status")
    .eq("show_id", showId)
    .in("status", ["reserved", "checked_in"]);

  const activeIds = new Set((bookings ?? []).map((b) => b.id));
  const bookingById = new Map((bookings ?? []).map((b) => [b.id, b]));

  let links: { seat_id: string; booking_id: string }[] = [];
  if (activeIds.size > 0) {
    const { data: linkRows } = await supabase
      .from("booking_seats")
      .select("seat_id, booking_id")
      .in("booking_id", [...activeIds]);
    links = linkRows ?? [];
  }

  const bookingBySeat = new Map<string, NonNullable<typeof bookings>[number]>();
  for (const link of links) {
    if (!activeIds.has(link.booking_id)) continue;
    const b = bookingById.get(link.booking_id);
    if (b) bookingBySeat.set(link.seat_id, b);
  }

  return (seats ?? []).map((row) => {
    const seat = mapSeat(row);
    if (seat.status === "blocked") {
      return { ...seat, availability: "blocked" as const };
    }
    const booking = bookingBySeat.get(seat.id);
    if (booking) {
      return {
        ...seat,
        availability: "reserved" as const,
        guest_name: booking.guest_name,
        booking_code: booking.booking_code,
        booking_id: booking.id,
      };
    }
    return { ...seat, availability: "available" as const };
  });
}

export async function reserveSeats(
  input: ReserveInput,
  options?: { admin?: boolean },
): Promise<ReserveResult> {
  const supabase = db();
  const { data, error } = await supabase.rpc("reserve_seats", {
    p_show_id: input.showId,
    p_seat_ids: input.seatIds,
    p_guest_name: input.guestName,
    p_guest_contact: input.guestContact ?? null,
    p_admin: Boolean(options?.admin),
  });

  if (!error && data) {
    const booking = mapBooking(data as Record<string, unknown>);
    const hydrated = await getBookingById(booking.id);
    if (!hydrated) {
      return { ok: false, error: "invalid", message: "Не удалось забронировать." };
    }
    return { ok: true, booking: hydrated };
  }

  // Fallback if RPC is missing/broken (e.g. gen_random_bytes search_path)
  if (error) {
    const msg = error.message || "";
    if (
      msg.includes("gen_random_bytes") ||
      msg.includes("does not exist") ||
      msg.includes("42883")
    ) {
      return reserveSeatsDirect(input, options);
    }
    if (msg.includes("23505") || msg.includes("already") || msg.includes("unavailable")) {
      return {
        ok: false,
        error: "conflict",
        message: "Похоже, это место только что забронировали.",
      };
    }
    if (msg.includes("not found") || msg.includes("cancelled")) {
      return {
        ok: false,
        error: "not_found",
        message: "Спектакль не найден.",
      };
    }
    console.error("[theater] reserve_seats RPC failed", error);
    return { ok: false, error: "invalid", message: "Не удалось забронировать." };
  }

  return { ok: false, error: "invalid", message: "Не удалось забронировать." };
}

async function reserveSeatsDirect(
  input: ReserveInput,
  options?: { admin?: boolean },
): Promise<ReserveResult> {
  const supabase = db();
  const name = input.guestName.trim();
  if (!name || input.seatIds.length === 0) {
    return { ok: false, error: "invalid", message: "Укажите имя и выберите места." };
  }

  const show = await getShowById(input.showId);
  if (!show) {
    return { ok: false, error: "not_found", message: "Спектакль не найден." };
  }
  if (show.status === "cancelled" || show.status === "archived") {
    return { ok: false, error: "invalid", message: "Спектакль отменён или в архиве." };
  }
  if (!options?.admin && show.status !== "published") {
    return { ok: false, error: "not_found", message: "Спектакль не найден." };
  }

  const seats = await getSeatsForShow(input.showId);
  const selected = seats.filter((s) => input.seatIds.includes(s.id));
  if (selected.length !== input.seatIds.length) {
    return { ok: false, error: "invalid", message: "Некоторые места не найдены." };
  }
  if (selected.some((s) => s.availability !== "available")) {
    return {
      ok: false,
      error: "conflict",
      message: "Похоже, это место только что забронировали.",
    };
  }

  const code = `MIA-${randomBytes(2).toString("hex").toUpperCase()}`;
  const { data: bookingRow, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      show_id: input.showId,
      booking_code: code,
      guest_name: name,
      guest_contact: input.guestContact?.trim() || null,
      status: "reserved",
    })
    .select("*")
    .single();

  if (bookingError || !bookingRow) {
    console.error("[theater] direct booking insert failed", bookingError);
    return { ok: false, error: "invalid", message: "Не удалось забронировать." };
  }

  const { error: linkError } = await supabase.from("booking_seats").insert(
    input.seatIds.map((seat_id) => ({
      booking_id: bookingRow.id,
      seat_id,
    })),
  );

  if (linkError) {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingRow.id);
    const msg = linkError.message || "";
    if (msg.includes("already") || msg.includes("23505") || msg.includes("seat")) {
      return {
        ok: false,
        error: "conflict",
        message: "Похоже, это место только что забронировали.",
      };
    }
    console.error("[theater] booking_seats insert failed", linkError);
    return { ok: false, error: "invalid", message: "Не удалось забронировать." };
  }

  const hydrated = await getBookingById(String(bookingRow.id));
  if (!hydrated) {
    return { ok: false, error: "invalid", message: "Не удалось забронировать." };
  }
  return { ok: true, booking: hydrated };
}

export async function cancelBooking(bookingId: string): Promise<boolean> {
  const { error } = await db()
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .neq("status", "cancelled");
  return !error;
}

export async function checkInBooking(bookingId: string): Promise<Booking | null> {
  const { data, error } = await db()
    .from("bookings")
    .update({ status: "checked_in", checked_in_at: new Date().toISOString() })
    .eq("id", bookingId)
    .neq("status", "cancelled")
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapBooking(data);
}

async function hydrateBooking(booking: Booking): Promise<BookingWithSeats> {
  const supabase = db();
  const { data: links } = await supabase
    .from("booking_seats")
    .select("seat_id")
    .eq("booking_id", booking.id);
  const seatIds = (links ?? []).map((l) => l.seat_id);
  const { data: seats } = seatIds.length
    ? await supabase.from("seats").select("*").in("id", seatIds)
    : { data: [] as Record<string, unknown>[] };
  const show = await getShowById(booking.show_id);
  return {
    ...booking,
    seats: (seats ?? []).map((s) => mapSeat(s)),
    show: show ?? undefined,
  };
}

export async function getBookingByCode(code: string): Promise<BookingWithSeats | null> {
  const { data, error } = await db()
    .from("bookings")
    .select("*")
    .ilike("booking_code", code.trim())
    .maybeSingle();
  if (error || !data) return null;
  return hydrateBooking(mapBooking(data));
}

export async function getBookingById(id: string): Promise<BookingWithSeats | null> {
  const { data, error } = await db().from("bookings").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return hydrateBooking(mapBooking(data));
}

export async function listBookingsForShow(showId: string): Promise<BookingWithSeats[]> {
  const { data, error } = await db()
    .from("bookings")
    .select("*")
    .eq("show_id", showId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Promise.all((data ?? []).map((row) => hydrateBooking(mapBooking(row))));
}

export async function searchBookings(
  showId: string,
  query: string,
): Promise<BookingWithSeats[]> {
  const q = query.trim().toLowerCase();
  const all = await listBookingsForShow(showId);
  if (!q) return all;
  return all.filter(
    (b) =>
      b.guest_name.toLowerCase().includes(q) ||
      b.booking_code.toLowerCase().includes(q),
  );
}

export async function createShow(input: CreateShowInput): Promise<Show> {
  const slugBase = input.title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const suffix = randomBytes(2).toString("hex");
  const capacity = input.row_count * input.seats_per_row;
  const { data, error } = await db()
    .from("shows")
    .insert({
      title: input.title.trim(),
      slug: `${slugBase || "spektakl"}-${suffix}`,
      short_description: (input.short_description ?? "").trim(),
      description: input.description.trim(),
      poster_url: input.poster_url ?? null,
      hero_url: input.hero_url ?? null,
      date: input.date,
      start_time: input.start_time,
      duration_minutes: input.duration_minutes,
      venue: input.venue.trim(),
      status: input.status ?? "draft",
      capacity,
      row_count: input.row_count,
      seats_per_row: input.seats_per_row,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapShow(data);
}

export async function updateShow(
  showId: string,
  input: UpdateShowInput,
): Promise<Show | null> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.short_description !== undefined) {
    patch.short_description = input.short_description.trim();
  }
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.date !== undefined) patch.date = input.date;
  if (input.start_time !== undefined) patch.start_time = input.start_time;
  if (input.duration_minutes !== undefined) patch.duration_minutes = input.duration_minutes;
  if (input.venue !== undefined) patch.venue = input.venue.trim();
  if (input.poster_url !== undefined) patch.poster_url = input.poster_url;
  if (input.hero_url !== undefined) patch.hero_url = input.hero_url;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await db()
    .from("shows")
    .update(patch)
    .eq("id", showId)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapShow(data);
}

export async function updateShowStatus(
  showId: string,
  status: ShowStatus,
): Promise<Show | null> {
  return updateShow(showId, { status });
}

export async function setSeatBlocked(
  seatId: string,
  blocked: boolean,
): Promise<Seat | null> {
  const { data, error } = await db()
    .from("seats")
    .update({ status: blocked ? "blocked" : "available" })
    .eq("id", seatId)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapSeat(data);
}

export async function getShowStats(showId: string) {
  const seats = await getSeatsForShow(showId);
  const bookings = await listBookingsForShow(showId);
  const total = seats.filter((s) => s.status !== "blocked").length;
  const reserved = seats.filter((s) => s.availability === "reserved").length;
  const checkedIn = bookings.filter((b) => b.status === "checked_in").length;
  return { total, reserved, checkedIn, guests: bookings.length };
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<Booking | null> {
  if (status === "checked_in") return checkInBooking(bookingId);
  if (status === "cancelled") {
    const ok = await cancelBooking(bookingId);
    return ok ? (await getBookingById(bookingId)) : null;
  }
  const { data, error } = await db()
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapBooking(data);
}

export async function uploadShowAsset(
  file: File,
  folder = "posters",
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `${folder}/${randomBytes(8).toString("hex")}.${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await db().storage.from("show-assets").upload(path, buffer, {
    contentType: file.type || `image/${safeExt}`,
    upsert: false,
  });
  if (error) throw error;
  const { data } = db().storage.from("show-assets").getPublicUrl(path);
  return data.publicUrl;
}

// re-export types used by index
export type { CreateShowInput, ReserveInput, ReserveResult, UpdateShowInput, BookingSeat };

import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { MOCK_SHOWS } from "@/lib/mock/shows";
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

type Store = {
  shows: Show[];
  seats: Seat[];
  bookings: Booking[];
  booking_seats: BookingSeat[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function rowLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

function createSeatsForShow(show: Show): Seat[] {
  const seats: Seat[] = [];
  const now = new Date().toISOString();
  for (let r = 0; r < show.row_count; r++) {
    for (let s = 1; s <= show.seats_per_row; s++) {
      seats.push({
        id: `${show.id}-${rowLabel(r)}${s}`,
        show_id: show.id,
        row_label: rowLabel(r),
        seat_number: s,
        status: "available",
        created_at: now,
      });
    }
  }
  return seats;
}

function defaultStore(): Store {
  return {
    shows: [...MOCK_SHOWS],
    seats: MOCK_SHOWS.flatMap((show) => createSeatsForShow(show)),
    bookings: [],
    booking_seats: [],
  };
}

let writeQueue: Promise<void> = Promise.resolve();

async function ensureStore(): Promise<Store> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Store;
    parsed.shows = parsed.shows.map(normalizeShow);
    return parsed;
  } catch {
    const store = defaultStore();
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    return store;
  }
}

function normalizeShow(s: Show): Show {
  return {
    ...s,
    short_description: s.short_description ?? "",
    hero_url: s.hero_url ?? null,
    capacity: s.capacity ?? s.row_count * s.seats_per_row,
  };
}

async function mutateStore<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const store = await ensureStore();
    const result = await fn(store);
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function activeBookingIds(store: Store): Set<string> {
  return new Set(
    store.bookings
      .filter((b) => b.status === "reserved" || b.status === "checked_in")
      .map((b) => b.id),
  );
}

function occupiedSeatIds(store: Store): Set<string> {
  const active = activeBookingIds(store);
  return new Set(
    store.booking_seats.filter((bs) => active.has(bs.booking_id)).map((bs) => bs.seat_id),
  );
}

export function generateBookingCode(): string {
  return `MIA-${randomBytes(2).toString("hex").toUpperCase()}`;
}

import { isSupabaseEnvReady } from "@/lib/supabase/env";

export function isSupabaseConfigured(): boolean {
  return isSupabaseEnvReady();
}

export async function listPublishedShows(): Promise<Show[]> {
  const store = await ensureStore();
  return store.shows
    .filter((s) => s.status === "published")
    .sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
}

export async function listAllShows(): Promise<Show[]> {
  const store = await ensureStore();
  return [...store.shows].sort((a, b) =>
    `${b.date}${b.start_time}`.localeCompare(`${a.date}${a.start_time}`),
  );
}

export async function getShowBySlug(slug: string): Promise<Show | null> {
  const store = await ensureStore();
  return store.shows.find((s) => s.slug === slug) ?? null;
}

export async function getShowById(id: string): Promise<Show | null> {
  const store = await ensureStore();
  return store.shows.find((s) => s.id === id) ?? null;
}

export async function getUpcomingShow(): Promise<Show | null> {
  const shows = await listPublishedShows();
  return shows[0] ?? null;
}

export async function getSeatsForShow(showId: string): Promise<SeatWithAvailability[]> {
  const store = await ensureStore();
  const occupied = occupiedSeatIds(store);
  const active = activeBookingIds(store);
  const bookingBySeat = new Map<string, Booking>();

  for (const bs of store.booking_seats) {
    if (!active.has(bs.booking_id)) continue;
    const booking = store.bookings.find((b) => b.id === bs.booking_id);
    if (booking) bookingBySeat.set(bs.seat_id, booking);
  }

  return store.seats
    .filter((s) => s.show_id === showId)
    .sort((a, b) => a.row_label.localeCompare(b.row_label) || a.seat_number - b.seat_number)
    .map((seat) => {
      if (seat.status === "blocked") {
        return { ...seat, availability: "blocked" as const };
      }
      if (occupied.has(seat.id)) {
        const booking = bookingBySeat.get(seat.id);
        return {
          ...seat,
          availability: "reserved" as const,
          guest_name: booking?.guest_name,
          booking_code: booking?.booking_code,
          booking_id: booking?.id,
        };
      }
      return { ...seat, availability: "available" as const };
    });
}

export type ReserveInput = {
  showId: string;
  seatIds: string[];
  guestName: string;
  guestContact?: string | null;
};

export type ReserveResult =
  | { ok: true; booking: BookingWithSeats }
  | { ok: false; error: "conflict" | "invalid" | "not_found"; message: string };

export async function reserveSeats(
  input: ReserveInput,
  options?: { admin?: boolean },
): Promise<ReserveResult> {
  return mutateStore((store) => {
    const show = store.shows.find((s) => s.id === input.showId);
    if (!show) {
      return {
        ok: false as const,
        error: "not_found" as const,
        message: "Спектакль не найден.",
      };
    }
    if (show.status === "cancelled" || show.status === "archived") {
      return {
        ok: false as const,
        error: "invalid" as const,
        message: "Спектакль отменён или в архиве.",
      };
    }
    if (!options?.admin && show.status !== "published") {
      return {
        ok: false as const,
        error: "not_found" as const,
        message: "Спектакль не найден.",
      };
    }

    const name = input.guestName.trim();
    if (!name || input.seatIds.length === 0) {
      return {
        ok: false as const,
        error: "invalid" as const,
        message: "Укажите имя и выберите места.",
      };
    }

    const occupied = occupiedSeatIds(store);
    const selected = store.seats.filter(
      (s) => s.show_id === input.showId && input.seatIds.includes(s.id),
    );

    if (selected.length !== input.seatIds.length) {
      return {
        ok: false as const,
        error: "invalid" as const,
        message: "Некоторые места не найдены.",
      };
    }

    if (selected.some((s) => s.status === "blocked" || occupied.has(s.id))) {
      return {
        ok: false as const,
        error: "conflict" as const,
        message: "Похоже, это место только что забронировали.",
      };
    }

    const now = new Date().toISOString();
    const booking: Booking = {
      id: `bk-${randomBytes(6).toString("hex")}`,
      show_id: input.showId,
      booking_code: generateBookingCode(),
      guest_name: name,
      guest_contact: input.guestContact?.trim() || null,
      status: "reserved",
      created_at: now,
      checked_in_at: null,
    };

    const links: BookingSeat[] = selected.map((seat) => ({
      id: `bs-${randomBytes(4).toString("hex")}`,
      booking_id: booking.id,
      seat_id: seat.id,
      created_at: now,
    }));

    store.bookings.push(booking);
    store.booking_seats.push(...links);

    return {
      ok: true as const,
      booking: { ...booking, seats: selected, show },
    };
  });
}

export async function cancelBooking(bookingId: string): Promise<boolean> {
  return mutateStore((store) => {
    const booking = store.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status === "cancelled") return false;
    booking.status = "cancelled";
    return true;
  });
}

export async function checkInBooking(bookingId: string): Promise<Booking | null> {
  return mutateStore((store) => {
    const booking = store.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status === "cancelled") return null;
    booking.status = "checked_in";
    booking.checked_in_at = new Date().toISOString();
    return booking;
  });
}

export async function getBookingByCode(code: string): Promise<BookingWithSeats | null> {
  const store = await ensureStore();
  const booking = store.bookings.find(
    (b) => b.booking_code.toLowerCase() === code.trim().toLowerCase(),
  );
  if (!booking) return null;
  return hydrateBooking(store, booking);
}

export async function getBookingById(id: string): Promise<BookingWithSeats | null> {
  const store = await ensureStore();
  const booking = store.bookings.find((b) => b.id === id);
  if (!booking) return null;
  return hydrateBooking(store, booking);
}

function hydrateBooking(store: Store, booking: Booking): BookingWithSeats {
  const seatIds = store.booking_seats
    .filter((bs) => bs.booking_id === booking.id)
    .map((bs) => bs.seat_id);
  const seats = store.seats.filter((s) => seatIds.includes(s.id));
  const show = store.shows.find((s) => s.id === booking.show_id);
  return { ...booking, seats, show };
}

export async function listBookingsForShow(showId: string): Promise<BookingWithSeats[]> {
  const store = await ensureStore();
  return store.bookings
    .filter((b) => b.show_id === showId && b.status !== "cancelled")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((b) => hydrateBooking(store, b));
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

export type CreateShowInput = {
  title: string;
  short_description?: string;
  description: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  venue: string;
  row_count: number;
  seats_per_row: number;
  poster_url?: string | null;
  hero_url?: string | null;
  status?: ShowStatus;
};

export type UpdateShowInput = Partial<
  Omit<CreateShowInput, "row_count" | "seats_per_row">
> & {
  title?: string;
};

export async function createShow(input: CreateShowInput): Promise<Show> {
  return mutateStore((store) => {
    const now = new Date().toISOString();
    const slugBase = input.title
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
    const id = `show-${randomBytes(4).toString("hex")}`;
    const capacity = input.row_count * input.seats_per_row;
    const show: Show = {
      id,
      title: input.title.trim(),
      slug: `${slugBase || "spektakl"}-${id.slice(-4)}`,
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
      created_at: now,
      updated_at: now,
    };
    store.shows.push(show);
    store.seats.push(...createSeatsForShow(show));
    return show;
  });
}

export async function updateShow(
  showId: string,
  input: UpdateShowInput,
): Promise<Show | null> {
  return mutateStore((store) => {
    const show = store.shows.find((s) => s.id === showId);
    if (!show) return null;
    if (input.title !== undefined) show.title = input.title.trim();
    if (input.short_description !== undefined) {
      show.short_description = input.short_description.trim();
    }
    if (input.description !== undefined) show.description = input.description.trim();
    if (input.date !== undefined) show.date = input.date;
    if (input.start_time !== undefined) show.start_time = input.start_time;
    if (input.duration_minutes !== undefined) {
      show.duration_minutes = input.duration_minutes;
    }
    if (input.venue !== undefined) show.venue = input.venue.trim();
    if (input.poster_url !== undefined) show.poster_url = input.poster_url;
    if (input.hero_url !== undefined) show.hero_url = input.hero_url;
    if (input.status !== undefined) show.status = input.status;
    show.updated_at = new Date().toISOString();
    return show;
  });
}

export async function updateShowStatus(showId: string, status: ShowStatus): Promise<Show | null> {
  return mutateStore((store) => {
    const show = store.shows.find((s) => s.id === showId);
    if (!show) return null;
    show.status = status;
    show.updated_at = new Date().toISOString();
    return show;
  });
}

export async function setSeatBlocked(
  seatId: string,
  blocked: boolean,
): Promise<Seat | null> {
  return mutateStore((store) => {
    const seat = store.seats.find((s) => s.id === seatId);
    if (!seat) return null;
    seat.status = blocked ? "blocked" : "available";
    return seat;
  });
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
  return mutateStore((store) => {
    const booking = store.bookings.find((b) => b.id === bookingId);
    if (!booking) return null;
    booking.status = status;
    return booking;
  });
}

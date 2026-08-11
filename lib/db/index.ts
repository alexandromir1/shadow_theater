import * as local from "@/lib/db/local";
import * as remote from "@/lib/db/supabase";
import type {
  CreateShowInput,
  ReserveInput,
  ReserveResult,
  UpdateShowInput,
} from "@/lib/db/local";
import type {
  Booking,
  BookingStatus,
  BookingWithSeats,
  Seat,
  SeatWithAvailability,
  Show,
  ShowStatus,
} from "@/lib/types";

export type { CreateShowInput, ReserveInput, ReserveResult, UpdateShowInput };

export function isSupabaseConfigured(): boolean {
  return local.isSupabaseConfigured();
}

function api() {
  // Prefer Supabase whenever env is present. Never throw here — callers handle errors.
  return isSupabaseConfigured() ? remote : local;
}

export function generateBookingCode(): string {
  return api().generateBookingCode();
}

export function listPublishedShows(): Promise<Show[]> {
  return api().listPublishedShows();
}

export function listAllShows(): Promise<Show[]> {
  return api().listAllShows();
}

export function getShowBySlug(slug: string): Promise<Show | null> {
  return api().getShowBySlug(slug);
}

export function getShowById(id: string): Promise<Show | null> {
  return api().getShowById(id);
}

export function getUpcomingShow(): Promise<Show | null> {
  return api().getUpcomingShow();
}

export function getSeatsForShow(showId: string): Promise<SeatWithAvailability[]> {
  return api().getSeatsForShow(showId);
}

export function reserveSeats(
  input: ReserveInput,
  options?: { admin?: boolean },
): Promise<ReserveResult> {
  return api().reserveSeats(input, options);
}

export function cancelBooking(bookingId: string): Promise<boolean> {
  return api().cancelBooking(bookingId);
}

export function checkInBooking(bookingId: string): Promise<Booking | null> {
  return api().checkInBooking(bookingId);
}

export function getBookingByCode(code: string): Promise<BookingWithSeats | null> {
  return api().getBookingByCode(code);
}

export function getBookingById(id: string): Promise<BookingWithSeats | null> {
  return api().getBookingById(id);
}

export function listBookingsForShow(showId: string): Promise<BookingWithSeats[]> {
  return api().listBookingsForShow(showId);
}

export function searchBookings(showId: string, query: string): Promise<BookingWithSeats[]> {
  return api().searchBookings(showId, query);
}

export function createShow(input: CreateShowInput): Promise<Show> {
  return api().createShow(input);
}

export function updateShow(showId: string, input: UpdateShowInput): Promise<Show | null> {
  return api().updateShow(showId, input);
}

export function updateShowStatus(showId: string, status: ShowStatus): Promise<Show | null> {
  return api().updateShowStatus(showId, status);
}

export function setSeatBlocked(seatId: string, blocked: boolean): Promise<Seat | null> {
  return api().setSeatBlocked(seatId, blocked);
}

export function getShowStats(showId: string) {
  return api().getShowStats(showId);
}

export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<Booking | null> {
  return api().updateBookingStatus(bookingId, status);
}

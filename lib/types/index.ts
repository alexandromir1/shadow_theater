export type ShowStatus = "draft" | "published" | "archived" | "cancelled";
export type SeatStatus = "available" | "blocked";
export type BookingStatus = "reserved" | "cancelled" | "checked_in";

export interface Show {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  poster_url: string | null;
  hero_url: string | null;
  date: string;
  start_time: string;
  duration_minutes: number;
  venue: string;
  status: ShowStatus;
  capacity: number;
  row_count: number;
  seats_per_row: number;
  created_at: string;
  updated_at: string;
}

export interface Seat {
  id: string;
  show_id: string;
  row_label: string;
  seat_number: number;
  status: SeatStatus;
  created_at: string;
}

export interface Booking {
  id: string;
  show_id: string;
  booking_code: string;
  guest_name: string;
  guest_contact: string | null;
  status: BookingStatus;
  created_at: string;
  checked_in_at: string | null;
}

export interface BookingSeat {
  id: string;
  booking_id: string;
  seat_id: string;
  created_at: string;
}

export type SeatAvailability =
  | "available"
  | "selected"
  | "reserved"
  | "blocked";

export interface SeatWithAvailability extends Seat {
  availability: SeatAvailability;
  guest_name?: string;
  booking_code?: string;
  booking_id?: string;
}

export interface BookingWithSeats extends Booking {
  seats: Seat[];
  show?: Show;
}

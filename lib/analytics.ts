/**
 * Lightweight analytics hooks.
 * Wire to a provider later; no PII.
 */
export type TheaterEvent =
  | "show_viewed"
  | "seat_selected"
  | "booking_started"
  | "booking_completed"
  | "booking_cancelled"
  | "admin_show_created"
  | "check_in_completed";

export function track(
  event: TheaterEvent,
  props?: { showId?: string; showTitle?: string; bookingId?: string; seatId?: string },
) {
  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", event, props ?? {});
  }
}

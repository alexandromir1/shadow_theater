import {
  listPublishedShows,
  getSeatsForShow,
  reserveSeats,
  checkInBooking,
  listBookingsForShow,
} from "../lib/db/local";

async function main() {
  const shows = await listPublishedShows();
  console.log("shows", shows.map((s) => s.title));
  const seats = await getSeatsForShow(shows[0].id);
  const free = seats.filter((s) => s.availability === "available").slice(0, 2);
  const r1 = await reserveSeats({
    showId: shows[0].id,
    seatIds: free.map((s) => s.id),
    guestName: "Анна",
  });
  console.log("reserve1", r1.ok, r1.ok ? r1.booking.booking_code : r1);
  const r2 = await reserveSeats({
    showId: shows[0].id,
    seatIds: [free[0].id],
    guestName: "Борис",
  });
  console.log("conflict", r2.ok, !r2.ok && r2.error);
  if (r1.ok) {
    const ci = await checkInBooking(r1.booking.id);
    console.log("checkin", ci?.status);
    const bookings = await listBookingsForShow(shows[0].id);
    console.log("bookings", bookings.length, bookings[0]?.status);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

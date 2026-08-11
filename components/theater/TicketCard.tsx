"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import { formatShowDateTime } from "@/lib/mock/shows";
import type { BookingWithSeats, Show } from "@/lib/types";

type TicketCardProps = {
  booking: BookingWithSeats;
  show: Show;
};

export function TicketCard({ booking, show }: TicketCardProps) {
  const reduced = useFramerReduced();
  const seatsLabel = booking.seats
    .map((s) => `${s.row_label}${s.seat_number}`)
    .sort()
    .join(" · ");

  return (
    <motion.div
      className="poster-frame relative mx-auto max-w-sm overflow-hidden rounded-sm px-8 py-10 text-center"
      style={{
        background:
          "linear-gradient(165deg, rgba(42,27,94,0.75) 0%, rgba(12,10,36,0.95) 100%)",
      }}
      initial={reduced ? false : { rotateX: 8, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Театр теней</p>
      <p className="mt-1 font-display text-2xl text-[var(--cream)]">Мии</p>
      <div className="my-6 h-px bg-gradient-to-r from-transparent via-[rgba(201,164,92,0.4)] to-transparent" />
      <h2 className="font-display text-2xl text-[var(--gold-soft)]">«{show.title}»</h2>
      <p className="mt-4 text-[var(--cream-muted)]">
        {formatShowDateTime(show.date, show.start_time)}
      </p>
      <p className="mt-2 text-sm text-[var(--cream-muted)]">{show.venue}</p>
      <p className="mt-6 font-display text-lg text-[var(--cream)]">
        {booking.seats.map((s) => `Ряд ${s.row_label} · Место ${s.seat_number}`).join(", ")}
      </p>
      <p className="mt-1 text-xs text-[var(--cream-muted)]">{seatsLabel}</p>
      <p className="mt-8 font-display text-xl tracking-[0.2em] text-[var(--gold)]">
        {booking.booking_code}
      </p>
      <p className="mt-2 text-sm text-[var(--cream-muted)]">{booking.guest_name}</p>
      <p className="mt-8 text-sm text-[var(--cream)]">До встречи в театре</p>
      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />
    </motion.div>
  );
}

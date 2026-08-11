"use client";

import { AnimatePresence, motion, useReducedMotion as useFramerReduced } from "motion/react";
import { useMemo, useState, useTransition } from "react";
import { reserveBookingAction } from "@/app/actions/booking";
import { SeatMap } from "@/components/booking/SeatMap";
import { TicketCard } from "@/components/theater/TicketCard";
import { MagicButton } from "@/components/theater/MagicButton";
import { motionTokens } from "@/lib/motion/tokens";
import type { BookingWithSeats, SeatWithAvailability, Show } from "@/lib/types";

type BookingFlowProps = {
  show: Show;
  seats: SeatWithAvailability[];
};

type Step = "seats" | "form" | "done";

export function BookingFlow({ show, seats: initialSeats }: BookingFlowProps) {
  const reduced = useFramerReduced();
  const [seats, setSeats] = useState(initialSeats);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("seats");
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingWithSeats | null>(null);
  const [pending, startTransition] = useTransition();
  const [curtain, setCurtain] = useState(false);

  const selectedSeats = useMemo(
    () => seats.filter((s) => selectedIds.includes(s.id)),
    [seats, selectedIds],
  );

  const selectionLabel = useMemo(() => {
    const byRow = new Map<string, number[]>();
    for (const seat of selectedSeats) {
      const list = byRow.get(seat.row_label) ?? [];
      list.push(seat.seat_number);
      byRow.set(seat.row_label, list);
    }
    return [...byRow.entries()]
      .map(([row, nums]) => `Ряд ${row} · места ${nums.sort((a, b) => a - b).join(", ")}`)
      .join("; ");
  }, [selectedSeats]);

  const toggleSeat = (seatId: string) => {
    setError(null);
    setSelectedIds((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId],
    );
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      if (!reduced) {
        setCurtain(true);
        await new Promise((r) => setTimeout(r, 500));
      }

      const result = await reserveBookingAction({
        showId: show.id,
        seatIds: selectedIds,
        guestName,
        guestContact: guestContact || undefined,
      });

      if (!result.ok) {
        setCurtain(false);
        setError(result.message);
        if (result.error === "conflict") {
          setSeats((prev) =>
            prev.map((s) =>
              selectedIds.includes(s.id)
                ? { ...s, availability: "reserved" as const }
                : s,
            ),
          );
          setSelectedIds([]);
          setStep("seats");
        }
        return;
      }

      setBooking(result.booking);
      setStep("done");
      setCurtain(false);
      setSeats((prev) =>
        prev.map((s) =>
          selectedIds.includes(s.id)
            ? { ...s, availability: "reserved" as const }
            : s,
        ),
      );
    });
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {curtain && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,6,26,0.72)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-full w-1/2 origin-left bg-[var(--curtain)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: motionTokens.curtain.duration, ease: motionTokens.curtain.ease }}
              style={{ position: "absolute", left: 0 }}
            />
            <motion.div
              className="h-full w-1/2 origin-right bg-[var(--curtain)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: motionTokens.curtain.duration, ease: motionTokens.curtain.ease }}
              style={{ position: "absolute", right: 0 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {step === "seats" && (
        <div>
          <SeatMap seats={seats} selectedIds={selectedIds} onToggle={toggleSeat} />

          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(201,164,92,0.25)] bg-[rgba(12,10,36,0.95)] px-4 py-4 backdrop-blur-md md:static md:mt-10 md:rounded-sm md:border md:px-6"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-lg text-[var(--cream)]">Ваши места</p>
                    <p className="text-sm text-[var(--cream-muted)]">{selectionLabel}</p>
                    <p className="mt-1 text-xs text-[var(--gold)]">
                      {selectedIds.length}{" "}
                      {selectedIds.length === 1
                        ? "место"
                        : selectedIds.length < 5
                          ? "места"
                          : "мест"}
                    </p>
                  </div>
                  <MagicButton onClick={() => setStep("form")}>Продолжить</MagicButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {step === "form" && (
        <motion.div
          className="mx-auto max-w-md"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            type="button"
            className="mb-6 text-sm text-[var(--cream-muted)] hover:text-[var(--gold)]"
            onClick={() => setStep("seats")}
          >
            ← Назад к местам
          </button>
          <h3 className="font-display text-3xl text-[var(--cream)]">Как вас зовут?</h3>
          <p className="mt-2 text-sm text-[var(--cream-muted)]">{selectionLabel}</p>

          <label className="mt-8 block">
            <span className="sr-only">Имя</span>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full border-b border-[rgba(201,164,92,0.4)] bg-transparent px-1 py-3 font-display text-2xl text-[var(--cream)] outline-none placeholder:text-[rgba(216,203,176,0.4)] focus:border-[var(--gold)]"
              autoFocus
            />
          </label>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm text-[var(--cream-muted)]">
              Контакт (по желанию)
            </span>
            <input
              value={guestContact}
              onChange={(e) => setGuestContact(e.target.value)}
              placeholder="Телефон или Telegram"
              className="w-full rounded-sm border border-[rgba(201,164,92,0.25)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-[var(--cream)] outline-none focus:border-[var(--gold)]"
            />
          </label>

          {error && (
            <p className="mt-4 text-sm text-[var(--gold-soft)]" role="alert">
              {error}
            </p>
          )}

          <div className="mt-8">
            <MagicButton
              onClick={submit}
              disabled={pending || !guestName.trim()}
              className="w-full disabled:opacity-50"
            >
              {pending ? "Бронируем…" : "Забронировать"}
            </MagicButton>
          </div>
        </motion.div>
      )}

      {step === "done" && booking && (
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: motionTokens.reveal.ease }}
        >
          <TicketCard booking={booking} show={show} />
          <div className="mt-8 text-center">
            <MagicButton href="/" variant="ghost">
              На главную
            </MagicButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}

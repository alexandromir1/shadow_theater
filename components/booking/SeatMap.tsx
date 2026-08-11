"use client";

import { AnimatePresence, motion, useReducedMotion as useFramerReduced } from "motion/react";
import { useMemo, useState } from "react";
import { motionTokens } from "@/lib/motion/tokens";
import type { SeatWithAvailability } from "@/lib/types";

type SeatMapProps = {
  seats: SeatWithAvailability[];
  selectedIds: string[];
  onToggle: (seatId: string) => void;
  interactive?: boolean;
  /** Admin mode: click any seat to inspect; selection is highlight only */
  mode?: "guest" | "admin";
};

export function SeatMap({
  seats,
  selectedIds,
  onToggle,
  interactive = true,
  mode = "guest",
}: SeatMapProps) {
  const reduced = useFramerReduced();
  const [flashId, setFlashId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const map = new Map<string, SeatWithAvailability[]>();
    for (const seat of seats) {
      const list = map.get(seat.row_label) ?? [];
      list.push(seat);
      map.set(seat.row_label, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  const handleClick = (seat: SeatWithAvailability) => {
    if (!interactive) return;
    if (mode === "guest") {
      if (seat.availability === "reserved" || seat.availability === "blocked") return;
      setFlashId(seat.id);
      window.setTimeout(() => setFlashId(null), 450);
    }
    onToggle(seat.id);
  };

  const isAdmin = mode === "admin";

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8 text-center">
        {isAdmin ? (
          <>
            <div className="mx-auto mb-2 h-1.5 w-[70%] rounded-full bg-stone-300" />
            <p className="text-sm font-semibold tracking-[0.2em] text-stone-700">СЦЕНА</p>
          </>
        ) : (
          <>
            <div
              className="mx-auto mb-2 h-2 w-[70%] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(201,164,92,0.7), transparent)",
                boxShadow: "0 0 24px rgba(201,164,92,0.35)",
              }}
            />
            <p className="font-display text-sm tracking-[0.3em] text-[var(--gold)]">СЦЕНА</p>
            <p className="mt-1 text-xs text-[var(--cream-muted)]">Театр теней</p>
          </>
        )}
      </div>

      <div className="space-y-4">
        {rows.map(([row, rowSeats]) => (
          <div key={row} className="flex items-center justify-center gap-2 sm:gap-3">
            <span
              className={`w-6 text-center text-xs ${isAdmin ? "text-stone-500" : "text-[var(--cream-muted)]"}`}
            >
              {row}
            </span>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {rowSeats.map((seat) => {
                const selected = selectedIds.includes(seat.id);
                const reserved = seat.availability === "reserved";
                const blocked = seat.availability === "blocked";
                const available = seat.availability === "available";

                const adminBg = blocked
                  ? "#eab308"
                  : reserved
                    ? "#ef4444"
                    : selected
                      ? "#22c55e"
                      : "#4ade80";
                const adminBorder = selected ? "#166534" : "transparent";

                return (
                  <motion.button
                    key={seat.id}
                    type="button"
                    disabled={
                      !interactive ||
                      (mode === "guest" && (reserved || blocked))
                    }
                    aria-label={`Ряд ${seat.row_label}, место ${seat.seat_number}`}
                    onClick={() => handleClick(seat)}
                    className="relative h-10 w-10 rounded-full sm:h-11 sm:w-11"
                    style={
                      isAdmin
                        ? {
                            background: adminBg,
                            border: `2px solid ${adminBorder}`,
                            cursor: "pointer",
                            boxShadow: selected ? "0 0 0 2px #166534" : undefined,
                          }
                        : {
                            background: blocked
                              ? "var(--seat-blocked)"
                              : reserved
                                ? "var(--seat-reserved)"
                                : selected
                                  ? "var(--seat-selected)"
                                  : "transparent",
                            border: `1.5px solid ${
                              selected
                                ? "var(--gold)"
                                : blocked
                                  ? "transparent"
                                  : reserved
                                    ? "rgba(90,74,120,0.8)"
                                    : "rgba(224,196,135,0.65)"
                            }`,
                            boxShadow: selected
                              ? "0 0 18px rgba(201,164,92,0.55)"
                              : available
                                ? "0 0 0 rgba(0,0,0,0)"
                                : undefined,
                            cursor:
                              !interactive || (mode === "guest" && (reserved || blocked))
                                ? "default"
                                : "pointer",
                            opacity: blocked ? 0.35 : 1,
                          }
                    }
                    whileHover={
                      reduced ||
                      !interactive ||
                      (mode === "guest" && !available)
                        ? undefined
                        : { scale: 1.08, boxShadow: isAdmin ? undefined : "0 0 14px rgba(201,164,92,0.4)" }
                    }
                    whileTap={
                      reduced ||
                      !interactive ||
                      (mode === "guest" && !available)
                        ? undefined
                        : { scale: 0.92 }
                    }
                    animate={
                      selected && !reduced
                        ? { scale: [1, 1.12, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: motionTokens.tactile.duration, ease: motionTokens.tactile.ease }}
                  >
                    <span
                      className="text-[10px] font-medium"
                      style={{
                        color: isAdmin
                          ? reserved || blocked
                            ? "#fff"
                            : "#14532d"
                          : selected
                            ? "var(--night-950)"
                            : reserved
                              ? "var(--cream-muted)"
                              : "var(--gold-soft)",
                      }}
                    >
                      {seat.seat_number}
                    </span>
                    <AnimatePresence>
                      {flashId === seat.id && !reduced && (
                        <motion.span
                          className="pointer-events-none absolute inset-0 rounded-full"
                          initial={{ opacity: 0.8, scale: 0.6 }}
                          animate={{ opacity: 0, scale: 1.8 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.45 }}
                          style={{
                            boxShadow: "0 0 20px rgba(245,230,168,0.8)",
                            background: "rgba(245,230,168,0.25)",
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
            <span
              className={`w-6 text-center text-xs ${isAdmin ? "text-stone-500" : "text-[var(--cream-muted)]"}`}
            >
              {row}
            </span>
          </div>
        ))}
      </div>

      <div
        className={`mt-8 flex flex-wrap items-center justify-center gap-4 text-xs ${isAdmin ? "text-stone-600" : "text-[var(--cream-muted)]"}`}
      >
        {isAdmin ? (
          <>
            <Legend color="#4ade80" border="transparent" label="Свободно" />
            <Legend color="#ef4444" border="transparent" label="Забронировано" />
            <Legend color="#eab308" border="transparent" label="Заблокировано" />
          </>
        ) : (
          <>
            <Legend color="transparent" border="rgba(224,196,135,0.65)" label="Свободно" />
            <Legend color="var(--seat-selected)" border="var(--gold)" label="Выбрано" />
            <Legend color="var(--seat-reserved)" border="rgba(90,74,120,0.8)" label="Занято" />
          </>
        )}
      </div>
    </div>
  );
}

function Legend({
  color,
  border,
  label,
}: {
  color: string;
  border: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{ background: color, border: `1px solid ${border}` }}
      />
      {label}
    </span>
  );
}

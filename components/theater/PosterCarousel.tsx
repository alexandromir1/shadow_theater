"use client";

import { AnimatePresence, motion, useReducedMotion as useFramerReduced } from "motion/react";
import { useState } from "react";
import { StagePoster, type StagePosterItem } from "@/components/theater/StagePoster";

type PosterCarouselProps = {
  items: StagePosterItem[];
  visible?: boolean;
  emptyMessage?: string | null;
};

export function PosterCarousel({
  items,
  visible = true,
  emptyMessage,
}: PosterCarouselProps) {
  const reduced = useFramerReduced();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  if (!items.length) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center px-6 text-center transition-opacity duration-500 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <p className="font-display text-xl text-[var(--cream)]">Афиша пока пуста</p>
        <p className="mt-3 max-w-md text-sm text-[var(--cream-muted)]">
          {emptyMessage ||
            "Опубликуйте спектакль в /admin — и он появится здесь."}
        </p>
      </div>
    );
  }

  const go = (dir: number) => {
    setDirection(dir);
    setIndex((i) => (i + dir + items.length) % items.length);
  };

  const current = items[index];
  const prev = items[(index - 1 + items.length) % items.length];
  const next = items[(index + 1) % items.length];

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center px-4 transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <p className="mb-4 font-display text-lg text-[var(--cream)] md:text-xl">
        Выбери спектакль
      </p>

      <div className="relative flex h-[min(62vh,520px)] w-full max-w-3xl items-center justify-center">
        {/* Side peek posters */}
        {items.length > 1 && (
          <>
            <motion.div
              className="pointer-events-none absolute left-[2%] top-1/2 hidden -translate-y-1/2 scale-[0.72] opacity-35 blur-[0.5px] sm:block"
              aria-hidden
              style={{ rotate: -8 }}
            >
              <StagePoster item={prev} active={false} />
            </motion.div>
            <motion.div
              className="pointer-events-none absolute right-[2%] top-1/2 hidden -translate-y-1/2 scale-[0.72] opacity-35 blur-[0.5px] sm:block"
              aria-hidden
              style={{ rotate: 8 }}
            >
              <StagePoster item={next} active={false} />
            </motion.div>
          </>
        )}

        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={current.show.id}
            className="relative z-10"
            custom={direction}
            initial={
              reduced
                ? { opacity: 0 }
                : {
                    x: direction >= 0 ? 120 : -120,
                    opacity: 0,
                    rotate: direction >= 0 ? 8 : -8,
                    scale: 0.9,
                  }
            }
            animate={{ x: 0, opacity: 1, rotate: 0, scale: 1 }}
            exit={
              reduced
                ? { opacity: 0 }
                : {
                    x: direction >= 0 ? -120 : 120,
                    opacity: 0,
                    rotate: direction >= 0 ? -8 : 8,
                    scale: 0.9,
                  }
            }
            transition={{ type: "spring", stiffness: 160, damping: 20, mass: 0.85 }}
          >
            <StagePoster item={current} />
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <div className="mt-4 flex items-center gap-6">
          <CarouselArrow label="Назад" onClick={() => go(-1)} side="left" />
          <div className="flex gap-2">
            {items.map((item, i) => (
              <button
                key={item.show.id}
                type="button"
                aria-label={item.show.title}
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                className="h-2 w-2 rounded-full transition-transform"
                style={{
                  background:
                    i === index ? "var(--gold)" : "rgba(216,203,176,0.35)",
                  transform: i === index ? "scale(1.3)" : "scale(1)",
                }}
              />
            ))}
          </div>
          <CarouselArrow label="Дальше" onClick={() => go(1)} side="right" />
        </div>
      )}
    </div>
  );
}

function CarouselArrow({
  label,
  onClick,
  side,
}: {
  label: string;
  onClick: () => void;
  side: "left" | "right";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,164,92,0.45)] bg-[rgba(12,10,36,0.55)] text-xl text-[var(--gold)] transition-colors hover:border-[var(--gold)] hover:bg-[rgba(201,164,92,0.15)]"
    >
      {side === "left" ? "←" : "→"}
    </button>
  );
}

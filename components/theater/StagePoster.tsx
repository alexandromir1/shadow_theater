"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion as useFramerReduced,
  useSpring,
  useTransform,
} from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatShowDate, seatsLabel } from "@/lib/mock/shows";
import type { Show } from "@/lib/types";

export type StagePosterItem = {
  show: Show;
  freeSeats: number;
};

type StagePosterProps = {
  item: StagePosterItem;
  active?: boolean;
  onEnter?: () => void;
};

export function StagePoster({ item, active = true, onEnter }: StagePosterProps) {
  const { show, freeSeats } = item;
  const reduced = useFramerReduced();
  const router = useRouter();
  const ref = useRef<HTMLButtonElement>(null);
  const [zooming, setZooming] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 120, damping: 18 });
  const springY = useSpring(my, { stiffness: 120, damping: 18 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !active) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mx.set(x);
    my.set(y);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const soldOut = freeSeats <= 0;

  const handleClick = () => {
    if (!active) return;
    onEnter?.();
    if (reduced) {
      router.push(`/shows/${show.slug}`);
      return;
    }
    setZooming(true);
    window.setTimeout(() => {
      router.push(`/shows/${show.slug}`);
    }, 480);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={handleClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative w-[min(78vw,300px)] origin-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
      style={{
        rotateX: reduced ? 0 : rotateX,
        rotateY: reduced ? 0 : rotateY,
        transformPerspective: 900,
      }}
      whileHover={reduced || !active ? undefined : { y: -6, scale: 1.03 }}
      animate={
        zooming
          ? { scale: 1.35, opacity: 0.2 }
          : { scale: 1, opacity: 1 }
      }
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      aria-label={soldOut ? `${show.title}. Мест нет` : `${show.title}. В театр`}
    >
      <div
        className="relative aspect-[3/4.2] overflow-hidden rounded-sm"
        style={{
          border: "1px solid rgba(201,164,92,0.4)",
          boxShadow:
            "0 18px 50px rgba(0,0,0,0.5), 0 0 30px rgba(201,164,92,0.18), inset 0 0 0 5px rgba(18,12,36,0.55)",
          background:
            "linear-gradient(165deg, #1a1440 0%, #0c0a24 50%, #15102e 100%)",
        }}
      >
        {/* Art layer */}
        <div className="absolute inset-0">
          {show.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={show.poster_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-55"
            />
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 18%, rgba(245,240,216,0.28), transparent 48%), radial-gradient(ellipse at 30% 80%, rgba(61,42,122,0.55), transparent 45%)",
                }}
              />
              <svg
                className="absolute inset-x-0 bottom-0 h-[48%] w-full"
                viewBox="0 0 300 160"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  fill="#05080f"
                  d="M0 160V80l25-30 20 22 30-48 25 35 28-28 35 45 20-40 40 55 25-30 35 35 22-22 20 28V160H0Z"
                />
              </svg>
              <div
                className="absolute left-1/2 top-[14%] h-9 w-9 -translate-x-1/2 rounded-full"
                style={{
                  background: "radial-gradient(circle at 35% 30%, #fffef5, #e8d9a8)",
                  boxShadow: "var(--glow-moon)",
                }}
              />
            </>
          )}
          {show.poster_url && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(8,6,20,0.35) 0%, rgba(8,6,20,0.55) 45%, rgba(8,6,20,0.92) 100%)",
              }}
            />
          )}
        </div>

        {/* All info ON the poster */}
        <div className="absolute inset-0 z-10 flex flex-col px-5 pb-5 pt-6">
          <p className="text-center text-[10px] uppercase tracking-[0.28em] text-[var(--gold-soft)]">
            Афиша
          </p>
          <h3 className="mt-auto text-center font-display text-[clamp(1.5rem,5vw,2rem)] leading-tight text-[var(--cream)] text-glow-gold">
            {show.title}
          </h3>
          <div className="mt-4 space-y-1 text-center text-sm text-[var(--cream-muted)]">
            <p>{formatShowDate(show.date)}</p>
            <p className="text-[var(--gold-soft)]">{show.start_time}</p>
            <p className="pt-1 text-xs">{seatsLabel(freeSeats)}</p>
          </div>
          <p className="mt-4 text-center font-medium tracking-wide text-[var(--gold)]">
            {soldOut ? "Все места заняты" : "В театр →"}
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-3 top-3 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50" />
        <div className="pointer-events-none absolute inset-x-3 bottom-3 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-40" />
      </div>
    </motion.button>
  );
}

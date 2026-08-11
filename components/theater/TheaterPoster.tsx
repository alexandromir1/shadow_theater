"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import Link from "next/link";
import { formatShowDateTime } from "@/lib/mock/shows";
import { motionTokens } from "@/lib/motion/tokens";
import type { Show } from "@/lib/types";

type TheaterPosterProps = {
  show: Show;
  href?: string;
};

function PosterArt({ title }: { title: string }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[linear-gradient(160deg,#1a1440_0%,#0c0a24_50%,#15102e_100%)]">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, rgba(245,240,216,0.2), transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(61,42,122,0.5), transparent 45%)",
        }}
      />
      <svg
        className="absolute inset-x-0 bottom-0 h-[55%] w-full opacity-80"
        viewBox="0 0 300 180"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="#05080f"
          d="M0 180V90l25-35 20 25 30-55 25 40 28-30 35 50 20-45 40 60 25-35 35 40 22-25 20 30V180H0Z"
        />
      </svg>
      <div className="absolute left-1/2 top-[18%] h-10 w-10 -translate-x-1/2 rounded-full bg-[var(--moon)] opacity-90 shadow-[var(--glow-moon)]" />
      <p className="absolute inset-x-4 bottom-8 text-center font-display text-xl leading-tight text-[var(--cream)] text-glow-gold md:text-2xl">
        {title}
      </p>
    </div>
  );
}

export function TheaterPoster({ show, href }: TheaterPosterProps) {
  const reduced = useFramerReduced();
  const link = href ?? `/shows/${show.slug}`;

  return (
    <motion.article
      className="group relative mx-auto w-full max-w-[280px]"
      whileHover={
        reduced
          ? undefined
          : {
              y: -4,
              scale: 1.02,
            }
      }
      transition={{ duration: motionTokens.hover.duration, ease: motionTokens.hover.ease }}
    >
      <Link href={link} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]">
        <div className="poster-frame relative overflow-hidden rounded-sm bg-[var(--night-800)] transition-[box-shadow] duration-300 group-hover:shadow-[0_16px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(201,164,92,0.22)]">
          <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />
          <PosterArt title={show.title} />
          <div className="space-y-3 px-5 py-5 text-center">
            <p className="text-sm tracking-wide text-[var(--cream-muted)]">
              {formatShowDateTime(show.date, show.start_time)}
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--gold)] transition-transform duration-300 group-hover:translate-x-0.5">
              В театр
              <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

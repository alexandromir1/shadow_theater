"use client";

import { Reveal } from "@/components/motion/Reveal";
import { TheaterPoster } from "@/components/theater/TheaterPoster";
import type { Show } from "@/lib/types";

type UpcomingShowsProps = {
  shows: Show[];
};

export function UpcomingShows({ shows }: UpcomingShowsProps) {
  return (
    <section
      id="afisha"
      className="relative px-6 py-[var(--space-section)]"
      style={{
        background:
          "linear-gradient(180deg, #05040f 0%, var(--night-900) 40%, var(--night-950) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(61,42,122,0.35), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <Reveal>
          <h2 className="text-center font-display text-3xl text-[var(--cream)] md:text-4xl">
            Ближайшие представления
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-[var(--cream-muted)]">
            Выберите историю и войдите в зал
          </p>
        </Reveal>

        <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-10">
          {shows.map((show, i) => (
            <Reveal key={show.id} delay={0.1 * i}>
              <TheaterPoster show={show} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

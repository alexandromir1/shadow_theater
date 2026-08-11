"use client";

import { Reveal } from "@/components/motion/Reveal";

export function AboutTheater() {
  return (
    <section
      className="relative px-6 pb-[var(--space-section)] pt-8"
      style={{
        background:
          "linear-gradient(180deg, var(--night-950) 0%, #0a0818 100%)",
      }}
    >
      <Reveal>
        <div className="poster-frame relative mx-auto max-w-xl overflow-hidden rounded-sm px-8 py-12 text-center md:px-14 md:py-16"
          style={{
            background:
              "linear-gradient(165deg, rgba(30,23,79,0.65) 0%, rgba(12,10,36,0.9) 100%)",
          }}
        >
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50" />
          <h2 className="font-display text-2xl tracking-wide text-[var(--cream)] md:text-3xl">
            О нашем театре
          </h2>
          <p className="mx-auto mt-6 max-w-sm text-[var(--cream-muted)] leading-relaxed">
            Здесь маленькие руки создают большие истории.
          </p>
          <div
            className="mx-auto my-8 h-8 w-8 rounded-full bg-[var(--moon)] opacity-80"
            style={{ boxShadow: "var(--glow-moon)" }}
            aria-hidden
          />
          <p className="mx-auto max-w-sm text-[var(--cream-muted)] leading-relaxed">
            Каждый спектакль — новая маленькая сказка.
          </p>
          <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50" />
        </div>
      </Reveal>
    </section>
  );
}

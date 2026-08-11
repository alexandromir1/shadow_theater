"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { MagicalBackground } from "@/components/scene/MagicalBackground";
import { MagicButton } from "@/components/theater/MagicButton";

export function HeroScene() {
  return (
    <MagicalBackground className="min-h-[100svh]">
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 pb-28 pt-16 text-center md:pb-36">
        <FadeIn delay={0.1}>
          <p className="mb-6 text-xs uppercase tracking-[0.35em] text-[var(--gold-soft)] md:text-sm">
            Добро пожаловать
          </p>
        </FadeIn>

        <FadeIn delay={0.25}>
          <h1 className="font-display text-[clamp(2.75rem,10vw,5.5rem)] leading-[0.95] tracking-wide text-[var(--cream)] text-glow-gold">
            <span className="block">Театр</span>
            <span className="block">теней</span>
            <span className="mt-2 block text-[clamp(2rem,7vw,3.75rem)] text-[var(--gold)]">
              Мии
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.45} y={12}>
          <p className="mx-auto mt-6 max-w-md text-base text-[var(--cream-muted)] md:text-lg">
            Маленькие истории в мире теней
          </p>
        </FadeIn>

        <FadeIn delay={0.65} y={10}>
          <div className="mt-10">
            <MagicButton href="#afisha">Смотреть афишу</MagicButton>
          </div>
        </FadeIn>
      </section>
    </MagicalBackground>
  );
}

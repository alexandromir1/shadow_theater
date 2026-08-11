"use client";

import { motion, type MotionValue, useTransform } from "motion/react";

type StoryHeaderProps = {
  visibility: MotionValue<number>;
  onRestart: () => void;
};

export function StoryHeader({ visibility, onRestart }: StoryHeaderProps) {
  const opacity = useTransform(visibility, [0, 1], [0, 1]);
  const y = useTransform(visibility, [0, 1], [-12, 0]);
  const pointer = useTransform(visibility, (v) => (v > 0.5 ? "auto" : "none"));

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-4 md:px-8"
      style={{
        opacity,
        y,
        pointerEvents: pointer,
        background:
          "linear-gradient(180deg, rgba(7,6,26,0.75) 0%, transparent 100%)",
      }}
    >
      <p className="font-display text-lg tracking-wide text-[var(--cream)] md:text-xl">
        Театр Мии
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="rounded-sm border border-[rgba(201,164,92,0.45)] bg-[rgba(12,10,36,0.55)] px-4 py-2 text-sm text-[var(--gold)] backdrop-blur-sm transition-colors hover:border-[var(--gold)] hover:bg-[rgba(201,164,92,0.12)]"
      >
        Сначала
      </button>
    </motion.header>
  );
}

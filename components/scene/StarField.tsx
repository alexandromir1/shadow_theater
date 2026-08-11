"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import { useMemo } from "react";
import { motionTokens } from "@/lib/motion/tokens";

type StarFieldProps = {
  count?: number;
  className?: string;
};

export function StarField({ count = 48, className = "" }: StarFieldProps) {
  const reduced = useFramerReduced();
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: ((i * 47) % 100) + (i % 7) * 0.3,
        top: ((i * 31) % 70) + (i % 5) * 0.4,
        size: 1 + (i % 3) * 0.6,
        delay: (i % 10) * 0.35,
        duration: motionTokens.starTwinkle.duration + (i % 5) * 0.4,
        opacity: 0.35 + (i % 4) * 0.15,
      })),
    [count],
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {stars.map((star) => (
        <motion.span
          key={star.id}
          className="absolute rounded-full bg-[var(--moon)]"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            boxShadow: `0 0 ${star.size * 3}px rgba(245, 240, 216, 0.6)`,
          }}
          initial={{ opacity: star.opacity }}
          animate={
            reduced
              ? { opacity: star.opacity }
              : { opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.45] }
          }
          transition={
            reduced
              ? undefined
              : {
                  duration: star.duration,
                  repeat: Infinity,
                  delay: star.delay,
                  ease: motionTokens.starTwinkle.ease,
                }
          }
        />
      ))}
    </div>
  );
}

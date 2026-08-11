"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import { useMemo } from "react";

type FloatingParticlesProps = {
  count?: number;
  className?: string;
  offsetX?: number;
  offsetY?: number;
};

export function FloatingParticles({
  count = 18,
  className = "",
  offsetX = 0,
  offsetY = 0,
}: FloatingParticlesProps) {
  const reduced = useFramerReduced();
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: ((i * 53) % 96) + 2,
        top: 20 + ((i * 37) % 60),
        size: 2 + (i % 3),
        delay: (i % 8) * 0.6,
        duration: 5 + (i % 6),
        warm: i % 3 === 0,
      })),
    [count],
  );

  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      animate={{ x: offsetX, y: offsetY }}
      transition={{ type: "spring", stiffness: 35, damping: 18 }}
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.warm
              ? "rgba(224, 196, 135, 0.85)"
              : "rgba(245, 240, 216, 0.7)",
            boxShadow: p.warm
              ? "0 0 10px rgba(201, 164, 92, 0.55)"
              : "0 0 8px rgba(245, 240, 216, 0.45)",
          }}
          animate={
            reduced
              ? { opacity: 0.5 }
              : {
                  y: [0, -18, 0],
                  opacity: [0.2, 0.85, 0.25],
                }
          }
          transition={
            reduced
              ? undefined
              : {
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </motion.div>
  );
}

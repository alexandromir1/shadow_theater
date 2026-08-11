"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import type { ReactNode } from "react";
import { motionTokens } from "@/lib/motion/tokens";

type FloatingElementProps = {
  children: ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
};

export function FloatingElement({
  children,
  className,
  amplitude = 8,
  duration = motionTokens.float.duration,
}: FloatingElementProps) {
  const reduced = useFramerReduced();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

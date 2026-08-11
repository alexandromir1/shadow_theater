"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import type { ReactNode } from "react";
import { motionTokens } from "@/lib/motion/tokens";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

export function FadeIn({ children, className, delay = 0, y = 16 }: FadeInProps) {
  const reduced = useFramerReduced();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.reveal.duration,
        ease: motionTokens.reveal.ease,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

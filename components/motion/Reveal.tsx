"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import type { ReactNode } from "react";
import { motionTokens } from "@/lib/motion/tokens";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduced = useFramerReduced();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
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

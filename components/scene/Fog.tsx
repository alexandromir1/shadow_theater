"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import { motionTokens } from "@/lib/motion/tokens";

type FogProps = {
  className?: string;
};

export function Fog({ className = "" }: FogProps) {
  const reduced = useFramerReduced();

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <motion.div
        className="absolute -inset-x-[20%] bottom-[8%] h-[40%]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(180,190,220,0.14) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
        animate={reduced ? undefined : { x: ["-8%", "8%", "-8%"] }}
        transition={{
          duration: motionTokens.fog.duration,
          repeat: Infinity,
          ease: motionTokens.fog.ease,
        }}
      />
      <motion.div
        className="absolute -inset-x-[30%] bottom-[18%] h-[28%]"
        style={{
          background:
            "radial-gradient(ellipse at 40% 50%, rgba(200,210,230,0.1) 0%, transparent 65%)",
          filter: "blur(28px)",
        }}
        animate={reduced ? undefined : { x: ["6%", "-10%", "6%"] }}
        transition={{
          duration: motionTokens.fog.duration * 1.2,
          repeat: Infinity,
          ease: motionTokens.fog.ease,
        }}
      />
    </div>
  );
}

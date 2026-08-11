"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import { motionTokens } from "@/lib/motion/tokens";

type MoonProps = {
  className?: string;
  offsetX?: number;
  offsetY?: number;
};

export function Moon({ className = "", offsetX = 0, offsetY = 0 }: MoonProps) {
  const reduced = useFramerReduced();

  return (
    <motion.div
      className={`pointer-events-none ${className}`}
      style={{ willChange: "transform" }}
      animate={
        reduced
          ? { x: offsetX, y: offsetY }
          : {
              x: offsetX,
              y: [offsetY, offsetY - 6, offsetY],
            }
      }
      transition={
        reduced
          ? { type: "spring", stiffness: 40, damping: 20 }
          : {
              x: { type: "spring", stiffness: 40, damping: 20 },
              y: {
                duration: motionTokens.dreamy.duration,
                repeat: Infinity,
                ease: motionTokens.float.ease,
              },
            }
      }
    >
      <div
        className="relative h-20 w-20 rounded-full md:h-28 md:w-28"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #fffef5 0%, #f5f0d8 40%, #e8d9a8 100%)",
          boxShadow: "var(--glow-moon)",
        }}
      >
        <div
          className="absolute inset-[18%] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle at 70% 60%, transparent 40%, rgba(12,10,36,0.25) 100%)",
          }}
        />
      </div>
    </motion.div>
  );
}

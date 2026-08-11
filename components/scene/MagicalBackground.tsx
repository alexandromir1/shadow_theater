"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import type { ReactNode } from "react";
import { FloatingParticles } from "@/components/scene/FloatingParticles";
import { Fog } from "@/components/scene/Fog";
import { ForestLayer } from "@/components/scene/ForestLayer";
import { Moon } from "@/components/scene/Moon";
import { ParallaxLayer } from "@/components/scene/ParallaxLayer";
import { StarField } from "@/components/scene/StarField";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useFinePointer, useMouseParallax } from "@/lib/motion/useMouseParallax";

type MagicalBackgroundProps = {
  children?: ReactNode;
  className?: string;
  intensity?: "full" | "soft";
  showForest?: boolean;
  parallax?: boolean;
};

/** Max px shift — layers are oversized so edges never appear */
const DEPTH = {
  sky: 14,
  stars: 28,
  moon: 18,
  farForest: 36,
  fog: 24,
  nearForest: 48,
  particles: 40,
} as const;

/** Extra bleed outside the viewport (covers parallax travel) */
const BLEED = "inset-[-22%]";

export function MagicalBackground({
  children,
  className = "",
  intensity = "full",
  showForest = true,
  parallax = true,
}: MagicalBackgroundProps) {
  const reducedPref = useReducedMotion();
  const reducedFramer = useFramerReduced();
  const reduced = reducedPref || !!reducedFramer;
  const finePointer = useFinePointer();
  const soft = intensity === "soft";
  const mouseOn = parallax && !reduced && finePointer;
  const mouse = useMouseParallax(mouseOn);
  const k = soft ? 0.85 : 1;

  const starCount = soft ? 52 : 64;
  const particleCount = reduced ? 0 : soft ? 16 : 20;

  return (
    <div className={`relative isolate overflow-hidden magical-gradient ${className}`}>
      {/* Base fill also oversized so gradient edges never show */}
      <div
        className={`pointer-events-none absolute ${BLEED}`}
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(61,42,122,0.4), transparent 55%), linear-gradient(180deg, #0c0a24 0%, #07061a 45%, #05040f 100%)",
        }}
      />

      <ParallaxLayer
        className={`pointer-events-none absolute ${BLEED}`}
        x={mouse.x}
        y={mouse.y}
        depth={DEPTH.sky * k}
      >
        <motion.div
          className="absolute inset-0"
          animate={
            reduced
              ? undefined
              : {
                  background: [
                    "radial-gradient(ellipse 70% 45% at 50% 10%, rgba(61,42,122,0.35), transparent 60%)",
                    "radial-gradient(ellipse 70% 45% at 58% 18%, rgba(42,27,94,0.42), transparent 60%)",
                    "radial-gradient(ellipse 70% 45% at 50% 10%, rgba(61,42,122,0.35), transparent 60%)",
                  ],
                }
          }
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </ParallaxLayer>

      <ParallaxLayer
        className={`pointer-events-none absolute ${BLEED}`}
        x={mouse.x}
        y={mouse.y}
        depth={DEPTH.stars * k}
      >
        <StarField count={starCount} />
      </ParallaxLayer>

      <ParallaxLayer
        className="absolute right-[8%] top-[6%] md:right-[14%] md:top-[6%]"
        x={mouse.x}
        y={mouse.y}
        depth={DEPTH.moon * k}
      >
        <Moon />
      </ParallaxLayer>

      {showForest && (
        <>
          <ParallaxLayer
            className="absolute -bottom-[8%] -left-[22%] h-[48%] w-[144%] md:h-[52%]"
            x={mouse.x}
            y={mouse.y}
            depth={DEPTH.farForest * k}
          >
            <ForestLayer variant="far" className="h-full w-full" />
          </ParallaxLayer>

          <ParallaxLayer
            className={`pointer-events-none absolute ${BLEED}`}
            x={mouse.x}
            y={mouse.y}
            depth={DEPTH.fog * k}
          >
            <Fog />
          </ParallaxLayer>

          <ParallaxLayer
            className="absolute -bottom-[10%] -left-[22%] h-[38%] w-[144%] md:h-[42%]"
            x={mouse.x}
            y={mouse.y}
            depth={DEPTH.nearForest * k}
          >
            <ForestLayer variant="near" className="h-full w-full" />
          </ParallaxLayer>
        </>
      )}

      {particleCount > 0 && (
        <ParallaxLayer
          className={`pointer-events-none absolute ${BLEED}`}
          x={mouse.x}
          y={mouse.y}
          depth={DEPTH.particles * k}
        >
          <FloatingParticles count={particleCount} />
        </ParallaxLayer>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

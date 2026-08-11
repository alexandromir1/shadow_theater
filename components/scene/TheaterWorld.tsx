"use client";

import { FloatingParticles } from "@/components/scene/FloatingParticles";
import { Fog } from "@/components/scene/Fog";
import { ForestLayer } from "@/components/scene/ForestLayer";
import { Moon } from "@/components/scene/Moon";
import { ParallaxLayer } from "@/components/scene/ParallaxLayer";
import { StarField } from "@/components/scene/StarField";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useFinePointer, useMouseParallax } from "@/lib/motion/useMouseParallax";
import type { ReactNode } from "react";

type TheaterWorldProps = {
  children?: ReactNode;
  className?: string;
  interactive?: boolean;
  framed?: boolean;
};

const DEPTH = {
  stars: 24,
  moon: 16,
  farForest: 30,
  fog: 18,
  nearForest: 40,
  particles: 32,
} as const;

const BLEED = "inset-[-22%]";

/**
 * Multi-layer world inside Mia's shadow theater.
 */
export function TheaterWorld({
  children,
  className = "",
  interactive = true,
  framed = true,
}: TheaterWorldProps) {
  const reduced = useReducedMotion();
  const finePointer = useFinePointer();
  const mouseOn = interactive && !reduced && finePointer;
  const mouse = useMouseParallax(mouseOn);

  const starCount = 56;
  const particleCount = reduced ? 4 : 16;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={
        framed
          ? {
              border: "2px solid rgba(201,164,92,0.4)",
              boxShadow:
                "inset 0 0 0 8px rgba(20,12,40,0.55), 0 0 60px rgba(0,0,0,0.5)",
              borderRadius: 4,
            }
          : undefined
      }
    >
      <div
        className={`absolute ${BLEED}`}
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(61,42,122,0.5), transparent 55%), linear-gradient(180deg, #0c0a24 0%, #07061a 45%, #05040f 100%)",
        }}
      />

      <ParallaxLayer
        className={`absolute ${BLEED}`}
        x={mouse.x}
        y={mouse.y}
        depth={DEPTH.stars}
      >
        <StarField count={starCount} />
      </ParallaxLayer>

      <ParallaxLayer
        className="absolute right-[10%] top-[8%]"
        x={mouse.x}
        y={mouse.y}
        depth={DEPTH.moon}
      >
        <div className="relative">
          <Moon />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ border: "1px solid rgba(245,240,216,0.12)" }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ border: "1px solid rgba(245,240,216,0.06)" }}
          />
        </div>
      </ParallaxLayer>

      <ParallaxLayer
        className="absolute -bottom-[8%] -left-[22%] h-[52%] w-[144%]"
        x={mouse.x}
        y={mouse.y}
        depth={DEPTH.farForest}
      >
        <ForestLayer variant="far" className="h-full w-full" />
      </ParallaxLayer>

      <ParallaxLayer
        className={`pointer-events-none absolute ${BLEED}`}
        x={mouse.x}
        y={mouse.y}
        depth={DEPTH.fog}
      >
        <Fog />
      </ParallaxLayer>

      <ParallaxLayer
        className="absolute -bottom-[10%] -left-[22%] h-[40%] w-[144%]"
        x={mouse.x}
        y={mouse.y}
        depth={DEPTH.nearForest}
      >
        <ForestLayer variant="near" className="h-full w-full" />
      </ParallaxLayer>

      <div
        className="pointer-events-none absolute inset-x-[8%] bottom-[6%] h-[10%] rounded-[50%]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(201,164,92,0.25), transparent 70%)",
          boxShadow: "0 0 40px rgba(201,164,92,0.15)",
        }}
      />

      {particleCount > 0 && (
        <ParallaxLayer
          className={`pointer-events-none absolute ${BLEED}`}
          x={mouse.x}
          y={mouse.y}
          depth={DEPTH.particles}
        >
          <FloatingParticles count={particleCount} />
        </ParallaxLayer>
      )}

      {framed && (
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            boxShadow:
              "inset 0 18px 30px rgba(0,0,0,0.35), inset 0 -24px 40px rgba(0,0,0,0.45)",
          }}
        />
      )}

      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}

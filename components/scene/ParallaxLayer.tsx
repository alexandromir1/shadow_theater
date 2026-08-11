"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, type ReactNode } from "react";

type ParallaxLayerProps = {
  children: ReactNode;
  className?: string;
  /** Normalized mouse (-1..1) as MotionValue or number */
  x?: MotionValue<number> | number;
  y?: MotionValue<number> | number;
  /** Max shift in px when mouse is at the edge */
  depth?: number;
  style?: React.CSSProperties;
};

function useAxis(
  value: MotionValue<number> | number,
  depth: number,
): MotionValue<number> {
  const fallback = useMotionValue(typeof value === "number" ? value : 0);

  useEffect(() => {
    if (typeof value === "number") fallback.set(value);
  }, [value, fallback]);

  const source = typeof value === "number" ? fallback : value;
  return useTransform(source, (v) => v * depth);
}

export function ParallaxLayer({
  children,
  className,
  x = 0,
  y = 0,
  depth = 1,
  style,
}: ParallaxLayerProps) {
  const tx = useAxis(x, depth);
  const ty = useAxis(y, depth);

  return (
    <motion.div
      className={className}
      style={{ willChange: "transform", x: tx, y: ty, ...style }}
    >
      {children}
    </motion.div>
  );
}

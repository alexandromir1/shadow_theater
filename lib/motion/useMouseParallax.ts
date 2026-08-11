"use client";

import { useMotionValue, useSpring, type MotionValue } from "motion/react";
import { useEffect } from "react";
import { useSyncExternalStore } from "react";

/** Desktop with a precise pointer (mouse), not coarse touch. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(pointer: fine)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => true,
  );
}

/**
 * Normalized mouse position (-1..1) as springy motion values.
 */
export function useMouseParallax(enabled: boolean): {
  x: MotionValue<number>;
  y: MotionValue<number>;
} {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 120, damping: 22, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 120, damping: 22, mass: 0.4 });

  useEffect(() => {
    if (!enabled) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    const onMove = (e: MouseEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled, rawX, rawY]);

  return { x, y };
}

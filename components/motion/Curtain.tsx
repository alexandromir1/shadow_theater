"use client";

import { AnimatePresence, motion, useReducedMotion as useFramerReduced } from "motion/react";
import { motionTokens } from "@/lib/motion/tokens";

type CurtainProps = {
  open: boolean;
};

export function Curtain({ open }: CurtainProps) {
  const reduced = useFramerReduced();

  if (reduced) {
    return (
      <AnimatePresence>
        {!open && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[100] bg-[var(--night-950)]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {!open && (
        <>
          <motion.div
            className="pointer-events-none fixed inset-y-0 left-0 z-[100] w-1/2 origin-left"
            style={{
              background:
                "linear-gradient(90deg, var(--curtain-fold) 0%, var(--curtain) 55%, #6b1f3d 100%)",
              boxShadow: "inset -20px 0 40px rgba(0,0,0,0.35)",
            }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{
              duration: motionTokens.curtain.duration,
              ease: motionTokens.curtain.ease,
            }}
          />
          <motion.div
            className="pointer-events-none fixed inset-y-0 right-0 z-[100] w-1/2 origin-right"
            style={{
              background:
                "linear-gradient(270deg, var(--curtain-fold) 0%, var(--curtain) 55%, #6b1f3d 100%)",
              boxShadow: "inset 20px 0 40px rgba(0,0,0,0.35)",
            }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{
              duration: motionTokens.curtain.duration,
              ease: motionTokens.curtain.ease,
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

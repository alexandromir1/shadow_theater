"use client";

import { AnimatePresence, motion, useReducedMotion as useFramerReduced } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motionTokens } from "@/lib/motion/tokens";

/**
 * Soft curtain flash on route change + fade of page content.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useFramerReduced();

  return (
    <>
      {!reduced && (
        <AnimatePresence>
          <motion.div
            key={pathname}
            className="pointer-events-none fixed inset-0 z-[100]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: motionTokens.curtain.duration,
              ease: motionTokens.curtain.ease,
            }}
          >
            <div
              className="absolute inset-y-0 left-0 w-1/2 origin-left"
              style={{
                background:
                  "linear-gradient(90deg, var(--curtain-fold) 0%, var(--curtain) 55%, #6b1f3d 100%)",
                boxShadow: "inset -20px 0 40px rgba(0,0,0,0.35)",
              }}
            />
            <div
              className="absolute inset-y-0 right-0 w-1/2 origin-right"
              style={{
                background:
                  "linear-gradient(270deg, var(--curtain-fold) 0%, var(--curtain) 55%, #6b1f3d 100%)",
                boxShadow: "inset 20px 0 40px rgba(0,0,0,0.35)",
              }}
            />
          </motion.div>
        </AnimatePresence>
      )}
      <motion.div
        key={`page-${pathname}`}
        initial={reduced ? false : { opacity: 0.88 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: motionTokens.reveal.ease }}
      >
        {children}
      </motion.div>
    </>
  );
}

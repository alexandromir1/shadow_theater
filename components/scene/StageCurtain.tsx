"use client";

import {
  motion,
  useReducedMotion as useFramerReduced,
  useTransform,
  type MotionValue,
} from "motion/react";

type StageCurtainProps = {
  /** 0 = closed, 1 = fully open */
  open: MotionValue<number>;
  className?: string;
};

function FabricPanel({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: isLeft
            ? "linear-gradient(95deg, #2a0c1c 0%, #5c1838 28%, #7a2348 52%, #4a1230 78%, #1f0814 100%)"
            : "linear-gradient(265deg, #2a0c1c 0%, #5c1838 28%, #7a2348 52%, #4a1230 78%, #1f0814 100%)",
        }}
      />
      {[8, 22, 38, 54, 70, 86].map((left, i) => (
        <div
          key={left}
          className="absolute inset-y-0 w-[7%]"
          style={{
            left: `${left}%`,
            background:
              i % 2 === 0
                ? "linear-gradient(90deg, transparent, rgba(0,0,0,0.28), transparent)"
                : "linear-gradient(90deg, transparent, rgba(255,220,180,0.08), transparent)",
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: isLeft
            ? "radial-gradient(ellipse at 30% 20%, rgba(255,210,160,0.18), transparent 55%)"
            : "radial-gradient(ellipse at 70% 20%, rgba(255,210,160,0.18), transparent 55%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[18%]"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)",
        }}
      />
      <div
        className={`absolute inset-y-[6%] w-[3px] ${isLeft ? "right-0" : "left-0"}`}
        style={{
          background:
            "linear-gradient(180deg, transparent, var(--gold-soft), var(--gold), var(--gold-soft), transparent)",
          boxShadow: "0 0 12px rgba(201,164,92,0.45)",
          opacity: 0.75,
        }}
      />
      <svg
        className="absolute inset-x-0 top-0 h-[12%] w-full"
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 0 H200 V8 Q150 28 100 10 Q50 28 0 8 Z"
          fill="#1a0610"
          opacity="0.85"
        />
        <path
          d="M0 4 Q50 22 100 8 Q150 22 200 4"
          fill="none"
          stroke="rgba(201,164,92,0.55)"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}

export function StageCurtain({ open, className = "" }: StageCurtainProps) {
  const reduced = useFramerReduced();
  const leftX = useTransform(open, [0, 1], ["0%", "-104%"]);
  const rightX = useTransform(open, [0, 1], ["0%", "104%"]);
  const leftSkew = useTransform(open, [0, 0.5, 1], [0, reduced ? 0 : 2.2, reduced ? 0 : 0.6]);
  const rightSkew = useTransform(open, [0, 0.5, 1], [0, reduced ? 0 : -2.2, reduced ? 0 : -0.6]);
  const glow = useTransform(open, [0, 0.35, 1], [0, 0.5, 0.85]);
  const titleOpacity = useTransform(open, [0, 0.2], [1, 0]);

  return (
    <div className={`pointer-events-none absolute inset-0 z-40 overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: glow,
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(245,230,180,0.35) 0%, rgba(61,42,122,0.25) 40%, transparent 70%)",
        }}
      />

      <motion.div
        className="absolute inset-y-0 left-0 w-[54%] origin-left"
        style={{
          x: leftX,
          skewY: leftSkew,
          filter: "drop-shadow(10px 0 28px rgba(0,0,0,0.5))",
        }}
      >
        <FabricPanel side="left" />
      </motion.div>

      <motion.div
        className="absolute inset-y-0 right-0 w-[54%] origin-right"
        style={{
          x: rightX,
          skewY: rightSkew,
          filter: "drop-shadow(-10px 0 28px rgba(0,0,0,0.5))",
        }}
      >
        <FabricPanel side="right" />
      </motion.div>

      <motion.div
        className="absolute inset-x-0 top-[18%] z-10 px-6 text-center"
        style={{ opacity: titleOpacity }}
      >
        <p className="font-display text-[clamp(1.35rem,5.2vw,2.6rem)] leading-tight tracking-wide text-[var(--cream)] text-glow-gold">
          Театр теней
          <br />
          для взрослых и детей
        </p>
      </motion.div>
    </div>
  );
}

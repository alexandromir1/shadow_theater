"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motionTokens } from "@/lib/motion/tokens";

type MagicButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "ghost" | "soft";
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variants = {
  primary:
    "bg-[var(--gold)] text-[var(--night-950)] hover:bg-[var(--gold-soft)] shadow-[var(--glow-gold)]",
  ghost:
    "bg-transparent text-[var(--cream)] border border-[rgba(201,164,92,0.45)] hover:border-[var(--gold)] hover:text-[var(--gold-soft)]",
  soft:
    "bg-[rgba(201,164,92,0.12)] text-[var(--cream)] border border-[rgba(201,164,92,0.25)] hover:bg-[rgba(201,164,92,0.2)]",
};

export function MagicButton({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  ...props
}: MagicButtonProps) {
  const reduced = useFramerReduced();
  const classes = `inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`;

  const content = (
    <motion.span
      className="inline-flex items-center gap-2"
      whileHover={reduced || disabled ? undefined : { y: -1 }}
      whileTap={reduced || disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: motionTokens.hover.duration }}
    >
      {children}
    </motion.span>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} {...props}>
      {content}
    </button>
  );
}

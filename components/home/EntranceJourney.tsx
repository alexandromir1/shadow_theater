"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion as useFramerReduced,
  useScroll,
  useTransform,
} from "motion/react";
import { useCallback, useRef, useState } from "react";
import { StoryHeader } from "@/components/home/StoryHeader";
import { MiaPortrait } from "@/components/scene/MiaPortrait";
import { StageCurtain } from "@/components/scene/StageCurtain";
import { TheaterWorld } from "@/components/scene/TheaterWorld";
import { PosterCarousel } from "@/components/theater/PosterCarousel";
import type { StagePosterItem } from "@/components/theater/StagePoster";

type EntranceJourneyProps = {
  posters: StagePosterItem[];
};

type PhotoBox = { left: number; top: number; width: number; height: number };

/**
 * Ширма → фото без обрезки, театр той же ширины от середины до низа → зум → афиши.
 */
export function EntranceJourney({ posters }: EntranceJourneyProps) {
  const reduced = useFramerReduced();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inside, setInside] = useState(false);

  const photoLeft = useMotionValue(0);
  const photoTop = useMotionValue(0);
  const photoWidth = useMotionValue(0);
  const photoHeight = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const hintOpacity = useTransform(scrollYProgress, [0, 0.02, 0.1], [1, 1, 0]);
  const curtainOpen = useTransform(scrollYProgress, [0, 0.14, 0.24, 1], [0, 0, 1, 1]);
  const miaOpacity = useTransform(scrollYProgress, [0.18, 0.26, 0.52, 0.64], [0, 1, 1, 0]);
  const textOpacity = useTransform(scrollYProgress, [0.26, 0.32, 0.48, 0.58], [0, 1, 1, 0]);
  const theaterOpacity = useTransform(scrollYProgress, [0.2, 0.28, 1], [0, 1, 1]);

  const sceneInset = useTransform(scrollYProgress, [0.28, 0.5, 0.7, 1], ["20%", "20%", "0%", "0%"]);
  const sceneTop = useTransform(scrollYProgress, [0.28, 0.5, 0.7, 1], ["12%", "12%", "0%", "0%"]);
  const sceneHeight = useTransform(scrollYProgress, [0.28, 0.5, 0.7, 1], ["76%", "76%", "100%", "100%"]);

  // t: 0 = полка (размер фото), 1 = весь экран
  const zoomT = useTransform(scrollYProgress, [0.5, 0.7], [0, 1]);

  const theaterLeft = useTransform(
    [zoomT, photoLeft] as const,
    ([t, left]) => {
      const tt = t as number;
      const l = left as number;
      return l * (1 - tt);
    },
  );
  const theaterWidth = useTransform(
    [zoomT, photoWidth] as const,
    ([t, width]) => {
      const tt = t as number;
      const w = width as number;
      const vw = typeof window !== "undefined" ? window.innerWidth : w;
      return w * (1 - tt) + vw * tt;
    },
  );
  const theaterTopPx = useTransform(
    [zoomT, photoTop, photoHeight] as const,
    ([t, top, height]) => {
      const tt = t as number;
      const pTop = top as number;
      const h = height as number;
      const shelfTop = pTop + h / 2;
      return shelfTop * (1 - tt);
    },
  );
  const theaterHeightPx = useTransform(
    [zoomT, photoHeight] as const,
    ([t, height]) => {
      const tt = t as number;
      const h = height as number;
      const vh = typeof window !== "undefined" ? window.innerHeight : h;
      const shelfH = h / 2;
      return shelfH * (1 - tt) + vh * tt;
    },
  );

  const theaterLeftPx = useMotionTemplate`${theaterLeft}px`;
  const theaterWidthPx = useMotionTemplate`${theaterWidth}px`;
  const theaterTopTemplate = useMotionTemplate`${theaterTopPx}px`;
  const theaterHeightTemplate = useMotionTemplate`${theaterHeightPx}px`;

  const frameRadius = useTransform(zoomT, [0, 1], ["12px", "0px"]);
  const postersOpacity = useTransform(scrollYProgress, [0.66, 0.74, 1], [0, 1, 1]);
  const headerVis = useTransform(scrollYProgress, [0.68, 0.76, 1], [0, 1, 1]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setInside(v >= 0.7);
  });

  const onPhotoBox = useCallback(
    (box: PhotoBox) => {
      photoLeft.set(box.left);
      photoTop.set(box.top);
      photoWidth.set(box.width);
      photoHeight.set(box.height);
    },
    [photoLeft, photoTop, photoWidth, photoHeight],
  );

  const restart = useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  if (reduced) {
    return <ReducedJourney posters={posters} onRestart={restart} />;
  }

  return (
    <div ref={containerRef} className="relative h-[520vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(61,42,122,0.4), transparent 60%), linear-gradient(180deg, #0c0a24 0%, #07061a 100%)",
          }}
        />

        {/* Фото Мии целиком — ширина по реальному кадру */}
        <motion.div
          className="absolute z-20 overflow-hidden"
          style={{
            top: sceneTop,
            height: sceneHeight,
            left: sceneInset,
            right: sceneInset,
            opacity: miaOpacity,
            borderRadius: 12,
            boxShadow: "0 16px 50px rgba(0,0,0,0.45)",
            background: "rgba(7,6,26,0.25)",
          }}
        >
          <MiaPortrait
            variant="leaning"
            className="h-full w-full"
            onPhotoBox={onPhotoBox}
          />
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[8%] z-10 px-4 text-center"
            style={{ opacity: textOpacity }}
          >
            <h1 className="font-display text-xl text-[var(--cream)] text-glow-gold drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] md:text-2xl">
              Театр теней Мии
            </h1>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[var(--cream)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] md:text-sm">
              Привет! Это мой театр теней.
            </p>
          </motion.div>
        </motion.div>

        {/* Театр: ширина = фото, от середины до низа → весь экран */}
        <motion.div
          className="absolute z-30 overflow-hidden"
          style={{
            top: theaterTopTemplate,
            left: theaterLeftPx,
            width: theaterWidthPx,
            height: theaterHeightTemplate,
            opacity: theaterOpacity,
            borderRadius: frameRadius,
            boxShadow: "0 -4px 24px rgba(0,0,0,0.35)",
            pointerEvents: inside ? "auto" : "none",
          }}
        >
          <TheaterWorld framed={false} interactive={inside} className="h-full w-full">
            <motion.div
              className="flex h-full w-full items-center justify-center pt-14"
              style={{ opacity: postersOpacity }}
            >
              <div
                className="h-full w-full"
                style={{ pointerEvents: inside ? "auto" : "none" }}
              >
                <PosterCarousel items={posters} visible={inside} />
              </div>
            </motion.div>
          </TheaterWorld>
        </motion.div>

        <StageCurtain open={curtainOpen} />

        <motion.div
          className="absolute inset-x-0 bottom-8 z-50 flex flex-col items-center gap-2"
          style={{ opacity: hintOpacity, pointerEvents: "none" }}
        >
          <span className="text-xs tracking-[0.25em] text-[var(--cream-muted)]">
            листай
          </span>
          <motion.span
            className="text-[var(--gold)]"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          >
            ↓
          </motion.span>
        </motion.div>

        <StoryHeader visibility={headerVis} onRestart={restart} />
      </div>
    </div>
  );
}

function ReducedJourney({
  posters,
  onRestart,
}: {
  posters: StagePosterItem[];
  onRestart: () => void;
}) {
  return (
    <div>
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 magical-gradient">
        <div className="relative inline-block max-h-[70vh] max-w-[60%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/mia.png"
            alt="Мия"
            className="max-h-[70vh] w-auto max-w-full"
          />
          <div className="absolute inset-x-0 top-1/2 bottom-0 overflow-hidden">
            <TheaterWorld framed={false} interactive={false} className="h-full" />
          </div>
        </div>
        <a
          href="#afisha-inside"
          className="mt-8 rounded-sm bg-[var(--gold)] px-6 py-3 font-medium text-[var(--night-950)]"
        >
          Смотреть афиши
        </a>
      </section>
      <section id="afisha-inside" className="relative min-h-[100svh]">
        <TheaterWorld framed={false} interactive={false} className="min-h-[100svh]">
          <div className="flex min-h-[100svh] flex-col pt-4">
            <div className="flex items-center justify-between px-5 py-4">
              <p className="font-display text-lg text-[var(--cream)]">Театр Мии</p>
              <button
                type="button"
                onClick={onRestart}
                className="rounded-sm border border-[rgba(201,164,92,0.45)] px-4 py-2 text-sm text-[var(--gold)]"
              >
                Сначала
              </button>
            </div>
            <PosterCarousel items={posters} visible />
          </div>
        </TheaterWorld>
      </section>
    </div>
  );
}

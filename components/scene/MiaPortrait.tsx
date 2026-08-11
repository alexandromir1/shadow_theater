"use client";

import { useEffect, useRef, useState } from "react";

type MiaPortraitProps = {
  className?: string;
  variant?: "card" | "leaning";
  /** Колбэк с реальными размерами отрисованного фото (без letterbox) */
  onPhotoBox?: (box: { left: number; top: number; width: number; height: number }) => void;
};

/**
 * Фото Мии: public/images/mia.png (или .jpg / .webp)
 */
export function MiaPortrait({
  className = "",
  variant = "card",
  onPhotoBox,
}: MiaPortraitProps) {
  const candidates = ["/images/mia.png", "/images/mia.jpg", "/images/mia.webp"];
  const [index, setIndex] = useState(0);
  const failed = index >= candidates.length;
  const src = failed ? null : candidates[index];
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!onPhotoBox) return;
    const img = imgRef.current;
    if (!img) return;

    const report = () => {
      const r = img.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        onPhotoBox({ left: r.left, top: r.top, width: r.width, height: r.height });
      }
    };

    report();
    img.addEventListener("load", report);
    const ro = new ResizeObserver(report);
    ro.observe(img);
    window.addEventListener("resize", report);
    window.addEventListener("scroll", report, { passive: true });

    return () => {
      img.removeEventListener("load", report);
      ro.disconnect();
      window.removeEventListener("resize", report);
      window.removeEventListener("scroll", report);
    };
  }, [onPhotoBox, src]);

  if (variant === "leaning") {
    return (
      <div className={`relative flex h-full w-full items-end justify-center ${className}`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={src}
            alt="Мия"
            className="max-h-full w-auto max-w-full object-contain object-bottom"
            onError={() => setIndex((i) => i + 1)}
          />
        ) : (
          <PhotoPlaceholder />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className="relative mx-auto aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-[4px] md:max-w-[340px]"
        style={{
          border: "1px solid rgba(201,164,92,0.45)",
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.45), 0 0 40px rgba(201,164,92,0.15), inset 0 0 0 6px rgba(20,12,40,0.45)",
          background:
            "linear-gradient(165deg, #1e174f 0%, #0c0a24 55%, #15102e 100%)",
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Мия"
            className="absolute inset-0 h-full w-full object-contain"
            onError={() => setIndex((i) => i + 1)}
          />
        ) : (
          <PhotoPlaceholder />
        )}
      </div>
    </div>
  );
}

function PhotoPlaceholder() {
  return (
    <div className="flex h-full min-h-[180px] w-full flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-4 h-24 w-24 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #f0d5b8 0%, #c4a07a 70%)",
        }}
      />
      <p className="font-display text-2xl text-[var(--cream)]">Мия</p>
    </div>
  );
}

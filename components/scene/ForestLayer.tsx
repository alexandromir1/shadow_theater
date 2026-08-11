"use client";

type ForestLayerProps = {
  variant: "far" | "near";
  className?: string;
};

function FarTrees() {
  return (
    <svg
      viewBox="0 0 1440 320"
      className="h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="var(--forest-far)"
        d="M0 320V180l40-50 35 40 55-90 50 70 45-55 60 85 40-100 55 90 70-120 50 80 45-40 60 70 40-85 55 95 80-130 45 75 50-50 60 90V320H0Z"
        opacity="0.85"
      />
      <path
        fill="#0d1528"
        d="M0 320V220l60-40 40 30 70-70 45 50 80-90 55 70 90-110 50 60 70-50 60 80 100-120 55 70 80-60 55 70V320H0Z"
        opacity="0.7"
      />
    </svg>
  );
}

function NearTrees() {
  return (
    <svg
      viewBox="0 0 1440 400"
      className="h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="var(--forest-near)"
        d="M0 400V160l50-90 40 70 70-140 55 110 60-100 80 150 45-120 90 160 70-180 60 130 85-150 50 100 100-170 55 120 70-90 80 140V400H0Z"
      />
      <path
        fill="#02040a"
        d="M0 400V240l80-60 50 40 90-100 60 70 110-120 70 90 120-140 65 80 100-70 80 100 130-150 70 90V400H0Z"
        opacity="0.9"
      />
    </svg>
  );
}

export function ForestLayer({ variant, className = "" }: ForestLayerProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 ${className}`}
      aria-hidden
    >
      {variant === "far" ? <FarTrees /> : <NearTrees />}
    </div>
  );
}

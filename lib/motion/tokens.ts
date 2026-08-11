export const motionTokens = {
  dreamy: {
    duration: 8,
    ease: [0.22, 0.61, 0.36, 1] as const,
  },
  float: {
    duration: 6,
    ease: "easeInOut" as const,
  },
  fog: {
    duration: 28,
    ease: "linear" as const,
  },
  reveal: {
    duration: 0.85,
    ease: [0.22, 0.61, 0.36, 1] as const,
  },
  tactile: {
    duration: 0.4,
    ease: [0.34, 1.56, 0.64, 1] as const,
  },
  curtain: {
    duration: 0.7,
    ease: [0.65, 0, 0.35, 1] as const,
  },
  hover: {
    duration: 0.35,
    ease: [0.22, 0.61, 0.36, 1] as const,
  },
  starTwinkle: {
    duration: 3.2,
    ease: "easeInOut" as const,
  },
} as const;

export const parallaxSpeeds = {
  background: 0.05,
  moon: 0.1,
  farForest: 0.15,
  fog: 0.2,
  nearForest: 0.3,
  content: 1,
  foreground: 0.4,
  particles: 0.45,
} as const;

export const mouseParallax = {
  moon: 2,
  farForest: 4,
  fog: 5,
  nearForest: 8,
  particles: 10,
} as const;

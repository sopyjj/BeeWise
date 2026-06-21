import type { Variants } from 'framer-motion';

export const screenVariants: Variants = {
  initial: { opacity: 0, x: 60, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 28 } },
  exit:    { opacity: 0, x: -60, scale: 0.97, transition: { duration: 0.22, ease: 'easeIn' } },
};

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

export const beeGridContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};

export const beeGridItem: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.75 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 340, damping: 22 },
  },
};

// Bee fly-in entrance: each bee swoops in from outside the grid along a slight
// arc, then settles. `custom` carries { angle, delay } so callers can chronologize
// and direction-vary the entrance per-bee.
export const beeFlyIn: Variants = {
  hidden: (c: { angle: number }) => {
    const r = (c.angle * Math.PI) / 180;
    const distance = 380;
    return {
      opacity: 0,
      x: Math.cos(r) * distance,
      y: Math.sin(r) * distance,
      rotate: Math.sin(r) * 22,
      scale: 0.5,
    };
  },
  visible: (c: { angle: number; delay: number }) => {
    const r = (c.angle * Math.PI) / 180;
    return {
      opacity: [0, 1, 1],
      x: [Math.cos(r) * 380, Math.cos(r) * 90, 0],
      y: [Math.sin(r) * 380, Math.sin(r) * 60 - 20, 0],
      rotate: [Math.sin(r) * 22, Math.sin(r) * 8, 0],
      scale: [0.5, 1.08, 1],
      transition: {
        delay: c.delay,
        duration: 0.85,
        times: [0, 0.7, 1],
        ease: [0.34, 1.2, 0.64, 1],
      },
    };
  },
};

export const speechBubbleVariants: Variants = {
  hidden: { opacity: 0, scale: 0, originX: 0, originY: 1 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  exit: {
    opacity: 0, scale: 0.8,
    transition: { duration: 0.15 },
  },
};

export const revealVariants: Variants = {
  hidden:   { opacity: 0, scale: 0.5, y: -10 },
  visible:  { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300 } },
};

export const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 10px rgba(245, 158, 11, 0.4)',
      '0 0 25px rgba(245, 158, 11, 0.9)',
      '0 0 10px rgba(245, 158, 11, 0.4)',
    ],
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const floatAnimation = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  hidden:  { opacity: 0, scale: 0.88, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } },
  exit:    { opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.15 } },
};

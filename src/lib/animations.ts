import type { Transition, Variants } from "framer-motion";

const easeOutQuint: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const pageTransition: Transition = {
  duration: 0.28,
  ease: easeOutQuint
};

export const modalTransition: Transition = {
  duration: 0.24,
  ease: easeOutQuint
};

export const dropdownTransition: Transition = {
  duration: 0.2,
  ease: easeOutQuint
};

export const staggerContainerTransition: Transition = {
  staggerChildren: 0.06,
  delayChildren: 0.04
};

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
    filter: "blur(3px)"
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)"
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: "blur(2px)"
  }
};

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 12
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 8
  }
};

export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -6,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.98
  }
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {}
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10
  },
  visible: {
    opacity: 1,
    y: 0
  }
};

export function withReducedMotion(shouldReduceMotion: boolean, transition: Transition): Transition {
  if (shouldReduceMotion) {
    return { duration: 0 };
  }

  return transition;
}

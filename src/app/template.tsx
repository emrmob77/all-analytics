"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

import { pageTransition, pageVariants, withReducedMotion } from "@/lib/animations";

interface RootTemplateProps {
  children: React.ReactNode;
}

export default function RootTemplate({ children }: RootTemplateProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        animate="animate"
        exit="exit"
        initial="initial"
        key={pathname}
        transition={withReducedMotion(Boolean(shouldReduceMotion), pageTransition)}
        variants={pageVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

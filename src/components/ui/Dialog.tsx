"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

import { backdropVariants, modalTransition, modalVariants, withReducedMotion } from "@/lib/animations";
import { cn } from "@/utils/cn";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  fullscreen?: boolean;
}

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentRef: RefObject<HTMLDivElement | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within Dialog.");
  }
  return context;
}

function Dialog({ children, onOpenChange, open }: DialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function getFocusableElements() {
      const container = contentRef.current;
      if (!container) return [] as HTMLElement[];

      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    function handleTabLoop(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      const container = contentRef.current;
      if (!container) return;

      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTabLoop);

    window.setTimeout(() => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0]?.focus();
        return;
      }
      contentRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabLoop);
      previouslyFocusedElement?.focus();
    };
  }, [onOpenChange, open]);

  return <DialogContext.Provider value={{ contentRef, onOpenChange, open }}>{children}</DialogContext.Provider>;
}

function DialogContent({
  ariaDescribedby,
  ariaLabel = "Dialog",
  ariaLabelledby,
  children,
  className,
  fullscreen = false
}: DialogContentProps) {
  const { contentRef, onOpenChange, open } = useDialogContext();
  const shouldReduceMotion = useReducedMotion();

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          animate="visible"
          className={cn(
            "fixed inset-0 z-[60] flex bg-black/40",
            fullscreen ? "items-stretch justify-stretch" : "items-center justify-center p-4"
          )}
          exit="exit"
          initial="hidden"
          onClick={() => onOpenChange(false)}
          transition={withReducedMotion(Boolean(shouldReduceMotion), modalTransition)}
          variants={backdropVariants}
        >
          <motion.div
            animate="visible"
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedby}
            aria-labelledby={ariaLabelledby}
            aria-modal="true"
            className={cn(
              "w-full max-w-xl rounded-xl border border-border-light bg-surface-light shadow-2xl dark:border-border-dark dark:bg-surface-dark",
              className
            )}
            exit="exit"
            initial="hidden"
            onClick={(event) => event.stopPropagation()}
            ref={contentRef}
            role="dialog"
            tabIndex={-1}
            transition={withReducedMotion(Boolean(shouldReduceMotion), modalTransition)}
            variants={modalVariants}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export { Dialog, DialogContent };

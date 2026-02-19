"use client";

import { useEffect, useMemo, useState } from "react";

import { TOAST_EVENT_NAME, type ToastPayload } from "@/lib/toast";

interface ActiveToast extends ToastPayload {
  timeoutId: number;
}

function getToastClasses(type: ToastPayload["type"]) {
  if (type === "success") {
    return "border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200";
  }

  if (type === "error") {
    return "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200";
  }

  return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200";
}

function ToastViewport() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    function removeToast(id: string) {
      setToasts((current) => {
        const found = current.find((toast) => toast.id === id);
        if (found) {
          window.clearTimeout(found.timeoutId);
        }
        return current.filter((toast) => toast.id !== id);
      });
    }

    function handleToastEvent(event: Event) {
      const customEvent = event as CustomEvent<ToastPayload>;
      const payload = customEvent.detail;
      if (!payload) return;

      const timeoutId = window.setTimeout(() => removeToast(payload.id), payload.duration);

      setToasts((current) => {
        const existing = current.find((toast) => toast.id === payload.id);
        if (existing) {
          window.clearTimeout(existing.timeoutId);
          return current.map((toast) => (toast.id === payload.id ? { ...payload, timeoutId } : toast));
        }

        return [...current, { ...payload, timeoutId }];
      });
    }

    window.addEventListener(TOAST_EVENT_NAME, handleToastEvent);

    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handleToastEvent);
      setToasts((current) => {
        current.forEach((toast) => window.clearTimeout(toast.timeoutId));
        return [];
      });
    };
  }, []);

  const orderedToasts = useMemo(() => [...toasts].reverse(), [toasts]);

  if (orderedToasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2"
    >
      {orderedToasts.map((toast) => (
        <div
          className={[
            "pointer-events-auto rounded-lg border px-3 py-2 shadow-md backdrop-blur-sm",
            getToastClasses(toast.type)
          ].join(" ")}
          key={toast.id}
          role="status"
        >
          <div className="flex items-start gap-2">
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              aria-label="Close notification"
              className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-current/70 transition-colors hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
              onClick={() =>
                setToasts((current) => {
                  const found = current.find((item) => item.id === toast.id);
                  if (found) {
                    window.clearTimeout(found.timeoutId);
                  }
                  return current.filter((item) => item.id !== toast.id);
                })
              }
              type="button"
            >
              <span className="material-icons-round text-base">close</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ToastViewport;

"use client";

export type ToastType = "success" | "error" | "info";

export interface ToastPayload {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastOptions {
  duration?: number;
}

export const TOAST_EVENT_NAME = "allanalytics:toast";
const DEFAULT_DURATION = 5000;

function createToastPayload(type: ToastType, message: string, options?: ToastOptions): ToastPayload {
  return {
    id: crypto.randomUUID(),
    type,
    message,
    duration: options?.duration ?? DEFAULT_DURATION
  };
}

function dispatchToast(payload: ToastPayload) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT_NAME, { detail: payload }));
}

function success(message: string, options?: ToastOptions) {
  dispatchToast(createToastPayload("success", message, options));
}

function error(message: string, options?: ToastOptions) {
  dispatchToast(createToastPayload("error", message, options));
}

function info(message: string, options?: ToastOptions) {
  dispatchToast(createToastPayload("info", message, options));
}

export const toast = {
  success,
  error,
  info
};

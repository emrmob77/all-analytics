import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export type BadgeSize = "sm" | "md" | "lg";
export type StatusTone = "green" | "yellow" | "red";
export type ConnectionState = "connected" | "inactive";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "status" | "notification" | "connection" | "beta";
  size?: BadgeSize;
  statusTone?: StatusTone;
  connectionState?: ConnectionState;
  showDot?: boolean;
}

const sizeClassByBadge: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm"
};

const statusClassByTone: Record<StatusTone, { wrapper: string; dot: string }> = {
  green: {
    wrapper: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    dot: "bg-green-500"
  },
  yellow: {
    wrapper: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    dot: "bg-yellow-500"
  },
  red: {
    wrapper: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    dot: "bg-red-500"
  }
};

/**
 * Reusable badge component for status, notification and connection states.
 */
function Badge({
  children,
  className,
  connectionState = "connected",
  showDot = true,
  size = "md",
  statusTone = "green",
  variant = "status",
  ...rest
}: BadgeProps) {
  if (variant === "notification") {
    return (
      <span
        className={cn(
          "inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 font-semibold leading-none text-white",
          size === "sm" ? "h-4 w-4 text-[10px]" : size === "md" ? "h-5 w-5 text-[11px]" : "h-6 w-6 text-xs",
          className
        )}
        {...rest}
      >
        {children}
      </span>
    );
  }

  if (variant === "beta") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-gray-100 font-medium text-gray-600 opacity-80 dark:bg-gray-800 dark:text-gray-300",
          sizeClassByBadge[size],
          className
        )}
        {...rest}
      >
        {children ?? "Beta"}
      </span>
    );
  }

  if (variant === "connection") {
    const isConnected = connectionState === "connected";

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          sizeClassByBadge[size],
          isConnected
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          className
        )}
        {...rest}
      >
        {showDot ? (
          <span
            className={cn(
              "mr-1.5 h-1.5 w-1.5 rounded-full",
              isConnected ? "bg-green-500" : "bg-gray-400 dark:bg-gray-500"
            )}
          />
        ) : null}
        {children ?? (isConnected ? "Connected" : "Inactive")}
      </span>
    );
  }

  const status = statusClassByTone[statusTone];

  return (
    <span
      className={cn("inline-flex items-center rounded-full font-medium", sizeClassByBadge[size], status.wrapper, className)}
      {...rest}
    >
      {showDot ? <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", status.dot)} /> : null}
      {children}
    </span>
  );
}

export default Badge;

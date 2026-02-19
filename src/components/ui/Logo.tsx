import Link from "next/link";

import { cn } from "@/utils/cn";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  showExternalLink?: boolean;
  websiteUrl?: string;
}

const logoSizeMap: Record<NonNullable<LogoProps["size"]>, { icon: string; text: string; gap: string }> = {
  sm: { icon: "h-7 w-7 text-sm", text: "text-base", gap: "gap-2" },
  md: { icon: "h-8 w-8 text-base", text: "text-xl", gap: "gap-3" },
  lg: { icon: "h-10 w-10 text-lg", text: "text-2xl", gap: "gap-3" }
};

/**
 * Brand logo with letter mark, word mark and optional external link action.
 */
function Logo({
  className,
  showExternalLink = true,
  showText = true,
  size = "md",
  websiteUrl = "https://allanalytics.ai"
}: LogoProps) {
  const current = logoSizeMap[size];

  return (
    <div className={cn("flex items-center", current.gap, className)}>
      <div className={cn("grid place-items-center rounded-md bg-primary font-bold text-white", current.icon)}>A</div>

      {showText ? (
        <span className={cn("font-bold tracking-tight text-text-main-light dark:text-text-main-dark", current.text)}>
          Allanalytics
        </span>
      ) : null}

      {showExternalLink && showText ? (
        <Link
          aria-label="Open Allanalytics website"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-muted-light transition-colors hover:text-primary dark:text-text-muted-dark"
          href={websiteUrl}
          rel="noreferrer"
          target="_blank"
        >
          <span className="material-icons-round text-lg">open_in_new</span>
        </Link>
      ) : null}
    </div>
  );
}

export default Logo;

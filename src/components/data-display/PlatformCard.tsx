"use client";

import { useState } from "react";

interface Platform {
  id: string;
  name: string;
  logo: string;
  logoClassName: string;
  connected: boolean;
  spend: number;
  limit: number;
}

const initialPlatforms: Platform[] = [
  {
    id: "google",
    name: "Google Ads",
    logo: "G",
    logoClassName: "bg-blue-100 text-blue-700",
    connected: true,
    spend: 12400,
    limit: 18000
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    logo: "in",
    logoClassName: "bg-indigo-100 text-indigo-700",
    connected: false,
    spend: 0,
    limit: 9000
  },
  {
    id: "facebook",
    name: "Facebook Ads",
    logo: "f",
    logoClassName: "bg-blue-600 text-white",
    connected: true,
    spend: 8700,
    limit: 12000
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    logo: "t",
    logoClassName: "bg-black text-white",
    connected: false,
    spend: 0,
    limit: 10000
  }
];

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

function progressColor(percentage: number) {
  if (percentage <= 70) return "bg-primary";
  if (percentage <= 90) return "bg-yellow-500";
  return "bg-red-500";
}

function PlatformCard() {
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms);

  function togglePlatform(platformId: string) {
    setPlatforms((current) =>
      current.map((platform) =>
        platform.id === platformId ? { ...platform, connected: !platform.connected } : platform
      )
    );
  }

  return (
    <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Platform Connections</h2>
        <button
          aria-label="Open platform settings"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-light text-text-muted-light transition-colors hover:bg-gray-50 dark:border-border-dark dark:text-text-muted-dark dark:hover:bg-gray-800"
          type="button"
        >
          <span className="material-icons-round text-lg">settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {platforms.map((platform) => {
          const percentage = platform.limit === 0 ? 0 : Math.round((platform.spend / platform.limit) * 100);

          return (
            <article
              className={[
                "rounded-xl border border-border-light p-4 shadow-sm transition-all hover:shadow-md dark:border-border-dark",
                platform.connected ? "" : "opacity-60"
              ].join(" ")}
              key={platform.id}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={[
                    "grid h-9 w-9 place-items-center rounded-full text-xs font-bold",
                    platform.logoClassName
                  ].join(" ")}
                >
                  {platform.logo}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                    {platform.name}
                  </h3>
                  <p
                    className={[
                      "text-xs",
                      platform.connected ? "text-green-600 dark:text-green-400" : "text-text-muted-light dark:text-text-muted-dark"
                    ].join(" ")}
                  >
                    {platform.connected ? "Connected" : "Inactive"}
                  </p>
                </div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    checked={platform.connected}
                    className="peer sr-only"
                    onChange={() => togglePlatform(platform.id)}
                    type="checkbox"
                  />
                  <span className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary dark:bg-gray-700" />
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                </label>
              </div>

              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-text-muted-light dark:text-text-muted-dark">
                  Spend <strong className="text-text-main-light dark:text-text-main-dark">{currency(platform.spend)}</strong>
                </span>
                <span className="text-text-muted-light dark:text-text-muted-dark">
                  Limit <strong className="text-text-main-light dark:text-text-main-dark">{currency(platform.limit)}</strong>
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div className={["h-1.5 rounded-full", progressColor(percentage)].join(" ")} style={{ width: `${percentage}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default PlatformCard;

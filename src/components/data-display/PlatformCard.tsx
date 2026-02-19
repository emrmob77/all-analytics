"use client";

import { useState } from "react";

interface Platform {
  id: string;
  name: string;
  glyph: string;
  glyphClassName: string;
  connected: boolean;
  spend: number;
  limit: number;
}

const initialPlatforms: Platform[] = [
  {
    id: "google",
    name: "Google Ads",
    glyph: "G",
    glyphClassName: "text-blue-700",
    connected: true,
    spend: 12450,
    limit: 15000
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    glyph: "in",
    glyphClassName: "text-indigo-700",
    connected: false,
    spend: 0,
    limit: 5000
  },
  {
    id: "meta",
    name: "Meta Ads",
    glyph: "f",
    glyphClassName: "text-blue-600",
    connected: true,
    spend: 6200,
    limit: 10000
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    glyph: "t",
    glyphClassName: "text-black dark:text-white",
    connected: true,
    spend: 4700,
    limit: 5000
  }
];

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

function getProgressColor(percentage: number) {
  if (percentage === 0) return "bg-gray-400";
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
    <section className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Connected Channels</h2>
        <button
          aria-label="Channel settings"
          className="min-h-11 min-w-11 rounded-lg text-text-muted-light transition-colors hover:text-primary dark:text-text-muted-dark"
          type="button"
        >
          <span className="material-icons-round">settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {platforms.map((platform) => {
          const percentage = platform.limit === 0 ? 0 : Math.round((platform.spend / platform.limit) * 100);

          return (
            <article
              className={[
                "rounded-xl border border-border-light bg-surface-light p-5 shadow-sm transition-shadow hover:shadow-md dark:border-border-dark dark:bg-surface-dark",
                platform.connected ? "" : "opacity-60"
              ].join(" ")}
              key={platform.id}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold dark:bg-gray-800",
                      platform.glyphClassName
                    ].join(" ")}
                  >
                    {platform.glyph}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{platform.name}</h3>
                    {platform.connected ? (
                      <p className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        Connected
                      </p>
                    ) : (
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Inactive</p>
                    )}
                  </div>
                </div>

                <label
                  aria-label={`Toggle ${platform.name} connection`}
                  className="relative inline-flex cursor-pointer items-center"
                >
                  <input
                    checked={platform.connected}
                    className="peer sr-only"
                    onChange={() => togglePlatform(platform.id)}
                    type="checkbox"
                  />
                  <span className="relative h-5 w-9 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-700" />
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted-light dark:text-text-muted-dark">Spend</span>
                  <span className="font-semibold">{currency(platform.spend)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted-light dark:text-text-muted-dark">Limit</span>
                  <span className="font-semibold">{currency(platform.limit)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={["h-1.5 rounded-full", getProgressColor(percentage)].join(" ")}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default PlatformCard;

# Route Gap Analysis (21.1)

Date: 2026-02-19

## Scope

Audit target:
- Sidebar navigation paths (`src/modules/moduleRegistry.ts`)
- App Router pages (`src/app/**/page.tsx`)

## Findings Before Fix

Navigation had 16 links, but only 8 dedicated routes existed.

Broken/missing routes before fix:
- `/google-ads`
- `/meta-ads`
- `/tiktok-ads`
- `/linkedin-ads`
- `/yandex-ads`
- `/ga4`
- `/growth-intelligence`
- `/market-insights`
- `/commerce-center`
- `/search-console`
- `/task-board`
- `/custom-report`
- `/glowy-ai`

## Resolution

Implemented controlled dynamic route handler with allow-list:
- `src/app/[slug]/page.tsx`
- `src/modules/dynamicRoutes.ts`
- `src/modules/DynamicRouteModule.tsx`

Behavior:
- Allowed slugs render working pages.
- Unknown slugs return 404 (`notFound()`).
- Legacy `/glowy-ai` redirects to `/allanalytics-ai`.

## Data Binding Upgrade (21.2)

For platform routes (`/google-ads`, `/meta-ads`, `/tiktok-ads`, `/linkedin-ads`, `/yandex-ads`, `/ga4`, `/search-console`):
- Real query hooks integrated:
  - `useCampaigns`
  - `usePlatformConnections`
  - `usePlatforms`
  - `useMetrics`
- Real mutation integrated:
  - `useTogglePlatformConnection`

Files:
- `src/modules/placeholders/PlatformAnalyticsModule.tsx`
- `src/hooks/usePlatforms.ts`

## Route/Menu Sync (21.3)

- System nav path updated from `/glowy-ai` to `/allanalytics-ai`.
- `getPageTitleByPath` now resolves title from sidebar nav labels when route registry has no static module definition.

File:
- `src/modules/moduleRegistry.ts`

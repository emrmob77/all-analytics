# AdsPulse Dashboard

Dijital pazarlamacilarin Google Ads, Meta Ads, TikTok Ads ve Pinterest Ads kampanyalarini tek bir arayuzden yonetmelerine olanak taniyan SaaS tabanli reklam yonetim dashboard'u.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, TanStack Table v8, TanStack Query v5, Zustand
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Monitoring:** Sentry, Posthog

## Project Structure

```
all-analytics/
├── CLAUDE.md              # Project context (this file)
├── docs/
│   ├── requirements.md    # Detailed requirements
│   ├── design.md          # Technical design
│   └── tasks.md           # Implementation plan
├── prototype/
│   └── Adspulse.tsx       # UI prototype reference
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── (auth)/        # Auth pages (login)
│   │   ├── dashboard/     # Dashboard page
│   │   ├── campaigns/     # Campaign list & detail
│   │   ├── reports/       # Reports page
│   │   └── settings/      # Settings page
│   ├── components/
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities
│   ├── services/          # API services
│   └── types/             # TypeScript types
└── supabase/
    └── migrations/        # Database migrations
```

## Key Features

- Multi-platform OAuth entegrasyonu (Google, Meta, TikTok, Pinterest)
- Otomatik veri senkronizasyonu (15 dakikada bir)
- Gercek zamanli dashboard ve metrik gorsellestirme
- Kampanya durum ve butce yonetimi
- Rol tabanli erisim kontrolu (RBAC)
- Organizasyon ve ekip yonetimi
- Rapor olusturma ve disa aktarma (CSV, Excel, PDF)
- Row-level security (RLS) ile veri izolasyonu

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Conventions

- TypeScript strict mode
- shadcn/ui components for UI
- Server Components by default, Client Components when needed
- Server Actions for mutations
- TanStack Query for client-side caching
- Zustand for global state
- RLS on all Supabase tables
- Prototype reference: prototype/Adspulse.tsx

## Performance Targets

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Dashboard load < 1.5s

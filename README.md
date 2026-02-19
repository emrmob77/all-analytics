# Allanalytics

Allanalytics, pazarlama kanallari (Google Ads, Meta Ads, TikTok, GA4, Search Console vb.) icin tasarlanmis Next.js tabanli bir analytics dashboard projesidir.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack React Query
- Supabase (Postgres + RLS)
- Vitest + Testing Library

## Proje Yapisi

```text
all-analytics/
├── docs/
│   └── specs/allanalytics-ui-design/
│       ├── design.md
│       ├── requirements.md
│       └── tasks.md
├── src/
│   ├── app/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── modules/
│   ├── pages/
│   ├── store/
│   ├── styles/
│   ├── types/
│   └── utils/
├── supabase/
│   └── migrations/
└── package.json
```

## Kurulum

1. Depoyu klonlayin:

```bash
git clone git@github.com:emrmob77/all-analytics.git
cd all-analytics
```

2. Bagimliliklari yukleyin:

```bash
npm install
```

3. Environment dosyasini hazirlayin:

```bash
cp .env.example .env.local
```

4. Gerekli degiskenleri doldurun ve uygulamayi baslatin:

```bash
npm run dev
```

## Environment Variables

Ornekler `.env.example` dosyasinda bulunur:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase proje URL'i
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonim/public key
- `VITE_SUPABASE_URL`: Vite uyumlulugu icin alternatif URL anahtari
- `VITE_SUPABASE_ANON_KEY`: Vite uyumlulugu icin alternatif key

Not: Proje Next.js ile calistigi icin runtime tarafinda `NEXT_PUBLIC_*` anahtarlari kullanilir. `VITE_*` alanlari uyumluluk amaclidir.

## NPM Scriptleri

- `npm run dev`: Gelistirme ortami
- `npm run build`: Production build
- `npm run start`: Production server
- `npm run preview`: Build sonrasi start
- `npm run lint`: ESLint
- `npm run type-check`: TypeScript type kontrolu
- `npm run test`: Vitest testleri
- `npm run test:watch`: Watch mod test
- `npm run format`: Prettier format

## Supabase

Supabase schema migrationlari:

- `supabase/migrations/20260219103321_create_core_schema_rls_and_triggers.sql`
- `supabase/migrations/20260219103818_harden_rls_and_function_search_path.sql`

Bu migrationlar su kapsami icerir:

- Core tablolar (`users`, `brands`, `campaigns`, `platforms`, `metrics` vb.)
- RLS policy seti (`SELECT/INSERT/UPDATE/DELETE`)
- Trigger ve functionlar (`updated_at`, metric position reindex)

## Dokumantasyon

- Tasarim ve gorev listesi: `docs/specs/allanalytics-ui-design/`
- Component dokumantasyonu: `docs/components.md`
- Gelistirme katki rehberi: `CONTRIBUTING.md`

## Test ve Build Durumu

Asagidaki komutlar proje icin standart dogrulama setidir:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

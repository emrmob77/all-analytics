# All Analytics

Allanalytics için UI/UX odaklı frontend proje altyapısı ve tasarım dokümanları.

## Proje Yapısı

```text
allanalytics/
├── README.md
├── .gitignore
├── package.json
├── next.config.ts
├── next-env.d.ts
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── App.tsx
│   └── components/
└── docs/
    └── specs/
        └── allanalytics-ui-design/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## Hızlı Başlangıç

1. Depoyu klonlayın:
   ```bash
   git clone git@github.com:emrmob77/all-analytics.git
   cd all-analytics
   ```
2. Bağımlılıkları kurun:
   ```bash
   npm install
   ```
3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
4. Build alın:
   ```bash
   npm run build
   ```
5. Production sunucusunu çalıştırın:
   ```bash
   npm run start
   ```

## Notlar

- Proje Next.js tabanlıdır ve `brand radar` klasöründeki akışla aynı şekilde çalışır (`next dev/build/start`).
- Dokümantasyon dosyaları `docs/specs/allanalytics-ui-design/` altında tutulur.

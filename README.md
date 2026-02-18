# All Analytics

Allanalytics için UI/UX odaklı frontend proje altyapısı ve tasarım dokümanları.

## Proje Yapısı

```text
allanalytics/
├── README.md
├── .gitignore
├── package.json
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   └── ...
└── docs/
    ├── prototype/
    │   └── static-ui.html
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

## Notlar

- Geliştirme akışında doğrudan build tool komutu yerine `npm run` scriptleri kullanılır.
- Eski statik prototip dosyası: `docs/prototype/static-ui.html`
- Dokümantasyon dosyaları `docs/specs/allanalytics-ui-design/` altında tutulur.

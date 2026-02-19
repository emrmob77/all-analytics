# Contributing Guide

Bu repo icin katki verirken asagidaki adimlari takip edin.

## 1) Branch Akisi

- Yeni gelistirme icin `main` uzerinden branch acin.
- Branch isimlendirmesi acik olsun: `feat/...`, `fix/...`, `chore/...`.
- Kucuk ve odakli commitler tercih edin.

## 2) Kod Standartlari

- TypeScript strict mode kurallarina uyun.
- UI degisikliklerinde mevcut tasarim dilini koruyun.
- Gereksiz buyuk refactorlardan kacinin.
- Yeni componentlerde kisa JSDoc aciklamasi ekleyin.

## 3) Local Kontrol

PR acmadan once asagidaki komutlarin temiz gecmesi beklenir:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

## 4) UI Degisiklikleri

- Ekran goruntusu veya kisa aciklama ekleyin.
- Erişilebilirlik etkisini not edin (focus, keyboard, contrast).
- Mobil davranisi kontrol edin.

## 5) Supabase Degisiklikleri

- DDL degisiklikleri migration dosyasi ile eklenmeli.
- RLS policy etkisini PR aciklamasinda belirtin.
- Migrations klasoru: `supabase/migrations/`.

## 6) PR Icerigi

PR aciklamasinda su bolumleri verin:

- Problem / hedef
- Yapilan degisiklikler
- Test sonucu
- Riskler ve geri donus plani

## 7) Commit Mesaji Onerisi

```text
feat(sidebar): add collapsible groups and profile dropdown
fix(api): show friendly query errors and retry only on network failures
chore(docs): update README and component usage docs
```

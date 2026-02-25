# Google Ads API — Temel Erişim Başvuru Kılavuzu

## Mevcut Durum

| Bilgi | Değer |
|-------|-------|
| MCC Customer ID | `336-710-1005` (3367101005) |
| Bağlı Reklam Hesabı | `3252564446` (emrmob7@gmail.com) |
| Developer Token | `UWkv2_0Wb82QLXyxGOP_VQ` |
| Mevcut Erişim | Test Hesabı |
| Hedef Erişim | **Temel Erişim (Basic Access)** |

## Neden Gerekli?

Test modundaki developer token yalnızca test hesaplarıyla çalışır.
`3252564446` gerçek bir reklam hesabı olduğundan `DEVELOPER_TOKEN_NOT_APPROVED`
hatası alınmaktadır. Temel Erişim onaylandıktan sonra sync çalışacaktır.

---

## Başvuru Adımları

### 1. Google Ads API Center'a Git

```
ads.google.com → seoroascom@gmail.com ile giriş yap
→ Sağ üst köşe: Tools & Settings (⚙)
→ Setup bölümü → API Center
→ "Temel Erişim için başvur" butonuna tıkla
```

### 2. Formu Doldur

**Uygulama Adı:**
```
AdsPulse Dashboard
```

**Kullanım Amacı (İngilizce):**
```
We are building a multi-platform advertising management dashboard
that aggregates campaign data from Google Ads, Meta Ads, TikTok Ads,
and Pinterest Ads into a single interface for digital marketers.
The application reads campaign metrics, impressions, clicks,
conversions and spend data to display unified reporting.
```

**Website URL:**
```
https://allads-analytics.vercel.app
```

**Kaç hesap yöneteceksiniz:**
```
1-10 (başlangıç için)
```

**Hesap türü:**
```
My own accounts (kendi hesaplarım)
```

### 3. Gönder ve Bekle

Onay süresi: **birkaç saat – 2 iş günü**

Onay e-postası `seoroascom@gmail.com` adresine gelecek.

---

## Onay Sonrası Yapılacaklar

1. Supabase Dashboard → Settings → Connections → "Sync Now" butonuna bas
2. Sync fonksiyonu `3252564446` customer ID'sini otomatik discover eder
3. Kampanyalar ve metrikler veritabanına yazılır
4. Dashboard'da veriler görünmeye başlar

---

## Teknik Notlar

- `external_account_id` DB'de şu an `108106106452062883935` (Google profile sub) olarak kayıtlı
- Sync fonksiyonu bu değerin customer ID olmadığını anlar, `listAccessibleCustomers` çağırır
- `3252564446` discover edilerek kampanya sorgusu yapılır
- Sorun yok — kod bu durumu zaten yönetiyor

## İlgili Supabase Secrets

```
GOOGLE_ADS_DEVELOPER_TOKEN   = UWkv2_0Wb82QLXyxGOP_VQ
GOOGLE_ADS_LOGIN_CUSTOMER_ID = 3367101005
OAUTH_TOKEN_SECRET           = <mevcut>
```

---

## Sorun Giderme

| Hata | Sebep | Çözüm |
|------|-------|-------|
| `DEVELOPER_TOKEN_NOT_APPROVED` | Henüz Basic Access yok | Başvuruyu bekle |
| `NOT_ADS_USER` | Yanlış Google hesabıyla bağlanıldı | emrmob7@gmail.com ile bağlan |
| `DEVELOPER_TOKEN_INVALID` | Token yanlış girilmiş | Supabase secret'ı kontrol et |
| `No accessible customer found` | listAccessibleCustomers boş döndü | MCC bağlantısını kontrol et |

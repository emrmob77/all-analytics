# Reklam Platformu Bağlantı Kılavuzu

Bu dokümanda **Google Ads**, **Meta Ads**, **TikTok Ads** ve **Pinterest Ads** platformlarının bu projeye nasıl bağlanacağı adım adım anlatılmaktadır.

---

## Genel Akış

```
Settings → Connections → "Connect" butonuna tıkla
    ↓
Sunucu tarafında CSRF state cookie'si oluşturulur
    ↓
Kullanıcı platforma yönlendirilir (izin ekranı)
    ↓
Platform, /api/oauth/{platform}/callback'e yönlendirir
    ↓
Token alınır → şifrelenerek veritabanına kaydedilir
    ↓
Settings → Connections → "Connected ✓" görünür
```

**Callback URL formatı:**
```
http://localhost:3000/api/oauth/{platform}/callback       ← local dev
https://allads-analytics.vercel.app/api/oauth/{platform}/callback  ← production
```

---

## Ortak Gereksinim — `.env.local`

Tüm platformlar için aşağıdaki temel değişkenler `.env.local`'da zaten mevcut olmalıdır:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000          # local dev
# NEXT_PUBLIC_APP_URL=https://allads-analytics.vercel.app  # production

OAUTH_TOKEN_SECRET=<32 byte hex>  # openssl rand -hex 32
```

---

## 1. Google Ads

### İhtiyaç Duyulan Değişkenler

```bash
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=
```

### Adımlar

#### 1.1 Google Cloud Console — OAuth Kimlik Bilgileri

1. [https://console.cloud.google.com](https://console.cloud.google.com) → projeye gir (yoksa yeni oluştur)
2. Sol menü → **APIs & Services → Library**
3. **Google Ads API**'yi ara → **Enable**
4. Sol menü → **APIs & Services → Credentials**
5. **+ Create Credentials → OAuth client ID**
6. Application type: **Web application**
7. **Authorized redirect URIs** bölümüne ekle:
   ```
   http://localhost:3000/api/oauth/google/callback
   https://allads-analytics.vercel.app/api/oauth/google/callback
   ```
8. **Create** → `Client ID` ve `Client Secret` kopyala

#### 1.2 Google Ads — Developer Token

1. [https://ads.google.com](https://ads.google.com) → bir Google Ads hesabına gir
2. Sağ üst köşe → **Tools & Settings (⚙)** → **API Center**
3. **Developer token**'ı kopyala

> **Not:** Yeni hesaplarda token "test" modunda gelir — yalnızca kendi test hesabınızla çalışır.
> Gerçek müşteri hesaplarına erişmek için **Basic Access** başvurusu yapmanız gerekir (genellikle 1–3 iş günü).

#### 1.3 `.env.local`'a ekle

```bash
GOOGLE_ADS_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GOOGLE_ADS_DEVELOPER_TOKEN=xXxXxXxXxXxXxXxX
```

#### 1.4 OAuth Scope

Proje şu scope'u kullanır:
```
https://www.googleapis.com/auth/adwords
```

#### 1.5 Google Ads API Versiyonu

Proje Google Ads tarafında erişilebilir müşteri hesabı sorgusunda sırasıyla `v19`, `v20`, `v21` endpointlerini dener. Bu sayede tek bir sabit API versiyonuna bağlı kalmadan bağlantı akışı devam eder.

---

## 2. Meta Ads (Facebook)

### İhtiyaç Duyulan Değişkenler

```bash
META_ADS_APP_ID=
META_ADS_APP_SECRET=
```

### Adımlar

#### 2.1 Meta for Developers — Uygulama Oluştur

1. [https://developers.facebook.com/apps](https://developers.facebook.com/apps)
2. **Create App** → App type: **Business** seç
3. Uygulama oluşturulduktan sonra sol menü → **Settings → Basic**
4. `App ID` ve `App Secret` kopyala

#### 2.2 Marketing API'yi Aktifleştir

1. Sol menü → **Add Product** → **Marketing API** → **Set Up**
2. **Permissions** sekmesinden şu izinleri ekle:
   - `ads_management`
   - `ads_read`

#### 2.3 Redirect URI Ekle

1. Sol menü → **Facebook Login → Settings**
2. **Valid OAuth Redirect URIs** bölümüne ekle:
   ```
   http://localhost:3000/api/oauth/meta/callback
   https://allads-analytics.vercel.app/api/oauth/meta/callback
   ```

#### 2.4 `.env.local`'a ekle

```bash
META_ADS_APP_ID=123456789012345
META_ADS_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 2.5 Token Davranışı

Meta, standart refresh token yerine **long-lived token** kullanır. Proje bunu otomatik olarak yönetir — access token hem `access_token` hem de `refresh_token` alanına kaydedilir ve yenileme isteğinde `fb_exchange_token` grant tipi kullanılır.

---

## 3. TikTok Ads

### İhtiyaç Duyulan Değişkenler

```bash
TIKTOK_ADS_APP_ID=
TIKTOK_ADS_APP_SECRET=
```

### Adımlar

#### 3.1 TikTok Business API — Uygulama Oluştur

1. [https://business-api.tiktok.com/portal/apps](https://business-api.tiktok.com/portal/apps)
2. **Create App** → **Web App**
3. Uygulama bilgilerini doldur → kaydet
4. `App ID` ve `App Secret` kopyala

#### 3.2 Redirect URI Ekle

Uygulama ayarlarında **Redirect URI** bölümüne ekle:
```
http://localhost:3000/api/oauth/tiktok/callback
https://allads-analytics.vercel.app/api/oauth/tiktok/callback
```

#### 3.3 İzin (Scope) Ayarı

Uygulamaya şu scope'ları ekle:
- `user.info.basic`
- `ad.read`
- `ad.account.readonly`

#### 3.4 `.env.local`'a ekle

```bash
TIKTOK_ADS_APP_ID=7xxxxxxxxxxxxxxxx
TIKTOK_ADS_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Not:** TikTok uygulamaları aktif olmadan önce review sürecinden geçmesi gerekebilir.

---

## 4. Pinterest Ads

### İhtiyaç Duyulan Değişkenler

```bash
PINTEREST_ADS_APP_ID=
PINTEREST_ADS_APP_SECRET=
```

### Adımlar

#### 4.1 Pinterest Developers — Uygulama Oluştur

1. [https://developers.pinterest.com/apps](https://developers.pinterest.com/apps)
2. **Connect app** → **Create new app**
3. Uygulama bilgilerini doldur → oluştur
4. `App ID` ve `App Secret` kopyala

#### 4.2 Redirect URI Ekle

Uygulama ayarlarında **Redirect URIs** bölümüne ekle:
```
http://localhost:3000/api/oauth/pinterest/callback
https://allads-analytics.vercel.app/api/oauth/pinterest/callback
```

#### 4.3 İzin (Scope) Ayarı

Uygulamaya şu scope'ları ekle:
- `ads:read`
- `ads:write`

#### 4.4 `.env.local`'a ekle

```bash
PINTEREST_ADS_APP_ID=1234567
PINTEREST_ADS_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 4.5 Token Yetkilendirme Yöntemi

Pinterest, token exchange için **HTTP Basic Auth** kullanır (diğer platformlardan farklı olarak). Bu proje tarafından otomatik olarak yönetilir.

---

## Vercel'e Environment Variable Ekleme

Local'de çalışan entegrasyon production'da da çalışmalıysa, Vercel'e de ekle:

1. [https://vercel.com](https://vercel.com) → projeye gir
2. **Settings → Environment Variables**
3. Her değişkeni aşağıdaki gibi ekle (Environment: **Production + Preview + Development**):

| Key | Value |
|-----|-------|
| `GOOGLE_ADS_CLIENT_ID` | `...` |
| `GOOGLE_ADS_CLIENT_SECRET` | `...` |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | `...` |
| `META_ADS_APP_ID` | `...` |
| `META_ADS_APP_SECRET` | `...` |
| `TIKTOK_ADS_APP_ID` | `...` |
| `TIKTOK_ADS_APP_SECRET` | `...` |
| `PINTEREST_ADS_APP_ID` | `...` |
| `PINTEREST_ADS_APP_SECRET` | `...` |
| `NEXT_PUBLIC_APP_URL` | `https://allads-analytics.vercel.app` |
| `OAUTH_TOKEN_SECRET` | `<mevcut değer>` |

> Vercel'e eklendikten sonra **Redeploy** yapılması gerekir.

---

## Token Güvenliği

Tüm access token ve refresh token değerleri veritabanına **AES-256 şifreli** olarak kaydedilir. Şifreleme anahtarı `OAUTH_TOKEN_SECRET` ortam değişkeninden gelir. Bu değer kaybolursa mevcut tüm tokenlar geçersiz hale gelir.

Şifreleme kodu: `src/lib/crypto.ts`
Token tablosu: `ad_account_tokens` (Supabase)

---

## Sık Karşılaşılan Sorunlar

| Sorun | Olası Sebep | Çözüm |
|-------|-------------|-------|
| `oauth_failed` hatası | Redirect URI eşleşmiyor | Console/Dashboard'da tanımlı URI'yi kontrol et |
| `oauth_denied` hatası | Kullanıcı izni reddetti | Tekrar dene, gerekli izinleri onayla |
| `No Google Ads accounts found` | Developer token test modunda + yanlış hesap | Developer token'ın bağlı olduğu hesapla giriş yap |
| `No Meta Ads accounts found` | Hesapta aktif reklam hesabı yok | Meta Business Manager'da reklam hesabı oluştur |
| Bağlantı başarılı ama veri gelmiyor | Token doğru fakat API erişimi kısıtlı | Platform'da API erişim seviyesini kontrol et |

---

## İlgili Dosyalar

```
src/
├── app/api/oauth/[platform]/callback/route.ts   ← OAuth callback handler
├── lib/actions/ad-accounts.ts                   ← initiateOAuth, disconnect, refresh
├── lib/crypto.ts                                ← Token şifreleme/çözme
├── services/ad-platforms/
│   ├── google.ts                                ← Google Ads OAuth servisi
│   ├── meta.ts                                  ← Meta Ads OAuth servisi
│   ├── tiktok.ts                                ← TikTok Ads OAuth servisi
│   └── pinterest.ts                             ← Pinterest Ads OAuth servisi
└── components/settings/
    ├── ConnectionsTab.tsx                       ← UI (Settings → Connections)
    └── OAuthConnector.tsx                       ← Connect/Disconnect kartı
```

# SMTP Kurulum Kılavuzu

Davet emaillerinin gerçek kullanıcılara gönderilmesi için Supabase'e custom SMTP bağlanması gerekir.
Bu projede **Gmail SMTP** kullanılmaktadır (ücretsiz, günlük ~500 email).

---

## Akış

```
Settings → Members → Invite → inviteUserByEmail()
    ↓
Supabase Auth Admin API
    ↓
Gmail SMTP (custom SMTP)
    ↓
Kullanıcının emaili → "Accept invitation" linki → /invitations/accept?token=xxx
```

---

## Adım 1 — Gmail App Password

> Gmail hesabında **2 Adımlı Doğrulama** açık olmalıdır.

1. [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) adresine git
2. **App name** alanına `AdsPulse` yaz → **Create**
3. Ekranda gösterilen **16 haneli şifreyi** kopyala (bir daha gösterilmez)

---

## Adım 2 — Supabase SMTP Ayarları

**Dashboard → Settings → Authentication → SMTP Settings**

Direkt link:
```
https://supabase.com/dashboard/project/xplzgwgzcstwrhdjlxgq/settings/auth
```

Sayfayı aşağı kaydır, **SMTP Settings** bölümüne gir ve şu değerleri doldur:

| Alan | Değer |
|------|-------|
| Enable Custom SMTP | ✓ Açık |
| Sender email | `senin@gmail.com` |
| Sender name | `AdsPulse` |
| Host | `smtp.gmail.com` |
| Port number | `587` |
| Username | `senin@gmail.com` |
| Password | *(App Password — 16 hane, boşluksuz)* |

**Save** butonuna tıkla.

---

## Adım 3 — Email Şablonunu Özelleştir (İsteğe Bağlı)

Supabase'in gönderdiği davet emailinin içeriğini değiştirebilirsin:

**Dashboard → Authentication → Email Templates → Invite user**

Direkt link:
```
https://supabase.com/dashboard/project/xplzgwgzcstwrhdjlxgq/auth/templates
```

Varsayılan şablon `{{ .ConfirmationURL }}` değişkenini kullanır.
Bu değişken otomatik olarak `/invitations/accept?token=xxx` adresine yönlenir.

Örnek özelleştirilmiş şablon:
```html
<h2>AdsPulse'a davet edildiniz</h2>
<p>Bir ekibe katılmak için aşağıdaki butona tıklayın:</p>
<a href="{{ .ConfirmationURL }}">Daveti Kabul Et →</a>
<p>Bu link 24 saat geçerlidir.</p>
```

---

## Adım 4 — Test

SMTP ayarını kaydettikten sonra:

1. **Settings → Members → Invite Member**
2. Gerçek bir email adresi gir
3. Email birkaç saniye içinde gelmeli

Gelmezse **Supabase Dashboard → Logs → Auth** bölümünden hata mesajını kontrol et.

---

## Sık Karşılaşılan Sorunlar

| Sorun | Sebep | Çözüm |
|-------|-------|-------|
| Email gelmiyor | App Password yanlış | Google'dan yeni App Password oluştur |
| "Username and Password not accepted" | 2FA açık değil | Google hesabında 2FA'yı etkinleştir |
| Günlük limit aşıldı | Gmail 500/gün sınırı | Brevo veya Postmark gibi servise geç |
| Email spam'e düşüyor | Gmail'in SPF/DKIM'i yok | Kendi domainini Supabase'e ekle |

---

## Limitler

| Servis | Ücretsiz Limit |
|--------|---------------|
| Gmail SMTP | ~500 email/gün |
| Brevo | 300 email/gün |
| Mailjet | 200 email/gün |
| Postmark | 100 email/ay (test) |

Uygulama büyüdükçe kendi domainini doğrulayıp Brevo veya Postmark'a geçmek önerilir.

---

## İlgili Dosyalar

```
src/lib/actions/invitation.ts   ← inviteUserByEmail() çağrısı burada
```

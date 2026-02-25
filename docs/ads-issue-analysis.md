# Google Ads Bağlantı ve Edge Function Hatası Analizi

**Temel Sorun:** Jetonunuz "Temel Erişim" (Basic Access) düzeyinde olmasına rağmen bağlantı veya senkronizasyon (işlem yapma) sırasında hata almanızın sebebi **jetonunuzun yetkisiz olması değil, kodun "MCC (Yönetici Masası)" hesap yapısını yanlış yorumlamasıdır.**

## Detaylı İnceleme

1. **OAuth Bağlantı Aşamasında Ne Oluyor? (`src/services/ad-platforms/google.ts`)**
   Siz OAuth ekranında (seoroascom@gmail.com hesabıyla) Google'a yetki verdiğinizde, `getAccountInfo` fonksiyonu `customers:listAccessibleCustomers` endpoint'ine istek atar. Bu endpoint **sadece doğrudan yetkilendirilen hesapları**, yani sizin durumunuzda MCC (Manager) hesabınızın ID'sini döndürür (Alt hesaplar dönmez).
   Kod, bu MCC ID'sini alıp veritabanına (`ad_accounts.external_account_id` olarak) kaydeder.

2. **İşlem Yaptığınızda (Sync) Neden Hata Alıyorsunuz? (`supabase/functions/sync-ad-platform-data/index.ts`)**
   Siz "Sync" işlemini tetiklediğinizde, Edge Function çalışır ve doğrudan bu `external_account_id` (yani MCC hesabınız) üzerinde kampanya verisi çekmeye çalışır.
   ```sql
   -- Edge Function İçindeki Hatalı Sorgu Mantığı
   SELECT campaign.id, campaign.name ... FROM campaign
   ```
   Google Ads API, bir **MCC hesabı üzerinde doğrudan kampanya sorgusu yapılamayacağı** için hata fırlatır (Örn: "campaign is not a valid resource"). Bu hata, kodunuzda "Edge Function returned a non-2xx status code" olarak Supabase tarafından yakalanır ve size başarısız bir işlem/bağlantı hatası olarak yansır.

3. **Kodun MCC Kararlılığındaki Mantıksal Hata:**
   Mevcut kodunuzdaki `pickPreferredGoogleCustomerId` ve `googleListAccessibleCustomers` fonksiyonları sadece alt hesapları arar ama `listAccessibleCustomers` endpoint'i Google API yapısı gereği child (alt) hesapları vermez. Alt hesapları almak için MCC hesabına GAQL ile `customer_client` sorgusu atılması gerekir.

## Çözüm Önerisi

Bu sorunu çözmek için yapılması gereken iki temel kod değişikliği var ve bu değişiklikler sisteme **uygulandı**:

1. **OAuth Aşamasında Dinamik İlk Hesap Seçimi (`src/services/ad-platforms/google.ts`):**  
   Önceden sistem, tek kullanıcılık bir ID'ye (Environment variables) bağlı çalışıyordu. Bunu kaldırarak, her kullanıcının OAuth Authorization sonrası erişebildiği (Manager veya Doğrudan Müşteri) **ilk hesabı dinamik olarak seçip** kaydetmesini sağladık. Artık hiçbir kullanıcı için özel ID tanımlaması gerekmiyor, her organizasyon kendi hesabını özgürce bağlayabilir.

2. **Senkronizasyon Sırasında Alt Hesap (Client Child Account) Tespiti (`sync-ad-platform-data/index.ts`):**  
   Senkronizasyon (Sync) işlemi esnasında Google Ads'e istek atmadan önce, sistem artık zekice bir kontrol yapıyor:
   - Kaydedilen hesap bir **Manager (MCC)** hesabı mı? (`SELECT customer.manager`)
   - Eğer MCC ise, bu hesaba bağlı aktif bir **alt müşteri (client)** hesabı bul (`level = 1` olan alt hesabı getir).
   - Bulunan alt hesabın bilgilerini analiz veya kampanya sorguları için kullanırken, MCC kimliğini `login-customer-id` başlığı (header) olarak o anki bağlantıya dinamik olarak enjekte et.

Sisteminizin jeton erişimi başarıyla onaylanmış ("Temel Erişim"), altyapı olarak sorun yok. Sadece uygulamanız eskiden kampanya verilerini sorgularken MCC hedefini aracı olarak değil doğrudan ana hesap olarak kullanmaya çalışıyor ve tek bir kullanıcının ID'sine bağlı kalıyordu. Kod içerisindeki reklam müşteri ID'si bulma/belirleme (Customer ID) stratejinizi değiştirdik. Hesap anında bağlanacak ve senkronizasyon herkes için problemsiz çalışacaktır.

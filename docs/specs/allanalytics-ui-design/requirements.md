# Gereksinimler Dokümanı

## Giriş

Allanalytics, çoklu reklam platformlarının (Google Ads, Meta Ads, TikTok Ads, vb.) metriklerini tek bir arayüzde toplayan bir marketing intelligence platformudur. Bu doküman, platformun UI/tasarım katmanının gereksinimlerini tanımlar. İlk aşamada kullanıcı arayüzü ve temel navigasyon yapısı kurulacak, ardından modüler yapıda her bir analitik modülü eklenecektir.

## Sözlük

- **Sistem**: Allanalytics web uygulaması
- **Kullanıcı**: Platformu kullanan pazarlama uzmanı veya yönetici
- **Marka**: Kullanıcının yönettiği işletme veya müşteri hesabı
- **Modül**: Belirli bir analitik veya yönetim işlevini sağlayan bağımsız UI bileşeni
- **Metrik**: Ölçülebilir performans göstergesi (ROAS, CTR, dönüşüm oranı vb.)
- **Platform**: Reklam veya analitik hizmeti sağlayıcısı (Google Ads, Meta Ads vb.)
- **Dashboard**: Özet metriklerin görüntülendiği ana sayfa
- **Sidebar**: Sol taraftaki navigasyon menüsü
- **Dark_Mode**: Karanlık renk teması
- **Light_Mode**: Aydınlık renk teması
- **Responsive**: Farklı ekran boyutlarına uyum sağlayan tasarım
- **Supabase**: Veritabanı ve backend servisi
- **Tailwind_CSS**: Utility-first CSS framework
- **Shadcn_UI**: React bileşen kütüphanesi
- **Framer_Motion**: Animasyon kütüphanesi

## Gereksinimler

### Gereksinim 1: Temel Sayfa Yapısı ve Layout

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, platformun tüm sayfalarında tutarlı bir layout görmek istiyorum, böylece navigasyon ve içerik erişimi kolay olsun.

#### Kabul Kriterleri

1. THE Sistem SHALL her sayfada sol tarafta sabit bir sidebar, üst tarafta header ve merkezi içerik alanı içeren üç bölümlü layout göstermelidir
2. WHEN bir kullanıcı sayfayı yüklediğinde, THE Sistem SHALL sidebar'ı 256px genişliğinde, header'ı 80px yüksekliğinde ve içerik alanını kalan alanı kaplayacak şekilde yerleştirmelidir
3. THE Sistem SHALL tüm layout bileşenlerinde Tailwind CSS utility sınıflarını kullanmalıdır
4. WHEN ekran genişliği 768px'in altına düştüğünde, THE Sistem SHALL sidebar'ı gizlemeli ve hamburger menü ikonu göstermelidir

### Gereksinim 2: Sidebar Navigasyon

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, platformun farklı modüllerine kolayca erişmek istiyorum, böylece ihtiyacım olan analitik veriye hızlıca ulaşabilirim.

#### Kabul Kriterleri

1. THE Sidebar SHALL en üstte platform logosu (A harfi primary renkte), "Allanalytics" başlığı ve external link butonu göstermelidir
2. THE Sidebar SHALL üç ana kategori göstermelidir: Analytics, Configuration ve System
3. WHEN bir kullanıcı sidebar'daki bir menü öğesine tıkladığında, THE Sistem SHALL o öğeyi aktif olarak işaretlemeli ve ilgili sayfaya yönlendirmelidir
4. THE Sidebar SHALL her kategori altında ilgili alt menü öğelerini listelenmelidir
5. THE Sidebar SHALL marka seçici dropdown göstermelidir
6. THE Sidebar SHALL en altta Notifications (badge ile), Support linkleri ve kullanıcı profil bilgisi (fotoğraf, isim, rol) göstermelidir
7. WHEN bir menü öğesi aktif olduğunda, THE Sistem SHALL o öğeyi farklı arka plan rengi, border ve kalın yazı tipi ile vurgulamalıdır
8. THE Sidebar SHALL Material Icons Round ikonlarını kullanmalıdır
9. THE Sidebar SHALL özel stil scrollbar göstermelidir (6px genişlik, rounded, light/dark mode desteği)

### Gereksinim 3: Header Bileşeni

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, her sayfada sayfa başlığını ve hızlı erişim araçlarını görmek istiyorum, böylece bulunduğum konumu bilir ve hızlı işlemler yapabilirim.

#### Kabul Kriterleri

1. THE Header SHALL sol tarafta dinamik sayfa başlığı göstermelidir
2. THE Header SHALL sağ tarafta arama çubuğu, quick actions butonu (3 nokta menü) ve hamburger menü butonu göstermelidir
3. WHEN bir kullanıcı arama çubuğuna tıkladığında, THE Sistem SHALL input alanını focus durumuna getirmeli ve primary renk ile 2px ring göstermelidir
4. THE Header SHALL arama çubuğunda placeholder olarak "Search..." metni, search ikonu ve ⌘K klavye kısayolu badge'i göstermelidir
5. THE Header SHALL 80px sabit yükseklikte olmalı ve sayfanın en üstünde sabitlenmelidir
6. THE Header SHALL alt border ile içerik alanından ayrılmalıdır

### Gereksinim 4: Dark Mode ve Light Mode Desteği

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, platformu karanlık veya aydınlık temada kullanabilmek istiyorum, böylece göz sağlığımı koruyabilir ve tercihime göre çalışabilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL hem dark mode hem de light mode renk şemalarını desteklemelidir
2. WHEN bir kullanıcı tema değiştirdiğinde, THE Sistem SHALL tüm bileşenlerde renk değişikliğini 200ms transition animasyonu ile anında uygulamalıdır
3. THE Sistem SHALL dark mode için şu renkleri kullanmalıdır: background #111827, surface #1F2937, text #F9FAFB, border #374151
4. THE Sistem SHALL light mode için şu renkleri kullanmalıdır: background #F3F4F6, surface #FFFFFF, text #111827, border #E5E7EB
5. THE Sistem SHALL primary renk olarak #5A8A5E kullanmalıdır (her iki temada da)
6. THE Sistem SHALL kullanıcının tema tercihini local storage'da saklamalıdır

### Gereksinim 5: Modüler Navigasyon Yapısı

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, platformun farklı modüllerine (Overview Dashboard, Google Ads, Meta Ads, vb.) erişebilmek istiyorum, böylece ihtiyacım olan analitik veriye ulaşabilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL sidebar'da şu modüllere erişim sağlamalıdır: Overview Dashboard, Google Ads, Meta Ads, GA4, Growth Intelligence, Market Insights, Commerce Center, Search Console, GlowyAI, Task Board, Custom Report, Settings
2. WHEN bir kullanıcı bir modül linkine tıkladığında, THE Sistem SHALL o modülün sayfasına yönlendirmeli ve aktif modülü sidebar'da farklı arka plan rengi ve kalın yazı tipi ile vurgulamalıdır
3. THE Sistem SHALL her modül için benzersiz bir route tanımlamalıdır
4. THE Sistem SHALL her modül için uygun Material Icons ikonu kullanmalıdır

### Gereksinim 6: Marka (Multi-Brand) Seçici

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, yönettiğim farklı markalar arasında geçiş yapabilmek istiyorum, böylece her markanın verilerini ayrı ayrı görebilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL sidebar'ın üst kısmında marka seçici dropdown göstermelidir
2. WHEN bir kullanıcı marka seçici dropdown'a tıkladığında, THE Sistem SHALL kullanıcının erişebildiği tüm markaları (marka adı, logo/avatar ve aktif admin sayısı ile birlikte) listelenmelidir
3. WHEN bir kullanıcı bir marka seçtiğinde, THE Sistem SHALL seçilen markayı aktif olarak işaretlemeli, session storage'da saklamalı ve sayfa yenilenmeden tüm dashboard verilerini o markaya göre filtrelemelidir

### Gereksinim 7: Kampanya Tablosu Bileşeni

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, aktif kampanyalarımı tablo formatında görmek istiyorum, böylece kampanya performansını hızlıca değerlendirebilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL kampanya tablosunda şu sütunları göstermelidir: Campaign Name, Platform, Status, Budget Used, ROAS, Action
2. WHEN bir kullanıcı kampanya tablosunu görüntülediğinde, THE Sistem SHALL her kampanya için kampanya adı, ID, platform logosu (inline SVG veya icon), renkli durum badge'i (Active: yeşil + dot, Paused: sarı + dot, Stopped: kırmızı + dot), bütçe progress bar'ı (harcama miktarı ve yüzde ile), ROAS değeri (trend ikonu ile: trending_up, trending_down, trending_flat) ve aksiyon menüsü (more_vert ikonu) göstermelidir
3. WHEN bir kullanıcı tablo satırına hover yaptığında, THE Sistem SHALL o satırın arka plan rengini değiştirmelidir
4. THE Sistem SHALL tablonun responsive olmasını sağlamalı ve mobil cihazlarda yatay scroll göstermelidir
5. THE Sistem SHALL tablo üzerinde "Filter by Status" dropdown ve "New Campaign" butonu göstermelidir
6. THE Sistem SHALL tablo altında "View All Campaigns" linki (arrow_forward ikonu ile) göstermelidir

### Gereksinim 8: Platform Entegrasyon Kartları

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, bağlı reklam platformlarımı ve bütçe durumlarını görmek istiyorum, böylece platform bazlı harcamalarımı takip edebilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL section başlığı yanında settings ikonu butonu göstermelidir
2. THE Sistem SHALL her platform için bir kart göstermelidir
3. WHEN bir platform kartı görüntülendiğinde, THE Sistem SHALL platform logosu (inline SVG), adı, bağlantı durumu ("Connected" yeşil badge veya "Inactive" gri metin), aktif/pasif toggle switch, harcama miktarı, limit ve renklendirilmiş progress bar (0-70%: primary, 71-90%: sarı, 91-100%: kırmızı) göstermelidir
4. WHEN bir kullanıcı platform toggle'ına tıkladığında, THE Sistem SHALL platformu aktif/pasif duruma getirmelidir
5. THE Sistem SHALL inactive platformlar için opacity-60 uygulamalıdır
6. THE Sistem SHALL platform kartlarını 2 sütunlu grid layout'ta (sm:grid-cols-2) göstermelidir
7. THE Sistem SHALL her kart için hover efekti (shadow-sm → shadow-md) uygulamalıdır

### Gereksinim 9: Kullanılabilir Entegrasyonlar Listesi

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, platformuma ekleyebileceğim entegrasyonları görmek istiyorum, böylece yeni araçları keşfedebilir ve bağlayabilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL kullanılabilir entegrasyonlar listesini göstermelidir
2. WHEN bir entegrasyon listede görüntülendiğinde, THE Sistem SHALL entegrasyon logosu, adı, kategorisi ve duruma göre aksiyon butonu ("Connect" butonu, "Configure" butonu + "Connected" yeşil badge, veya "Beta" gri badge) göstermelidir
3. WHEN bir kullanıcı liste öğesine hover yaptığında, THE Sistem SHALL arka plan rengini değiştirmeli ve entegrasyon adını primary renge boyamalıdır
4. THE Sistem SHALL liste üzerinde "Browse Directory" linki göstermelidir

### Gereksinim 10: Özelleştirilebilir Metrik Sistemi

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, dashboard'umda görmek istediğim metrikleri seçebilmek istiyorum, böylece benim için önemli olan verilere odaklanabilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL kullanıcının dashboard'a metrik ekleyebilmesini, kaldırabilmesini ve sırasını değiştirebilmesini sağlamalıdır
2. THE Sistem SHALL kullanıcının metrik tercihlerini Supabase veritabanında saklamalıdır
3. WHEN bir kullanıcı metrik ekle butonuna tıkladığında, THE Sistem SHALL mevcut metrikleri kategorilere göre gruplanmış şekilde (ad, açıklama, kategori ve veri kaynağı bilgisi ile) göstermelidir
4. THE Sistem SHALL kullanıcının seçtiği metrikleri dashboard'da kart veya grafik olarak görselleştirmelidir

### Gereksinim 11: Responsive Tasarım

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, platformu farklı cihazlarda (desktop, tablet, mobil) kullanabilmek istiyorum, böylece her yerden verilerime erişebilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL desktop (1280px+), tablet (768px-1279px) ve mobil (767px-) ekran boyutlarını desteklemelidir
2. WHEN ekran genişliği 768px'in altına düştüğünde, THE Sistem SHALL sidebar'ı gizlemeli ve hamburger menü göstermelidir
3. WHEN ekran genişliği 768px'in altına düştüğünde, THE Sistem SHALL tablo ve grid layout'ları tek sütuna düşürmelidir
4. THE Sistem SHALL tüm bileşenlerde Tailwind CSS responsive utility sınıflarını kullanmalıdır
5. THE Sistem SHALL mobil cihazlarda touch-friendly buton boyutları (minimum 44x44px) kullanmalıdır
6. THE Sistem SHALL mobil cihazlarda arama çubuğunu gizlemeli ve arama ikonuna tıklandığında modal olarak göstermelidir

### Gereksinim 12: Animasyon ve Geçişler

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, platformda akıcı ve profesyonel animasyonlar görmek istiyorum, böylece kullanıcı deneyimi daha keyifli olsun.

#### Kabul Kriterleri

1. THE Sistem SHALL sayfa geçişlerinde Framer Motion animasyonları kullanmalıdır
2. THE Sistem SHALL hover efektlerinde 200ms transition uygulamalıdır
3. THE Sistem SHALL modal ve dropdown açılışlarında fade-in ve scale animasyonu uygulamalıdır
4. THE Sistem SHALL liste öğelerinde stagger animasyonu kullanmalıdır
5. THE Sistem SHALL loading durumlarında skeleton screen veya spinner göstermelidir
6. THE Sistem SHALL tüm animasyonların prefers-reduced-motion ayarına uygun olmasını sağlamalıdır

### Gereksinim 13: Erişilebilirlik (Accessibility)

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, platformun erişilebilir olmasını istiyorum, böylece engelli kullanıcılar da platformu kullanabilsin.

#### Kabul Kriterleri

1. THE Sistem SHALL tüm interaktif elementlerde klavye navigasyonu, focus indicator, semantic HTML ve ekran okuyucu uyumluluğunu desteklemelidir
2. THE Sistem SHALL tüm görsellerde alt text kullanmalıdır
3. THE Sistem SHALL renk kontrastının WCAG AA standardına uygun olmasını sağlamalıdır
4. THE Sistem SHALL form elementlerinde label ve aria-label kullanmalıdır

### Gereksinim 14: Performans ve Optimizasyon

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, platformun hızlı yüklenmesini ve akıcı çalışmasını istiyorum, böylece verimli çalışabilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL ilk sayfa yüklemesini 3 saniye altında tamamlamalıdır
2. THE Sistem SHALL lazy loading kullanarak görünmeyen bileşenleri sonradan yüklemelidir
3. THE Sistem SHALL görselleri optimize edilmiş formatlarda (WebP, AVIF) sunmalıdır
4. THE Sistem SHALL CSS ve JavaScript dosyalarını minify etmelidir
5. THE Sistem SHALL kritik CSS'i inline olarak yüklemelidir
6. THE Sistem SHALL büyük veri setlerini sayfalama veya infinite scroll ile yüklemelidir
7. THE Sistem SHALL API çağrılarında debounce ve throttle teknikleri kullanmalıdır

### Gereksinim 15: Hata Yönetimi ve Kullanıcı Geri Bildirimi

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, işlemlerim sırasında hata oluştuğunda veya başarılı olduğunda bilgilendirilmek istiyorum, böylece ne olduğunu anlayabilirim.

#### Kabul Kriterleri

1. WHEN bir API çağrısı başarısız veya başarılı olduğunda, THE Sistem SHALL kullanıcıya anlaşılır mesajı toast notification olarak göstermelidir
2. THE Sistem SHALL toast notification'ları 5 saniye sonra otomatik olarak kapatmalı veya kullanıcının manuel olarak kapatabilmesini sağlamalıdır
3. THE Sistem SHALL kritik hatalarda kullanıcıyı hata sayfasına yönlendirmelidir
4. THE Sistem SHALL network hatalarında retry mekanizması sunmalıdır

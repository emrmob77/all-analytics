# Implementation Tasks

## 1. Proje Kurulumu ve Temel Yapılandırma

### [x] 1.1 Next.js + TypeScript Projesi Oluşturma (npm run odaklı)
**Gereksinimler:** Tüm gereksinimler için temel
**Detaylar:**
- Next.js (App Router) + TypeScript projesini kur
- Tüm geliştirme komutlarını `npm run` scriptleri üzerinden çalıştır (`dev`, `build`, `start`, `type-check`, `lint`)
- Package.json'a gerekli bağımlılıkları ekle: next, @tanstack/react-query, zustand, framer-motion, tailwindcss, @supabase/supabase-js
- shadcn/ui kurulumunu yap
- TypeScript konfigürasyonunu ayarla (strict mode)
- ESLint ve Prettier konfigürasyonlarını ekle

### [x] 1.2 Tailwind CSS ve Tema Konfigürasyonu
**Gereksinimler:** 4.1, 4.2, 4.3, 4.4, 4.5
**Detaylar:**
- tailwind.config.js dosyasını oluştur
- Dark mode için 'class' stratejisini aktifleştir
- Özel renk paletini tanımla (primary: #5A8A5E, secondary: #D4E5D6, background-light: #F3F4F6, background-dark: #111827, vb.)
- Özel border-radius değerlerini ekle (default: 0.75rem)
- Font family olarak Inter'i ekle
- Responsive breakpoint'leri doğrula

### [x] 1.3 Supabase Client Kurulumu
**Gereksinimler:** 6.3, 10.2
**Detaylar:**
- src/lib/supabase.ts dosyası oluştur
- Supabase client'ı environment variables ile yapılandır
- .env.example dosyası oluştur
- TypeScript type definitions ekle

### [x] 1.4 Proje Klasör Yapısını Oluşturma
**Gereksinimler:** Tüm gereksinimler için temel
**Detaylar:**
```
src/
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── ui/
│   └── data-display/
├── contexts/
├── hooks/
├── lib/
├── modules/
├── types/
├── utils/
└── App.tsx
```

## 2. Layout ve Navigasyon Bileşenleri

### [x] 2.1 Layout Component Oluşturma
**Gereksinimler:** 1.1, 1.2, 1.3
**Detaylar:**
- src/components/layout/Layout.tsx dosyası oluştur
- Flex container ile sidebar, header ve main content alanlarını yerleştir
- Sidebar için 256px genişlik, header için 80px yükseklik ayarla
- Mobile state yönetimi için useState kullan
- Responsive davranış ekle (md breakpoint)

### [x] 2.2 Sidebar Component Oluşturma
**Gereksinimler:** 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 11.2
**Detaylar:**
- src/components/layout/Sidebar.tsx dosyası oluştur
- Logo section: "A" harfi (primary bg), "Allanalytics" başlığı, external link butonu
- Sidebar'ı 4 bölüme ayır: Logo (üst), BrandSelector, NavigationMenu (orta), Footer (alt)
- Footer section: Notifications (badge ile), Support linkleri, UserProfile
- Özel scrollbar CSS ekle (6px genişlik, rounded, transparent track, gray thumb)
- Overflow-y-auto ile scroll özelliği ekle
- Mobile'da gizlenme/gösterilme animasyonu ekle
- Dark mode desteği ekle

### [x] 2.3 BrandSelector Component Oluşturma
**Gereksinimler:** 6.1, 6.2, 6.3
**Detaylar:**
- src/components/navigation/BrandSelector.tsx dosyası oluştur
- Dropdown için shadcn/ui DropdownMenu kullan
- Brand avatar, name ve activeAdmins bilgilerini göster
- Dropdown açık/kapalı state yönetimi
- Brand seçimi için callback prop ekle

### [x] 2.4 NavigationMenu Component Oluşturma
**Gereksinimler:** 2.1, 2.2, 2.3, 5.1, 5.2, 5.4
**Detaylar:**
- src/components/navigation/NavigationMenu.tsx dosyası oluştur
- 3 kategori oluştur: Analytics, Configuration, System
- Her kategori için başlık ve menü öğeleri listesi
- Material Icons Round ikonlarını ekle
- Aktif route için özel stil (sidebar-item-active class)
- Next.js `Link` component kullan

### [x] 2.5 Header Component Oluşturma
**Gereksinimler:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
**Detaylar:**
- src/components/layout/Header.tsx dosyası oluştur
- Sol tarafta dinamik sayfa başlığı
- Sağ tarafta SearchBar, QuickActionsButton (more_horiz ikonu), hamburger menü
- QuickActionsButton: Dropdown menu ile (shadcn/ui DropdownMenu)
- 80px sabit yükseklik
- Border-bottom ile ayırıcı
- Mobile'da hamburger menü butonu göster

### [x] 2.6 SearchBar Component Oluşturma
**Gereksinimler:** 3.2, 3.3, 3.4, 11.6
**Detaylar:**
- src/components/ui/SearchBar.tsx dosyası oluştur
- Input field ile Material Icons search ikonu (sol tarafta)
- Placeholder: "Search..."
- Keyboard shortcut badge (⌘K) - sağ tarafta, border ile
- Focus state için primary ring (ring-2 ring-primary)
- Debounce ile arama fonksiyonu
- Mobile'da gizle (hidden sm:block)
- Mobile'da modal olarak göster (Dialog component)

## 3. Context Providers ve State Management

### [x] 3.1 ThemeProvider Oluşturma
**Gereksinimler:** 4.1, 4.2, 4.6
**Detaylar:**
- src/contexts/ThemeContext.tsx dosyası oluştur
- Theme state: 'light' | 'dark'
- toggleTheme fonksiyonu
- localStorage'da tema tercihini sakla
- document.documentElement'e 'dark' class ekle/çıkar
- 200ms transition için CSS ekle

### [x] 3.2 BrandProvider Oluşturma
**Gereksinimler:** 6.1, 6.2, 6.3
**Detaylar:**
- src/contexts/BrandContext.tsx dosyası oluştur
- brands, activeBrand, selectBrand, isLoading state'leri
- useEffect ile Supabase'den brand'leri yükle
- sessionStorage'da activeBrandId sakla
- Custom hook: useBrand()

### [x] 3.3 Zustand Store Oluşturma
**Gereksinimler:** 10.1, 10.2, 10.3
**Detaylar:**
- src/store/appStore.ts dosyası oluştur
- sidebarOpen state ve setSidebarOpen action
- selectedMetrics array ve addMetric, removeMetric, reorderMetrics actions
- campaignFilter state ve setCampaignFilter action

### [x] 3.4 React Query Setup
**Gereksinimler:** 6.3, 7.1, 8.1, 10.2
**Detaylar:**
- src/lib/queryClient.ts dosyası oluştur
- QueryClient instance oluştur
- Default options ayarla (staleTime, cacheTime)
- App.tsx'te QueryClientProvider ekle

## 4. Routing ve Sayfa Yapısı

### [x] 4.1 Next.js App Router Kurulumu
**Gereksinimler:** 5.1, 5.2, 5.3
**Detaylar:**
- `src/app/layout.tsx` ile global layout yapısını kur
- `src/app/page.tsx` ve modül sayfaları ile route'ları dosya tabanlı tanımla
- Mevcut layout bileşenini App Router sayfalarında kullan
- 404 Not Found sayfası ekle

### [x] 4.2 Route Tanımları ve Modül Placeholder'ları
**Gereksinimler:** 5.1, 5.2, 5.3, 5.4, 5.5
**Detaylar:**
- `src/app/<route>/page.tsx` yapısında modül route'larını oluştur
- Her modül için route dizini, sayfa başlığı ve ikon eşleşmesi tanımla
- Placeholder component'ler oluştur (OverviewDashboard, GoogleAdsModule, vb.)
- Lazy loading için React.lazy kullan

### [x] 4.3 Page Title Management
**Gereksinimler:** 3.1
**Detaylar:**
- src/hooks/usePageTitle.ts custom hook oluştur
- Route değişikliklerinde sayfa başlığını güncelle
- document.title'ı da güncelle

## 5. Veri Görselleştirme Bileşenleri

### [x] 5.1 CampaignTable Component Oluşturma
**Gereksinimler:** 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
**Detaylar:**
- src/components/data-display/CampaignTable.tsx dosyası oluştur
- Table header: Campaign Name, Platform, Status, Budget Used, ROAS, Action
- CampaignRow sub-component oluştur
- Platform logo: Inline SVG veya icon component (Google, Meta, TikTok, LinkedIn)
- Status badge component: dot (w-1.5 h-1.5 rounded-full) + text (Active: yeşil, Paused: sarı, Stopped: kırmızı)
- Progress bar component: harcama miktarı + yüzde + renkli bar
- ROAS trend: Material Icons (trending_up, trending_down, trending_flat) + renk
- Action button: more_vert ikonu
- Hover efekti: bg-gray-50 dark:bg-gray-800/50
- Responsive: overflow-x-auto (mobil'de horizontal scroll)
- Filter dropdown ve New Campaign butonu (add ikonu ile)
- Tablo altında "View All Campaigns" linki (arrow_forward ikonu ile)

### [x] 5.2 PlatformCard Component Oluşturma
**Gereksinimler:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
**Detaylar:**
- src/components/data-display/PlatformCard.tsx dosyası oluştur
- Section header: başlık + settings ikonu butonu
- Platform logo: Inline SVG component (Google, LinkedIn, Facebook, TikTok)
- Platform name ve connection status (Connected: yeşil, Inactive: gri)
- Toggle switch: shadcn/ui Switch component (peer-checked:bg-primary)
- Spend ve Limit metrikleri
- Progress bar: renkli (0-70%: primary, 71-90%: yellow-500, 91-100%: red-500)
- Inactive platformlar için opacity-60
- Grid layout: grid-cols-1 sm:grid-cols-2
- Hover shadow efekti: shadow-sm hover:shadow-md

### [x] 5.3 IntegrationList Component Oluşturma
**Gereksinimler:** 9.1, 9.2, 9.3, 9.4
**Detaylar:**
- src/components/data-display/IntegrationList.tsx dosyası oluştur
- Liste öğeleri: logo, name, category, action button
- Connection status badge
- Beta badge
- Hover efekti
- "Browse Directory" link

### [x] 5.4 MetricCard Component Oluşturma
**Gereksinimler:** 10.4, 10.7
**Detaylar:**
- src/components/data-display/MetricCard.tsx dosyası oluştur
- Metric name, value, trend (direction + percentage)
- Remove button (X ikonu)
- formatValue utility fonksiyonu kullan
- Trend ikonu ve renk (up: yeşil, down: kırmızı)

### [x] 5.5 MetricSelector Component Oluşturma
**Gereksinimler:** 10.1, 10.5, 10.6
**Detaylar:**
- src/components/data-display/MetricSelector.tsx dosyası oluştur
- Modal veya Drawer component (shadcn/ui Dialog)
- Metrikleri kategorilere göre grupla
- Checkbox ile seçim
- Metric bilgileri: name, description, category, source
- Add/Remove toggle

## 6. API Integration ve Data Fetching

### [x] 6.1 Supabase Queries (React Query Hooks)
**Gereksinimler:** 6.3, 7.1, 8.1, 10.2
**Detaylar:**
- src/hooks/useBrands.ts: Brand listesi
- src/hooks/useCampaigns.ts: Kampanya listesi (brandId ve filter ile)
- src/hooks/usePlatformConnections.ts: Platform bağlantıları
- src/hooks/useMetrics.ts: Metrik listesi
- src/hooks/useUserMetricPreferences.ts: Kullanıcı metrik tercihleri
- Her hook için error handling ve loading state

### [x] 6.2 Supabase Mutations
**Gereksinimler:** 8.3, 10.1, 10.2
**Detaylar:**
- src/hooks/useTogglePlatformConnection.ts: Platform aktif/pasif
- src/hooks/useAddMetricPreference.ts: Metrik ekleme
- src/hooks/useRemoveMetricPreference.ts: Metrik kaldırma
- src/hooks/useReorderMetricPreferences.ts: Metrik sıralama
- Toast notification ile success/error mesajları

### [x] 6.3 Toast Notification System
**Gereksinimler:** 15.1, 15.2
**Detaylar:**
- shadcn/ui Toast component kullan
- src/lib/toast.ts utility dosyası oluştur
- toast.success(), toast.error(), toast.info() fonksiyonları
- 5 saniye otomatik kapanma
- Manuel kapatma butonu

## 7. Animasyonlar ve Geçişler

### [x] 7.1 Framer Motion Variants Tanımlama
**Gereksinimler:** 12.1, 12.2, 12.3, 12.4
**Detaylar:**
- src/lib/animations.ts dosyası oluştur
- pageVariants: initial, animate, exit
- modalVariants: hidden, visible, exit
- dropdownVariants: hidden, visible, exit
- staggerContainer ve staggerItem
- Transition timing: 200ms-300ms

### [x] 7.2 Page Transitions Uygulama
**Gereksinimler:** 12.1
**Detaylar:**
- AnimatePresence component ile route transitions
- Her sayfa component'ine motion.div wrapper
- pageVariants ve pageTransition kullan

### [x] 7.3 Loading States ve Skeleton Screens
**Gereksinimler:** 12.5
**Detaylar:**
- src/components/ui/Skeleton.tsx component oluştur
- CampaignTableSkeleton, PlatformCardSkeleton, MetricCardSkeleton
- Shimmer animasyonu ekle
- React Query isLoading state'inde göster

### [x] 7.4 Prefers-Reduced-Motion Desteği
**Gereksinimler:** 12.6
**Detaylar:**
- CSS media query: @media (prefers-reduced-motion: reduce)
- Framer Motion'da shouldReduceMotion check
- Animasyonları devre dışı bırak veya basitleştir

## 8. Responsive Tasarım

### [x] 8.1 Mobile Sidebar ve Hamburger Menü
**Gereksinimler:** 1.4, 11.2
**Detaylar:**
- Sidebar'ı md breakpoint'te gizle
- Hamburger menü butonu ekle (Header'da)
- Mobile'da sidebar overlay olarak göster
- Backdrop ile kapatma
- Framer Motion slide animasyonu

### [x] 8.2 Responsive Grid ve Table Layouts
**Gereksinimler:** 7.7, 11.3
**Detaylar:**
- Platform kartları: 2 sütun (desktop) → 1 sütun (mobile)
- Kampanya tablosu: horizontal scroll (mobile)
- Metrik kartları: 3 sütun (desktop) → 1 sütun (mobile)
- Tailwind responsive utilities kullan

### [x] 8.3 Touch-Friendly Button Sizes
**Gereksinimler:** 11.5
**Detaylar:**
- Minimum 44x44px buton boyutu
- Padding ve spacing ayarlamaları
- Mobile'da daha büyük touch target'lar

### [x] 8.4 Mobile Search Modal
**Gereksinimler:** 11.6
**Detaylar:**
- Mobile'da arama çubuğunu gizle
- Arama ikonu butonu göster
- Tıklandığında full-screen modal aç
- shadcn/ui Dialog component kullan

## 9. Erişilebilirlik (Accessibility)

### [x] 9.1 Klavye Navigasyonu
**Gereksinimler:** 13.1
**Detaylar:**
- Tüm interaktif elementlerde tabIndex
- Focus trap (modal ve dropdown'larda)
- Escape tuşu ile kapatma
- Enter/Space ile aktivasyon

### [x] 9.2 Focus Indicators
**Gereksinimler:** 13.1
**Detaylar:**
- CSS focus-visible pseudo-class
- Primary renk ile 2px outline
- Focus ring animasyonu
- Tailwind focus utilities

### [x] 9.3 ARIA Labels ve Semantic HTML
**Gereksinimler:** 13.1, 13.3, 13.4
**Detaylar:**
- Button, nav, main, aside, header semantic tag'leri
- aria-label, aria-labelledby, aria-describedby
- role attribute'ları (menu, menuitem, dialog)
- Alt text tüm görsellerde

### [x] 9.4 Color Contrast Check
**Gereksinimler:** 13.3
**Detaylar:**
- WCAG AA standardı: minimum 4.5:1 (normal text), 3:1 (large text)
- Renk paletini contrast checker ile test et
- Gerekirse renkleri ayarla

## 10. Utility Functions ve Helpers

### [x] 10.1 Format Helpers
**Gereksinimler:** 7.2, 8.2, 10.7
**Detaylar:**
- src/utils/formatters.ts dosyası oluştur
- formatCurrency(value, currency)
- formatNumber(value)
- formatPercentage(value)
- formatDate(date)
- formatRelativeTime(date)

### [x] 10.2 Class Name Utilities
**Gereksinimler:** Tüm bileşenler
**Detaylar:**
- src/utils/cn.ts dosyası oluştur
- clsx ve tailwind-merge kullan
- cn(...inputs) fonksiyonu

### [x] 10.3 Debounce ve Throttle
**Gereksinimler:** 3.3, 14.7
**Detaylar:**
- src/utils/performance.ts dosyası oluştur
- debounce<T>(func, wait) generic fonksiyonu
- throttle<T>(func, limit) generic fonksiyonu
- SearchBar'da debounce kullan

## 11. Performans Optimizasyonları

### [x] 11.1 Code Splitting ve Lazy Loading
**Gereksinimler:** 14.2
**Detaylar:**
- React.lazy ile modül component'lerini lazy load et
- Suspense ile loading fallback
- Route-based code splitting

### [x] 11.2 React.memo ve useMemo
**Gereksinimler:** 14.1
**Detaylar:**
- CampaignRow, PlatformCard, MetricCard component'lerini memo ile sar
- Expensive hesaplamalar için useMemo
- Callback fonksiyonlar için useCallback

### [x] 11.3 Image Optimization
**Gereksinimler:** 14.3
**Detaylar:**
- Platform logoları için WebP format
- Lazy loading (loading="lazy")
- Responsive images (srcset)

### [x] 11.4 Bundle Optimization
**Gereksinimler:** 14.4, 14.5
**Detaylar:**
- Build config: manualChunks
- Vendor chunk'ları: react-vendor, ui-vendor, data-vendor
- CSS minification
- Tree shaking

## 12. Testing

### [x] 12.1 Component Unit Tests
**Gereksinimler:** Tüm bileşenler
**Detaylar:**
- Vitest ve React Testing Library kurulumu
- BrandSelector.test.tsx
- NavigationMenu.test.tsx
- CampaignTable.test.tsx
- PlatformCard.test.tsx
- Her test: render, user interaction, assertion

### [x] 12.2 Custom Hook Tests
**Gereksinimler:** 3.1, 3.2, 6.1, 6.2
**Detaylar:**
- @testing-library/react-hooks kullan
- useBrand.test.ts
- usePageTitle.test.ts
- Mock Supabase client

### [x] 12.3 Integration Tests
**Gereksinimler:** 4.1, 5.1, 6.1
**Detaylar:**
- Full page render tests
- User flow tests (brand seçimi → kampanya görüntüleme)
- Mock API responses

## 13. Supabase Database Schema

### [x] 13.1 Database Tables Oluşturma
**Gereksinimler:** 6.3, 7.1, 8.1, 10.2
**Detaylar:**
- Supabase Dashboard'da SQL Editor kullan
- brands, users, user_brand_access tabloları
- platforms, platform_connections tabloları
- campaigns tablosu
- metrics, user_metric_preferences tabloları
- Timestamp fields: created_at, updated_at

### [x] 13.2 Row Level Security (RLS) Policies
**Gereksinimler:** 6.3
**Detaylar:**
- Her tablo için RLS enable et
- SELECT policy: user_brand_access kontrolü
- INSERT/UPDATE/DELETE policies
- auth.uid() fonksiyonu kullan

### [x] 13.3 Database Functions ve Triggers
**Gereksinimler:** 10.3
**Detaylar:**
- update_updated_at_column() trigger function
- Metrik sıralama için position update function

## 14. Environment ve Deployment

### [x] 14.1 Environment Variables Setup
**Gereksinimler:** 6.3
**Detaylar:**
- .env.example dosyası oluştur
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- .gitignore'a .env ekle

### [x] 14.2 Build Configuration
**Gereksinimler:** 14.4, 14.5
**Detaylar:**
- Build config dosyasını optimize et
- Path alias (@/) ekle
- Build output optimize et
- Source maps production'da devre dışı

### [x] 14.3 Deployment Scripts
**Gereksinimler:** 14.1
**Detaylar:**
- package.json scripts: dev, build, preview, type-check, lint
- CI/CD için build script
- Environment-specific builds

## 15. Documentation

### [x] 15.1 Component Documentation
**Gereksinimler:** Tüm bileşenler
**Detaylar:**
- Her component için JSDoc comments
- Props interface documentation
- Usage examples

### [x] 15.2 README ve Setup Guide
**Gereksinimler:** Tüm
**Detaylar:**
- README.md: Proje açıklaması, kurulum, kullanım
- CONTRIBUTING.md: Geliştirme guidelines
- .env.example açıklamaları

## 16. Error Handling ve Monitoring

### [x] 16.1 Error Boundaries
**Gereksinimler:** 15.3
**Detaylar:**
- src/components/ErrorBoundary.tsx oluştur
- Fallback UI component
- Error logging (console.error)
- App.tsx'te ErrorBoundary wrapper

### [x] 16.2 API Error Handling
**Gereksinimler:** 15.1, 15.4
**Detaylar:**
- React Query onError callbacks
- Toast notification ile hata mesajları
- Retry logic (network errors için)
- User-friendly error messages

### [x] 16.3 404 ve Error Pages
**Gereksinimler:** 15.3
**Detaylar:**
- src/pages/NotFound.tsx
- src/pages/ErrorPage.tsx
- Friendly error messages
- "Go back" navigation


## 17. UI Assets ve Icons

### [x] 17.1 Platform Logo SVG Components
**Gereksinimler:** 7.2, 8.2
**Detaylar:**
- src/components/icons/PlatformLogos.tsx dosyası oluştur
- Google Ads logo SVG component (4 renk: #4285F4, #34A853, #FBBC05, #EA4335)
- Meta/Facebook logo SVG component (#1877F2)
- LinkedIn logo SVG component (#0A66C2)
- TikTok logo SVG component (siyah/beyaz)
- Her logo için size prop (default: 24px)
- Dark mode desteği (currentColor kullan)

### [x] 17.2 Custom Scrollbar Styling
**Gereksinimler:** 2.9
**Detaylar:**
- src/styles/scrollbar.css dosyası oluştur
- Webkit scrollbar styling:
  - width: 6px, height: 6px
  - track: transparent
  - thumb: #D1D5DB (light), #4B5563 (dark)
  - border-radius: 3px
- Global CSS'e import et

### [x] 17.3 Badge Components
**Gereksinimler:** 2.6, 7.2, 8.2, 9.2
**Detaylar:**
- src/components/ui/Badge.tsx dosyası oluştur
- Status badge: dot + text (yeşil, sarı, kırmızı variants)
- Notification badge: kırmızı, küçük, rounded-full
- Connection badge: "Connected" yeşil, "Inactive" gri
- Beta badge: gri, disabled görünüm
- Size variants: sm, md, lg

### [x] 17.4 Logo Component
**Gereksinimler:** 2.1
**Detaylar:**
- src/components/ui/Logo.tsx dosyası oluştur
- "A" harfi primary background'da
- "Allanalytics" text
- External link button (open_in_new ikonu)
- Size variants: sm, md, lg
- Dark mode desteği

### [x] 17.5 UserProfile Component
**Gereksinimler:** 2.6
**Detaylar:**
- src/components/navigation/UserProfile.tsx dosyası oluştur
- Avatar image (rounded-full, 40x40px)
- User name ve role
- Border-top ile üstten ayırma
- Dropdown menu (logout, profile, settings)
- Hover efekti

## 18. SaaS Product ve Marketing Site

### [x] 18.1 Product Scope ve Planlama
**Gereksinimler:** Tüm
**Detaylar:**
- MVP ve V1 feature set tanımı
- Persona ve kullanım senaryoları (agency, brand owner, analyst)
- Plan bazlı feature matrix (Free, Pro, Team, Enterprise)
- Information architecture (public site + app)

### [x] 18.2 SaaS Landing Page (Ana Sayfa)
**Gereksinimler:** 2.1, 7.2, 8.2, 9.2
**Detaylar:**
- Hero, feature blocks, social proof, CTA
- Integrations showcase (Google Ads, Meta, TikTok, LinkedIn, Pinterest, Shopify, Yandex, GA4, Search Console, HubSpot)
- Pricing teaser + "Start Free Trial" / "Book Demo" CTA
- Responsive, SEO-friendly section yapısı

### [x] 18.3 Pricing ve Satın Alma Giriş Sayfaları
**Gereksinimler:** 18.1
**Detaylar:**
- /pricing sayfası (aylık/yıllık toggle)
- Plan karşılaştırma tablosu
- Checkout'a yönlenen CTA butonları
- Success / Cancel yönlendirme senaryoları

### [x] 18.4 Public Site Ek Sayfaları
**Gereksinimler:** 18.2
**Detaylar:**
- /features, /integrations, /security, /about sayfaları
- /contact-sales form sayfası
- /privacy, /terms, /cookies yasal sayfaları
- Footer navigation ve legal linkler

## 19. Authentication ve Kullanıcı Erişimi

### [x] 19.1 Auth Altyapısı
**Gereksinimler:** 6.3, 13.1, 13.2
**Detaylar:**
- Supabase Auth yapılandırması
- users/profile tablosu ile auth user senkronu
- Protected route modeli (middleware)
- Session persistence ve refresh token akışı

### [x] 19.2 Giriş / Kayıt / Şifre Akışları
**Gereksinimler:** 19.1
**Detaylar:**
- /login ve /register sayfaları
- /forgot-password ve /reset-password sayfaları
- E-posta doğrulama ve hata senaryoları
- User-friendly form validation mesajları

### [x] 19.3 Logout ve Oturum Yönetimi
**Gereksinimler:** 19.1
**Detaylar:**
- Header ve profile menüsünden logout
- Multi-tab logout sync
- Session timeout handling
- Unauthorized durumda login'e yönlendirme

### [x] 19.4 Rol ve Yetki Modeli (RBAC)
**Gereksinimler:** 13.2
**Detaylar:**
- owner/admin/member/viewer rollerinin net tanımı
- Sayfa bazlı yetki kontrolü
- API bazlı yetki kontrolü
- Yetki yetersizliği UI state'leri (403)

## 20. Billing, Checkout ve Abonelik

### [x] 20.1 Plan ve Ürün Konfigürasyonu
**Gereksinimler:** 18.3
**Detaylar:**
- Stripe product/price setup (monthly/yearly)
- Trial period ve coupon desteği
- Plan limitlerinin ürünle eşleştirilmesi
- Sandbox/prod environment ayrımı

### [x] 20.2 Checkout Akışı
**Gereksinimler:** 20.1
**Detaylar:**
- /checkout sayfası
- Plan seçimi + ödeme adımı
- Başarılı ödeme sonrası onboarding yönlendirmesi
- Başarısız/cancel ödeme senaryoları

### [x] 20.3 Subscription Management
**Gereksinimler:** 20.2
**Detaylar:**
- Billing portal entegrasyonu
- Plan upgrade/downgrade/cancel
- Invoice geçmişi ve fatura görüntüleme
- Abonelik durumu badge'leri

### [x] 20.4 Billing Webhook ve Access Sync
**Gereksinimler:** 20.3
**Detaylar:**
- Webhook endpointleri (checkout, invoice, subscription events)
- Abonelik durumunu DB ile senkronlama
- Feature-gating (plan based access)
- Idempotency ve webhook retry handling

## 21. Çalışmayan Sayfaların Tamamlanması

### [x] 21.1 Navigation Route Gap Analysis
**Gereksinimler:** 4.2
**Detaylar:**
- Sidebar'daki tüm item'ların route kontrolü
- Eksik route listesi çıkarma
- Broken route ve 404 audit raporu
- Route naming standardizasyonu

### [x] 21.2 Eksik Modül Sayfaları
**Gereksinimler:** 21.1
**Detaylar:**
- /tiktok-ads sayfası oluştur ve çalışır hale getir
- /yandex-ads sayfası oluştur ve çalışır hale getir
- /google-ads, /meta-ads, /linkedin-ads, /ga4, /search-console için app route doğrulaması
- Her route için data placeholder yerine gerçek query/mutation bağlantısı

### [x] 21.3 Route ve Menü Senkronizasyonu
**Gereksinimler:** 21.2
**Detaylar:**
- Sidebar menü path'leri ile app router path'lerini birebir eşleştir
- Active state ve page title doğruluğu
- Mobile/desktop navigation parity
- Kırık link regression testleri

## 22. API Katmanı ve Entegrasyonlar

### [x] 22.1 API Architecture (BFF)
**Gereksinimler:** 6.1, 6.2
**Detaylar:**
- Next.js route handlers ile API katmanı tasarımı
- DTO ve schema validation (zod vb.)
- Error envelope standardı
- Request tracing ve request-id propagation

### [x] 22.2 Platform OAuth ve API Entegrasyonları
**Gereksinimler:** 22.1
**Detaylar:**
- Reklam ağları: Google Ads, Meta Ads, TikTok Ads, LinkedIn Ads, Pinterest Ads, Microsoft Ads, Yandex Ads, Snapchat Ads, X Ads, Reddit Ads, Amazon Ads
- Analytics: GA4, Search Console, YouTube Analytics, Mixpanel, Amplitude, Adobe Analytics
- E-ticaret: Shopify, WooCommerce, BigCommerce, Magento, Amazon Seller Central, Etsy
- CRM & Marketing: HubSpot, Salesforce, Pipedrive, Klaviyo, Mailchimp, ActiveCampaign, Brevo
- Data Warehouse & DB: BigQuery, Snowflake, Redshift, Databricks, PostgreSQL
- Destek ve operasyon: Zendesk, Intercom, Freshdesk, Slack
- OAuth2 + API key + service account kimlik doğrulama modları
- Her entegrasyon için scope, refresh token ve credential rotation planı

### [x] 22.3 Data Sync Jobs
**Gereksinimler:** 22.2
**Detaylar:**
- Scheduled sync (hourly/daily)
- Incremental sync ve cursor yönetimi
- Retry + dead-letter stratejisi
- Rate limit handling ve backoff

### [x] 22.4 Dashboard API Endpointleri
**Gereksinimler:** 22.3
**Detaylar:**
- KPI summary endpointleri
- Campaign / channel list endpointleri
- Metrics preference endpointleri
- Filters: date range, brand, platform

### [x] 22.5 API Güvenlik ve Limitler
**Gereksinimler:** 22.1, 13.2
**Detaylar:**
- JWT doğrulama ve tenant isolation
- Rate limiting
- Input sanitization
- Audit log için kritik API event kayıtları

### [x] 22.6 Connector Framework ve Marketplace
**Gereksinimler:** 22.2, 22.3
**Detaylar:**
- Provider-agnostic connector interface (auth, sync, mapping, health)
- Connector lifecycle state'leri: draft, connected, syncing, paused, failed
- Integration marketplace sayfası (/integrations/marketplace)
- "Request integration" akışı ve talep önceliklendirme
- Connector sürümleme ve backward compatibility stratejisi

### [x] 22.7 Data Mapping ve Normalization
**Gereksinimler:** 22.4
**Detaylar:**
- Platform bazlı metric naming farklarını normalize etme
- Currency/timezone normalization
- Cross-platform attribution field mapping
- Schema evolution ve migration stratejisi

### [x] 22.8 Webhook Tabanlı Near Real-Time Entegrasyonlar
**Gereksinimler:** 22.2, 22.3
**Detaylar:**
- Shopify webhook'ları (orders, refunds, products)
- HubSpot / Salesforce event webhook'ları
- Meta/Google conversion event ingestion
- Signature verification, replay protection, dead-letter queue

## 23. Notifications Sistemi

### [x] 23.1 In-App Notifications Merkezi
**Gereksinimler:** 17.3
**Detaylar:**
- Notifications panel/page
- read/unread state
- kategori bazlı filtreleme
- action link'li notification kartları

### [x] 23.2 Notification Preferences
**Gereksinimler:** 23.1
**Detaylar:**
- Kullanıcı bazlı notification ayarları
- E-posta/in-app kanal seçimi
- Threshold bazlı alert ayarları
- Quiet hours/timezone desteği

### [x] 23.3 Notification Delivery Pipeline
**Gereksinimler:** 23.2
**Detaylar:**
- Event-to-notification mapping
- Queue/worker altyapısı
- Template yönetimi
- Delivery logs ve başarısız gönderim retry

## 24. Settings, Profile ve Workspace Yönetimi

### [x] 24.1 User Profile Settings
**Gereksinimler:** 17.5, 19.1
**Detaylar:**
- Profil düzenleme (ad, soyad, avatar)
- E-posta ve parola değişikliği
- Dil, timezone, locale ayarları
- "Delete account" güvenli akışı

### [x] 24.2 Workspace Settings
**Gereksinimler:** 19.4
**Detaylar:**
- Workspace adı, logo, default currency
- Brand/workspace ilişki ayarları
- Data retention ve export ayarları
- Workspace-level permission defaults

### [x] 24.3 Team Management
**Gereksinimler:** 19.4, 24.2
**Detaylar:**
- Davet gönderme / kabul akışı
- Üye rolü düzenleme
- Üye kaldırma ve audit trail
- Pending invite yönetimi

### [x] 24.4 Integration Settings Paneli
**Gereksinimler:** 22.2
**Detaylar:**
- Bağlı hesap listesi
- Reconnect / disconnect işlemleri
- Sync status ve son sync zamanı
- Health check state'leri
- OAuth scope görüntüleme ve yeniden yetkilendirme
- API key/service account credential yenileme
- Connector bazlı sync frequency ayarı
- "Test connection" ve troubleshooting sonuç ekranı

## 25. Support ve Help Center

### [x] 25.1 Support Modülü
**Gereksinimler:** 18.4
**Detaylar:**
- /support sayfası
- Ticket oluşturma formu (kategori, öncelik, açıklama)
- Ticket durum takibi (open, in progress, resolved)
- Kullanıcıya geri bildirim bildirimleri

### [x] 25.2 Knowledge Base
**Gereksinimler:** 25.1
**Detaylar:**
- SSS (FAQ) sayfası
- Aranabilir yardım makaleleri
- Onboarding rehberi
- API/integration troubleshooting dökümanı

## 26. Onboarding ve İlk Kurulum Akışı

### [x] 26.1 İlk Giriş Onboarding Wizard
**Gereksinimler:** 19.2, 22.2
**Detaylar:**
- Brand/workspace oluşturma adımı
- İlk platform bağlantısı adımı
- Varsayılan KPI seçim adımı
- Onboarding completion state kaydı

### [x] 26.2 Demo Data ve Empty States
**Gereksinimler:** 26.1
**Detaylar:**
- Veri yokken açıklayıcı empty states
- Demo data ile ürün keşfi
- "Connect your first channel" CTA
- Onboarding sonrası next-step checklist

## 27. Güvenlik, İzlenebilirlik ve Release

### [x] 27.1 Observability ve Monitoring
**Gereksinimler:** 16.1, 16.2
**Detaylar:**
- Frontend error tracking (Sentry vb.)
- API log aggregation
- Health check endpointleri
- Alerting kuralları

### [x] 27.2 Security Hardening
**Gereksinimler:** 13.2, 22.5
**Detaylar:**
- Secrets yönetimi ve rotasyon
- CSP, security headers
- CSRF/XSS kontrolleri
- Dependency ve vuln scanning

### [x] 27.3 E2E ve Release Checklist
**Gereksinimler:** 12.3, 21.3, 20.4
**Detaylar:**
- Kritik akışlar için E2E testler (signup -> checkout -> dashboard)
- Release smoke test checklist
- Rollback planı
- Staging -> production release prosedürü

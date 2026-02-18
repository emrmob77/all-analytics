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
- Logo section: "G" harfi (primary bg), "Glowytics" başlığı, trademark (™), external link butonu
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

### 5.2 PlatformCard Component Oluşturma
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

### 5.3 IntegrationList Component Oluşturma
**Gereksinimler:** 9.1, 9.2, 9.3, 9.4
**Detaylar:**
- src/components/data-display/IntegrationList.tsx dosyası oluştur
- Liste öğeleri: logo, name, category, action button
- Connection status badge
- Beta badge
- Hover efekti
- "Browse Directory" link

### 5.4 MetricCard Component Oluşturma
**Gereksinimler:** 10.4, 10.7
**Detaylar:**
- src/components/data-display/MetricCard.tsx dosyası oluştur
- Metric name, value, trend (direction + percentage)
- Remove button (X ikonu)
- formatValue utility fonksiyonu kullan
- Trend ikonu ve renk (up: yeşil, down: kırmızı)

### 5.5 MetricSelector Component Oluşturma
**Gereksinimler:** 10.1, 10.5, 10.6
**Detaylar:**
- src/components/data-display/MetricSelector.tsx dosyası oluştur
- Modal veya Drawer component (shadcn/ui Dialog)
- Metrikleri kategorilere göre grupla
- Checkbox ile seçim
- Metric bilgileri: name, description, category, source
- Add/Remove toggle

## 6. API Integration ve Data Fetching

### 6.1 Supabase Queries (React Query Hooks)
**Gereksinimler:** 6.3, 7.1, 8.1, 10.2
**Detaylar:**
- src/hooks/useBrands.ts: Brand listesi
- src/hooks/useCampaigns.ts: Kampanya listesi (brandId ve filter ile)
- src/hooks/usePlatformConnections.ts: Platform bağlantıları
- src/hooks/useMetrics.ts: Metrik listesi
- src/hooks/useUserMetricPreferences.ts: Kullanıcı metrik tercihleri
- Her hook için error handling ve loading state

### 6.2 Supabase Mutations
**Gereksinimler:** 8.3, 10.1, 10.2
**Detaylar:**
- src/hooks/useTogglePlatformConnection.ts: Platform aktif/pasif
- src/hooks/useAddMetricPreference.ts: Metrik ekleme
- src/hooks/useRemoveMetricPreference.ts: Metrik kaldırma
- src/hooks/useReorderMetricPreferences.ts: Metrik sıralama
- Toast notification ile success/error mesajları

### 6.3 Toast Notification System
**Gereksinimler:** 15.1, 15.2
**Detaylar:**
- shadcn/ui Toast component kullan
- src/lib/toast.ts utility dosyası oluştur
- toast.success(), toast.error(), toast.info() fonksiyonları
- 5 saniye otomatik kapanma
- Manuel kapatma butonu

## 7. Animasyonlar ve Geçişler

### 7.1 Framer Motion Variants Tanımlama
**Gereksinimler:** 12.1, 12.2, 12.3, 12.4
**Detaylar:**
- src/lib/animations.ts dosyası oluştur
- pageVariants: initial, animate, exit
- modalVariants: hidden, visible, exit
- dropdownVariants: hidden, visible, exit
- staggerContainer ve staggerItem
- Transition timing: 200ms-300ms

### 7.2 Page Transitions Uygulama
**Gereksinimler:** 12.1
**Detaylar:**
- AnimatePresence component ile route transitions
- Her sayfa component'ine motion.div wrapper
- pageVariants ve pageTransition kullan

### 7.3 Loading States ve Skeleton Screens
**Gereksinimler:** 12.5
**Detaylar:**
- src/components/ui/Skeleton.tsx component oluştur
- CampaignTableSkeleton, PlatformCardSkeleton, MetricCardSkeleton
- Shimmer animasyonu ekle
- React Query isLoading state'inde göster

### 7.4 Prefers-Reduced-Motion Desteği
**Gereksinimler:** 12.6
**Detaylar:**
- CSS media query: @media (prefers-reduced-motion: reduce)
- Framer Motion'da shouldReduceMotion check
- Animasyonları devre dışı bırak veya basitleştir

## 8. Responsive Tasarım

### 8.1 Mobile Sidebar ve Hamburger Menü
**Gereksinimler:** 1.4, 11.2
**Detaylar:**
- Sidebar'ı md breakpoint'te gizle
- Hamburger menü butonu ekle (Header'da)
- Mobile'da sidebar overlay olarak göster
- Backdrop ile kapatma
- Framer Motion slide animasyonu

### 8.2 Responsive Grid ve Table Layouts
**Gereksinimler:** 7.7, 11.3
**Detaylar:**
- Platform kartları: 2 sütun (desktop) → 1 sütun (mobile)
- Kampanya tablosu: horizontal scroll (mobile)
- Metrik kartları: 3 sütun (desktop) → 1 sütun (mobile)
- Tailwind responsive utilities kullan

### 8.3 Touch-Friendly Button Sizes
**Gereksinimler:** 11.5
**Detaylar:**
- Minimum 44x44px buton boyutu
- Padding ve spacing ayarlamaları
- Mobile'da daha büyük touch target'lar

### 8.4 Mobile Search Modal
**Gereksinimler:** 11.6
**Detaylar:**
- Mobile'da arama çubuğunu gizle
- Arama ikonu butonu göster
- Tıklandığında full-screen modal aç
- shadcn/ui Dialog component kullan

## 9. Erişilebilirlik (Accessibility)

### 9.1 Klavye Navigasyonu
**Gereksinimler:** 13.1
**Detaylar:**
- Tüm interaktif elementlerde tabIndex
- Focus trap (modal ve dropdown'larda)
- Escape tuşu ile kapatma
- Enter/Space ile aktivasyon

### 9.2 Focus Indicators
**Gereksinimler:** 13.1
**Detaylar:**
- CSS focus-visible pseudo-class
- Primary renk ile 2px outline
- Focus ring animasyonu
- Tailwind focus utilities

### 9.3 ARIA Labels ve Semantic HTML
**Gereksinimler:** 13.1, 13.3, 13.4
**Detaylar:**
- Button, nav, main, aside, header semantic tag'leri
- aria-label, aria-labelledby, aria-describedby
- role attribute'ları (menu, menuitem, dialog)
- Alt text tüm görsellerde

### 9.4 Color Contrast Check
**Gereksinimler:** 13.3
**Detaylar:**
- WCAG AA standardı: minimum 4.5:1 (normal text), 3:1 (large text)
- Renk paletini contrast checker ile test et
- Gerekirse renkleri ayarla

## 10. Utility Functions ve Helpers

### 10.1 Format Helpers
**Gereksinimler:** 7.2, 8.2, 10.7
**Detaylar:**
- src/utils/formatters.ts dosyası oluştur
- formatCurrency(value, currency)
- formatNumber(value)
- formatPercentage(value)
- formatDate(date)
- formatRelativeTime(date)

### 10.2 Class Name Utilities
**Gereksinimler:** Tüm bileşenler
**Detaylar:**
- src/utils/cn.ts dosyası oluştur
- clsx ve tailwind-merge kullan
- cn(...inputs) fonksiyonu

### 10.3 Debounce ve Throttle
**Gereksinimler:** 3.3, 14.7
**Detaylar:**
- src/utils/performance.ts dosyası oluştur
- debounce<T>(func, wait) generic fonksiyonu
- throttle<T>(func, limit) generic fonksiyonu
- SearchBar'da debounce kullan

## 11. Performans Optimizasyonları

### 11.1 Code Splitting ve Lazy Loading
**Gereksinimler:** 14.2
**Detaylar:**
- React.lazy ile modül component'lerini lazy load et
- Suspense ile loading fallback
- Route-based code splitting

### 11.2 React.memo ve useMemo
**Gereksinimler:** 14.1
**Detaylar:**
- CampaignRow, PlatformCard, MetricCard component'lerini memo ile sar
- Expensive hesaplamalar için useMemo
- Callback fonksiyonlar için useCallback

### 11.3 Image Optimization
**Gereksinimler:** 14.3
**Detaylar:**
- Platform logoları için WebP format
- Lazy loading (loading="lazy")
- Responsive images (srcset)

### 11.4 Bundle Optimization
**Gereksinimler:** 14.4, 14.5
**Detaylar:**
- Build config: manualChunks
- Vendor chunk'ları: react-vendor, ui-vendor, data-vendor
- CSS minification
- Tree shaking

## 12. Testing

### 12.1 Component Unit Tests
**Gereksinimler:** Tüm bileşenler
**Detaylar:**
- Vitest ve React Testing Library kurulumu
- BrandSelector.test.tsx
- NavigationMenu.test.tsx
- CampaignTable.test.tsx
- PlatformCard.test.tsx
- Her test: render, user interaction, assertion

### 12.2 Custom Hook Tests
**Gereksinimler:** 3.1, 3.2, 6.1, 6.2
**Detaylar:**
- @testing-library/react-hooks kullan
- useBrand.test.ts
- usePageTitle.test.ts
- Mock Supabase client

### 12.3 Integration Tests
**Gereksinimler:** 4.1, 5.1, 6.1
**Detaylar:**
- Full page render tests
- User flow tests (brand seçimi → kampanya görüntüleme)
- Mock API responses

## 13. Supabase Database Schema

### 13.1 Database Tables Oluşturma
**Gereksinimler:** 6.3, 7.1, 8.1, 10.2
**Detaylar:**
- Supabase Dashboard'da SQL Editor kullan
- brands, users, user_brand_access tabloları
- platforms, platform_connections tabloları
- campaigns tablosu
- metrics, user_metric_preferences tabloları
- Timestamp fields: created_at, updated_at

### 13.2 Row Level Security (RLS) Policies
**Gereksinimler:** 6.3
**Detaylar:**
- Her tablo için RLS enable et
- SELECT policy: user_brand_access kontrolü
- INSERT/UPDATE/DELETE policies
- auth.uid() fonksiyonu kullan

### 13.3 Database Functions ve Triggers
**Gereksinimler:** 10.3
**Detaylar:**
- update_updated_at_column() trigger function
- Metrik sıralama için position update function

## 14. Environment ve Deployment

### 14.1 Environment Variables Setup
**Gereksinimler:** 6.3
**Detaylar:**
- .env.example dosyası oluştur
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- .gitignore'a .env ekle

### 14.2 Build Configuration
**Gereksinimler:** 14.4, 14.5
**Detaylar:**
- Build config dosyasını optimize et
- Path alias (@/) ekle
- Build output optimize et
- Source maps production'da devre dışı

### 14.3 Deployment Scripts
**Gereksinimler:** 14.1
**Detaylar:**
- package.json scripts: dev, build, preview, type-check, lint
- CI/CD için build script
- Environment-specific builds

## 15. Documentation

### 15.1 Component Documentation
**Gereksinimler:** Tüm bileşenler
**Detaylar:**
- Her component için JSDoc comments
- Props interface documentation
- Usage examples

### 15.2 README ve Setup Guide
**Gereksinimler:** Tüm
**Detaylar:**
- README.md: Proje açıklaması, kurulum, kullanım
- CONTRIBUTING.md: Geliştirme guidelines
- .env.example açıklamaları

## 16. Error Handling ve Monitoring

### 16.1 Error Boundaries
**Gereksinimler:** 15.3
**Detaylar:**
- src/components/ErrorBoundary.tsx oluştur
- Fallback UI component
- Error logging (console.error)
- App.tsx'te ErrorBoundary wrapper

### 16.2 API Error Handling
**Gereksinimler:** 15.1, 15.4
**Detaylar:**
- React Query onError callbacks
- Toast notification ile hata mesajları
- Retry logic (network errors için)
- User-friendly error messages

### 16.3 404 ve Error Pages
**Gereksinimler:** 15.3
**Detaylar:**
- src/pages/NotFound.tsx
- src/pages/ErrorPage.tsx
- Friendly error messages
- "Go back" navigation


## 17. UI Assets ve Icons

### 17.1 Platform Logo SVG Components
**Gereksinimler:** 7.2, 8.2
**Detaylar:**
- src/components/icons/PlatformLogos.tsx dosyası oluştur
- Google Ads logo SVG component (4 renk: #4285F4, #34A853, #FBBC05, #EA4335)
- Meta/Facebook logo SVG component (#1877F2)
- LinkedIn logo SVG component (#0A66C2)
- TikTok logo SVG component (siyah/beyaz)
- Her logo için size prop (default: 24px)
- Dark mode desteği (currentColor kullan)

### 17.2 Custom Scrollbar Styling
**Gereksinimler:** 2.9
**Detaylar:**
- src/styles/scrollbar.css dosyası oluştur
- Webkit scrollbar styling:
  - width: 6px, height: 6px
  - track: transparent
  - thumb: #D1D5DB (light), #4B5563 (dark)
  - border-radius: 3px
- Global CSS'e import et

### 17.3 Badge Components
**Gereksinimler:** 2.6, 7.2, 8.2, 9.2
**Detaylar:**
- src/components/ui/Badge.tsx dosyası oluştur
- Status badge: dot + text (yeşil, sarı, kırmızı variants)
- Notification badge: kırmızı, küçük, rounded-full
- Connection badge: "Connected" yeşil, "Inactive" gri
- Beta badge: gri, disabled görünüm
- Size variants: sm, md, lg

### 17.4 Logo Component
**Gereksinimler:** 2.1
**Detaylar:**
- src/components/ui/Logo.tsx dosyası oluştur
- "G" harfi primary background'da
- "Glowytics" text + trademark (™)
- External link button (open_in_new ikonu)
- Size variants: sm, md, lg
- Dark mode desteği

### 17.5 UserProfile Component
**Gereksinimler:** 2.6
**Detaylar:**
- src/components/navigation/UserProfile.tsx dosyası oluştur
- Avatar image (rounded-full, 40x40px)
- User name ve role
- Border-top ile üstten ayırma
- Dropdown menu (logout, profile, settings)
- Hover efekti

# Component Documentation

Bu dokuman, projedeki ana UI componentleri icin props ve kullanim orneklerini listeler.

## Layout

### `Layout`

Uygulama shell'i (sidebar + header + main content).

Props:
- `children: ReactNode`

Usage:

```tsx
import Layout from "@/components/layout/Layout";

<Layout>
  <div>Dashboard content</div>
</Layout>;
```

### `Header`

Ust bar: sayfa basligi, arama, tema ve mobil menu.

Props:
- `onMenuClick: () => void`

Usage:

```tsx
<Header onMenuClick={() => setSidebarOpen(true)} />
```

### `Sidebar`

Desktop/mobil responsive sidebar.

Props:
- `isOpen: boolean`
- `onClose: () => void`

Usage:

```tsx
<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
```

## Navigation

### `BrandSelector`

Aktif brand secimi icin dropdown.

Props:
- `brand: Brand`
- `brands: Brand[]`
- `onSelectBrand: (brand: Brand) => void`

### `NavigationMenu`

Section bazli acilir/kapanir menu listesi.

Props:
- `sections: NavigationSection[]`
- `activePath: string`
- `onItemClick?: () => void`
- `collapsed?: boolean`

### `UserProfile`

Sidebar altinda avatar + rol + dropdown menu.

Props:
- `name: string`
- `role: string`
- `avatarUrl: string`
- `collapsed?: boolean`
- `onToggleCollapse?: () => void`
- `onProfileClick?: () => void`
- `onSettingsClick?: () => void`
- `onLogout?: () => void`

Usage:

```tsx
<UserProfile
  avatarUrl="https://images.unsplash.com/..."
  name="Esra Bayatli"
  role="Super Admin"
  onLogout={() => console.log("logout")}
/>
```

## UI

### `Logo`

Allanalytics logo + wordmark + external link action.

Props:
- `size?: "sm" | "md" | "lg"`
- `showText?: boolean`
- `showExternalLink?: boolean`
- `websiteUrl?: string`
- `className?: string`

Usage:

```tsx
<Logo size="md" />
<Logo showText={false} showExternalLink={false} />
```

### `Badge`

Status, notification, connection, beta tipleri icin ortak badge.

Props:
- `variant?: "status" | "notification" | "connection" | "beta"`
- `size?: "sm" | "md" | "lg"`
- `statusTone?: "green" | "yellow" | "red"`
- `connectionState?: "connected" | "inactive"`
- `showDot?: boolean`

Usage:

```tsx
<Badge variant="status" statusTone="green">Active</Badge>
<Badge variant="notification" size="sm">5</Badge>
<Badge variant="connection" connectionState="inactive" />
<Badge variant="beta" />
```

### `PlatformLogo`

Platform logo SVG renderer.

Props:
- `name: "google-ads" | "facebook" | "ga4" | "tiktok" | "search-console" | "linkedin" | "yandex-ads"`
- `size?: number`
- `className?: string`

Usage:

```tsx
import { PlatformLogo } from "@/components/icons/PlatformLogos";

<PlatformLogo name="google-ads" size={20} />
```

### `SearchBar`

Debounced desktop + mobile search.

Props:
- `onSearch?: (query: string) => void`
- `debounceMs?: number`

## Data Display

### `CampaignTable`

Kampanya listesi, status badge ve budget gorunumu.

### `PlatformCard`

Kanal baglanti kartlari ve spend limit progress.

### `MetricCard`

Tek KPI karti (value + trend).

Props:
- `metricName: string`
- `value: number`
- `valueStyle?: "number" | "currency" | "percent"`
- `trendDirection: "up" | "down"`
- `trendPercentage: number`
- `onRemove?: () => void`

### `MetricSelector`

Dialog uzerinden metric secim arayuzu.

### `IntegrationList`

Entegrasyon dizini + connect/beta/connected durumlari.

## Error Handling

### `ErrorBoundary`

Runtime render hatalarini yakalar ve fallback UI gosterir.

Usage:

```tsx
<ErrorBoundary>
  <Layout>{children}</Layout>
</ErrorBoundary>
```

### `NotFound` ve `ErrorPage`

- `src/pages/NotFound.tsx`: 404 icin kullanilir.
- `src/pages/ErrorPage.tsx`: route hata senaryolari icin kullanilir.

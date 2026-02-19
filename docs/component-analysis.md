# Task 0: Prototype Analizi ve Component Yapisi

## 1. Prototype'daki Mevcut Yapilar

### 1.1 Custom Hooks
| Hook | Aciklama | shadcn/ui Karsiligi |
|------|----------|---------------------|
| `useWindowSize()` | Responsive breakpoints (isMobile, isDesktop) | Olusturuldu: `src/hooks/use-window-size.ts` |

### 1.2 Utility Components
| Component | Aciklama | shadcn/ui Karsiligi |
|-----------|----------|---------------------|
| `AnimNum` | Animated number display with easing | Custom component gerekli |
| `StatCard` | Metric card with value, change indicator | Card + custom content |

### 1.3 Layout Components
| Component | Aciklama | shadcn/ui Karsiligi |
|-----------|----------|---------------------|
| `SidebarContent` | Logo, account, nav, platforms, user | Sheet (mobile) + custom sidebar |
| `MainLayout` | Flex container with sidebar + content | Custom layout |

### 1.4 Dashboard Components
| Component | Aciklama | shadcn/ui Karsiligi |
|-----------|----------|---------------------|
| Header | Title, date range, actions | Custom with Button |
| PlatformTabs | Platform filter chips | Custom chips veya Tabs |
| MetricCards | 6 adet StatCard | Card grid |
| PerformanceChart | Area chart (Recharts) | Recharts wrapper |
| HourlyCTRChart | Bar chart (Recharts) | Recharts wrapper |
| PlatformSummary | Platform breakdown cards | Card grid |
| CampaignTable | Sortable campaign table | Table + sorting |

## 2. Constants ve Config

### 2.1 PLATFORMS Config
```typescript
// src/types/index.ts'de tanimli
export const PLATFORMS: PlatformConfig[] = [
  { id: 'google', label: 'Google Ads', color: '#1A73E8', bgColor: '#EAF1FB' },
  { id: 'meta', label: 'Meta Ads', color: '#0866FF', bgColor: '#EBF3FF' },
  { id: 'tiktok', label: 'TikTok Ads', color: '#161823', bgColor: '#F5F5F5' },
  { id: 'pinterest', label: 'Pinterest', color: '#E60023', bgColor: '#FFF0F1' },
];
```

### 2.2 Status Styles
```typescript
// src/types/index.ts'e eklenecek
export const STATUS_STYLES: Record<CampaignStatus, StatusStyle> = {
  active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  deleted: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};
```

### 2.3 Navigation Items
```typescript
// src/config/navigation.ts
export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard' },
  { id: 'campaigns', label: 'Campaigns', href: '/campaigns', badge: true },
  { id: 'reports', label: 'Reports', href: '/reports' },
  { id: 'settings', label: 'Settings', href: '/settings' },
];
```

## 3. Component Hiyerarsisi

```
src/components/
├── ui/                          # shadcn/ui (mevcut)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── sonner.tsx
│   ├── table.tsx
│   └── tabs.tsx
│
├── layout/                      # Layout components
│   ├── sidebar.tsx              # Desktop sidebar
│   ├── mobile-nav.tsx           # Mobile navigation (Sheet)
│   ├── header.tsx               # Top header
│   ├── app-shell.tsx            # Main app wrapper
│   └── user-menu.tsx            # User dropdown
│
├── dashboard/                   # Dashboard components (mevcut)
│   ├── dashboard-header.tsx     ✅
│   ├── metric-cards.tsx         ✅
│   ├── performance-chart.tsx    ✅ (placeholder)
│   ├── platform-summary.tsx     ✅
│   ├── campaign-table.tsx       ✅
│   └── index.ts                 ✅
│
├── charts/                      # Chart components
│   ├── area-chart.tsx           # Recharts Area wrapper
│   ├── bar-chart.tsx            # Recharts Bar wrapper
│   └── chart-container.tsx      # Common chart wrapper
│
├── shared/                      # Shared/reusable
│   ├── animated-number.tsx      # AnimNum component
│   ├── platform-badge.tsx       # Platform indicator
│   ├── status-badge.tsx         # Campaign status badge
│   ├── date-range-picker.tsx    # Date range selector
│   ├── platform-filter.tsx      # Platform chips filter
│   └── loading-skeleton.tsx     # Loading states
│
└── icons/                       # Platform icons
    ├── google-icon.tsx
    ├── meta-icon.tsx
    ├── tiktok-icon.tsx
    └── pinterest-icon.tsx
```

## 4. Olusturulacak Components (Oncelik Sirasi)

### Yuksek Oncelik (Task 11)
1. **AnimatedNumber** - Animasyonlu sayi gosterimi
2. **DateRangePicker** - Tarih araligi secici
3. **PlatformFilter** - Platform filtreleme chips
4. **ChartContainer** - Recharts wrapper

### Orta Oncelik (Task 12)
5. **AppShell** - Layout wrapper
6. **Sidebar** - Desktop navigation
7. **MobileNav** - Mobile drawer

### Dusuk Oncelik (Gerektiginde)
8. **PlatformIcon** - SVG icon components
9. **LoadingSkeleton** - Loading states

## 5. shadcn/ui Component Mapping

| Prototype Element | shadcn/ui Component | Notes |
|-------------------|---------------------|-------|
| Stat card container | `Card`, `CardContent` | ✅ Mevcut |
| Buttons | `Button` | ✅ Mevcut |
| Data table | `Table`, `TableHeader`, `TableBody`, etc. | ✅ Mevcut |
| Dropdown menus | `DropdownMenu` | ✅ Mevcut |
| Dialogs/modals | `Dialog` | ✅ Mevcut |
| Tabs | `Tabs` | ✅ Mevcut |
| Toast notifications | `Sonner` | ✅ Mevcut |
| Form inputs | `Input` | ✅ Mevcut |
| Mobile drawer | `Sheet` | Eklenecek |
| Date picker | `Calendar`, `Popover` | Eklenecek |
| Select/Combobox | `Select` | Eklenecek |
| Checkbox | `Checkbox` | Eklenecek (bulk actions) |
| Badge | `Badge` | Eklenecek |
| Avatar | `Avatar` | Eklenecek |
| Separator | `Separator` | Eklenecek |
| Scroll Area | `ScrollArea` | Eklenecek |

## 6. Eksik shadcn/ui Components

Yuklenmesi gereken:
```bash
npx shadcn@latest add sheet calendar popover select checkbox badge avatar separator scroll-area
```

## 7. Sonraki Adimlar

1. ✅ Task 0 tamamlandi - Bu dokuman
2. [ ] Eksik shadcn/ui componentlerini yukle
3. [ ] Task 1.2 - Supabase entegrasyonu
4. [ ] Task 2 - Database schema
5. [ ] Task 3.2 - Utility functions
6. [ ] Task 11 - Reusable UI components (AnimatedNumber, DateRangePicker, etc.)

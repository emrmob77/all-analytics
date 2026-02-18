# Tasarım Dokümanı

## Genel Bakış

Allanalytics UI tasarımı, modern web teknolojileri kullanarak çoklu reklam platformlarının metriklerini tek bir arayüzde toplayan bir marketing intelligence platformunun kullanıcı arayüzünü oluşturur. Bu tasarım, Next.js (App Router) tabanlı bir web uygulaması olarak geliştirilecek ve Tailwind CSS, shadcn/ui ve Framer Motion kullanarak modern, responsive ve erişilebilir bir kullanıcı deneyimi sunacaktır.

### Temel Prensipler

1. **Modüler Mimari**: Her UI bileşeni bağımsız, yeniden kullanılabilir ve test edilebilir olmalıdır
2. **Responsive Design**: Tüm ekran boyutlarında (mobil, tablet, desktop) optimal deneyim sunulmalıdır
3. **Erişilebilirlik**: WCAG AA standartlarına uygun, klavye navigasyonu ve ekran okuyucu desteği sağlanmalıdır
4. **Performans**: Lazy loading, code splitting ve optimizasyon teknikleri kullanılmalıdır
5. **Tema Desteği**: Dark ve light mode arasında sorunsuz geçiş sağlanmalıdır
6. **Tutarlılık**: Tüm bileşenlerde tutarlı tasarım dili ve kullanıcı deneyimi sunulmalıdır

### Teknoloji Stack

- **Frontend Framework**: Next.js 15+ (React 19, TypeScript)
- **Styling**: Tailwind CSS 3+
- **Component Library**: shadcn/ui
- **Animation**: Framer Motion
- **State Management**: React Context API + Zustand
- **Routing**: Next.js App Router (file-based routing)
- **Form Management**: React Hook Form + Zod
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)

## Mimari

### Bileşen Hiyerarşisi

```
App
├── ThemeProvider (Dark/Light mode yönetimi)
├── AuthProvider (Kullanıcı kimlik doğrulama)
├── BrandProvider (Multi-brand context)
└── Layout
    ├── Sidebar
    │   ├── BrandSelector
    │   ├── NavigationMenu
    │   │   ├── AnalyticsSection
    │   │   ├── ConfigurationSection
    │   │   └── SystemSection
    │   └── UserProfile
    ├── Header
    │   ├── PageTitle
    │   ├── SearchBar
    │   └── QuickActions
    └── MainContent
        └── [Dynamic Module Content]
            ├── OverviewDashboard
            ├── GoogleAdsModule
            ├── MetaAdsModule
            ├── GA4Module
            ├── GrowthIntelligence
            ├── MarketInsights
            ├── CommerceCenter
            ├── SearchConsole
            ├── GlowyAI
            ├── TaskBoard
            ├── CustomReport
            └── Settings
```

### Veri Akışı

```
User Action → Component Event Handler → State Update (Context/Zustand)
                                              ↓
                                    Supabase API Call (React Query)
                                              ↓
                                    Cache Update + UI Re-render
```



## Bileşenler ve Arayüzler

### 1. Layout Bileşenleri

#### Layout Component
Ana layout bileşeni, tüm sayfaların temel yapısını oluşturur.

```typescript
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
```

#### Sidebar Component
Sol navigasyon menüsü.

```typescript
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeBrand } = useBrand();
  const location = useLocation();
  
  const sections: NavigationSection[] = [
    {
      title: "Analytics",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/" },
        { id: "performance", label: "Performance", icon: "insights", path: "/performance" },
        { id: "campaigns", label: "Campaigns", icon: "campaign", path: "/campaigns" },
        { id: "channels", label: "Channels", icon: "hub", path: "/channels" }
      ]
    },
    // ... diğer sections
  ];
  
  return (
    <aside className={cn(
      "w-64 bg-surface-light dark:bg-surface-dark border-r",
      "hidden md:flex flex-col",
      isOpen && "flex"
    )}>
      <BrandSelector brand={activeBrand} />
      <NavigationMenu sections={sections} activePath={location.pathname} />
      <UserProfile />
    </aside>
  );
};
```

#### Header Component
Üst başlık bileşeni.

```typescript
interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { pageTitle } = usePageTitle();
  
  return (
    <header className="h-20 px-8 flex items-center justify-between border-b">
      <h1 className="text-2xl font-bold">{pageTitle}</h1>
      <div className="flex items-center gap-4">
        <SearchBar />
        <QuickActions />
        <button className="md:hidden" onClick={onMenuClick}>
          <MenuIcon />
        </button>
      </div>
    </header>
  );
};
```

### 2. Navigasyon Bileşenleri

#### BrandSelector Component
Marka seçici dropdown.

```typescript
interface Brand {
  id: string;
  name: string;
  logo?: string;
  activeAdmins: number;
}

interface BrandSelectorProps {
  brand: Brand;
}

const BrandSelector: React.FC<BrandSelectorProps> = ({ brand }) => {
  const { brands, selectBrand } = useBrand();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-background-light dark:bg-background-dark p-3 rounded-lg"
      >
        <div className="flex items-center gap-3">
          <Avatar brand={brand} />
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold">{brand.name}</div>
            <div className="text-xs text-muted">{brand.activeAdmins} admins active</div>
          </div>
          <ChevronDownIcon />
        </div>
      </button>
      {isOpen && (
        <BrandDropdown
          brands={brands}
          onSelect={(b) => {
            selectBrand(b);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
};
```

#### NavigationMenu Component
Kategorize edilmiş navigasyon menüsü.

```typescript
interface NavigationMenuProps {
  sections: NavigationSection[];
  activePath: string;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ sections, activePath }) => {
  return (
    <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="text-xs font-semibold text-muted uppercase mb-2 px-2">
            {section.title}
          </div>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                isActive={activePath === item.path}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};
```

### 3. Veri Görselleştirme Bileşenleri

#### CampaignTable Component
Kampanya listesi tablosu.

```typescript
interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  status: 'active' | 'paused' | 'stopped';
  budgetUsed: number;
  budgetLimit: number;
  roas: number;
  roasTrend: 'up' | 'down' | 'flat';
}

interface CampaignTableProps {
  campaigns: Campaign[];
  onFilterChange: (filter: CampaignFilter) => void;
  onNewCampaign: () => void;
}

const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  onFilterChange,
  onNewCampaign
}) => {
  return (
    <section>
      <TableHeader
        title="Active Campaigns"
        onFilterChange={onFilterChange}
        onNewCampaign={onNewCampaign}
      />
      <div className="bg-surface rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th>Campaign Name</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Budget Used</th>
              <th>ROAS</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
```

#### PlatformCard Component
Platform entegrasyon kartı.

```typescript
interface PlatformConnection {
  id: string;
  platform: Platform;
  isConnected: boolean;
  isActive: boolean;
  spend: number;
  limit: number;
}

interface PlatformCardProps {
  connection: PlatformConnection;
  onToggle: (id: string, active: boolean) => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({ connection, onToggle }) => {
  const percentage = (connection.spend / connection.limit) * 100;
  const progressColor = percentage > 90 ? 'red' : percentage > 70 ? 'yellow' : 'green';
  
  return (
    <div className="bg-surface p-5 rounded-xl border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <PlatformLogo platform={connection.platform} />
          <div>
            <h3 className="font-semibold text-sm">{connection.platform.name}</h3>
            <ConnectionStatus isConnected={connection.isConnected} />
          </div>
        </div>
        <Toggle
          checked={connection.isActive}
          onChange={(active) => onToggle(connection.id, active)}
        />
      </div>
      <div className="space-y-3">
        <MetricRow label="Spend" value={`$${connection.spend.toLocaleString()}`} />
        <MetricRow label="Limit" value={`$${connection.limit.toLocaleString()}`} />
        <ProgressBar percentage={percentage} color={progressColor} />
      </div>
    </div>
  );
};
```



### 4. Tema ve Stil Bileşenleri

#### ThemeProvider Component
Dark/Light mode yönetimi.

```typescript
type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as Theme) || 'light';
  });
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 5. Özelleştirilebilir Metrik Bileşenleri

#### MetricSelector Component
Kullanıcının dashboard'a ekleyebileceği metrikleri seçmesini sağlar.

```typescript
interface Metric {
  id: string;
  name: string;
  description: string;
  category: string;
  source: string;
  type: 'number' | 'percentage' | 'currency' | 'chart';
}

interface MetricSelectorProps {
  availableMetrics: Metric[];
  selectedMetrics: string[];
  onSelect: (metricId: string) => void;
  onDeselect: (metricId: string) => void;
}

const MetricSelector: React.FC<MetricSelectorProps> = ({
  availableMetrics,
  selectedMetrics,
  onSelect,
  onDeselect
}) => {
  const groupedMetrics = groupBy(availableMetrics, 'category');
  
  return (
    <div className="space-y-4">
      {Object.entries(groupedMetrics).map(([category, metrics]) => (
        <div key={category}>
          <h3 className="font-semibold mb-2">{category}</h3>
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric) => (
              <MetricOption
                key={metric.id}
                metric={metric}
                isSelected={selectedMetrics.includes(metric.id)}
                onToggle={() => {
                  if (selectedMetrics.includes(metric.id)) {
                    onDeselect(metric.id);
                  } else {
                    onSelect(metric.id);
                  }
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### MetricCard Component
Dashboard'da metrik görselleştirmesi.

```typescript
interface MetricCardProps {
  metric: Metric;
  value: number | string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
  };
  onRemove?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, value, trend, onRemove }) => {
  return (
    <div className="bg-surface p-4 rounded-xl border">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm text-muted">{metric.name}</h4>
          <p className="text-2xl font-bold mt-1">{formatValue(value, metric.type)}</p>
        </div>
        {onRemove && (
          <button onClick={onRemove} className="text-muted hover:text-primary">
            <CloseIcon />
          </button>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-sm">
          <TrendIcon direction={trend.direction} />
          <span className={cn(
            trend.direction === 'up' && 'text-green-600',
            trend.direction === 'down' && 'text-red-600'
          )}>
            {trend.percentage}%
          </span>
        </div>
      )}
    </div>
  );
};
```

### 6. Form ve Input Bileşenleri

#### SearchBar Component
Global arama çubuğu.

```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Search...", 
  onSearch 
}) => {
  const [query, setQuery] = useState('');
  const debouncedSearch = useDebouncedCallback(onSearch, 300);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };
  
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-10 pr-16 py-2 rounded-lg border focus:ring-2 focus:ring-primary"
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2">⌘K</kbd>
    </div>
  );
};
```

## Veri Modelleri

### User Model
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'super_admin' | 'admin' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}
```

### Brand Model
```typescript
interface Brand {
  id: string;
  name: string;
  logo?: string;
  ownerId: string;
  activeAdmins: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### UserBrandAccess Model
```typescript
interface UserBrandAccess {
  userId: string;
  brandId: string;
  role: 'owner' | 'admin' | 'viewer';
  grantedAt: Date;
}
```

### Platform Model
```typescript
interface Platform {
  id: string;
  name: string;
  slug: string;
  logo: string;
  category: 'advertising' | 'analytics' | 'ecommerce' | 'other';
  apiEndpoint?: string;
}
```

### PlatformConnection Model
```typescript
interface PlatformConnection {
  id: string;
  brandId: string;
  platformId: string;
  isConnected: boolean;
  isActive: boolean;
  credentials: Record<string, any>; // Encrypted
  spend: number;
  limit: number;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Campaign Model
```typescript
interface Campaign {
  id: string;
  brandId: string;
  platformConnectionId: string;
  externalId: string; // Platform'daki kampanya ID'si
  name: string;
  status: 'active' | 'paused' | 'stopped';
  budgetUsed: number;
  budgetLimit: number;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Metric Model
```typescript
interface Metric {
  id: string;
  name: string;
  description: string;
  category: string;
  source: string;
  type: 'number' | 'percentage' | 'currency' | 'chart';
  formula?: string;
  isCustom: boolean;
  createdBy?: string;
  createdAt: Date;
}
```

### UserMetricPreference Model
```typescript
interface UserMetricPreference {
  userId: string;
  brandId: string;
  metricId: string;
  position: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### NavigationState Model
```typescript
interface NavigationState {
  activePath: string;
  pageTitle: string;
  breadcrumbs: Breadcrumb[];
}

interface Breadcrumb {
  label: string;
  path: string;
}
```

### ThemeState Model
```typescript
interface ThemeState {
  theme: 'light' | 'dark';
  systemPreference: 'light' | 'dark';
  useSystemPreference: boolean;
}
```



## Routing Yapısı

### Route Tanımları

```text
src/app/page.tsx                        -> /
src/app/google-ads/page.tsx             -> /google-ads
src/app/meta-ads/page.tsx               -> /meta-ads
src/app/ga4/page.tsx                    -> /ga4
src/app/growth-intelligence/page.tsx    -> /growth-intelligence
src/app/market-insights/page.tsx        -> /market-insights
src/app/commerce-center/page.tsx        -> /commerce-center
src/app/search-console/page.tsx         -> /search-console
src/app/glowy-ai/page.tsx               -> /glowy-ai
src/app/task-board/page.tsx             -> /task-board
src/app/custom-report/page.tsx          -> /custom-report
src/app/settings/page.tsx               -> /settings
```

## State Management

### Context Providers

#### BrandContext
```typescript
interface BrandContextValue {
  brands: Brand[];
  activeBrand: Brand | null;
  selectBrand: (brand: Brand) => void;
  isLoading: boolean;
}

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Load brands from Supabase
    loadBrands();
  }, []);
  
  const selectBrand = (brand: Brand) => {
    setActiveBrand(brand);
    sessionStorage.setItem('activeBrandId', brand.id);
  };
  
  return (
    <BrandContext.Provider value={{ brands, activeBrand, selectBrand, isLoading }}>
      {children}
    </BrandContext.Provider>
  );
};
```

### Zustand Store

```typescript
interface AppStore {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Metric Preferences
  selectedMetrics: string[];
  addMetric: (metricId: string) => void;
  removeMetric: (metricId: string) => void;
  reorderMetrics: (metricIds: string[]) => void;
  
  // Filters
  campaignFilter: CampaignFilter;
  setCampaignFilter: (filter: CampaignFilter) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  selectedMetrics: [],
  addMetric: (metricId) => set((state) => ({
    selectedMetrics: [...state.selectedMetrics, metricId]
  })),
  removeMetric: (metricId) => set((state) => ({
    selectedMetrics: state.selectedMetrics.filter(id => id !== metricId)
  })),
  reorderMetrics: (metricIds) => set({ selectedMetrics: metricIds }),
  
  campaignFilter: { status: 'all' },
  setCampaignFilter: (filter) => set({ campaignFilter: filter }),
}));
```

## API Integration

### Supabase Client Setup

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### React Query Hooks

```typescript
// Brands
export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Brand[];
    }
  });
};

// Campaigns
export const useCampaigns = (brandId: string, filter?: CampaignFilter) => {
  return useQuery({
    queryKey: ['campaigns', brandId, filter],
    queryFn: async () => {
      let query = supabase
        .from('campaigns')
        .select('*, platform:platforms(*)')
        .eq('brand_id', brandId);
      
      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!brandId
  });
};

// Platform Connections
export const usePlatformConnections = (brandId: string) => {
  return useQuery({
    queryKey: ['platform-connections', brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_connections')
        .select('*, platform:platforms(*)')
        .eq('brand_id', brandId);
      
      if (error) throw error;
      return data as PlatformConnection[];
    },
    enabled: !!brandId
  });
};

// Metrics
export const useMetrics = () => {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Metric[];
    }
  });
};

// User Metric Preferences
export const useUserMetricPreferences = (userId: string, brandId: string) => {
  return useQuery({
    queryKey: ['user-metric-preferences', userId, brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_metric_preferences')
        .select('*, metric:metrics(*)')
        .eq('user_id', userId)
        .eq('brand_id', brandId)
        .eq('is_visible', true)
        .order('position');
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!brandId
  });
};
```

### Mutations

```typescript
// Toggle Platform Connection
export const useTogglePlatformConnection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('platform_connections')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-connections'] });
      toast.success(`Platform ${data.is_active ? 'activated' : 'deactivated'}`);
    },
    onError: (error) => {
      toast.error('Failed to update platform connection');
      console.error(error);
    }
  });
};

// Add Metric Preference
export const useAddMetricPreference = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (preference: Omit<UserMetricPreference, 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('user_metric_preferences')
        .insert(preference)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-metric-preferences'] });
      toast.success('Metric added to dashboard');
    }
  });
};

// Remove Metric Preference
export const useRemoveMetricPreference = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, brandId, metricId }: { userId: string; brandId: string; metricId: string }) => {
      const { error } = await supabase
        .from('user_metric_preferences')
        .delete()
        .eq('user_id', userId)
        .eq('brand_id', brandId)
        .eq('metric_id', metricId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-metric-preferences'] });
      toast.success('Metric removed from dashboard');
    }
  });
};
```

## Animasyon Patterns

### Framer Motion Variants

```typescript
// Page Transitions
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

// Modal Animations
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

// Dropdown Animations
export const dropdownVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

// Stagger Children
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};
```

### Usage Example

```typescript
import { motion } from 'framer-motion';

const PageComponent: React.FC = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <h1>Page Content</h1>
    </motion.div>
  );
};
```

## Utility Functions

### Format Helpers

```typescript
// Currency Formatter
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Number Formatter
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Percentage Formatter
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Date Formatter
export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

// Relative Time Formatter
export const formatRelativeTime = (date: Date | string): string => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((past.getTime() - now.getTime()) / 1000);
  
  if (Math.abs(diffInSeconds) < 60) return rtf.format(diffInSeconds, 'second');
  if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
  if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
  return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
};
```

### Class Name Utilities

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Debounce & Throttle

```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

## Testing Strategy

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrandSelector } from './BrandSelector';

describe('BrandSelector', () => {
  const mockBrand = {
    id: '1',
    name: 'Test Brand',
    activeAdmins: 3
  };
  
  it('renders brand information', () => {
    render(<BrandSelector brand={mockBrand} />);
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('3 admins active')).toBeInTheDocument();
  });
  
  it('opens dropdown on click', () => {
    render(<BrandSelector brand={mockBrand} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
```

## Performans Optimizasyonları

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const OverviewDashboard = lazy(() => import('./modules/OverviewDashboard'));
const GoogleAdsModule = lazy(() => import('./modules/GoogleAdsModule'));
const MetaAdsModule = lazy(() => import('./modules/MetaAdsModule'));

// Usage
<Suspense fallback={<LoadingSpinner />}>
  <OverviewDashboard />
</Suspense>
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

export const CampaignRow = memo<CampaignRowProps>(({ campaign }) => {
  const percentage = useMemo(
    () => (campaign.budgetUsed / campaign.budgetLimit) * 100,
    [campaign.budgetUsed, campaign.budgetLimit]
  );
  
  const handleClick = useCallback(() => {
    console.log('Campaign clicked:', campaign.id);
  }, [campaign.id]);
  
  return (
    <tr onClick={handleClick}>
      {/* ... */}
    </tr>
  );
});
```

### Virtual Scrolling

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export const CampaignList: React.FC<{ campaigns: Campaign[] }> = ({ campaigns }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: campaigns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <CampaignRow campaign={campaigns[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Güvenlik

### Environment Variables

```typescript
// .env.example
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Row Level Security (RLS) Policies

```sql
-- Brands: Users can only see brands they have access to
CREATE POLICY "Users can view their brands"
  ON brands FOR SELECT
  USING (
    id IN (
      SELECT brand_id FROM user_brand_access
      WHERE user_id = auth.uid()
    )
  );

-- Campaigns: Users can only see campaigns for their brands
CREATE POLICY "Users can view their brand campaigns"
  ON campaigns FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM user_brand_access
      WHERE user_id = auth.uid()
    )
  );

-- Platform Connections: Users can only see connections for their brands
CREATE POLICY "Users can view their brand connections"
  ON platform_connections FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM user_brand_access
      WHERE user_id = auth.uid()
    )
  );
```

## Deployment

### Build Configuration

```typescript
// build.config.ts (örnek)
export const buildConfig = {
  alias: {
    "@": "./src",
  },
  optimization: {
    manualChunks: {
      "react-vendor": ["react", "react-dom", "next"],
      "ui-vendor": ["framer-motion", "@radix-ui/react-dropdown-menu"],
      "data-vendor": ["@tanstack/react-query", "@supabase/supabase-js"],
    },
    minifyCSS: true,
    treeShaking: true,
  },
};
```

### Environment Setup

```bash
# Not: build tool komutları doğrudan çalıştırılmaz, npm scripts kullanılır.

# Development
npm run dev

# Build
npm run build

# Preview
npm run preview

# Type Check
npm run type-check

# Lint
npm run lint
```


## UI Assets ve Icon Components

### Platform Logo Components

```typescript
// Google Ads Logo
export const GoogleAdsLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Meta/Facebook Logo
export const MetaLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// LinkedIn Logo
export const LinkedInLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

// TikTok Logo
export const TikTokLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.62-1.12-1.09 2.41-1.04 5.16-.06 7.63.85 2.15 2.56 3.93 4.72 4.96L21 20.49c-3.16 3.16-8.23 3.61-11.75 1.1-4.22-2.99-5.25-9-2.22-13.19.67-.93 1.5-1.74 2.44-2.4 2.87-2.03 6.64-2.12 9.61-.26l.48.33.47-.32c2.02-1.39 4.29-2.3 6.66-2.65V.02h-3.92c-.01 1.63-.61 3.23-1.77 4.35-1.15 1.12-2.73 1.67-4.32 1.8V.02h-4.66z"/>
  </svg>
);
```

### Logo Component

```typescript
interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showExternal?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showExternal = true }) => {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-base' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl' }
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        sizes[size].icon,
        "rounded bg-primary flex items-center justify-center text-white font-bold"
      )}>
        G
      </div>
      <span className={cn(sizes[size].text, "font-bold tracking-tight")}>
        Glowytics{' '}
        <span className="text-xs align-top text-text-muted-light dark:text-text-muted-dark">
          ™
        </span>
      </span>
      {showExternal && (
        <button className="ml-auto text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors">
          <span className="material-icons-round text-sm">open_in_new</span>
        </button>
      )}
    </div>
  );
};
```

### Badge Components

```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'beta';
  children: React.ReactNode;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant, 
  children, 
  showDot = false,
  size = 'md' 
}) => {
  const variants = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    beta: 'bg-gray-100 text-gray-400 dark:bg-gray-800'
  };
  
  const dotColors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    beta: 'bg-gray-500'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs'
  };
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      variants[variant],
      sizes[size]
    )}>
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};

// Notification Badge
interface NotificationBadgeProps {
  count: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
  return (
    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-auto">
      {count}
    </span>
  );
};
```

### UserProfile Component

```typescript
interface UserProfileProps {
  user: {
    name: string;
    role: string;
    avatar: string;
  };
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="p-4 mt-auto">
      <div className="mb-4 space-y-1">
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted-light dark:text-text-muted-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" href="#">
          <span className="material-icons-round text-[20px]">notifications</span>
          Notifications
          <NotificationBadge count={5} />
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted-light dark:text-text-muted-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" href="#">
          <span className="material-icons-round text-[20px]">help_outline</span>
          Support
        </a>
      </div>
      
      <div className="flex items-center gap-3 pt-4 border-t border-border-light dark:border-border-dark cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <img 
          src={user.avatar} 
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div className="text-sm font-semibold">{user.name}</div>
          <div className="text-xs text-text-muted-light dark:text-text-muted-dark">{user.role}</div>
        </div>
      </div>
      
      {isOpen && (
        <UserProfileDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
};
```

### Custom Scrollbar Styling

```css
/* src/styles/scrollbar.css */

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4B5563;
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #D1D5DB transparent;
}

.dark * {
  scrollbar-color: #4B5563 transparent;
}
```

### QuickActions Component

```typescript
export const QuickActionsButton: React.FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-text-muted-light dark:text-text-muted-dark transition-colors">
          <span className="material-icons-round text-lg">more_horiz</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <span className="material-icons-round text-sm mr-2">settings</span>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <span className="material-icons-round text-sm mr-2">help_outline</span>
          Help
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <span className="material-icons-round text-sm mr-2">logout</span>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### ViewAllButton Component

```typescript
interface ViewAllButtonProps {
  text: string;
  onClick: () => void;
}

export const ViewAllButton: React.FC<ViewAllButtonProps> = ({ text, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
    >
      {text}
      <span className="material-icons-round text-sm">arrow_forward</span>
    </button>
  );
};
```

# Implementation Plan: AdsPulse Dashboard

## Overview

AdsPulse, Google Ads, Meta Ads, TikTok Ads ve Pinterest Ads kampanyalarını tek bir arayüzden yönetmeye olanak tanıyan SaaS tabanlı bir reklam yönetim dashboard'udur. Bu implementation plan, mevcut Adspulse.tsx prototype'ını production-ready Next.js 15 uygulamasına dönüştürmeyi ve tüm özellikleri adım adım uygulamayı içerir.

Tech Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, TanStack Table v8, TanStack Query v5, Zustand, Supabase (PostgreSQL, Auth, Realtime, Edge Functions)

## Tasks

- [x] 0. Prototype analizi ve component yapısı planlama ✅
  - Adspulse.tsx dosyasını analiz et ve component'lere ayır
  - Hangi component'lerin reusable olacağını belirle
  - Component hiyerarşisini ve klasör yapısını planla
  - shadcn/ui ile uyumlu component mapping'i oluştur
  - _Requirements: Tüm requirements için temel yapı_
  - **Output: docs/component-analysis.md**

- [x] 1. Proje kurulumu ve temel yapılandırma
  - [x] 1.1 Next.js 15 projesi oluştur ve temel bağımlılıkları yükle ✅
    - Next.js 15 (App Router), TypeScript, Tailwind CSS v4 kurulumu
    - shadcn/ui, Recharts, TanStack Table v8, TanStack Query v5, Zustand kurulumu
    - ESLint, Prettier yapılandırması
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

  - [x] 1.2 Supabase entegrasyonu ve environment variables ✅
    - Supabase client kurulumu
    - Environment variables yapılandırması (.env.local)
    - Supabase Auth yapılandırması
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 1.3 Tailwind CSS v4 ve shadcn/ui yapılandırması ✅
    - Tailwind config dosyası oluştur
    - shadcn/ui init ve temel component'leri yükle (button, card, input, table, dialog, dropdown-menu, tabs, toast)
    - Global CSS ve font yapılandırması (Google Sans, Roboto)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [x] 2. Veritabanı şeması ve RLS politikaları
  - [x] 2.1 Supabase migration dosyaları oluştur ✅
    - organizations, org_members, ad_accounts, campaigns, campaign_metrics, hourly_metrics, sync_logs, invitations tablolarını oluştur
    - Gerekli indexleri ekle
    - Foreign key ilişkilerini tanımla
    - _Requirements: 2.1, 2.2, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 2.2 Row Level Security (RLS) politikalarını uygula ✅
    - Her tablo için organization-based RLS politikaları yaz
    - SELECT, INSERT, UPDATE, DELETE politikalarını tanımla
    - Policy test senaryoları oluştur
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [ ]* 2.3 RLS politikaları için property test yaz
    - **Property 1: Organization isolation - Bir kullanıcı sadece kendi organizasyonunun verilerine erişebilir**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 3. Type definitions ve utility functions
  - [x] 3.1 TypeScript type definitions oluştur ✅
    - Core entity types (User, Organization, OrgMember, AdAccount, Campaign, CampaignMetric, HourlyMetric, SyncLog, Invitation)
    - Enum types (AdPlatform, CampaignStatus, Role, SyncStatus, ExportFormat, DateRangePreset)
    - Utility types (DateRange, OAuthTokens, DashboardMetrics, ChartData)
    - _Requirements: Tüm requirements için type safety_
  
  - [x] 3.2 Utility functions ve helpers ✅
    - Date formatting ve manipulation utilities
    - Number formatting (currency, percentage, abbreviation)
    - Validation helpers (email, budget, date range)
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ] 4. Authentication sistemi
  - [x] 4.1 Auth provider ve hooks oluştur ✅
    - Supabase Auth provider component
    - useAuth hook (user, session, loading states)
    - useUser hook (user profile data)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 4.2 Login sayfası ve Google OAuth ✅
    - Login page (/login)
    - Google OAuth button ve flow
    - Magic Link email authentication
    - Session management (7 gün)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 16.4_
  
  - [x] 4.3 Auth middleware ve protected routes ✅
    - Middleware for authentication check
    - Redirect logic (authenticated → /dashboard, unauthenticated → /login)
    - Session expiry handling
    - _Requirements: 1.3, 1.4, 1.6_
  
  - [ ]* 4.4 Authentication flow için unit tests
    - Login flow tests
    - Session expiry tests
    - Redirect logic tests
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 5. Organization management
  - [x] 5.1 Organization creation ve default setup ✅
    - İlk authentication'da default organization oluşturma
    - Owner role assignment
    - Server action: createDefaultOrganization
    - _Requirements: 2.1, 2.2, 2.6_
  
  - [ ] 5.2 Organization member invitation sistemi
    - Server action: inviteOrgMember
    - Email notification service entegrasyonu
    - Invitation token generation ve validation
    - _Requirements: 2.3, 13.1, 13.2, 13.3, 13.4, 20.3_
  
  - [ ] 5.3 Member management UI
    - Settings page - Members tab
    - Member list with roles
    - Invite member dialog
    - Remove member functionality
    - Role change functionality (owner only)
    - _Requirements: 12.6, 12.7, 13.1, 13.5, 13.6, 13.7_
  
  - [ ]* 5.4 Organization management için unit tests
    - Default organization creation test
    - Invitation flow test
    - Role-based access test
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 13.1, 13.2, 13.3, 13.4_

- [ ] 6. Role-based access control (RBAC)
  - [ ] 6.1 RBAC utility functions ve hooks
    - useRole hook (current user role)
    - hasPermission utility function
    - Role hierarchy definition
    - _Requirements: 2.4, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [ ] 6.2 RoleGuard component
    - Client component for conditional rendering
    - Permission check logic
    - Fallback UI for unauthorized access
    - _Requirements: 2.5, 12.4, 12.5_
  
  - [ ]* 6.3 RBAC için property test yaz
    - **Property 2: Role hierarchy - Owner > Admin > Member > Viewer yetki hiyerarşisi korunur**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [ ] 7. Ad platform OAuth entegrasyonu
  - [ ] 7.1 OAuth service layer oluştur
    - AdPlatformService interface implementation
    - Google Ads OAuth (API v18)
    - Meta Ads OAuth (API v21)
    - TikTok Ads OAuth (API v1.3)
    - Pinterest Ads OAuth (API v5)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 7.2 OAuth callback handlers
    - API route: /api/oauth/[platform]/callback
    - Token exchange ve storage (encrypted)
    - Error handling
    - _Requirements: 3.5, 3.6, 16.1, 16.3_
  
  - [ ] 7.3 Token refresh mechanism
    - Automatic token refresh logic
    - Token expiry check
    - Refresh failure notification
    - _Requirements: 3.6, 3.7, 20.1_
  
  - [ ] 7.4 Ad account connection UI
    - Settings page - Ad Accounts tab
    - Platform connection buttons (OAuthConnector component)
    - Connected accounts list
    - Disconnect functionality
    - _Requirements: 3.8, 3.9_
  
  - [ ]* 7.5 OAuth flow için unit tests
    - Token exchange test
    - Token refresh test
    - Error handling test
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 8. Checkpoint - Authentication ve Organization setup tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Campaign data sync sistemi
  - [ ] 9.1 Sync service layer oluştur
    - syncAdPlatformData Edge Function
    - Platform-specific API clients (Google, Meta, TikTok, Pinterest)
    - Data transformation ve normalization
    - _Requirements: 4.1, 4.7, 4.8, 4.9_
  
  - [ ] 9.2 Scheduled sync job
    - Supabase Edge Function with cron (15 dakikada bir)
    - Queue-based processing
    - Rate limiting compliance
    - _Requirements: 4.1, 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [ ] 9.3 Sync logging ve error handling
    - sync_logs table operations
    - Status tracking (in_progress, completed, failed)
    - Error message logging
    - _Requirements: 4.2, 4.3, 4.4, 16.1, 16.2_
  
  - [ ] 9.4 Manual sync trigger
    - Server action: triggerManualSync
    - UI button ve loading state
    - 120 saniye timeout
    - _Requirements: 4.5, 4.6_
  
  - [ ]* 9.5 Sync sistemi için unit tests
    - Sync job execution test
    - Error handling test
    - Rate limiting test
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 10. Data retention ve cleanup
  - [ ] 10.1 Cleanup Edge Functions
    - hourly_metrics cleanup (7 gün)
    - sync_logs cleanup (90 gün)
    - Scheduled execution (low-traffic hours)
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_
  
  - [ ]* 10.2 Cleanup logic için unit tests
    - Data retention period test
    - Cleanup execution test
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 11. Reusable UI components (prototype'dan çıkarılan)
  - [ ] 11.1 MetricCard component
    - Animated number display (AnimNum)
    - Change indicator (positive/negative)
    - Loading state
    - _Requirements: 5.2_
  
  - [ ] 11.2 DateRangePicker component
    - Preset options (today, yesterday, last 7 days, last 30 days, custom)
    - Custom range selector
    - Max 365 days validation
    - _Requirements: 5.4, 5.5, 17.2_
  
  - [ ] 11.3 PlatformFilter component
    - Multi-platform selection
    - Platform icons ve colors
    - "All Platforms" option
    - _Requirements: 5.3_
  
  - [ ] 11.4 ChartContainer component
    - Recharts wrapper (line, bar, pie, area)
    - Responsive container
    - Loading state
    - Tooltip ve legend customization
    - _Requirements: 5.6, 5.7_
  
  - [ ] 11.5 SyncStatusIndicator component
    - Last sync timestamp
    - Status badge (syncing, success, error, idle)
    - Manual sync button
    - _Requirements: 4.5, 4.6_

- [ ] 12. Dashboard overview page
  - [ ] 12.1 Dashboard layout ve header
    - Page layout (/dashboard/page.tsx)
    - Header with title, filters, actions
    - Mobile responsive design
    - _Requirements: 5.1, 5.8, 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ] 12.2 Dashboard metrics cards
    - Total spend, impressions, clicks, conversions, CTR, CPA cards
    - Animated number display
    - Change indicators
    - _Requirements: 5.2_
  
  - [ ] 12.3 Dashboard charts
    - Performance trend chart (area chart)
    - Platform comparison chart (bar chart)
    - Hourly CTR chart
    - _Requirements: 5.6, 5.7_
  
  - [ ] 12.4 Platform summary section
    - Platform breakdown cards
    - Budget share visualization
    - Aggregated metrics per platform
    - _Requirements: 5.3_
  
  - [ ] 12.5 Dashboard data fetching ve caching
    - Server Component data fetching
    - TanStack Query for client-side caching
    - 1.5 saniye yükleme hedefi
    - _Requirements: 5.1, 15.5_
  
  - [ ]* 12.6 Dashboard performance için unit tests
    - LCP < 2.5s test
    - CLS < 0.1 test
    - Data loading test
    - _Requirements: 5.1, 5.9, 5.10, 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 13. Campaign list page
  - [ ] 13.1 Campaign list layout ve filters
    - Page layout (/campaigns/page.tsx)
    - Platform filter, status filter, search
    - Date range filter
    - _Requirements: 6.2, 6.3_
  
  - [ ] 13.2 TanStack Table implementation
    - CampaignTable component
    - Pagination (50 items per page)
    - Sorting by columns
    - Column definitions
    - _Requirements: 6.1, 6.4, 6.5_
  
  - [ ] 13.3 Bulk selection ve actions
    - Row selection (checkbox)
    - Bulk action buttons (pause, activate, archive)
    - Bulk operation confirmation dialog
    - _Requirements: 6.7, 6.8_
  
  - [ ] 13.4 Campaign list data fetching
    - Server Component initial data
    - TanStack Query for pagination ve filtering
    - Optimistic updates
    - _Requirements: 6.1, 6.6_
  
  - [ ]* 13.5 Campaign list için unit tests
    - Pagination test
    - Filtering test
    - Sorting test
    - Bulk actions test
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8_

- [ ] 14. Campaign status ve budget management
  - [ ] 14.1 Campaign status change
    - Server action: updateCampaignStatus
    - Platform API call (10 saniye timeout)
    - Error handling ve revert logic
    - Status change logging
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 16.5_
  
  - [ ] 14.2 Campaign budget update
    - Server action: updateCampaignBudget
    - Budget validation (> 0)
    - Platform API call (10 saniye timeout)
    - Error handling ve revert logic
    - Budget change logging
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 16.5, 17.1_
  
  - [ ] 14.3 UI for status ve budget changes
    - Status dropdown in table
    - Budget edit dialog
    - Loading states ve optimistic updates
    - Error toast notifications
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 14.4 Campaign management için unit tests
    - Status change test
    - Budget update test
    - Validation test
    - Error handling test
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 15. Checkpoint - Campaign management tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Campaign detail page
  - [ ] 16.1 Campaign detail layout
    - Page layout (/campaigns/[id]/page.tsx)
    - Campaign header (name, platform, status, budget)
    - Date range selector
    - _Requirements: 9.1, 9.2, 9.6_
  
  - [ ] 16.2 Daily metrics breakdown
    - Daily metrics table
    - Spend, impressions, clicks, conversions per day
    - _Requirements: 9.3_
  
  - [ ] 16.3 Hourly metrics breakdown
    - Hourly metrics chart (last 7 days)
    - Hourly performance visualization
    - _Requirements: 9.4_
  
  - [ ] 16.4 Performance charts
    - Spend trend chart
    - Impressions trend chart
    - Clicks trend chart
    - Conversions trend chart
    - _Requirements: 9.5_
  
  - [ ] 16.5 Campaign detail data fetching
    - Server Component initial data
    - TanStack Query for date range changes
    - 800ms reload hedefi
    - _Requirements: 9.1, 9.7_
  
  - [ ]* 16.6 Campaign detail için unit tests
    - Data loading test
    - Date range change test
    - Chart rendering test
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 17. Reports page ve export functionality
  - [ ] 17.1 Reports page layout
    - Page layout (/reports/page.tsx)
    - Report builder UI
    - Date range selector
    - Platform filter
    - Campaign selector
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 17.2 Report preview
    - Aggregated metrics display
    - Platform comparison data
    - Report generation timestamp
    - _Requirements: 10.4, 10.5, 10.10_
  
  - [ ] 17.3 Export functionality
    - API route: /api/reports/export
    - CSV export
    - Excel export
    - PDF export
    - 30 saniye generation timeout
    - Signed URL for download
    - _Requirements: 10.6, 10.7, 10.8, 10.9_
  
  - [ ]* 17.4 Reports için unit tests
    - Report generation test
    - Export format test
    - Timeout test
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

- [ ] 18. Settings page
  - [ ] 18.1 Settings layout ve tabs
    - Page layout (/settings/page.tsx)
    - Tab navigation (Profile, Organization, Members, Ad Accounts)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [ ] 18.2 Profile settings tab
    - Display name update
    - Email update with verification
    - Profile picture upload (max 5MB)
    - Organization memberships list
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [ ] 18.3 Organization settings tab
    - Organization name update
    - Organization plan display
    - _Requirements: 2.1, 2.2_
  
  - [ ] 18.4 Members tab (task 5.3'te oluşturuldu)
    - Member list with roles
    - Invite member functionality
    - Remove member functionality
    - Role change functionality
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_
  
  - [ ] 18.5 Ad Accounts tab (task 7.4'te oluşturuldu)
    - Connected accounts list
    - Platform connection buttons
    - Disconnect functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.8, 3.9_
  
  - [ ]* 18.6 Settings için unit tests
    - Profile update test
    - Email verification test
    - Picture upload test
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 19. Notification system
  - [ ] 19.1 Email notification service
    - NotificationService implementation
    - Email templates (invitation, token refresh failure, budget alert, sync failure)
    - Email sending logic (60 saniye timeout)
    - _Requirements: 2.3, 3.7, 20.1, 20.2, 20.3, 20.4_
  
  - [ ] 19.2 Notification triggers
    - OAuth token refresh failure trigger
    - Campaign budget alert trigger (90% threshold)
    - Sync failure trigger (3 consecutive failures)
    - _Requirements: 20.1, 20.2, 20.4_
  
  - [ ] 19.3 Notification preferences
    - User notification preferences table
    - Preferences UI in settings
    - Preference check before sending
    - _Requirements: 20.5, 20.6_
  
  - [ ]* 19.4 Notification system için unit tests
    - Email sending test
    - Trigger logic test
    - Preference check test
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [ ] 20. Error handling ve logging
  - [ ] 20.1 Sentry integration
    - Sentry SDK kurulumu
    - Error boundary components
    - API error tracking
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [ ] 20.2 Logging utilities
    - Structured logging functions
    - Log levels (error, warn, info, debug)
    - Log retention (90 gün)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [ ] 20.3 User-friendly error messages
    - Error message mapping
    - Toast notifications for errors
    - Fallback UI for critical errors
    - _Requirements: 16.3, 17.4_

- [ ] 21. Analytics ve monitoring
  - [ ] 21.1 Posthog integration
    - Posthog SDK kurulumu
    - Event tracking (page views, button clicks, form submissions)
    - User identification
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ] 21.2 Performance monitoring
    - Web Vitals tracking (LCP, FID, INP, CLS)
    - Custom performance metrics
    - Performance alerts
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 22. Final integration ve testing
  - [ ] 22.1 End-to-end flow testing
    - Authentication flow
    - Organization setup flow
    - Ad account connection flow
    - Campaign management flow
    - Report generation flow
    - _Requirements: Tüm requirements_
  
  - [ ] 22.2 Performance optimization
    - Image optimization (WebP, AVIF)
    - Code splitting ve lazy loading
    - Cache headers (24 saat)
    - Bundle size optimization
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_
  
  - [ ] 22.3 Accessibility audit
    - WCAG compliance check
    - Keyboard navigation test
    - Screen reader test
    - Color contrast check
    - _Requirements: Tüm UI requirements_
  
  - [ ] 22.4 Security audit
    - RLS policy verification
    - Token encryption verification
    - Input validation verification
    - CSRF protection verification
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ] 23. Final checkpoint - Production ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Task 0 ensures prototype analysis before starting implementation
- TypeScript kullanılacak (design dokümanında belirtildiği üzere)
- Tüm component'ler shadcn/ui ile uyumlu olacak
- Performance hedefleri: LCP < 2.5s, FID < 100ms, CLS < 0.1, Dashboard < 1.5s
- Güvenlik: RLS tüm tablolarda, OAuth token encryption (AES-256)

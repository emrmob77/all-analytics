# Requirements Document

## Introduction

AdsPulse, dijital pazarlamacıların Google Ads, Meta Ads, TikTok Ads ve Pinterest Ads kampanyalarını tek bir arayüzden yönetmelerine, analiz etmelerine ve raporlamalarına olanak tanıyan SaaS tabanlı bir reklam yönetim dashboard'udur. Sistem, birden fazla reklam platformunun verilerini merkezi bir arayüzde birleştirerek zaman kaybını önler, veri tutarlılığını sağlar ve daha iyi karar alma süreçlerini destekler.

## Glossary

- **AdsPulse_System**: Tüm reklam platformlarını entegre eden merkezi dashboard uygulaması
- **User**: Sistemi kullanan dijital pazarlamacı, ajans çalışanı veya işletme sahibi
- **Organization**: Birden fazla kullanıcının birlikte çalıştığı organizasyon birimi
- **Ad_Platform**: Google Ads, Meta Ads, TikTok Ads veya Pinterest Ads gibi reklam platformları
- **Ad_Account**: Bir reklam platformunda kullanıcının bağladığı hesap
- **Campaign**: Bir reklam platformunda oluşturulmuş kampanya
- **Metric**: Harcama, gösterim, tıklama, dönüşüm gibi kampanya performans verileri
- **Sync_Operation**: Reklam platformlarından veri çekme işlemi
- **OAuth_Token**: Reklam platformlarına erişim için kullanılan kimlik doğrulama token'ı
- **RLS**: Row Level Security - Veritabanı seviyesinde satır bazlı güvenlik kontrolü
- **Org_Member**: Bir organizasyona üye olan kullanıcı
- **Role**: Kullanıcının organizasyon içindeki yetki seviyesi (owner, admin, member, viewer)
- **Dashboard**: Tüm kampanya metriklerinin görselleştirildiği ana sayfa
- **Report**: Belirli tarih aralığı ve filtreler için oluşturulan analiz raporu
- **Bulk_Operation**: Birden fazla kampanyaya aynı anda uygulanan işlem

## Requirements

### Requirement 1: User Authentication

**User Story:** As a digital marketer, I want to securely authenticate to the system, so that I can access my campaign data safely.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL provide Google OAuth authentication
2. THE AdsPulse_System SHALL provide Magic Link email authentication
3. WHEN a User successfully authenticates, THE AdsPulse_System SHALL create a session valid for 7 days
4. WHEN a User's session expires, THE AdsPulse_System SHALL redirect the User to the login page
5. THE AdsPulse_System SHALL store authentication tokens encrypted in the database
6. WHEN a User logs out, THE AdsPulse_System SHALL invalidate the User's session immediately

### Requirement 2: Organization Management

**User Story:** As an agency owner, I want to create and manage organizations, so that my team can collaborate on campaigns.

#### Acceptance Criteria

1. WHEN a User first authenticates, THE AdsPulse_System SHALL create a default Organization for the User
2. THE AdsPulse_System SHALL assign the creating User as owner role in the Organization
3. WHEN an owner invites a new member, THE AdsPulse_System SHALL send an invitation email within 60 seconds
4. THE AdsPulse_System SHALL support four roles: owner, admin, member, and viewer
5. WHEN an Org_Member with viewer role attempts to modify data, THE AdsPulse_System SHALL deny the operation
6. THE AdsPulse_System SHALL allow each Organization to have at least 1 owner at all times

### Requirement 3: Ad Platform Connection

**User Story:** As a User, I want to connect my ad platform accounts, so that I can manage campaigns from multiple platforms.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL support OAuth connection for Google Ads API v19/v20/v21 (with fallback)
2. THE AdsPulse_System SHALL support OAuth connection for Meta Marketing API v21
3. THE AdsPulse_System SHALL support OAuth connection for TikTok Ads API v1.3
4. THE AdsPulse_System SHALL support OAuth connection for Pinterest Ads API v5
5. WHEN a User completes OAuth flow, THE AdsPulse_System SHALL store the OAuth_Token encrypted
6. WHEN an OAuth_Token expires, THE AdsPulse_System SHALL attempt automatic refresh
7. IF automatic token refresh fails, THEN THE AdsPulse_System SHALL notify the User via email
8. THE AdsPulse_System SHALL allow a User to disconnect an Ad_Account at any time
9. WHEN a User disconnects an Ad_Account, THE AdsPulse_System SHALL delete associated OAuth_Token immediately

### Requirement 4: Campaign Data Synchronization

**User Story:** As a User, I want my campaign data to sync automatically, so that I always see up-to-date metrics.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL perform automatic Sync_Operation every 15 minutes for all connected Ad_Accounts
2. WHEN a Sync_Operation starts, THE AdsPulse_System SHALL create a sync_log entry with status "in_progress"
3. WHEN a Sync_Operation completes successfully, THE AdsPulse_System SHALL update sync_log status to "completed" within 5 seconds
4. IF a Sync_Operation fails, THEN THE AdsPulse_System SHALL update sync_log status to "failed" and log the error message
5. THE AdsPulse_System SHALL allow Users to trigger manual Sync_Operation
6. WHEN a manual Sync_Operation is triggered, THE AdsPulse_System SHALL complete it within 120 seconds
7. THE AdsPulse_System SHALL store daily Metric data in campaign_metrics table
8. THE AdsPulse_System SHALL store hourly Metric data in hourly_metrics table for the last 7 days
9. WHEN new Campaign data is synced, THE AdsPulse_System SHALL update existing Campaign records or create new ones

### Requirement 5: Dashboard Overview Display

**User Story:** As a User, I want to see an overview of all my campaigns, so that I can quickly assess performance.

#### Acceptance Criteria

1. WHEN a User accesses the Dashboard, THE AdsPulse_System SHALL load and display data within 1.5 seconds
2. THE AdsPulse_System SHALL display metric cards showing total spend, impressions, clicks, conversions, CTR, and CPA
3. THE AdsPulse_System SHALL allow Users to filter Dashboard by Ad_Platform
4. THE AdsPulse_System SHALL allow Users to filter Dashboard by date range (today, yesterday, last 7 days, last 30 days, custom)
5. WHEN a User selects a custom date range, THE AdsPulse_System SHALL accept ranges up to 365 days
6. THE AdsPulse_System SHALL display a spend trend chart using daily aggregated data
7. THE AdsPulse_System SHALL display a platform comparison chart showing spend distribution
8. WHEN Dashboard data is loading, THE AdsPulse_System SHALL display loading indicators
9. THE AdsPulse_System SHALL achieve Largest Contentful Paint (LCP) under 2.5 seconds
10. THE AdsPulse_System SHALL achieve Cumulative Layout Shift (CLS) under 0.1

### Requirement 6: Campaign List Management

**User Story:** As a User, I want to view and manage all my campaigns in one place, so that I can efficiently control my advertising.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL display a paginated list of Campaigns with 50 items per page
2. THE AdsPulse_System SHALL allow Users to filter Campaigns by Ad_Platform, status, and date range
3. THE AdsPulse_System SHALL allow Users to search Campaigns by name
4. THE AdsPulse_System SHALL display Campaign name, platform, status, spend, impressions, clicks, and conversions in the list
5. THE AdsPulse_System SHALL allow Users to sort Campaigns by any displayed column
6. WHEN a User clicks on a Campaign, THE AdsPulse_System SHALL navigate to the Campaign detail page within 500ms
7. THE AdsPulse_System SHALL support bulk selection of Campaigns
8. WHERE bulk selection is active, THE AdsPulse_System SHALL allow Users to pause, activate, or archive multiple Campaigns simultaneously

### Requirement 7: Campaign Status Control

**User Story:** As a User, I want to change campaign status, so that I can control when my ads run.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL allow Users with member role or higher to change Campaign status
2. WHEN a User changes Campaign status to paused, THE AdsPulse_System SHALL call the respective Ad_Platform API within 10 seconds
3. WHEN a User changes Campaign status to active, THE AdsPulse_System SHALL call the respective Ad_Platform API within 10 seconds
4. IF the Ad_Platform API call fails, THEN THE AdsPulse_System SHALL display an error message and revert the status change
5. WHEN a status change succeeds, THE AdsPulse_System SHALL update the Campaign record in the database
6. THE AdsPulse_System SHALL log all status changes with timestamp and User information

### Requirement 8: Campaign Budget Management

**User Story:** As a User, I want to modify campaign budgets, so that I can control my advertising spend.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL allow Users with admin role or higher to modify Campaign budgets
2. WHEN a User updates a Campaign budget, THE AdsPulse_System SHALL validate the amount is greater than zero
3. WHEN a User updates a Campaign budget, THE AdsPulse_System SHALL call the respective Ad_Platform API within 10 seconds
4. IF the Ad_Platform API call fails, THEN THE AdsPulse_System SHALL display an error message and revert the budget change
5. WHEN a budget change succeeds, THE AdsPulse_System SHALL update the Campaign record in the database
6. THE AdsPulse_System SHALL log all budget changes with timestamp, User information, old value, and new value

### Requirement 9: Campaign Detail View

**User Story:** As a User, I want to see detailed campaign metrics, so that I can analyze performance deeply.

#### Acceptance Criteria

1. WHEN a User accesses a Campaign detail page, THE AdsPulse_System SHALL load data within 1 second
2. THE AdsPulse_System SHALL display Campaign name, platform, status, budget, and date range
3. THE AdsPulse_System SHALL display daily Metric breakdown for the selected date range
4. THE AdsPulse_System SHALL display hourly Metric breakdown for the last 7 days
5. THE AdsPulse_System SHALL display performance charts for spend, impressions, clicks, and conversions
6. THE AdsPulse_System SHALL allow Users to change the date range on the detail page
7. WHEN a User changes the date range, THE AdsPulse_System SHALL reload Metric data within 800ms

### Requirement 10: Report Generation

**User Story:** As a User, I want to generate reports, so that I can share performance data with stakeholders.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL allow Users to create Reports with custom date ranges
2. THE AdsPulse_System SHALL allow Users to filter Reports by Ad_Platform
3. THE AdsPulse_System SHALL allow Users to filter Reports by specific Campaigns
4. THE AdsPulse_System SHALL display aggregated Metrics in the Report
5. THE AdsPulse_System SHALL display platform comparison data in the Report
6. THE AdsPulse_System SHALL allow Users to export Reports as CSV format
7. THE AdsPulse_System SHALL allow Users to export Reports as Excel format
8. THE AdsPulse_System SHALL allow Users to export Reports as PDF format
9. WHEN a User requests a Report export, THE AdsPulse_System SHALL generate the file within 30 seconds
10. THE AdsPulse_System SHALL include Report generation timestamp in exported files

### Requirement 11: Data Access Security

**User Story:** As an organization owner, I want data access to be restricted by organization, so that my data remains private.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL enforce Row Level Security (RLS) on all database tables
2. WHEN a User queries data, THE AdsPulse_System SHALL return only data belonging to the User's Organization
3. THE AdsPulse_System SHALL prevent Users from accessing Ad_Accounts not connected to their Organization
4. THE AdsPulse_System SHALL prevent Users from accessing Campaigns not belonging to their Organization
5. THE AdsPulse_System SHALL prevent Users from accessing Metrics not belonging to their Organization
6. IF a User attempts unauthorized data access, THEN THE AdsPulse_System SHALL deny the request and log the attempt

### Requirement 12: Role-Based Access Control

**User Story:** As an organization owner, I want to control what team members can do, so that I can manage permissions appropriately.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL allow owner role to perform all operations
2. THE AdsPulse_System SHALL allow admin role to manage Campaigns and Ad_Accounts but not Organization settings
3. THE AdsPulse_System SHALL allow member role to view and modify Campaigns but not manage Ad_Accounts
4. THE AdsPulse_System SHALL allow viewer role to view data only without modification rights
5. WHEN a User with insufficient permissions attempts an operation, THE AdsPulse_System SHALL display an error message
6. THE AdsPulse_System SHALL allow owner role to change other Users' roles
7. THE AdsPulse_System SHALL prevent the last owner from being removed or demoted

### Requirement 13: Organization Member Management

**User Story:** As an organization owner, I want to invite and manage team members, so that we can collaborate effectively.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL allow owner and admin roles to invite new Org_Members
2. WHEN an invitation is sent, THE AdsPulse_System SHALL create an invitation record valid for 7 days
3. WHEN an invited User accepts the invitation, THE AdsPulse_System SHALL add the User to the Organization
4. IF an invitation expires, THEN THE AdsPulse_System SHALL mark it as expired and prevent acceptance
5. THE AdsPulse_System SHALL allow owner role to remove Org_Members
6. WHEN an Org_Member is removed, THE AdsPulse_System SHALL revoke their access immediately
7. THE AdsPulse_System SHALL display a list of all Org_Members with their roles

### Requirement 14: User Profile Management

**User Story:** As a User, I want to manage my profile, so that I can keep my information up to date.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL allow Users to update their display name
2. THE AdsPulse_System SHALL allow Users to update their email address
3. WHEN a User updates their email, THE AdsPulse_System SHALL send a verification email within 60 seconds
4. THE AdsPulse_System SHALL require email verification before applying the email change
5. THE AdsPulse_System SHALL allow Users to upload a profile picture up to 5MB
6. THE AdsPulse_System SHALL allow Users to view their current Organization memberships

### Requirement 15: Performance Monitoring

**User Story:** As a system administrator, I want the application to meet performance standards, so that Users have a good experience.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL achieve Largest Contentful Paint (LCP) under 2.5 seconds for all pages
2. THE AdsPulse_System SHALL achieve First Input Delay (FID) under 100 milliseconds
3. THE AdsPulse_System SHALL achieve Interaction to Next Paint (INP) under 100 milliseconds
4. THE AdsPulse_System SHALL achieve Cumulative Layout Shift (CLS) under 0.1
5. WHEN Dashboard loads, THE AdsPulse_System SHALL display initial content within 1.5 seconds
6. THE AdsPulse_System SHALL cache static assets for at least 24 hours
7. THE AdsPulse_System SHALL use optimized images with appropriate formats (WebP, AVIF)

### Requirement 16: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error logging, so that I can troubleshoot issues effectively.

#### Acceptance Criteria

1. WHEN an API error occurs, THE AdsPulse_System SHALL log the error with timestamp, User ID, and error details
2. WHEN a Sync_Operation fails, THE AdsPulse_System SHALL log the failure reason and affected Ad_Account
3. IF an Ad_Platform API returns an error, THEN THE AdsPulse_System SHALL display a user-friendly error message
4. THE AdsPulse_System SHALL log all authentication attempts with success or failure status
5. THE AdsPulse_System SHALL log all data modification operations with User ID and timestamp
6. THE AdsPulse_System SHALL retain error logs for at least 90 days

### Requirement 17: Data Validation

**User Story:** As a User, I want the system to validate my inputs, so that I don't make mistakes.

#### Acceptance Criteria

1. WHEN a User enters a Campaign budget, THE AdsPulse_System SHALL validate it is a positive number
2. WHEN a User selects a date range, THE AdsPulse_System SHALL validate the end date is after the start date
3. WHEN a User enters an email address, THE AdsPulse_System SHALL validate it matches email format
4. IF validation fails, THEN THE AdsPulse_System SHALL display an error message describing the issue
5. THE AdsPulse_System SHALL prevent form submission while validation errors exist
6. THE AdsPulse_System SHALL display validation errors in real-time as Users type

### Requirement 18: API Rate Limiting Compliance

**User Story:** As a system administrator, I want to respect API rate limits, so that platform connections remain stable.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL track API request counts for each Ad_Platform
2. WHEN approaching an Ad_Platform rate limit, THE AdsPulse_System SHALL queue additional requests
3. IF an Ad_Platform returns a rate limit error, THEN THE AdsPulse_System SHALL retry the request after the specified wait time
4. THE AdsPulse_System SHALL distribute Sync_Operations across time to avoid rate limit spikes
5. THE AdsPulse_System SHALL log all rate limit encounters with timestamp and platform information

### Requirement 19: Data Retention and Cleanup

**User Story:** As a system administrator, I want old data to be managed appropriately, so that database performance remains optimal.

#### Acceptance Criteria

1. THE AdsPulse_System SHALL retain hourly_metrics data for 7 days
2. WHEN hourly_metrics data exceeds 7 days, THE AdsPulse_System SHALL delete it automatically
3. THE AdsPulse_System SHALL retain campaign_metrics data for 2 years
4. THE AdsPulse_System SHALL retain sync_logs for 90 days
5. WHEN sync_logs exceed 90 days, THE AdsPulse_System SHALL delete them automatically
6. THE AdsPulse_System SHALL perform cleanup operations during low-traffic hours

### Requirement 20: Notification System

**User Story:** As a User, I want to receive notifications about important events, so that I stay informed.

#### Acceptance Criteria

1. WHEN an OAuth_Token refresh fails, THE AdsPulse_System SHALL send an email notification within 5 minutes
2. WHEN a Campaign spend exceeds 90% of budget, THE AdsPulse_System SHALL send an email notification
3. WHEN a User is invited to an Organization, THE AdsPulse_System SHALL send an invitation email within 60 seconds
4. WHEN a Sync_Operation fails 3 consecutive times, THE AdsPulse_System SHALL send an alert email
5. THE AdsPulse_System SHALL allow Users to configure notification preferences
6. WHERE notification preferences disable a notification type, THE AdsPulse_System SHALL not send that notification type

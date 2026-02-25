-- Add Google Analytics 4 and Search Console to the ad_platform enum
ALTER TYPE public.ad_platform ADD VALUE IF NOT EXISTS 'google-analytics';
ALTER TYPE public.ad_platform ADD VALUE IF NOT EXISTS 'search-console';

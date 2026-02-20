import type { AdPlatform } from '@/types';
import type { AdPlatformOAuthService } from './types';
import { GoogleAdsOAuthService } from './google';
import { MetaAdsOAuthService } from './meta';
import { TikTokAdsOAuthService } from './tiktok';
import { PinterestAdsOAuthService } from './pinterest';

export function getAdPlatformService(platform: AdPlatform): AdPlatformOAuthService {
  switch (platform) {
    case 'google':
      return new GoogleAdsOAuthService();
    case 'meta':
      return new MetaAdsOAuthService();
    case 'tiktok':
      return new TikTokAdsOAuthService();
    case 'pinterest':
      return new PinterestAdsOAuthService();
    default: {
      const _exhaustive: never = platform;
      throw new Error(`Unknown ad platform: ${_exhaustive}`);
    }
  }
}

export type { AdPlatformOAuthService, OAuthTokens } from './types';

'use client';

import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const DEFAULT_SIZE: WindowSize = {
  width: 1200,
  height: 800,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
};

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(DEFAULT_SIZE);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Return default values during SSR to avoid hydration mismatch
  if (!isClient) {
    return DEFAULT_SIZE;
  }

  return windowSize;
}

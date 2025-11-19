"use client";

import { useState, useEffect } from 'react';

export function usePWAStatus() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsStandalone(true);
      }

      const userAgent = window.navigator.userAgent;
      if (/iPhone|iPad|iPod/i.test(userAgent) && !window.matchMedia('(display-mode: standalone)').matches) {
        setIsIOS(true);
      }
    }
  }, []);

  return { isStandalone, isIOS };
}

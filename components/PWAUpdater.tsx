'use client';

import { useEffect, useRef } from 'react';

export function PWAUpdater() {
  const lastCheckedRef = useRef<number>(Date.now());
  const initialVersionRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkVersion = async () => {
      try {
        // Append unique timestamp to prevent caching on any CDN or proxy layer
        const res = await fetch(`/api/version?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!res.ok) return;
        const data = await res.json();
        const currentVersion = data.version;

        if (!currentVersion) return;

        if (!initialVersionRef.current) {
          // Set the baseline version on first load
          initialVersionRef.current = currentVersion;
        } else if (initialVersionRef.current !== currentVersion) {
          console.warn('[PWAUpdater] New version detected:', currentVersion, 'Expected:', initialVersionRef.current);
          console.warn('[PWAUpdater] Auto-reloading client to fetch updates...');
          
          // Trigger a clean page reload to fetch the latest assets
          window.location.reload();
        }
      } catch (err) {
        console.error('[PWAUpdater] Error checking version:', err);
      }
    };

    // 1. Check version immediately on mount
    checkVersion();

    // 2. Schedule periodic checks (every 60 seconds)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheckedRef.current > 45000) {
        lastCheckedRef.current = Date.now();
        checkVersion();
      }
    }, 60000);

    // 3. Check version whenever the app is brought back to focus or resumed on mobile/desktop
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastCheckedRef.current > 15000) {
          lastCheckedRef.current = Date.now();
          checkVersion();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  return null;
}

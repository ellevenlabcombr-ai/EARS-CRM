'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function BrandingInjector() {
  const [color, setColor] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('branding_settings')
          .select('brand_color, background_url, logo_url')
          .limit(1)
          .maybeSingle();
        
        if (data) {
          if (data.brand_color) setColor(data.brand_color);
          if (data.background_url) setBackgroundUrl(data.background_url);
          if (data.logo_url) setLogoUrl(data.logo_url);
        }
      } catch (err) {
        console.error('Failed to fetch branding settings', err);
      }
    };
    
    fetchBranding();

    const handleUpdate = () => {
      fetchBranding();
    };

    window.addEventListener('branding-updated', handleUpdate);
    return () => window.removeEventListener('branding-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (logoUrl) {
      // Find existing favicon or create one
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = logoUrl;
    }
  }, [logoUrl]);

  return (
    <>
      {color && (
        <style dangerouslySetInnerHTML={{
          __html: `
            :root, :host {
              --color-cyan-300: color-mix(in oklab, ${color} 80%, white);
              --color-cyan-400: color-mix(in oklab, ${color} 90%, white);
              --color-cyan-500: ${color};
              --color-cyan-600: color-mix(in oklab, ${color} 80%, black);
              --color-cyan-700: color-mix(in oklab, ${color} 60%, black);
            }
          `
        }} />
      )}
      {backgroundUrl && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: `url(${backgroundUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            opacity: 0.05
          }}
        />
      )}
    </>
  );
}

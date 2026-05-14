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
      const setFavicon = () => {
        let links = document.querySelectorAll("link[rel~='icon']");
        if (links.length > 0) {
          links.forEach(link => {
            (link as HTMLLinkElement).href = logoUrl;
          });
        } else {
          let link = document.createElement('link');
          link.rel = 'icon';
          link.href = logoUrl;
          document.head.appendChild(link);
        }
        
        let shortcutLink = document.querySelector("link[rel='shortcut icon']");
        if (shortcutLink) {
          (shortcutLink as HTMLLinkElement).href = logoUrl;
        }
      };
      
      setFavicon();
      // Ensure it runs after Next.js potentially sets its own head elements
      setTimeout(setFavicon, 500);
      setTimeout(setFavicon, 2000);
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
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, body.bg-\\[\\#050B14\\] {
              background-color: #050B14 !important;
              background-image: linear-gradient(rgba(5, 11, 20, 0.85), rgba(5, 11, 20, 0.85)), url("${backgroundUrl}") !important;
              background-position: center !important;
              background-size: cover !important;
              background-repeat: no-repeat !important;
              background-attachment: fixed !important;
            }
            div.bg-\\[\\#050B14\\], main.bg-\\[\\#050B14\\], header.bg-\\[\\#050B14\\], nav.bg-\\[\\#050B14\\] {
              background-color: transparent !important;
            }
          `
        }} />
      )}
    </>
  );
}

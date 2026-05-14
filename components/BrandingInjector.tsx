'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function BrandingInjector() {
  const [color, setColor] = useState<string | null>(null);
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number | null>(null);
  const [cornerRadius, setCornerRadius] = useState<string | null>(null);
  const [backgroundPattern, setBackgroundPattern] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('branding_settings')
          .select('brand_color, secondary_brand_color, background_opacity, corner_radius, background_pattern, background_url, logo_url, favicon_url')
          .limit(1)
          .maybeSingle();
        
        if (data) {
          if (data.brand_color) setColor(data.brand_color);
          if (data.secondary_brand_color) setSecondaryColor(data.secondary_brand_color);
          if (data.background_opacity !== undefined) setBgOpacity(data.background_opacity);
          if (data.corner_radius) setCornerRadius(data.corner_radius);
          if (data.background_pattern) setBackgroundPattern(data.background_pattern);
          if (data.background_url) setBackgroundUrl(data.background_url);
          if (data.logo_url) setLogoUrl(data.logo_url);
          if (data.favicon_url) setFaviconUrl(data.favicon_url);
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
    if (faviconUrl || logoUrl) {
      const urlToUse = faviconUrl || logoUrl;
      const cacheBustedUrl = urlToUse + (urlToUse?.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
      
      const setFavicon = () => {
        let links = document.querySelectorAll("link[rel~='icon']");
        if (links.length > 0) {
          links.forEach(link => {
            (link as HTMLLinkElement).href = cacheBustedUrl;
          });
        } else {
          let link = document.createElement('link');
          link.rel = 'icon';
          link.href = cacheBustedUrl;
          document.head.appendChild(link);
        }
        
        let shortcutLink = document.querySelector("link[rel='shortcut icon']");
        if (shortcutLink) {
          (shortcutLink as HTMLLinkElement).href = cacheBustedUrl;
        }
      };
      
      setFavicon();
      // Ensure it runs after Next.js potentially sets its own head elements
      setTimeout(setFavicon, 500);
      setTimeout(setFavicon, 2000);
    }
  }, [faviconUrl, logoUrl]);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          :root, :host {
            ${color ? `
              --color-cyan-300: color-mix(in oklab, ${color} 80%, white);
              --color-cyan-400: color-mix(in oklab, ${color} 90%, white);
              --color-cyan-500: ${color};
              --color-cyan-600: color-mix(in oklab, ${color} 80%, black);
              --color-cyan-700: color-mix(in oklab, ${color} 60%, black);
            ` : ''}
            
            ${secondaryColor ? `
              --color-emerald-300: color-mix(in oklab, ${secondaryColor} 80%, white);
              --color-emerald-400: color-mix(in oklab, ${secondaryColor} 90%, white);
              --color-emerald-500: ${secondaryColor};
              --color-emerald-600: color-mix(in oklab, ${secondaryColor} 80%, black);
              --color-emerald-700: color-mix(in oklab, ${secondaryColor} 60%, black);

              --color-green-300: color-mix(in oklab, ${secondaryColor} 80%, white);
              --color-green-400: color-mix(in oklab, ${secondaryColor} 90%, white);
              --color-green-500: ${secondaryColor};
              --color-green-600: color-mix(in oklab, ${secondaryColor} 80%, black);
              --color-green-700: color-mix(in oklab, ${secondaryColor} 60%, black);
            ` : ''}

            ${cornerRadius ? `--brand-radius: ${cornerRadius};` : '--brand-radius: 1rem;'}
          }

          ${backgroundPattern && backgroundPattern !== 'none' ? `
            body::before {
              content: "";
              position: fixed;
              inset: 0;
              background-image: ${backgroundPattern === 'dots' 
                ? `radial-gradient(${secondaryColor || '#10b981'} 1px, transparent 1px)` 
                : backgroundPattern === 'grid' 
                ? `linear-gradient(${secondaryColor || '#10b981'} 0.5px, transparent 0.5px), linear-gradient(90deg, ${secondaryColor || '#10b981'} 0.5px, transparent 0.5px)`
                : `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              };
              background-size: ${backgroundPattern === 'dots' ? '24px 24px' : backgroundPattern === 'grid' ? '40px 40px' : 'auto'};
              opacity: ${backgroundPattern === 'noise' ? '0.05' : '0.03'};
              pointer-events: none;
              z-index: 1;
              ${backgroundPattern === 'noise' ? 'filter: contrast(150%) brightness(100%);' : ''}
            }
          ` : ''}

          ${backgroundUrl ? `
            html, body, body.bg-\\[\\#050B14\\] {
              background-color: #050B14 !important;
              background-image: linear-gradient(rgba(5, 11, 20, ${bgOpacity ?? 0.85}), rgba(5, 11, 20, ${bgOpacity ?? 0.85})), url("${backgroundUrl}") !important;
              background-position: center !important;
              background-size: cover !important;
              background-repeat: no-repeat !important;
              background-attachment: fixed !important;
            }
            div.bg-\\[\\#050B14\\], main.bg-\\[\\#050B14\\], header.bg-\\[\\#050B14\\], nav.bg-\\[\\#050B14\\] {
              background-color: transparent !important;
            }
          ` : ''}
        `
      }} />
    </>
  );
}

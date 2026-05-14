'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function BrandingInjector() {
  const [colors, setColors] = useState<{brand: string, bg: string} | null>(null);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const { data, error } = await supabase
          .from('branding_settings')
          .select('brand_color, background_color')
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setColors({
            brand: data.brand_color || '#06b6d4',
            bg: data.background_color || '#050B14'
          });
        }
      } catch (err) {
        console.error('Failed to fetch brand colors', err);
      }
    };
    
    fetchColors();
  }, []);

  if (!colors) return null;

  // We override the cyan color scale as it's the primary theme color.
  // And we override the slate scale (specifically 950 and nearby) for the background.
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root, :host {
          --color-cyan-300: color-mix(in oklab, ${colors.brand} 80%, white);
          --color-cyan-400: color-mix(in oklab, ${colors.brand} 90%, white);
          --color-cyan-500: ${colors.brand};
          --color-cyan-600: color-mix(in oklab, ${colors.brand} 80%, black);
          --color-cyan-700: color-mix(in oklab, ${colors.brand} 60%, black);

          --color-slate-950: ${colors.bg};
          --color-slate-900: color-mix(in oklab, ${colors.bg} 85%, white);
          --color-slate-800: color-mix(in oklab, ${colors.bg} 70%, white);
          
          background-color: var(--color-slate-950);
        }
        body {
          background-color: var(--color-slate-950);
        }
      `
    }} />
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function BrandingInjector() {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    const fetchColor = async () => {
      try {
        const { data, error } = await supabase
          .from('branding_settings')
          .select('brand_color')
          .limit(1)
          .maybeSingle();
        
        if (data?.brand_color) {
          setColor(data.brand_color);
        }
      } catch (err) {
        console.error('Failed to fetch brand color', err);
      }
    };
    
    fetchColor();
  }, []);

  if (!color) return null;

  // We override the cyan color scale as it's the primary theme color.
  return (
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
  );
}

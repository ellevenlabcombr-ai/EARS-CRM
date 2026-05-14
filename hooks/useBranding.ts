import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useBranding() {
  const [branding, setBranding] = useState<{
    logo_url: string | null;
    favicon_url: string | null;
    brand_color: string | null;
    company_name: string;
  }>({
    logo_url: null,
    favicon_url: null,
    brand_color: null,
    company_name: 'ELLEVEN',
  });

  useEffect(() => {
    let mounted = true;
    const fetchBranding = async () => {
      try {
        const { data } = await supabase
          .from('branding_settings')
          .select('logo_url, favicon_url, brand_color, company_name')
          .limit(1)
          .maybeSingle();

        if (data && mounted) {
          setBranding({
            logo_url: data.logo_url,
            favicon_url: data.favicon_url,
            brand_color: data.brand_color,
            company_name: data.company_name || 'ELLEVEN',
          });
        }
      } catch (err) {
        console.error('Failed to fetch branding:', err);
      }
    };

    fetchBranding();

    const handleUpdate = () => {
      fetchBranding();
    };

    window.addEventListener('branding-updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('branding-updated', handleUpdate);
    };
  }, []);

  return branding;
}

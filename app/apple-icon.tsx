import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default async function Icon() {
  let logoUrl = null;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
      const { data } = await supabase.from('branding_settings').select('logo_url').maybeSingle();
      if (data?.logo_url) {
        logoUrl = data.logo_url;
      }
    }
  } catch (e) {
    console.error(e);
  }

  if (logoUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            background: '#050B14',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Logo"
            style={{ width: '80%', height: '80%', objectFit: 'contain' }}
          />
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 100,
          background: '#050B14',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#06b6d4', // cyan-500
          fontWeight: '900',
        }}
      >
        11
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: settings } = await supabase.from('automation_settings')
      .select('evolution_api_url, evolution_api_key, evolution_instance_id').single();

    if (!settings || !settings.evolution_api_url) {
      return NextResponse.json({ status: 'not_configured' });
    }

    const baseUrl = settings.evolution_api_url.endsWith('/') ? settings.evolution_api_url.slice(0, -1) : settings.evolution_api_url;
    
    // Check connection State
    const res = await fetch(`${baseUrl}/instance/connectionState/${settings.evolution_instance_id}`, {
      method: 'GET',
      headers: {
        'apikey': settings.evolution_api_key || ''
      }
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ status: data?.instance?.state || 'unknown', data });
    } else {
      return NextResponse.json({ status: 'disconnected', reason: res.statusText });
    }

  } catch (error: any) {
    console.error('Error fetching whatsapp status:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}

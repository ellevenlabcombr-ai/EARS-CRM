import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = req.headers;
    const body = JSON.parse(rawBody);

    console.log("Recebido Webhook Asaas:", JSON.stringify(body, null, 2));

    const asaasToken = process.env.ASAAS_API_KEY;
    // Asaas webhooks generally send an header asaas-access-token if verified
    // We will just read the body to test functionality

    if (!body || !body.event || !body.payment) {
      return NextResponse.json({ received: true });
    }

    const { event, payment } = body;
    const paymentId = payment.id;

    // Conectar ao Supabase (service role for server side)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase config missing");
      return NextResponse.json({ error: 'Database config error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Se o pagamento for recebido/confirmado
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_DUND' || event === 'PAYMENT_RECEIVED_IN_CASH_UNDONE') {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update({ 
          status: 'paid',
          // optionally save payment date/receipt
        })
        .eq('asaas_payment_id', paymentId);
        
      if (error) {
        console.error("Error updating transaction status:", error);
      } else {
        console.log("Transaction successfully updated as paid:", paymentId);
      }
    } else if (event === 'PAYMENT_OVERDUE') {
      // maybe mark as delayed or pending?
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Asaas Webhook Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

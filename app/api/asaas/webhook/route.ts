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

    // Listas de eventos por status
    const paidEvents = [
      'PAYMENT_RECEIVED', 
      'PAYMENT_CONFIRMED',
      'PAYMENT_ANTICIPATED',
      'PAYMENT_RESTORED',
      'PAYMENT_DUNNING_RECEIVED',
      'PAYMENT_RECEIVED_IN_CASH',
      'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
    ];

    const cancelledEvents = [
      'PAYMENT_DELETED',
      'PAYMENT_REFUNDED',
      'PAYMENT_REFUND_IN_PROGRESS',
      'PAYMENT_CHARGEBACK_REQUESTED',
      'PAYMENT_CHARGEBACK_DISPUTE',
      'PAYMENT_RECEIVED_IN_CASH_UNDONE',
      'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
      'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
      'PAYMENT_REFUND_DENIED',
      'PAYMENT_BANK_SLIP_CANCELLED' // Boleto expirado - podemos considerar cancelado ou deixar pendente, mas a cobrança em si pode ficar vencida. Vamos usar o padrão do Asaas.
    ];

    const pendingEvents = [
      'PAYMENT_CREATED',
      'PAYMENT_UPDATED',
      'PAYMENT_OVERDUE',
      'PAYMENT_AUTHORIZED',
      'PAYMENT_AWAITING_RISK_ANALYSIS',
      'PAYMENT_APPROVED_BY_RISK_ANALYSIS',
      'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
      'PAYMENT_DUNNING_REQUESTED',
      'PAYMENT_BANK_SLIP_VIEWED',
      'PAYMENT_CHECKOUT_VIEWED',
      'PAYMENT_PARTIALLY_REFUNDED',
      'PAYMENT_SPLIT_CANCELLED',
      'PAYMENT_SPLIT_DIVERGENCE_BLOCK',
      'PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED'
    ];

    let newStatus = '';
    if (paidEvents.includes(event)) {
      newStatus = 'paid';
    } else if (cancelledEvents.includes(event)) {
      newStatus = 'cancelled';
    }

    if (newStatus) {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update({ status: newStatus })
        .eq('asaas_payment_id', paymentId);
        
      if (error) {
        console.error(`Error updating transaction status to ${newStatus}:`, error);
      } else {
        console.log(`Transaction successfully updated as ${newStatus}:`, paymentId);
      }
    } else {
      console.log(`Event ${event} ignorado ou mapeado como pendente.`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Asaas Webhook Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

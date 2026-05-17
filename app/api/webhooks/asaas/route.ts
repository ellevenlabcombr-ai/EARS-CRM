import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or Key");
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    if (!payload.event) {
      return NextResponse.json({ error: "No event found in payload" }, { status: 400 });
    }

    const { event, payment } = payload;
    if (!payment || !payment.id) {
       return NextResponse.json({ error: "No payment object found" }, { status: 400 });
    }

    const asaasPaymentId = payment.id;
    const asaasSubscriptionId = payment.subscription; 
    let statusToUpdate: string | null = null;

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
      'PAYMENT_BANK_SLIP_CANCELLED',
      'PAYMENT_OVERDUE'
    ];

    const pendingEvents = [
      'PAYMENT_CREATED',
      'PAYMENT_UPDATED'
    ];

    if (paidEvents.includes(event)) {
      statusToUpdate = "paid";
    } else if (cancelledEvents.includes(event)) {
      statusToUpdate = "cancelled";
    } else if (pendingEvents.includes(event)) {
      statusToUpdate = "pending";
    }

    if (statusToUpdate) {
      const supabase = getSupabaseClient();
      
      const orCondition = asaasSubscriptionId 
        ? `asaas_payment_id.eq.${asaasPaymentId},asaas_payment_id.eq.${asaasSubscriptionId}`
        : `asaas_payment_id.eq.${asaasPaymentId}`;

      let { data: existingTx, error: findError } = await supabase
        .from("financial_transactions")
        .select('id')
        .or(orCondition);

      if (!existingTx || existingTx.length === 0) {
        // Not found in transactions.
        if (asaasSubscriptionId || asaasPaymentId) {
          // If it has subscription, fetch `financial_subscriptions`.
          // If not, we might not auto-create unless we want to for single payments not recorded, 
          // but single payments are usually created alongside the transaction. 
          // We will definitely auto-create for subscriptions.
          let athleteId = null;

          if (asaasSubscriptionId) {
            const { data: subData } = await supabase
               .from("financial_subscriptions")
               .select('*')
               .eq('asaas_subscription_id', asaasSubscriptionId)
               .single();
            if (subData) athleteId = subData.athlete_id;
          }

          if (athleteId) {
            let accountType = "PIX";
            if (payment.billingType === "CREDIT_CARD") accountType = "Crédito";
            else if (payment.billingType === "BOLETO") accountType = "Boleto";
            
            const insertPayload = {
              type: 'income',
              category: 'Geral',
              amount: payment.value,
              description: payment.description || 'Cobrança de Assinatura',
              date: payment.paymentDate || payment.clientPaymentDate || payment.dueDate || new Date().toISOString().split('T')[0],
              status: statusToUpdate,
              account: accountType,
              athlete_id: athleteId,
              is_recurring: !!asaasSubscriptionId,
              asaas_payment_id: asaasPaymentId,
              asaas_invoice_url: payment.invoiceUrl
            };
            const { error: insertErr } = await supabase.from('financial_transactions').insert(insertPayload);
            if (insertErr) {
               return NextResponse.json({ error: "Failed to auto-create subscription transaction.", details: insertErr }, { status: 500 });
            }
            return NextResponse.json({ success: true, message: "Transaction auto-created from subscription/payment" });
          }
        }
      }

      // If exists or fallback update
      const { error: updateError } = await supabase
        .from("financial_transactions")
        .update({ status: statusToUpdate })
        .or(orCondition);

      if (updateError) {
        console.error("Webhook update error:", updateError);
        return NextResponse.json({ error: "Failed to update internal record.", details: updateError }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message || "Unknown error parsing webhook" }, { status: 500 });
  }
}

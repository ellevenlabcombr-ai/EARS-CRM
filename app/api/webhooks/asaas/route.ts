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
      'PAYMENT_BANK_SLIP_CANCELLED'
    ];

    if (paidEvents.includes(event)) {
      statusToUpdate = "paid";
    } else if (cancelledEvents.includes(event)) {
      statusToUpdate = "cancelled";
    }

    if (statusToUpdate) {
      const supabase = getSupabaseClient();
      
      const { error: updateError } = await supabase
        .from("financial_transactions")
        .update({ status: statusToUpdate })
        .eq("asaas_payment_id", asaasPaymentId);

      if (updateError) {
        console.error("Webhook update error:", updateError);
        return NextResponse.json({ error: "Failed to update internal record." }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message || "Unknown error parsing webhook" }, { status: 500 });
  }
}

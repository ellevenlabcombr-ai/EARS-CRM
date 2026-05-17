import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase URL or Service Role Key");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    // If there is any signature verification needed, it can be implemented here.

    if (!payload.event) {
      return NextResponse.json({ error: "No event found in payload" }, { status: 400 });
    }

    const { event, payment } = payload;

    if (!payment || !payment.id) {
       return NextResponse.json({ error: "No payment object found" }, { status: 400 });
    }

    const asaasPaymentId = payment.id;
    let statusToUpdate = null;

    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      statusToUpdate = "paid";
    } else if (event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED") {
      statusToUpdate = "pending"; // Or some other status for refunded
    } else if (event === "PAYMENT_OVERDUE") {
      statusToUpdate = "pending"; // Late status could be mapped here later
    }

    if (statusToUpdate) {
      const supabaseAdmin = getSupabaseAdmin();
      // Find the transaction with this asaas_payment_id
      const { data: transaction, error: fetchError } = await supabaseAdmin
        .from("financial_transactions")
        .select("id")
        .eq("asaas_payment_id", asaasPaymentId)
        .maybeSingle();

      if (transaction?.id) {
        // Update the transaction status
        const { error: updateError } = await supabaseAdmin
          .from("financial_transactions")
          .update({ status: statusToUpdate })
          .eq("id", transaction.id);

        if (updateError) {
          console.error("Webhook update error:", updateError);
          return NextResponse.json({ error: "Failed to update internal record." }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message || "Unknown error parsing webhook" }, { status: 500 });
  }
}

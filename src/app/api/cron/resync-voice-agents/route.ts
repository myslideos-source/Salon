import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { retellProvider } from "@/lib/voice/providers/retell";
import { computeBoostedKeywords } from "@/lib/voice/boosted-keywords";

// Runs once a day via Vercel Cron (see vercel.json). The Retell agent's
// general_prompt is static text set at sync time — it opens with "Heute ist
// <weekday>, <date>" (see providers/retell.ts) so the agent can resolve
// relative dates like "morgen" correctly. Without a periodic re-sync that
// date silently goes stale the next day and every relative-date lookup
// breaks. This just re-runs the same sync every already-configured salon
// goes through when an admin clicks "Erneut übertragen" manually.
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET ist nicht gesetzt." }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("voice_settings")
    .select("salon_id, provider_agent_id, provider_llm_id, greeting, personality, voice_id, phone_number, forwarding_number, mention_prices, offer_alternatives, respect_employee_preference, offer_callback, detect_new_customers, send_confirmation_sms, salons(name, timezone)")
    .not("provider_agent_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "APP_URL ist nicht gesetzt." }, { status: 500 });
  }

  const results: { salonId: string; ok: boolean; error?: string }[] = [];

  for (const row of rows ?? []) {
    const salon = Array.isArray(row.salons) ? row.salons[0] : row.salons;
    if (!salon) {
      results.push({ salonId: row.salon_id, ok: false, error: "salon not found" });
      continue;
    }

    const boostedKeywords = await computeBoostedKeywords(supabase, row.salon_id);

    const result = await retellProvider.syncAgent(
      {
        salonId: row.salon_id,
        salonName: salon.name,
        timezone: salon.timezone,
        greeting: row.greeting,
        personality: row.personality,
        voiceId: row.voice_id,
        phoneNumber: row.phone_number,
        forwardingNumber: row.forwarding_number,
        rules: {
          mentionPrices: row.mention_prices,
          offerAlternatives: row.offer_alternatives,
          respectEmployeePreference: row.respect_employee_preference,
          offerCallback: row.offer_callback,
          detectNewCustomers: row.detect_new_customers,
          sendConfirmationSms: row.send_confirmation_sms,
        },
        webhookUrl: `${appUrl}/api/voice/webhook`,
        boostedKeywords,
      },
      { agentId: row.provider_agent_id, llmId: row.provider_llm_id }
    );

    if (result.ok) {
      await supabase
        .from("voice_settings")
        .update({ provider_agent_id: result.agentId, provider_llm_id: result.llmId, updated_at: new Date().toISOString() })
        .eq("salon_id", row.salon_id);
      results.push({ salonId: row.salon_id, ok: true });
    } else {
      results.push({ salonId: row.salon_id, ok: false, error: result.error });
    }
  }

  return NextResponse.json({ ok: true, resynced: results.length, results });
}

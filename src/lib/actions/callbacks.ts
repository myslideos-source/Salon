"use server";

// Manuelles Erfassen eines Rückrufwunschs durch das Unternehmen selbst
// (Dashboard-Schnellaktion "Rückruf erfassen", Konzeptabschnitt
// "Dashboard"). Bislang legte ausschließlich Mia per Voice-Tool
// `createCallbackRequest` (src/lib/voice/tools.ts) Zeilen in
// `callback_requests` an - dieselbe Tabelle, dieselbe Anzeigefläche unter
// /app/requests und /app/calls, nur ein zweiter, manueller Einstiegspunkt.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function createManualCallbackAction(params: {
  salonId: string;
  phone: string;
  reason?: string;
  customerId?: string | null;
  revalidate: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session, params.salonId) !== params.salonId) {
    return { ok: false, error: "Kein Zugriff auf dieses Unternehmen." };
  }
  const phone = params.phone.trim();
  if (!phone) return { ok: false, error: "Telefonnummer ist erforderlich." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("callback_requests")
    .insert({
      salon_id: params.salonId,
      customer_id: params.customerId ?? null,
      phone_number: phone,
      reason: params.reason?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Unbekannter Fehler." };

  await notify(supabase, {
    salonId: params.salonId,
    type: "callback_requested",
    title: `Rückruf erfasst: ${phone}`,
    body: params.reason?.trim() || undefined,
    entityType: "callback_request",
    entityId: data.id,
  });

  revalidatePath(params.revalidate);
  return { ok: true, data: { id: data.id } };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";

export async function updateCallbackStatusAction(
  salonId: string,
  callbackId: string,
  status: "open" | "contacted" | "resolved",
  revalidate: string
) {
  const supabase = await createClient();
  await supabase.from("callback_requests").update({ status }).eq("id", callbackId).eq("salon_id", salonId);
  revalidatePath(revalidate);
}

// "Interne Notizen" an einem Gespräch (Konzeptabschnitt "Gesprächsübersicht").
// `calls_update` erlaubt bereits jedem Salon-Mitglied ein UPDATE auf eigene
// Zeilen (0002_rls.sql) — keine neue RPC nötig, nur die zusätzliche
// Sitzungsprüfung hier auf Anwendungsebene (Vorbild: requests/customers).
export async function updateCallNotesAction(salonId: string, callId: string, notes: string, revalidate: string) {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session, salonId) !== salonId) throw new Error("Kein Zugriff auf dieses Unternehmen.");

  const supabase = await createClient();
  const { error } = await supabase.from("calls").update({ notes: notes.trim() || null }).eq("id", callId).eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath(revalidate);
}

// Rechtliche Aktivierung der Audioaufzeichnung (Konzeptabschnitt "Telefonie
// und Integrationen": "Aktiviere Audioaufzeichnung nicht automatisch.").
// Eigene, eng gefasste RPC statt einer breiten UPDATE-Policy auf
// voice_settings, das auch admin-only Felder (phone_number, provider_*)
// trägt — siehe update_call_recording_consent in Migration 0036.
export async function updateRecordingConsentAction(salonId: string, enabled: boolean, revalidate: string) {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session, salonId) !== salonId) throw new Error("Kein Zugriff auf dieses Unternehmen.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_call_recording_consent", {
    target_salon_id: salonId,
    p_recording_enabled: enabled,
  });
  if (error) throw new Error(error.message);
  revalidatePath(revalidate);
}

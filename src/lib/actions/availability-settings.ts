"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { businessHourSchema } from "@/lib/validation/salon";
import { businessHourExceptionSchema, bookingRulesSchema, callbackWindowSchema } from "@/lib/validation/team-resources";

export type ActionState = { error?: string; ok?: boolean } | null;

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function requireAvailabilityAccess(salonId: string): Promise<string | null> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session) !== salonId) return "Kein Zugriff auf dieses Unternehmen.";
  const allowed = await checkPermission(salonId, "manage_settings");
  if (!allowed) return "Dafür fehlt dir die Berechtigung.";
  return null;
}

// ── Reguläre Öffnungszeiten (self-service Gegenstück zu
// updateBusinessHoursAction in lib/actions/admin.ts) ────────────────────

export async function updateBusinessHoursSelfAction(salonId: string, formData: FormData): Promise<ActionState> {
  const denied = await requireAvailabilityAccess(salonId);
  if (denied) return { error: denied };

  const supabase = await createClient();

  const rows = Array.from({ length: 7 }, (_, weekday) => {
    const parsed = businessHourSchema.safeParse({
      weekday,
      is_closed: formData.get(`closed_${weekday}`) === "on",
      start_time: formData.get(`start_${weekday}`),
      end_time: formData.get(`end_${weekday}`),
    });
    if (!parsed.success) return null;
    return {
      salon_id: salonId,
      weekday,
      is_closed: parsed.data.is_closed,
      start_time: parsed.data.is_closed ? null : `${parsed.data.start_time}:00`,
      end_time: parsed.data.is_closed ? null : `${parsed.data.end_time}:00`,
    };
  }).filter(Boolean);

  const { error } = await supabase.from("business_hours").upsert(rows as never[], { onConflict: "salon_id,weekday" });
  if (error) return { error: error.message };
  revalidatePath("/app/availability");
  revalidatePath("/app/onboarding");
  return { ok: true };
}

// ── Feiertage & abweichende Öffnungszeiten ───────────────────────────────

export async function addBusinessHourExceptionAction(
  salonId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const denied = await requireAvailabilityAccess(salonId);
  if (denied) return { error: denied };

  const parsed = businessHourExceptionSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.from("business_hour_exceptions").insert({
    salon_id: salonId,
    location_id: parsed.data.location_id || null,
    date: parsed.data.date,
    is_closed: parsed.data.is_closed,
    start_time: parsed.data.is_closed ? null : `${parsed.data.start_time}:00`,
    end_time: parsed.data.is_closed ? null : `${parsed.data.end_time}:00`,
    note: parsed.data.note || null,
  });
  if (error) {
    return { error: error.code === "23505" ? "Für diesen Tag existiert bereits eine Ausnahme." : error.message };
  }
  revalidatePath("/app/availability");
  return { ok: true };
}

export async function deleteBusinessHourExceptionAction(salonId: string, id: string) {
  const denied = await requireAvailabilityAccess(salonId);
  if (denied) throw new Error(denied);
  const supabase = await createClient();
  const { error } = await supabase.from("business_hour_exceptions").delete().eq("id", id).eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/availability");
}

// ── Rückrufzeiträume ──────────────────────────────────────────────────────

export async function addCallbackWindowAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await requireAvailabilityAccess(salonId);
  if (denied) return { error: denied };

  const parsed = callbackWindowSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  if (parsed.data.start_time >= parsed.data.end_time) return { error: "Startzeit muss vor Endzeit liegen." };

  const supabase = await createClient();
  const { error } = await supabase.from("callback_windows").insert({
    salon_id: salonId,
    weekday: parsed.data.weekday,
    start_time: `${parsed.data.start_time}:00`,
    end_time: `${parsed.data.end_time}:00`,
  });
  if (error) return { error: error.message };
  revalidatePath("/app/availability");
  return { ok: true };
}

export async function deleteCallbackWindowAction(salonId: string, id: string) {
  const denied = await requireAvailabilityAccess(salonId);
  if (denied) throw new Error(denied);
  const supabase = await createClient();
  const { error } = await supabase.from("callback_windows").delete().eq("id", id).eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/availability");
}

// ── Buchungsregeln (Vorlauf, Buchungszeitraum, Intervalle, parallele
// Termine, maximale Termine pro Tag) — enge RPC statt breiter
// UPDATE-Policy, weil `salons` auch geschützte Felder trägt (status, slug,
// ai_active) — siehe update_own_booking_rules in
// 0031_self_service_team_resources_availability.sql. ──────────────────────

export async function updateBookingRulesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session);
  if (!salonId) return { error: "Kein Unternehmen gefunden." };

  const parsed = bookingRulesSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_booking_rules", {
    target_salon_id: salonId,
    p_slot_granularity_minutes: parsed.data.slot_granularity_minutes,
    p_earliest_booking_lead_minutes: parsed.data.earliest_booking_lead_minutes,
    p_max_advance_booking_days: parsed.data.max_advance_booking_days,
    // Postgres accepts null for these optional int params even though the
    // generated type doesn't know that (no `| null` in its signature,
    // same mismatch as p_custom_prompt in salon-voice-settings.ts).
    p_max_parallel_appointments: (parsed.data.max_parallel_appointments ?? null) as number,
    p_max_appointments_per_day: (parsed.data.max_appointments_per_day ?? null) as number,
  });
  if (error) return { error: error.message };
  revalidatePath("/app/availability");
  return { ok: true };
}

"use server";

// Minimaler, manueller Einstiegspunkt in die seit dem Sonderauftrag
// "Datenmodell, Mandantenfähigkeit und Berechtigungen" bestehende, bislang
// ungenutzte `requests`-Tabelle - genügt für die Dashboard-Schnellaktion
// "Anfrage erstellen" (Konzeptabschnitt "Dashboard"). Die vollständige
// Anfragen-Domäne (eigene Listenoberfläche mit Status-Workflow, Anhängen,
// zuständigem Mitarbeiter) ist bewusst NICHT Teil dieses Schritts - siehe
// docs/HALLOMIA_UMSETZUNGSPLAN.md, Phase 8, dort als eigener, ähnlich
// großer Auftrag vorgesehen.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { notify } from "@/lib/notifications/notify";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const QUICK_REQUEST_CATEGORIES = ["general", "quote", "complaint", "information", "other"] as const;
export const QUICK_REQUEST_URGENCIES = ["low", "normal", "high", "urgent"] as const;
export type QuickRequestCategory = (typeof QUICK_REQUEST_CATEGORIES)[number];
export type QuickRequestUrgency = (typeof QUICK_REQUEST_URGENCIES)[number];

export async function createQuickRequestAction(params: {
  salonId: string;
  category: QuickRequestCategory;
  subject: string;
  description?: string;
  contactName?: string;
  contactPhone?: string;
  urgency: QuickRequestUrgency;
  customerId?: string | null;
  revalidate: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session, params.salonId) !== params.salonId) {
    return { ok: false, error: "Kein Zugriff auf dieses Unternehmen." };
  }
  const subject = params.subject.trim();
  if (!subject) return { ok: false, error: "Betreff ist erforderlich." };

  const allowed = await checkPermission(params.salonId, "manage_requests");
  if (!allowed) return { ok: false, error: "Dafür fehlt dir die Berechtigung." };

  const supabase = await createClient();
  const contactLine = [params.contactName?.trim(), params.contactPhone?.trim()].filter(Boolean).join(" · ");
  const description = [contactLine ? `Kontakt: ${contactLine}` : null, params.description?.trim() || null]
    .filter(Boolean)
    .join("\n\n");

  const { data, error } = await supabase
    .from("requests")
    .insert({
      salon_id: params.salonId,
      customer_id: params.customerId ?? null,
      category: params.category,
      subject,
      description: description || null,
      urgency: params.urgency,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Unbekannter Fehler." };

  const urgent = params.urgency === "high" || params.urgency === "urgent";
  await notify(supabase, {
    salonId: params.salonId,
    type: urgent ? "urgent_request" : "request_unresolved",
    title: `${urgent ? "Dringende Anfrage" : "Neue Anfrage"}: ${subject}`,
    body: contactLine || undefined,
    entityType: "request",
    entityId: data.id,
  });

  revalidatePath(params.revalidate);
  return { ok: true, data: { id: data.id } };
}

import "server-only";
import type { DbClient } from "@/lib/scheduling/engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailConfigured, sendNotificationEmail } from "./providers/email";
import type { NotificationEventType } from "./types";

export type NotifyParams = {
  salonId: string;
  type: NotificationEventType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
};

/**
 * Schreibt eine In-App-Benachrichtigung und stößt (best effort) den
 * E-Mail-Versand an — die Benachrichtigungsgrundlage aus dem
 * Konzeptabschnitt "Benachrichtigungen". Wird von den zentralen
 * Buchungs-/Rückruf-/Anfragen-Aktionen aufgerufen (Muster:
 * `sendAppointmentConfirmationSms`) und darf den aufrufenden Vorgang
 * niemals scheitern lassen — ein Benachrichtigungsfehler ist kein Grund,
 * einen bereits erfolgreichen Termin/Rückruf/Anfrage abzubrechen.
 */
export async function notify(supabase: DbClient, params: NotifyParams): Promise<void> {
  const log = (msg: string) => console.log(`[notify] ${msg} (salon ${params.salonId}, type ${params.type})`);

  try {
    const { error } = await supabase.from("notifications").insert({
      salon_id: params.salonId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      channel: "in_app",
    });
    if (error) log(`In-App-Benachrichtigung fehlgeschlagen: ${error.message}`);
  } catch (e) {
    log(`In-App-Benachrichtigung fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`);
  }

  // E-Mail-Fanout läuft unabhängig von der In-App-Zeile weiter, auch wenn
  // diese fehlschlug - beide Kanäle sind voneinander unabhängige
  // Best-effort-Zustellungen.
  try {
    await deliverEmail(params);
  } catch (e) {
    log(`E-Mail-Zustellung fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function deliverEmail(params: NotifyParams): Promise<void> {
  if (!isEmailConfigured()) return; // nicht eingerichtet -> stiller Verzicht, wie bei fehlendem Twilio

  const admin = createAdminClient();

  const [{ data: members }, { data: prefs }] = await Promise.all([
    admin.from("salon_users").select("user_id").eq("salon_id", params.salonId),
    admin
      .from("notification_preferences")
      .select("user_id, enabled")
      .eq("salon_id", params.salonId)
      .eq("event_type", params.type)
      .eq("channel", "email"),
  ]);
  if (!members || members.length === 0) return;

  const prefByUser = new Map((prefs ?? []).map((p) => [p.user_id, p.enabled]));
  const subject = params.title;
  const text = params.body ? `${params.title}\n\n${params.body}` : params.title;

  await Promise.all(
    members.map(async (member) => {
      // Ohne explizite Präferenz-Zeile ist der Kanal standardmäßig aktiv
      // (Opt-out statt Opt-in), damit Benachrichtigungen nicht lautlos
      // ins Leere laufen, bevor jemand die Einstellungen überhaupt geöffnet hat.
      const enabled = prefByUser.get(member.user_id) ?? true;
      if (!enabled) return;

      const { data: userRes } = await admin.auth.admin.getUserById(member.user_id);
      const email = userRes?.user?.email;
      if (!email) return;

      await sendNotificationEmail(email, subject, text);
    })
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { NOTIFICATION_CHANNEL_AVAILABLE, type NotificationChannel, type NotificationEventType } from "@/lib/notifications/types";

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  await requireSalonSession();
  const supabase = await createClient();
  await supabase.rpc("mark_notification_read", { p_notification_id: notificationId });
}

export async function markAllNotificationsReadAction(salonId: string): Promise<void> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session, salonId) !== salonId) throw new Error("Kein Zugriff auf dieses Unternehmen.");
  const supabase = await createClient();
  await supabase.rpc("mark_all_notifications_read", { target_salon_id: salonId });
}

/**
 * Setzt die Kanal-Präferenz des eingeloggten Nutzers für einen
 * Ereignistyp (Konzeptabschnitt "Benachrichtigungen": "Berechtigungen
 * müssen konfigurierbar sein" — hier auf Kanal-Ebene). SMS/Push sind
 * bewusst nicht aktivierbar (siehe NOTIFICATION_CHANNEL_AVAILABLE), da
 * dafür keine echte technische Anbindung besteht.
 */
export async function setNotificationPreferenceAction(
  salonId: string,
  eventType: NotificationEventType,
  channel: NotificationChannel,
  enabled: boolean,
  redirectPath: string
): Promise<void> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session, salonId) !== salonId) throw new Error("Kein Zugriff auf dieses Unternehmen.");
  if (!NOTIFICATION_CHANNEL_AVAILABLE[channel]) throw new Error("Dieser Kanal ist noch nicht eingerichtet.");

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) throw new Error("Nicht angemeldet.");

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      { salon_id: salonId, user_id: userId, event_type: eventType, channel, enabled },
      { onConflict: "salon_id,user_id,event_type,channel" }
    );
  if (error) throw new Error(error.message);
  revalidatePath(redirectPath);
}

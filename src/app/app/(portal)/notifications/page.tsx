import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

export default async function SalonNotificationsPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;

  const [{ data: notifications }, { data: preferences }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, created_at, read_at")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: false })
      .limit(100),
    userId
      ? supabase.from("notification_preferences").select("event_type, channel, enabled").eq("salon_id", salonId).eq("user_id", userId)
      : Promise.resolve({ data: [] as { event_type: string; channel: string; enabled: boolean }[] }),
  ]);

  return (
    <div>
      <Topbar title="Benachrichtigungen" subtitle="Alle Ereignisse und deine persönlichen Kanal-Einstellungen." avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-3xl">
        <NotificationsList salonId={salonId} notifications={notifications ?? []} />
        <NotificationPreferencesForm salonId={salonId} redirectPath="/app/notifications" preferences={preferences ?? []} />
      </div>
    </div>
  );
}

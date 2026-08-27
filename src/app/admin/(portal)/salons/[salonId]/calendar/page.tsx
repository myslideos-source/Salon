import { createClient } from "@/lib/supabase/server";
import { CalendarShell } from "@/components/calendar/calendar-shell";
import { ADMIN_AVATAR_URL } from "@/lib/utils";

export default async function AdminSalonCalendarPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = await createClient();
  const [{ data: salon }, { data: services }] = await Promise.all([
    supabase.from("salons").select("slot_granularity_minutes").eq("id", salonId).single(),
    supabase
      .from("services")
      .select("id, name, duration_minutes, price_cents, color")
      .eq("salon_id", salonId)
      .eq("active", true)
      .order("sort_order"),
  ]);

  return (
    <CalendarShell
      salonId={salonId}
      basePath={`/admin/salons/${salonId}/calendar`}
      appointmentsHref="/admin/appointments"
      services={services ?? []}
      slotGranularity={salon?.slot_granularity_minutes ?? 15}
      canEdit
      avatarLabel="Admin"
      avatarImageUrl={ADMIN_AVATAR_URL}
    />
  );
}

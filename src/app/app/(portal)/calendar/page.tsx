import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { CalendarShell } from "@/components/calendar/calendar-shell";

export default async function SalonCalendarPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
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
      basePath="/app/calendar"
      appointmentsHref="/app/appointments"
      services={services ?? []}
      slotGranularity={salon?.slot_granularity_minutes ?? 15}
      canEdit
      avatarLabel={session.email ?? "Salon"}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { OpeningHoursForm } from "@/components/availability/opening-hours-form";
import { ExceptionsManager } from "@/components/availability/exceptions-manager";
import { CallbackWindowsManager } from "@/components/availability/callback-windows-manager";
import { BookingRulesForm } from "@/components/availability/booking-rules-form";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export default async function AvailabilityPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const [{ data: businessHours }, { data: exceptions }, { data: callbackWindows }, { data: locations }, { data: salon }, canManage] =
    await Promise.all([
      supabase.from("business_hours").select("weekday, is_closed, start_time, end_time").eq("salon_id", salonId).order("weekday"),
      supabase.from("business_hour_exceptions").select("*").eq("salon_id", salonId).gte("date", new Date().toISOString().slice(0, 10)).order("date"),
      supabase.from("callback_windows").select("*").eq("salon_id", salonId).order("weekday"),
      supabase.from("locations").select("id, name").eq("salon_id", salonId).order("sort_order"),
      supabase
        .from("salons")
        .select("slot_granularity_minutes, earliest_booking_lead_minutes, max_advance_booking_days, max_parallel_appointments, max_appointments_per_day")
        .eq("id", salonId)
        .single(),
      checkPermission(salonId, "manage_settings"),
    ]);

  const rows = WEEKDAYS.map((label, weekday) => {
    const row = (businessHours ?? []).find((b) => b.weekday === weekday);
    return { weekday, label, is_closed: row?.is_closed, start_time: row?.start_time, end_time: row?.end_time };
  });

  return (
    <div>
      <Topbar
        title="Verfügbarkeit"
        subtitle="Öffnungszeiten, Feiertage, Buchungsregeln und Rückrufzeiträume."
        avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL}
      />
      <div className="max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader title="Reguläre Öffnungszeiten" subtitle="Gelten für alle Standorte, sofern keine Ausnahme greift." />
          <div className="p-5 pt-4">
            <OpeningHoursForm salonId={salonId} rows={rows} canManage={canManage} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Feiertage & abweichende Öffnungszeiten" subtitle="Einzelne Tage, an denen die regulären Öffnungszeiten nicht gelten." />
          <div className="p-5 pt-4">
            <ExceptionsManager salonId={salonId} exceptions={(exceptions ?? []) as never[]} locations={locations ?? []} canManage={canManage} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Buchungsregeln" subtitle="Vorlauf, Buchungszeitraum, Intervalle sowie parallele und tägliche Terminlimits." />
          <div className="p-5 pt-4">
            <BookingRulesForm
              rules={{
                slot_granularity_minutes: salon?.slot_granularity_minutes ?? 15,
                earliest_booking_lead_minutes: salon?.earliest_booking_lead_minutes ?? 60,
                max_advance_booking_days: salon?.max_advance_booking_days ?? 60,
                max_parallel_appointments: salon?.max_parallel_appointments ?? null,
                max_appointments_per_day: salon?.max_appointments_per_day ?? null,
              }}
              canManage={canManage}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Rückrufzeiträume" subtitle="Wann Mia Kund:innen für einen Rückruf zurückrufen darf." />
          <div className="p-5 pt-4">
            <CallbackWindowsManager salonId={salonId} windows={callbackWindows ?? []} canManage={canManage} />
          </div>
        </Card>
      </div>
    </div>
  );
}

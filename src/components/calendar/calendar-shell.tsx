"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, BellRing } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { DayView } from "./day-view";
import { WeekGrid } from "./week-grid";
import { MonthGrid } from "./month-grid";
import { MobileAgenda } from "./mobile-agenda";
import { MobileDateStrip } from "./mobile-date-strip";
import { MiniMonthCalendar } from "./mini-month-calendar";
import { TodayAppointmentsCard } from "./today-appointments-card";
import { WeekStatsCard } from "./week-stats-card";
import { EmployeeFilter } from "./employee-filter";
import { NewAppointmentModal } from "./new-appointment-modal";
import { CalendarFeedCard } from "@/components/portal/calendar-feed-card";
import {
  getDayCalendarDataAction,
  getSalonEmployeesAction,
  type CalendarAppointment,
  type CalendarEmployee,
} from "@/lib/actions/calendar-data";
import { addDaysStr, formatDayLabel, formatMonthLabel, formatWeekRange, startOfWeekStr, todayStr, weekDatesFrom } from "@/lib/date";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Service = { id: string; name: string; duration_minutes: number; price_cents: number; color: string };
type View = "day" | "week" | "month";

export function CalendarShell({
  salonId,
  basePath,
  appointmentsHref,
  services,
  slotGranularity,
  canEdit,
  avatarLabel,
  initialDate,
  showCalendarFeed,
}: {
  salonId: string;
  basePath: string;
  appointmentsHref: string;
  services: Service[];
  slotGranularity: number;
  canEdit: boolean;
  avatarLabel: string;
  initialDate?: string;
  /** Salon-portal self-service ICS calendar-subscription card - not shown
   * in the admin calendar, which manages many salons at once. */
  showCalendarFeed?: boolean;
}) {
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(initialDate ?? todayStr());
  const [mobileDate, setMobileDate] = useState(initialDate ?? todayStr());
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState<{
    timezone: string;
    employees: CalendarEmployee[];
    appointments: CalendarAppointment[];
    businessHours: { isClosed: boolean; startTime: string | null; endTime: string | null } | null;
  } | null>(null);
  const [mobileDayData, setMobileDayData] = useState<typeof dayData>(null);
  const [employees, setEmployees] = useState<CalendarEmployee[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState<Set<string>>(new Set());
  const [showNew, setShowNew] = useState(false);
  const [weekRefreshKey, setWeekRefreshKey] = useState(0);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getDayCalendarDataAction(salonId, date).then((res) => {
      setDayData(res);
      setLoading(false);
    });
  }, [salonId, date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on view/date change
    if (view === "day") load();
  }, [view, load]);

  useEffect(() => {
    getSalonEmployeesAction(salonId).then(setEmployees);
  }, [salonId]);

  // On mobile, "Woche" renders as an agenda for one selected day within the
  // week, fetched the same way as the day view.
  useEffect(() => {
    if (view !== "week") return;
    getDayCalendarDataAction(salonId, mobileDate).then(setMobileDayData);
  }, [salonId, mobileDate, view, weekRefreshKey]);

  const viewRef = useRef(view);
  const loadRef = useRef(load);
  useEffect(() => {
    viewRef.current = view;
    loadRef.current = load;
  }, [view, load]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`appointments-${salonId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `salon_id=eq.${salonId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLiveNotice("Neuer Termin eingegangen");
            setTimeout(() => setLiveNotice(null), 5000);
          }
          if (viewRef.current === "day") loadRef.current();
          setWeekRefreshKey((k) => k + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId]);

  const weekStart = startOfWeekStr(date);
  const weekDates = weekDatesFrom(weekStart);

  function step(dir: 1 | -1) {
    if (view === "day") setDate((d) => addDaysStr(d, dir));
    else if (view === "week") setDate((d) => addDaysStr(d, dir * 7));
    else setDate((d) => addDaysStr(d, dir * 30));
  }

  const dateLabel =
    view === "day" ? formatDayLabel(date) : view === "week" ? formatWeekRange(weekStart) : formatMonthLabel(date);

  return (
    <div className="max-w-full overflow-x-hidden">
      <Topbar
        title="Kalender"
        subtitle="Behalte alle Termine im Blick."
        avatarLabel={avatarLabel}
        right={
          canEdit && (
            <button
              onClick={() => setShowNew(true)}
              aria-label="Neuer Termin"
              className="brand-gradient-bg flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(169,112,255,0.25)] transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Neuer Termin</span>
            </button>
          )
        }
      />

      {showCalendarFeed && <CalendarFeedCard />}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => step(-1)} aria-label="Vorheriger Zeitraum" className="rounded-lg p-1.5 text-ink-soft hover:bg-sand">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => step(1)} aria-label="Nächster Zeitraum" className="rounded-lg p-1.5 text-ink-soft hover:bg-sand">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="font-display text-base capitalize text-ink sm:text-lg">{dateLabel}</span>
          {date !== todayStr() && (
            <button
              onClick={() => {
                setDate(todayStr());
                setMobileDate(todayStr());
              }}
              className="rounded-lg border border-border-strong px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-sand"
            >
              Heute
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border-strong p-0.5">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  view === v
                    ? "brand-gradient-bg text-white shadow-[0_0_10px_rgba(169,112,255,0.35)]"
                    : "text-ink-soft hover:bg-sand"
                )}
              >
                {v === "day" ? "Tag" : v === "week" ? "Woche" : "Monat"}
              </button>
            ))}
          </div>
          <EmployeeFilter employees={employees} selected={employeeFilter} onChange={setEmployeeFilter} />
        </div>
      </div>

      {view === "week" && (
        <div className="border-b border-border py-3 lg:hidden">
          <MobileDateStrip dates={weekDates} selectedDate={mobileDate} onSelect={setMobileDate} />
        </div>
      )}

      {liveNotice && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-bronze/30 bg-bronze-soft px-3 py-2 text-sm text-bronze-dark sm:mx-6 lg:mx-8">
          <BellRing className="h-4 w-4 shrink-0" />
          {liveNotice}
        </div>
      )}

      <div className="lg:flex lg:items-start">
        <div className="min-w-0 flex-1">
          {view === "day" &&
            (loading || !dayData ? (
              <div className="p-10 text-center text-sm text-ink-faint">Kalender wird geladen…</div>
            ) : (
              <DayView
                salonId={salonId}
                date={date}
                timezone={dayData.timezone}
                employees={employeeFilter.size > 0 ? dayData.employees.filter((e) => employeeFilter.has(e.id)) : dayData.employees}
                services={services}
                appointments={dayData.appointments}
                businessHours={dayData.businessHours}
                slotGranularity={slotGranularity}
                canEdit={canEdit}
                revalidatePath={basePath}
                onChanged={load}
              />
            ))}

          {view === "week" && (
            <>
              <div className="hidden lg:block">
                <WeekGrid
                  salonId={salonId}
                  dates={weekDates}
                  timezone={dayData?.timezone ?? "Europe/Berlin"}
                  services={services}
                  slotGranularity={slotGranularity}
                  canEdit={canEdit}
                  revalidatePath={basePath}
                  employeeFilter={employeeFilter}
                  refreshKey={weekRefreshKey}
                  onSelectDay={(d) => {
                    setDate(d);
                    setView("day");
                  }}
                />
              </div>
              <div className="lg:hidden">
                {!mobileDayData ? (
                  <div className="p-10 text-center text-sm text-ink-faint">Kalender wird geladen…</div>
                ) : (
                  <MobileAgenda
                    salonId={salonId}
                    date={mobileDate}
                    timezone={mobileDayData.timezone}
                    employees={employeeFilter.size > 0 ? mobileDayData.employees.filter((e) => employeeFilter.has(e.id)) : mobileDayData.employees}
                    appointments={
                      employeeFilter.size > 0
                        ? mobileDayData.appointments.filter((a) => employeeFilter.has(a.employeeId))
                        : mobileDayData.appointments
                    }
                    canEdit={canEdit}
                    revalidatePath={basePath}
                    onChanged={() => getDayCalendarDataAction(salonId, mobileDate).then(setMobileDayData)}
                  />
                )}
                <div className="px-4 pb-24 sm:px-6">
                  <WeekStatsCard salonId={salonId} dates={weekDates} refreshKey={weekRefreshKey} />
                </div>
              </div>
            </>
          )}

          {view === "month" && (
            <MonthGrid
              salonId={salonId}
              monthDate={date}
              refreshKey={weekRefreshKey}
              onSelectDay={(d) => {
                setDate(d);
                setMobileDate(d);
                setView("day");
              }}
            />
          )}
        </div>

        <aside className="hidden w-72 shrink-0 space-y-4 border-l border-border p-4 lg:block">
          <MiniMonthCalendar
            salonId={salonId}
            selectedDate={date}
            onSelectDate={(d) => {
              setDate(d);
              setMobileDate(d);
            }}
          />
          <TodayAppointmentsCard
            salonId={salonId}
            timezone={dayData?.timezone ?? "Europe/Berlin"}
            refreshKey={weekRefreshKey}
            appointmentsHref={appointmentsHref}
          />
          <WeekStatsCard salonId={salonId} dates={weekDates} refreshKey={weekRefreshKey} />
        </aside>
      </div>

      {canEdit && (
        <button
          onClick={() => setShowNew(true)}
          aria-label="Neuer Termin"
          className="brand-gradient-bg fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_4px_24px_rgba(169,112,255,0.5)] lg:hidden"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {showNew && (
        <NewAppointmentModal
          salonId={salonId}
          date={view === "week" ? mobileDate : date}
          timezone={dayData?.timezone ?? mobileDayData?.timezone ?? "Europe/Berlin"}
          employees={employees}
          services={services}
          defaultEmployeeId={employees[0]?.id ?? ""}
          defaultStartAt={`${view === "week" ? mobileDate : date}T09:00:00`}
          revalidatePath={basePath}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            load();
            setWeekRefreshKey((k) => k + 1);
            getDayCalendarDataAction(salonId, mobileDate).then(setMobileDayData);
          }}
        />
      )}
    </div>
  );
}

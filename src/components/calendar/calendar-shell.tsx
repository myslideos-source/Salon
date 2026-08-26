"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { DayView } from "./day-view";
import { WeekView } from "./week-view";
import { NewAppointmentModal } from "./new-appointment-modal";
import { getDayCalendarDataAction, type CalendarAppointment, type CalendarEmployee } from "@/lib/actions/calendar-data";
import { addDaysStr, formatDayLabel, formatWeekRange, startOfWeekStr, todayStr, weekDatesFrom } from "@/lib/date";
import { cn } from "@/lib/utils";

type Service = { id: string; name: string; duration_minutes: number; price_cents: number; color: string };

export function CalendarShell({
  salonId,
  basePath,
  services,
  slotGranularity,
  canEdit,
  avatarLabel,
  initialDate,
}: {
  salonId: string;
  basePath: string;
  services: Service[];
  slotGranularity: number;
  canEdit: boolean;
  avatarLabel: string;
  initialDate?: string;
}) {
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState(initialDate ?? todayStr());
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState<{
    timezone: string;
    employees: CalendarEmployee[];
    appointments: CalendarAppointment[];
    businessHours: { isClosed: boolean; startTime: string | null; endTime: string | null } | null;
  } | null>(null);
  const [showNew, setShowNew] = useState(false);

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

  const weekStart = startOfWeekStr(date);
  const weekDates = weekDatesFrom(weekStart);

  return (
    <div>
      <Topbar
        title="Kalender"
        avatarLabel={avatarLabel}
        right={
          canEdit && (
            <Button variant="bronze" size="sm" onClick={() => setShowNew(true)} aria-label="Neuer Termin">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Neuer Termin</span>
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDate((d) => addDaysStr(d, view === "day" ? -1 : -7))}
              aria-label="Vorheriger Zeitraum"
              className="rounded-lg p-1.5 text-ink-soft hover:bg-sand"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDate((d) => addDaysStr(d, view === "day" ? 1 : 7))}
              aria-label="Nächster Zeitraum"
              className="rounded-lg p-1.5 text-ink-soft hover:bg-sand"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="font-display text-base text-ink sm:text-lg">
            {view === "day" ? formatDayLabel(date) : formatWeekRange(weekStart)}
          </span>
          {date !== todayStr() && (
            <button
              onClick={() => setDate(todayStr())}
              className="rounded-lg border border-border-strong px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-sand"
            >
              Heute
            </button>
          )}
        </div>
        <div className="flex rounded-lg border border-border-strong p-0.5">
          {(["week", "day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                view === v ? "bg-ink text-cream" : "text-ink-soft hover:bg-sand"
              )}
            >
              {v === "week" ? "Woche" : "Tag"}
            </button>
          ))}
        </div>
      </div>

      {view === "week" ? (
        <WeekView
          salonId={salonId}
          dates={weekDates}
          timezone={dayData?.timezone ?? "Europe/Berlin"}
          onSelectDay={(d) => {
            setDate(d);
            setView("day");
          }}
        />
      ) : loading || !dayData ? (
        <div className="p-10 text-center text-sm text-ink-faint">Kalender wird geladen…</div>
      ) : (
        <DayView
          salonId={salonId}
          date={date}
          timezone={dayData.timezone}
          employees={dayData.employees}
          services={services}
          appointments={dayData.appointments}
          businessHours={dayData.businessHours}
          slotGranularity={slotGranularity}
          canEdit={canEdit}
          revalidatePath={basePath}
          onChanged={load}
        />
      )}

      {showNew && dayData && (
        <NewAppointmentModal
          salonId={salonId}
          date={date}
          timezone={dayData.timezone}
          employees={dayData.employees}
          services={services}
          defaultEmployeeId={dayData.employees[0]?.id ?? ""}
          defaultStartAt={`${date}T09:00:00`}
          revalidatePath={basePath}
          onClose={() => setShowNew(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}

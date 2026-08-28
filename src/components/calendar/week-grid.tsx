"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AppointmentCard } from "./appointment-card";
import { AppointmentDetailModal } from "./appointment-detail-modal";
import { NewAppointmentModal } from "./new-appointment-modal";
import { rescheduleAppointmentAction, resizeAppointmentAction } from "@/lib/actions/appointments";
import { getWeekCalendarDataAction, type CalendarAppointment, type CalendarEmployee, type CalendarBusinessHours } from "@/lib/actions/calendar-data";
import { formatWeekdayShort, formatDayNum, todayStr } from "@/lib/date";
import { cn } from "@/lib/utils";
import { matchesCalendarFilters, type CalendarFilters } from "@/lib/scheduling/calendar-filters";

const PX_PER_HOUR = 56;
const PX_PER_MIN = PX_PER_HOUR / 60;
const DEFAULT_WINDOW_START = 8 * 60;
const DEFAULT_WINDOW_END = 20 * 60;

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Assigns each time-overlapping appointment a column/columns-in-cluster pair
// so concurrent appointments from different employees render side-by-side
// instead of stacked directly on top of each other. Standard greedy-column
// sweep: sort by start, pack into the first column whose last appointment
// has already ended, and every appointment sharing a connected overlap
// chain ("cluster") gets the cluster's max simultaneous column count.
function layoutOverlaps(items: { id: string; start: number; end: number }[]) {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const result = new Map<string, { col: number; cols: number }>();
  let clusterIds: string[] = [];
  let clusterEnd = -Infinity;
  let columnEnds: number[] = [];

  function flushCluster() {
    for (const id of clusterIds) {
      const entry = result.get(id);
      if (entry) entry.cols = columnEnds.length;
    }
    clusterIds = [];
    columnEnds = [];
  }

  for (const item of sorted) {
    if (item.start >= clusterEnd) {
      flushCluster();
      clusterEnd = -Infinity;
    }
    let col = columnEnds.findIndex((end) => end <= item.start);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(item.end);
    } else {
      columnEnds[col] = item.end;
    }
    result.set(item.id, { col, cols: 0 });
    clusterIds.push(item.id);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flushCluster();

  return result;
}

type Service = { id: string; name: string; duration_minutes: number; price_cents: number; color: string };

export function WeekGrid({
  salonId,
  dates,
  timezone: timezoneProp,
  services,
  slotGranularity,
  canEdit,
  revalidatePath,
  filters,
  refreshKey,
  onSelectDay,
}: {
  salonId: string;
  dates: string[];
  timezone: string;
  services: Service[];
  slotGranularity: number;
  canEdit: boolean;
  revalidatePath: string;
  filters: CalendarFilters;
  refreshKey?: number;
  onSelectDay: (date: string) => void;
}) {
  const [data, setData] = useState<{
    timezone: string;
    employees: CalendarEmployee[];
    appointments: CalendarAppointment[];
    businessHoursByDate: Record<string, CalendarBusinessHours | null>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const datesKey = dates.join(",");
  const load = useCallback(() => {
    setLoading(true);
    getWeekCalendarDataAction(salonId, dates).then((res) => {
      setData(res);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId, datesKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on date range/refresh change
    load();
  }, [load, refreshKey]);

  const timezone = data?.timezone ?? timezoneProp;
  const employeesById = useMemo(() => new Map((data?.employees ?? []).map((e) => [e.id, e])), [data]);

  const { windowStart, windowEnd } = useMemo(() => {
    let start = DEFAULT_WINDOW_START;
    let end = DEFAULT_WINDOW_END;
    if (data) {
      for (const date of dates) {
        const bh = data.businessHoursByDate[date];
        if (bh && !bh.isClosed && bh.startTime && bh.endTime) {
          start = Math.min(start, Math.floor(timeToMinutes(bh.startTime) / 60) * 60);
          end = Math.max(end, Math.ceil(timeToMinutes(bh.endTime) / 60) * 60);
        }
      }
    }
    return { windowStart: start, windowEnd: end };
  }, [data, dates]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let m = windowStart; m <= windowEnd; m += 60) list.push(m);
    return list;
  }, [windowStart, windowEnd]);

  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [drag, setDrag] = useState<{ id: string; date: string; deltaMinutes: number } | null>(null);
  const [resize, setResize] = useState<{ id: string; deltaMinutes: number } | null>(null);
  const [detail, setDetail] = useState<CalendarAppointment | null>(null);
  const [newAppt, setNewAppt] = useState<{ date: string; employeeId: string; startAt: string } | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const today = todayStr();
  const nowMinutes = (() => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return h * 60 + m;
  })();

  const apptMinutes = useCallback(
    (iso: string) => {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(
        new Date(iso)
      );
      const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
      const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
      return h * 60 + m;
    },
    [timezone]
  );

  const localDateOf = useCallback(
    (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso)),
    [timezone]
  );

  function appointmentsForDate(date: string) {
    return (data?.appointments ?? []).filter((a) => {
      if (localDateOf(a.startAt) !== date) return false;
      return matchesCalendarFilters(a, employeesById.get(a.employeeId)?.locationId, filters);
    });
  }

  function handlePointerDown(e: React.PointerEvent, appt: CalendarAppointment, date: string) {
    if (!canEdit || appt.status !== "booked") return;
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    let currentDelta = 0;
    setDrag({ id: appt.id, date, deltaMinutes: 0 });

    function onMove(ev: PointerEvent) {
      const deltaPx = ev.clientY - startY;
      const rawDelta = deltaPx / PX_PER_MIN;
      currentDelta = Math.round(rawDelta / slotGranularity) * slotGranularity;
      setDrag({ id: appt.id, date, deltaMinutes: currentDelta });
    }

    async function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDrag(null);
      if (currentDelta === 0) return;
      const newStartAt = new Date(new Date(appt.startAt).getTime() + currentDelta * 60_000).toISOString();
      const result = await rescheduleAppointmentAction({
        salonId,
        appointmentId: appt.id,
        newEmployeeId: appt.employeeId,
        newStartAt,
        revalidate: revalidatePath,
      });
      if (!result.ok) alert("Dieser Zeitraum ist nicht verfügbar.");
      load();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleResizePointerDown(e: React.PointerEvent, appt: CalendarAppointment) {
    if (!canEdit || appt.status !== "booked") return;
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const originalMinutes = apptMinutes(appt.endAt) - apptMinutes(appt.startAt);
    let currentDelta = 0;
    setResize({ id: appt.id, deltaMinutes: 0 });

    function onMove(ev: PointerEvent) {
      const deltaPx = ev.clientY - startY;
      const rawDelta = deltaPx / PX_PER_MIN;
      const rounded = Math.round(rawDelta / slotGranularity) * slotGranularity;
      currentDelta = Math.max(rounded, slotGranularity - originalMinutes);
      setResize({ id: appt.id, deltaMinutes: currentDelta });
    }

    async function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setResize(null);
      if (currentDelta === 0) return;
      const result = await resizeAppointmentAction({
        salonId,
        appointmentId: appt.id,
        newDurationMinutes: originalMinutes + currentDelta,
        revalidate: revalidatePath,
      });
      if (!result.ok) alert(result.error || "Dieser Zeitraum ist nicht verfügbar.");
      load();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleColumnClick(e: React.MouseEvent, date: string) {
    if (!canEdit || !data || data.employees.length === 0) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = windowStart + Math.round(y / PX_PER_MIN / slotGranularity) * slotGranularity;
    const [h, m] = [Math.floor(minutes / 60), minutes % 60];
    const employeeId = filters.employeeIds.size === 1 ? [...filters.employeeIds][0] : data.employees[0].id;
    setNewAppt({ date, employeeId, startAt: `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00` });
  }

  const gridHeight = (windowEnd - windowStart) * PX_PER_MIN;

  if (loading && !data) {
    return <div className="p-10 text-center text-sm text-ink-faint">Kalender wird geladen…</div>;
  }

  return (
    <div className="flex overflow-x-auto scroll-thin">
      <div className="sticky left-0 z-10 w-14 shrink-0 bg-cream pt-12">
        {hours.map((m) => (
          <div key={m} style={{ height: PX_PER_HOUR }} className="relative -top-2 pr-2 text-right text-[11px] text-ink-faint">
            {String(Math.floor(m / 60)).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      <div className="flex flex-1">
        {dates.map((date) => {
          const isToday = date === today;
          const bh = data?.businessHoursByDate[date] ?? null;
          const dayStart = bh && !bh.isClosed && bh.startTime ? timeToMinutes(bh.startTime) : windowStart;
          const dayEnd = bh && !bh.isClosed && bh.endTime ? timeToMinutes(bh.endTime) : windowEnd;
          const closed = bh?.isClosed;

          return (
            <div key={date} className="min-w-[150px] flex-1 border-l border-border first:border-l-0">
              <button
                onClick={() => onSelectDay(date)}
                className={cn(
                  "sticky top-0 z-10 flex h-12 w-full flex-col items-center justify-center border-b border-border bg-cream-soft/90 backdrop-blur-sm transition-colors hover:bg-sand",
                  isToday && "bg-bronze-soft"
                )}
              >
                <span className="text-[10px] font-medium uppercase text-ink-faint">{formatWeekdayShort(date)}</span>
                <span
                  className={cn(
                    "font-display text-sm",
                    isToday ? "brand-gradient-text font-semibold" : "text-ink"
                  )}
                >
                  {formatDayNum(date)}
                </span>
              </button>
              <div
                ref={(el) => {
                  columnRefs.current[date] = el;
                }}
                className="relative cursor-cell"
                style={{ height: gridHeight }}
                onClick={(e) => handleColumnClick(e, date)}
              >
                {hours.map((m) => (
                  <div key={m} className="absolute inset-x-0 border-t border-border/70" style={{ top: (m - windowStart) * PX_PER_MIN }} />
                ))}

                {/* Dim the hours outside this day's actual business hours. */}
                {closed ? (
                  <div className="pointer-events-none absolute inset-0 bg-cream-soft/60" />
                ) : (
                  <>
                    {dayStart > windowStart && (
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 bg-cream-soft/60"
                        style={{ height: (dayStart - windowStart) * PX_PER_MIN }}
                      />
                    )}
                    {dayEnd < windowEnd && (
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 bg-cream-soft/60"
                        style={{ height: (windowEnd - dayEnd) * PX_PER_MIN }}
                      />
                    )}
                  </>
                )}

                {isToday && nowMinutes >= windowStart && nowMinutes <= windowEnd && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-gold"
                    style={{ top: (nowMinutes - windowStart) * PX_PER_MIN }}
                  >
                    <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-gold" />
                  </div>
                )}

                {(() => {
                  const dayAppts = appointmentsForDate(date);
                  const withMinutes = dayAppts.map((a) => {
                    const isDragging = drag?.id === a.id && drag.date === date;
                    const isResizing = resize?.id === a.id;
                    const startMin = apptMinutes(a.startAt) + (isDragging ? drag.deltaMinutes : 0);
                    const endMin = apptMinutes(a.endAt) + (isDragging ? drag.deltaMinutes : 0) + (isResizing ? resize.deltaMinutes : 0);
                    return { a, isDragging, isResizing, startMin, endMin };
                  });
                  const layout = layoutOverlaps(withMinutes.map((w) => ({ id: w.a.id, start: w.startMin, end: w.endMin })));

                  return withMinutes.map(({ a, isDragging, isResizing, startMin, endMin }) => {
                    const top = (startMin - windowStart) * PX_PER_MIN;
                    const height = Math.max((endMin - startMin) * PX_PER_MIN - 2, 16);
                    const emp = employeesById.get(a.employeeId);
                    const { col, cols } = layout.get(a.id) ?? { col: 0, cols: 1 };
                    const widthPct = 100 / cols;
                    return (
                      <AppointmentCard
                        key={a.id}
                        appointment={a}
                        timezone={timezone}
                        dragging={isDragging}
                        resizing={isResizing}
                        style={{
                          top,
                          height,
                          left: `calc(${col * widthPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                          right: "auto",
                        }}
                        colorOverride={emp?.color}
                        showEmployeeName={emp?.firstName}
                        onPointerDown={(e) => handlePointerDown(e, a, date)}
                        onResizePointerDown={canEdit && a.status === "booked" ? (e) => handleResizePointerDown(e, a) : undefined}
                        onClick={() => {
                          if (!drag && !resize) setDetail(a);
                        }}
                      />
                    );
                  });
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {detail && (
        <AppointmentDetailModal
          appointment={detail}
          salonId={salonId}
          timezone={timezone}
          canEdit={canEdit}
          revalidatePath={revalidatePath}
          employees={data?.employees}
          onClose={() => setDetail(null)}
          onChanged={load}
        />
      )}
      {newAppt && data && (
        <NewAppointmentModal
          salonId={salonId}
          date={newAppt.date}
          timezone={timezone}
          employees={data.employees}
          services={services}
          defaultEmployeeId={newAppt.employeeId}
          defaultStartAt={newAppt.startAt}
          revalidatePath={revalidatePath}
          onClose={() => setNewAppt(null)}
          onCreated={load}
        />
      )}
    </div>
  );
}

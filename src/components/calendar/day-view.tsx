"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { initials } from "@/lib/utils";
import { AppointmentCard } from "./appointment-card";
import { AppointmentDetailModal } from "./appointment-detail-modal";
import { NewAppointmentModal } from "./new-appointment-modal";
import { rescheduleAppointmentAction, resizeAppointmentAction } from "@/lib/actions/appointments";
import type { CalendarAppointment, CalendarEmployee } from "@/lib/actions/calendar-data";

const PX_PER_HOUR = 64;
const PX_PER_MIN = PX_PER_HOUR / 60;

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

type Service = { id: string; name: string; duration_minutes: number; price_cents: number; color: string };

export function DayView({
  salonId,
  date,
  timezone,
  employees,
  services,
  appointments,
  businessHours,
  slotGranularity,
  canEdit,
  revalidatePath,
  onChanged,
}: {
  salonId: string;
  date: string;
  timezone: string;
  employees: CalendarEmployee[];
  services: Service[];
  appointments: CalendarAppointment[];
  businessHours: { isClosed: boolean; startTime: string | null; endTime: string | null } | null;
  slotGranularity: number;
  canEdit: boolean;
  revalidatePath: string;
  onChanged: () => void;
}) {
  const windowStart = businessHours && !businessHours.isClosed && businessHours.startTime
    ? Math.floor(timeToMinutes(businessHours.startTime) / 60) * 60
    : 8 * 60;
  const windowEnd = businessHours && !businessHours.isClosed && businessHours.endTime
    ? Math.ceil(timeToMinutes(businessHours.endTime) / 60) * 60
    : 20 * 60;

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let m = windowStart; m <= windowEnd; m += 60) list.push(m);
    return list;
  }, [windowStart, windowEnd]);

  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [drag, setDrag] = useState<{ id: string; deltaMinutes: number; employeeId: string } | null>(null);
  const [resize, setResize] = useState<{ id: string; deltaMinutes: number } | null>(null);
  const [detail, setDetail] = useState<CalendarAppointment | null>(null);
  const [newAppt, setNewAppt] = useState<{ employeeId: string; startAt: string } | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const isToday = date === new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(now);
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

  function handlePointerDown(e: React.PointerEvent, appt: CalendarAppointment) {
    if (!canEdit || appt.status !== "booked") return;
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    let currentDelta = 0;
    let currentEmployeeId = appt.employeeId;
    setDrag({ id: appt.id, deltaMinutes: 0, employeeId: appt.employeeId });

    function onMove(ev: PointerEvent) {
      const deltaPx = ev.clientY - startY;
      const rawDelta = deltaPx / PX_PER_MIN;
      currentDelta = Math.round(rawDelta / slotGranularity) * slotGranularity;

      let employeeId = currentEmployeeId;
      for (const [id, el] of Object.entries(columnRefs.current)) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (ev.clientX >= rect.left && ev.clientX <= rect.right) {
          employeeId = id;
          break;
        }
      }
      currentEmployeeId = employeeId;
      setDrag({ id: appt.id, deltaMinutes: currentDelta, employeeId });
    }

    async function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDrag(null);
      if (currentDelta === 0 && currentEmployeeId === appt.employeeId) return;
      const newStartAt = new Date(new Date(appt.startAt).getTime() + currentDelta * 60_000).toISOString();
      const result = await rescheduleAppointmentAction({
        salonId,
        appointmentId: appt.id,
        newEmployeeId: currentEmployeeId,
        newStartAt,
        revalidate: revalidatePath,
      });
      if (!result.ok) {
        alert("Dieser Zeitraum ist nicht verfügbar.");
      }
      onChanged();
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
      // Never let a drag shrink the appointment below one slot's duration.
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
      onChanged();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleColumnClick(e: React.MouseEvent, employeeId: string) {
    if (!canEdit) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = windowStart + Math.round(y / PX_PER_MIN / slotGranularity) * slotGranularity;
    const [h, m] = [Math.floor(minutes / 60), minutes % 60];
    const startAt = toZonedIso(date, h, m, timezone);
    setNewAppt({ employeeId, startAt });
  }

  const gridHeight = (windowEnd - windowStart) * PX_PER_MIN;

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
        {employees.map((emp) => (
          <div key={emp.id} className="flex-1 min-w-[200px] border-l border-border first:border-l-0">
            <div className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-cream-soft/90 px-3 backdrop-blur-sm">
              {emp.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded Supabase Storage URL, not a local/known asset
                <img src={emp.avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
              ) : (
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: emp.color }}
                >
                  {initials(emp.firstName, emp.lastName)}
                </span>
              )}
              <span className="truncate text-sm font-medium text-ink">{emp.firstName}</span>
            </div>
            <div
              ref={(el) => {
                columnRefs.current[emp.id] = el;
              }}
              className="relative cursor-cell"
              style={{ height: gridHeight }}
              onClick={(e) => handleColumnClick(e, emp.id)}
            >
              {hours.map((m) => (
                <div
                  key={m}
                  className="absolute inset-x-0 border-t border-border/70"
                  style={{ top: (m - windowStart) * PX_PER_MIN }}
                />
              ))}

              {isToday && nowMinutes >= windowStart && nowMinutes <= windowEnd && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-bronze"
                  style={{ top: (nowMinutes - windowStart) * PX_PER_MIN }}
                >
                  <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-bronze" />
                </div>
              )}

              {appointments
                .filter((a) => (drag?.id === a.id ? drag.employeeId : a.employeeId) === emp.id)
                .map((a) => {
                  const isDragging = drag?.id === a.id;
                  const isResizing = resize?.id === a.id;
                  const startMin = apptMinutes(a.startAt) + (isDragging ? drag.deltaMinutes : 0);
                  const endMin = apptMinutes(a.endAt) + (isDragging ? drag.deltaMinutes : 0) + (isResizing ? resize.deltaMinutes : 0);
                  const top = (startMin - windowStart) * PX_PER_MIN;
                  const height = Math.max((endMin - startMin) * PX_PER_MIN - 2, 18);
                  return (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      timezone={timezone}
                      dragging={isDragging}
                      resizing={isResizing}
                      style={{ top, height }}
                      onPointerDown={(e) => handlePointerDown(e, a)}
                      onResizePointerDown={canEdit && a.status === "booked" ? (e) => handleResizePointerDown(e, a) : undefined}
                      onClick={() => {
                        if (!drag && !resize) setDetail(a);
                      }}
                    />
                  );
                })}
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="flex-1 p-10 text-center text-sm text-ink-soft">Keine aktiven Mitarbeiter für diesen Tag.</div>
        )}
      </div>

      {detail && (
        <AppointmentDetailModal
          appointment={detail}
          salonId={salonId}
          timezone={timezone}
          canEdit={canEdit}
          revalidatePath={revalidatePath}
          employees={employees}
          onClose={() => setDetail(null)}
          onChanged={onChanged}
        />
      )}
      {newAppt && (
        <NewAppointmentModal
          salonId={salonId}
          date={date}
          timezone={timezone}
          employees={employees}
          services={services}
          defaultEmployeeId={newAppt.employeeId}
          defaultStartAt={newAppt.startAt}
          revalidatePath={revalidatePath}
          onClose={() => setNewAppt(null)}
          onCreated={onChanged}
        />
      )}
    </div>
  );
}

function toZonedIso(date: string, hour: number, minute: number, timezone: string): string {
  // Construct the wall-clock instant and correct for the timezone offset via
  // a round-trip through Intl (avoids pulling in a heavy tz library here).
  const guess = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(guess);
  const shownH = Number(parts.find((p) => p.type === "hour")?.value ?? hour);
  const shownM = Number(parts.find((p) => p.type === "minute")?.value ?? minute);
  const diffMinutes = hour * 60 + minute - (shownH * 60 + shownM);
  return new Date(guess.getTime() + diffMinutes * 60_000).toISOString();
}

"use client";

import { Sparkles } from "lucide-react";
import { AppointmentDetailModal } from "./appointment-detail-modal";
import type { CalendarAppointment, CalendarEmployee } from "@/lib/actions/calendar-data";
import { formatDayLabel, formatTime } from "@/lib/date";
import { useState } from "react";

export function MobileAgenda({
  salonId,
  date,
  timezone,
  employees,
  appointments,
  canEdit,
  revalidatePath,
  onChanged,
}: {
  salonId: string;
  date: string;
  timezone: string;
  employees: CalendarEmployee[];
  appointments: CalendarAppointment[];
  canEdit: boolean;
  revalidatePath: string;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<CalendarAppointment | null>(null);
  const employeesById = new Map(employees.map((e) => [e.id, e]));
  const sorted = [...appointments].sort((a, b) => a.startAt.localeCompare(b.startAt));

  return (
    <div className="px-4 py-4 sm:px-6">
      <p className="mb-3 font-display text-base capitalize text-ink">{formatDayLabel(date)}</p>

      {sorted.length === 0 && (
        <div className="rounded-2xl border border-border bg-white/[0.03] p-8 text-center text-sm text-ink-soft">
          Keine Termine an diesem Tag.
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((a) => {
          const emp = employeesById.get(a.employeeId);
          const customerName = a.customer ? `${a.customer.firstName} ${a.customer.lastName}`.trim() : "Kunde";
          const serviceNames = a.services.map((s) => s.name).join(", ");
          const color = a.services[0]?.color ?? emp?.color ?? "#B08968";
          return (
            <button
              key={a.id}
              onClick={() => setDetail(a)}
              style={{ borderLeftColor: color, background: `${color}14` }}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl border border-border border-l-4 p-4 text-left shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className="w-14 shrink-0 text-sm font-semibold text-ink">{formatTime(a.startAt, timezone)}</div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                  {customerName}
                  {a.source === "voice_ai" && <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" />}
                </p>
                <p className="truncate text-xs text-ink-soft">{serviceNames}</p>
                <p className="text-xs text-ink-faint">
                  {formatTime(a.startAt, timezone)} – {formatTime(a.endAt, timezone)}
                  {emp ? ` · ${emp.firstName}` : ""}
                </p>
              </div>
            </button>
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
          employees={employees}
          onClose={() => setDetail(null)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}

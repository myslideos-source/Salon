"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/date";
import type { CalendarAppointment } from "@/lib/actions/calendar-data";

export function AppointmentCard({
  appointment,
  style,
  onClick,
  onPointerDown,
  dragging,
  timezone,
  colorOverride,
  showEmployeeName,
}: {
  appointment: CalendarAppointment;
  style: React.CSSProperties;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  dragging?: boolean;
  timezone: string;
  /** Week view colors by employee instead of by service - the column no
   * longer implies who the appointment belongs to. */
  colorOverride?: string;
  showEmployeeName?: string;
}) {
  const color = colorOverride ?? appointment.services[0]?.color ?? "#B08968";
  const customerName = appointment.customer
    ? `${appointment.customer.firstName} ${appointment.customer.lastName}`.trim()
    : "Kunde";
  const serviceNames = appointment.services.map((s) => s.name).join(", ");

  return (
    <div
      style={{ ...style, borderLeftColor: color, background: `${color}1c` }}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={cn(
        "absolute left-1 right-1 overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left shadow-sm cursor-grab active:cursor-grabbing transition-shadow",
        dragging ? "z-20 shadow-lg ring-2 ring-bronze/40 opacity-90" : "hover:shadow-md",
        appointment.status === "no_show" && "opacity-50"
      )}
    >
      <p className="truncate text-[11px] font-semibold text-ink leading-tight">
        {formatTime(appointment.startAt, timezone)}–{formatTime(appointment.endAt, timezone)}
      </p>
      <p className="truncate text-xs font-medium text-ink leading-tight">{customerName}</p>
      <p className="truncate text-[11px] text-ink-soft leading-tight">
        {serviceNames}
        {showEmployeeName ? ` · ${showEmployeeName}` : ""}
      </p>
      {appointment.source === "voice_ai" && (
        <span
          className="absolute right-1 top-1 text-gold"
          title="Automatisch von HalloMia gebucht"
          aria-label="Automatisch von HalloMia gebucht"
        >
          <Sparkles className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}

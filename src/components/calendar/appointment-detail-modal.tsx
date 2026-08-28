"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, User, Clock, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { formatPrice, formatDuration } from "@/lib/utils";
import { formatTime } from "@/lib/date";
import { cancelAppointmentAction, markAppointmentStatusAction, rescheduleAppointmentAction, resizeAppointmentAction } from "@/lib/actions/appointments";
import type { CalendarAppointment, CalendarEmployee } from "@/lib/actions/calendar-data";
import { statusLabel, statusTone, sourceLabel } from "@/lib/scheduling/status";

function toDatetimeLocalValue(iso: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function AppointmentDetailModal({
  appointment,
  salonId,
  timezone,
  canEdit,
  revalidatePath,
  employees,
  employeeName,
  onClose,
  onChanged,
}: {
  appointment: CalendarAppointment;
  salonId: string;
  timezone: string;
  canEdit: boolean;
  revalidatePath: string;
  /** For the "Verschieben" employee picker - optional, falls back to just showing the current employee's name. */
  employees?: CalendarEmployee[];
  employeeName?: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [resizingForm, setResizingForm] = useState(false);
  const [newStart, setNewStart] = useState(() => toDatetimeLocalValue(appointment.startAt, timezone));
  const [newEmployeeId, setNewEmployeeId] = useState(appointment.employeeId);
  const customerName = appointment.customer
    ? `${appointment.customer.firstName} ${appointment.customer.lastName}`.trim()
    : "Unbekannter Kunde";
  const currentEmployeeName = employees?.find((e) => e.id === appointment.employeeId)?.firstName ?? employeeName;
  const durationMinutes = Math.round((new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / 60_000);
  const [newDuration, setNewDuration] = useState(durationMinutes);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    await fn();
    setBusy(false);
    onChanged();
    onClose();
  }

  async function submitReschedule() {
    setBusy(true);
    // datetime-local has no timezone info - treat it as wall-clock time in
    // the salon's timezone, same trick as the day/week grids' click-to-create.
    const result = await rescheduleAppointmentAction({
      salonId,
      appointmentId: appointment.id,
      newEmployeeId,
      newStartAt: `${newStart}:00`,
      revalidate: revalidatePath,
    });
    setBusy(false);
    if (!result.ok) {
      alert("Dieser Zeitraum ist nicht verfügbar.");
      return;
    }
    onChanged();
    onClose();
  }

  async function submitResize() {
    setBusy(true);
    const result = await resizeAppointmentAction({
      salonId,
      appointmentId: appointment.id,
      newDurationMinutes: newDuration,
      revalidate: revalidatePath,
    });
    setBusy(false);
    if (!result.ok) {
      alert(result.error || "Dieser Zeitraum ist nicht verfügbar.");
      return;
    }
    onChanged();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={customerName} subtitle={`${formatTime(appointment.startAt, timezone)} – ${formatTime(appointment.endAt, timezone)}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(appointment.status)}>{statusLabel(appointment.status)}</Badge>
          <Badge tone={appointment.source === "voice_ai" ? "bronze" : "neutral"}>
            {appointment.source === "voice_ai" ? (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Von HalloMia gebucht
              </span>
            ) : (
              sourceLabel(appointment.source)
            )}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {appointment.customer && (
            <div className="flex items-center gap-2 text-ink-soft">
              <Phone className="h-4 w-4 shrink-0 text-ink-faint" /> {appointment.customer.phone}
            </div>
          )}
          {currentEmployeeName && (
            <div className="flex items-center gap-2 text-ink-soft">
              <User className="h-4 w-4 shrink-0 text-ink-faint" /> {currentEmployeeName}
            </div>
          )}
          <div className="flex items-center gap-2 text-ink-soft">
            <Clock className="h-4 w-4 shrink-0 text-ink-faint" /> {formatDuration(durationMinutes)}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink-soft mb-1">Leistungen</p>
          <ul className="space-y-1">
            {appointment.services.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm text-ink">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-soft">Preis</span>
          <span className="font-medium text-ink">{formatPrice(appointment.totalPriceCents)}</span>
        </div>

        {appointment.notes && (
          <div className="rounded-lg bg-sand p-3 text-sm text-ink-soft">{appointment.notes}</div>
        )}

        {rescheduling && (
          <div className="space-y-3 rounded-xl border border-bronze/30 bg-bronze-soft/40 p-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Neuer Zeitpunkt</label>
              <input
                type="datetime-local"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="w-full rounded-lg border border-border-strong bg-sand px-3 h-10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-bronze/30"
              />
            </div>
            {employees && employees.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Mitarbeiter</label>
                <Select value={newEmployeeId} onChange={(e) => setNewEmployeeId(e.target.value)}>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="bronze" disabled={busy} onClick={submitReschedule}>
                Verschieben bestätigen
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setRescheduling(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {resizingForm && (
          <div className="space-y-3 rounded-xl border border-bronze/30 bg-bronze-soft/40 p-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Neue Dauer (Minuten)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-border-strong bg-sand px-3 h-10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-bronze/30"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="bronze" disabled={busy || newDuration < 5} onClick={submitResize}>
                Dauer speichern
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setResizingForm(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {appointment.customer && (
          <Link href={`/app/customers/${appointment.customer.id}`} className="text-sm text-bronze-dark hover:underline">
            Kunde öffnen →
          </Link>
        )}

        {canEdit && appointment.status === "booked" && !rescheduling && !resizingForm && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setRescheduling(true)}>
              Verschieben
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setResizingForm(true)}>
              Dauer ändern
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => markAppointmentStatusAction(salonId, appointment.id, "completed", revalidatePath))}>
              Als abgeschlossen markieren
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => markAppointmentStatusAction(salonId, appointment.id, "no_show", revalidatePath))}>
              Nicht erschienen
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => {
                if (confirm("Termin wirklich absagen?")) run(() => cancelAppointmentAction(salonId, appointment.id, revalidatePath));
              }}
            >
              Absagen
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

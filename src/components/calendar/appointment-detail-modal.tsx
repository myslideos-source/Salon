"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { formatTime } from "@/lib/date";
import { cancelAppointmentAction, markAppointmentStatusAction } from "@/lib/actions/appointments";
import type { CalendarAppointment } from "@/lib/actions/calendar-data";

const STATUS_LABEL: Record<string, string> = {
  booked: "Gebucht",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
  no_show: "Nicht erschienen",
};

export function AppointmentDetailModal({
  appointment,
  salonId,
  timezone,
  canEdit,
  revalidatePath,
  onClose,
  onChanged,
}: {
  appointment: CalendarAppointment;
  salonId: string;
  timezone: string;
  canEdit: boolean;
  revalidatePath: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const customerName = appointment.customer
    ? `${appointment.customer.firstName} ${appointment.customer.lastName}`.trim()
    : "Unbekannter Kunde";

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    await fn();
    setBusy(false);
    onChanged();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={customerName} subtitle={`${formatTime(appointment.startAt, timezone)} – ${formatTime(appointment.endAt, timezone)}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge tone={appointment.status === "booked" ? "success" : appointment.status === "cancelled" ? "danger" : "neutral"}>
            {STATUS_LABEL[appointment.status] ?? appointment.status}
          </Badge>
          <Badge tone={appointment.source === "voice_ai" ? "bronze" : "neutral"}>
            {appointment.source === "voice_ai" ? "KI-Buchung" : appointment.source === "manual" ? "Manuell" : "Online"}
          </Badge>
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

        {appointment.customer && (
          <Link href={`/app/customers/${appointment.customer.id}`} className="text-sm text-bronze-dark hover:underline">
            Kundenprofil ansehen →
          </Link>
        )}

        {canEdit && appointment.status === "booked" && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
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
                if (confirm("Termin wirklich stornieren?")) run(() => cancelAppointmentAction(salonId, appointment.id, revalidatePath));
              }}
            >
              Stornieren
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

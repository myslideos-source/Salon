"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { formatPrice } from "@/lib/utils";
import { formatTime } from "@/lib/date";
import {
  checkAvailabilityAction,
  createManualAppointmentAction,
  findCustomerByPhoneAction,
} from "@/lib/actions/appointments";
import type { CalendarEmployee } from "@/lib/actions/calendar-data";

type Service = { id: string; name: string; duration_minutes: number; price_cents: number; color: string };

export function NewAppointmentModal({
  salonId,
  date,
  timezone,
  employees,
  services,
  defaultEmployeeId,
  defaultStartAt,
  revalidatePath,
  onClose,
  onCreated,
}: {
  salonId: string;
  date: string;
  timezone: string;
  employees: CalendarEmployee[];
  services?: Service[];
  defaultEmployeeId: string;
  defaultStartAt: string;
  revalidatePath: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId);
  const [serviceIds, setServiceIds] = useState<string[]>(services?.[0] ? [services[0].id] : []);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(defaultStartAt);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [lookupDone, setLookupDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (serviceIds.length === 0 || !employeeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on selection change
      setSlots([]);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on selection change
    setLoadingSlots(true);
    checkAvailabilityAction({ salonId, employeeId, serviceIds, date }).then((res) => {
      setLoadingSlots(false);
      if (res.ok) {
        setSlots(res.data.slots);
        if (!res.data.slots.includes(selectedSlot ?? "")) {
          setSelectedSlot(res.data.slots.find((s) => s === defaultStartAt) ?? res.data.slots[0] ?? null);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, serviceIds.join(","), date]);

  async function lookupPhone() {
    if (!phone.trim()) return;
    const res = await findCustomerByPhoneAction(salonId, phone);
    setLookupDone(true);
    if (res.ok && res.data) {
      setFirstName(res.data.firstName);
      setLastName(res.data.lastName);
    }
  }

  async function submit() {
    if (!selectedSlot || serviceIds.length === 0 || !phone.trim()) {
      setError("Bitte Leistung, Zeit und Telefonnummer angeben.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await createManualAppointmentAction({
      salonId,
      employeeId,
      serviceIds,
      startAt: selectedSlot,
      notes,
      customerPhone: phone,
      customerFirstName: firstName,
      customerLastName: lastName,
      revalidate: revalidatePath,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Neuer Termin" subtitle={date} width="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Mitarbeiter</Label>
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Notiz (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="z. B. Wunsch: kürzer als letztes Mal" />
          </div>
        </div>

        {services && (
          <div>
            <Label>Leistung(en)</Label>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border-strong px-3 py-1.5 text-xs has-[:checked]:border-bronze has-[:checked]:bg-bronze-soft"
                >
                  <input
                    type="checkbox"
                    checked={serviceIds.includes(s.id)}
                    onChange={(e) =>
                      setServiceIds((prev) => (e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)))
                    }
                    className="sr-only"
                  />
                  {s.name} · {formatPrice(s.price_cents)}
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>Verfügbare Zeiten</Label>
          {loadingSlots && <p className="text-sm text-ink-faint">Verfügbarkeit wird geprüft…</p>}
          {!loadingSlots && slots.length === 0 && (
            <p className="text-sm text-ink-faint">Keine freien Zeiten für diese Auswahl an diesem Tag.</p>
          )}
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto scroll-thin">
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSlot(s)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  selectedSlot === s ? "border-bronze bg-bronze text-white" : "border-border-strong text-ink-soft hover:bg-sand"
                }`}
              >
                {formatTime(s, timezone)}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Label>Kunde</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Telefonnummer"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setLookupDone(false);
              }}
              onBlur={lookupPhone}
            />
          </div>
          {lookupDone && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Input placeholder="Vorname" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input placeholder="Nachname" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          )}
        </div>

        <FieldError>{error}</FieldError>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="bronze" onClick={submit} disabled={submitting || !selectedSlot}>
            {submitting ? "Wird gebucht…" : "Termin buchen"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

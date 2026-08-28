"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, CalendarCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { checkAvailabilityAction, createManualAppointmentAction, cancelAppointmentAction } from "@/lib/actions/appointments";
import { advanceOnboardingStepAction } from "@/lib/actions/onboarding";
import { formatTime, todayStr } from "@/lib/date";
import { formatPrice } from "@/lib/utils";
import type { Employee } from "@/components/team/employees-manager";
import type { Service } from "@/components/services/services-manager";

const TEST_PHONE = "0000000000";

/**
 * Onboarding-Schritt 10 "Kalender testen". Übt den echten Buchungsablauf
 * einmal vollständig aus - Verfügbarkeit prüfen, Testtermin buchen, wieder
 * stornieren - über dieselbe serverseitige Verfügbarkeits-/Buchungs-Engine
 * wie der reguläre Kalender (`/app/calendar`), statt nur eine Vorschau zu
 * zeigen. Kein neuer Datenpfad: derselbe `checkAvailabilityAction` /
 * `createManualAppointmentAction` / `cancelAppointmentAction`.
 */
export function CalendarTestStep({
  salonId,
  timezone,
  employees,
  services,
  onBack,
}: {
  salonId: string;
  timezone: string;
  employees: Employee[];
  services: Service[];
  onBack: () => void;
}) {
  const router = useRouter();
  const activeEmployees = employees.filter((e) => e.active);
  const activeServices = services.filter((s) => s.active);
  const date = todayStr();

  const [employeeId, setEmployeeId] = useState(activeEmployees[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookedId, setBookedId] = useState<string | null>(null);
  const [testPassed, setTestPassed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!employeeId || !serviceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on selection change
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    checkAvailabilityAction({ salonId, employeeId, serviceIds: [serviceId], date }).then((res) => {
      setLoadingSlots(false);
      if (res.ok) {
        setSlots(res.data.slots);
        setSelectedSlot(res.data.slots[0] ?? null);
      }
    });
  }, [salonId, employeeId, serviceId, date]);

  async function bookTestAppointment() {
    if (!selectedSlot) return;
    setBooking(true);
    setError(null);
    const result = await createManualAppointmentAction({
      salonId,
      employeeId,
      serviceIds: [serviceId],
      startAt: selectedSlot,
      notes: "Automatischer Testtermin aus dem Einrichtungsassistenten (Schritt „Kalender testen“).",
      customerPhone: TEST_PHONE,
      customerFirstName: "Testkunde",
      customerLastName: "(Kalendertest)",
      revalidate: "/app/calendar",
    });
    setBooking(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBookedId(result.data.id);
    setTestPassed(true);
  }

  async function cancelTestAppointment() {
    if (!bookedId) return;
    setBooking(true);
    await cancelAppointmentAction(salonId, bookedId, "/app/calendar");
    setBooking(false);
    setBookedId(null);
    // Refresh availability - the slot should now be free again.
    checkAvailabilityAction({ salonId, employeeId, serviceIds: [serviceId], date }).then((res) => {
      if (res.ok) setSlots(res.data.slots);
    });
  }

  async function finish() {
    setFinishing(true);
    await advanceOnboardingStepAction(salonId, 11);
    router.push("/app/dashboard?onboarding=in_progress");
  }

  if (activeEmployees.length === 0 || activeServices.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-soft">
          Für den Kalendertest wird mindestens ein aktiver Mitarbeiter und eine aktive Terminart benötigt.
        </p>
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Button>
          <Button type="button" variant="bronze" disabled={finishing} onClick={finish}>
            Später testen <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">
        Buche jetzt einen echten Testtermin über deinen Kalender - genau die Verfügbarkeitsprüfung und Buchungslogik, die auch Mia am
        Telefon verwendet. Der Testtermin lässt sich danach direkt wieder stornieren.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Mitarbeiter</label>
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} disabled={Boolean(bookedId)}>
            {activeEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.first_name} {e.last_name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Terminart</label>
          <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={Boolean(bookedId)}>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {formatPrice(s.price_cents)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!bookedId && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Verfügbare Zeiten heute</label>
          {loadingSlots && <p className="text-sm text-ink-faint">Verfügbarkeit wird geprüft…</p>}
          {!loadingSlots && slots.length === 0 && (
            <p className="text-sm text-ink-faint">
              Keine freien Zeiten mehr für heute. Prüfe die Öffnungs- und Arbeitszeiten unter{" "}
              <Link href="/app/availability" className="text-bronze-dark hover:underline">
                Verfügbarkeit
              </Link>
              .
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scroll-thin">
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
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {bookedId ? (
        <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success-soft p-3 text-sm text-success">
          <CalendarCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Testtermin erfolgreich gebucht.</p>
            <p className="mt-0.5 text-success/80">Verfügbarkeit geprüft, Termin angelegt - genau der Ablauf, den Mia am Telefon nutzt.</p>
          </div>
        </div>
      ) : (
        <Button type="button" variant="bronze" disabled={booking || !selectedSlot} onClick={bookTestAppointment}>
          {booking ? "Wird gebucht…" : "Testtermin buchen"}
        </Button>
      )}

      {bookedId && (
        <Button type="button" variant="outline" disabled={booking} onClick={cancelTestAppointment}>
          <XCircle className="h-4 w-4" /> Testtermin wieder stornieren
        </Button>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onBack} disabled={finishing}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <Button type="button" variant="bronze" disabled={finishing} onClick={finish}>
          {testPassed ? "Kalendertest abschließen" : "Weiter ohne Test"} <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

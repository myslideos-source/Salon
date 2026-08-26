"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { cancelAppointmentAction } from "@/lib/actions/appointments";

export function CancelAppointmentButton({
  salonId,
  appointmentId,
  revalidatePath,
}: {
  salonId: string;
  appointmentId: string;
  revalidatePath: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("Termin wirklich stornieren?")) {
          startTransition(() => cancelAppointmentAction(salonId, appointmentId, revalidatePath));
        }
      }}
      className="rounded-lg p-1.5 text-ink-soft hover:bg-danger-soft hover:text-danger disabled:opacity-50"
      title="Stornieren"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

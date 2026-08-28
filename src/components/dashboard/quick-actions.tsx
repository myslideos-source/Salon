"use client";

import { useState } from "react";
import { CalendarPlus, UserPlus, PhoneCall, ClipboardList, MessageSquareText, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { LinkButton } from "@/components/ui/button";
import { NewAppointmentModal } from "@/components/calendar/new-appointment-modal";
import { CustomerForm } from "@/components/customers/customer-form";
import { CallbackQuickModal } from "./callback-quick-modal";
import { RequestQuickModal } from "./request-quick-modal";
import type { CalendarEmployee } from "@/lib/actions/calendar-data";
import type { CustomFieldDefinition } from "@/lib/validation/custom-fields";
import { TERMINOLOGY } from "@/lib/terminology";

type Service = { id: string; name: string; duration_minutes: number; price_cents: number; color: string };
type SimpleEmployee = { id: string; first_name: string; last_name: string };

type QuickActionKey = "appointment" | "customer" | "callback" | "request";

export function QuickActions({
  salonId,
  timezone,
  employees,
  services,
  customFieldDefinitions,
}: {
  salonId: string;
  timezone: string;
  employees: CalendarEmployee[];
  services: Service[];
  customFieldDefinitions?: CustomFieldDefinition[];
}) {
  const [open, setOpen] = useState<QuickActionKey | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const simpleEmployees: SimpleEmployee[] = employees.map((e) => ({ id: e.id, first_name: e.firstName, last_name: e.lastName }));

  const actions: { key: QuickActionKey | "test" | "hours"; label: string; icon: typeof CalendarPlus; onClick?: () => void; href?: string }[] = [
    { key: "appointment", label: "Termin erstellen", icon: CalendarPlus, onClick: () => setOpen("appointment") },
    { key: "customer", label: `${TERMINOLOGY.customer} anlegen`, icon: UserPlus, onClick: () => setOpen("customer") },
    { key: "callback", label: "Rückruf erfassen", icon: PhoneCall, onClick: () => setOpen("callback") },
    { key: "request", label: `${TERMINOLOGY.request} erstellen`, icon: ClipboardList, onClick: () => setOpen("request") },
    { key: "test", label: "Mia testen", icon: MessageSquareText, href: "/app/ai/test" },
    { key: "hours", label: "Öffnungszeiten ändern", icon: Clock, href: "/app/availability" },
  ];

  return (
    <>
      <Card>
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-6">
          {actions.map((action) =>
            action.href ? (
              <LinkButton key={action.key} href={action.href} variant="outline" size="sm" className="h-auto flex-col gap-2 py-4">
                <action.icon className="h-5 w-5" strokeWidth={1.8} />
                <span className="text-center text-xs leading-tight">{action.label}</span>
              </LinkButton>
            ) : (
              <button
                key={action.key}
                onClick={action.onClick}
                className="flex h-auto flex-col items-center gap-2 rounded-xl border border-border-strong bg-white/5 py-4 text-ink transition-colors hover:bg-sand"
              >
                <action.icon className="h-5 w-5" strokeWidth={1.8} />
                <span className="text-center text-xs leading-tight">{action.label}</span>
              </button>
            )
          )}
        </div>
      </Card>

      {open === "appointment" && (
        <NewAppointmentModal
          salonId={salonId}
          date={today}
          timezone={timezone}
          employees={employees}
          services={services}
          defaultEmployeeId={employees[0]?.id ?? ""}
          defaultStartAt={`${today}T09:00:00`}
          revalidatePath="/app/dashboard"
          onClose={() => setOpen(null)}
          onCreated={() => setOpen(null)}
        />
      )}

      {open === "customer" && (
        <Modal open onClose={() => setOpen(null)} title={`${TERMINOLOGY.customer} anlegen`}>
          <CustomerForm
            salonId={salonId}
            redirectPath="/app/dashboard"
            employees={simpleEmployees}
            customFieldDefinitions={customFieldDefinitions}
            onSuccess={() => setOpen(null)}
          />
        </Modal>
      )}

      {open === "callback" && (
        <CallbackQuickModal salonId={salonId} revalidate="/app/dashboard" onClose={() => setOpen(null)} onCreated={() => setOpen(null)} />
      )}

      {open === "request" && (
        <RequestQuickModal salonId={salonId} revalidate="/app/dashboard" onClose={() => setOpen(null)} onCreated={() => setOpen(null)} />
      )}
    </>
  );
}

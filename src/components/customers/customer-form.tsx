"use client";

import { useActionState } from "react";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createCustomerAction, updateCustomerAction } from "@/lib/actions/customers";
import type { ActionState } from "@/lib/actions/admin";

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  preferred_employee_id: string | null;
  notes: string | null;
};

export function CustomerForm({
  salonId,
  redirectPath,
  employees,
  customer,
  onSuccess,
}: {
  salonId: string;
  redirectPath: string;
  employees: { id: string; first_name: string; last_name: string }[];
  customer?: Customer;
  onSuccess?: () => void;
}) {
  const action = customer
    ? updateCustomerAction.bind(null, salonId, customer.id, redirectPath)
    : createCustomerAction.bind(null, salonId, redirectPath);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
        if (onSuccess) onSuccess();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="first_name">Vorname</Label>
          <Input id="first_name" name="first_name" defaultValue={customer?.first_name} placeholder="Julia" />
        </div>
        <div>
          <Label htmlFor="last_name">Nachname</Label>
          <Input id="last_name" name="last_name" defaultValue={customer?.last_name} placeholder="Müller" />
        </div>
      </div>
      <div>
        <Label htmlFor="phone">Telefonnummer</Label>
        <Input id="phone" name="phone" required defaultValue={customer?.phone} placeholder="+49 151 23456789" />
      </div>
      <div>
        <Label htmlFor="email">E-Mail (optional)</Label>
        <Input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} placeholder="julia@example.com" />
      </div>
      <div>
        <Label htmlFor="preferred_employee_id">Bevorzugter Mitarbeiter</Label>
        <Select id="preferred_employee_id" name="preferred_employee_id" defaultValue={customer?.preferred_employee_id ?? ""}>
          <option value="">Kein Wunsch</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.first_name} {e.last_name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">Notizen</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={customer?.notes ?? ""} />
      </div>
      <FieldError>{state?.error}</FieldError>
      <Button type="submit" variant="bronze" className="w-full" disabled={pending}>
        {pending ? "Wird gespeichert…" : customer ? "Speichern" : "Kunde anlegen"}
      </Button>
    </form>
  );
}

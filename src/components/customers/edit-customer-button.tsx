"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CustomerForm } from "./customer-form";

export function EditCustomerButton({
  salonId,
  redirectPath,
  employees,
  customer,
}: {
  salonId: string;
  redirectPath: string;
  employees: { id: string; first_name: string; last_name: string }[];
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
    preferred_employee_id: string | null;
    notes: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" /> Bearbeiten
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Kunde bearbeiten">
        <CustomerForm
          salonId={salonId}
          redirectPath={redirectPath}
          employees={employees}
          customer={customer}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

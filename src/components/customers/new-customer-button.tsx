"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CustomerForm } from "./customer-form";
import type { CustomFieldDefinition } from "@/lib/validation/custom-fields";

export function NewCustomerButton({
  salonId,
  redirectPath,
  employees,
  customFieldDefinitions,
}: {
  salonId: string;
  redirectPath: string;
  employees: { id: string; first_name: string; last_name: string }[];
  customFieldDefinitions?: CustomFieldDefinition[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="gradient" size="sm" onClick={() => setOpen(true)} aria-label="Neuer Kunde">
        <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Neuer Kunde</span>
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Neuer Kunde">
        <CustomerForm
          salonId={salonId}
          redirectPath={redirectPath}
          employees={employees}
          customFieldDefinitions={customFieldDefinitions}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

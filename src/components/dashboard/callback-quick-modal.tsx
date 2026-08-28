"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { createManualCallbackAction } from "@/lib/actions/callbacks";
import { findCustomerByPhoneAction } from "@/lib/actions/appointments";

export function CallbackQuickModal({ salonId, revalidate, onClose, onCreated }: { salonId: string; revalidate: string; onClose: () => void; onCreated: () => void }) {
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!phone.trim()) {
      setError("Bitte eine Telefonnummer angeben.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const customer = await findCustomerByPhoneAction(salonId, phone);
    const result = await createManualCallbackAction({
      salonId,
      phone,
      reason,
      customerId: customer.ok ? customer.data?.id ?? null : null,
      revalidate,
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
    <Modal open onClose={onClose} title="Rückruf erfassen" subtitle="Rückrufwunsch manuell hinterlegen.">
      <div className="space-y-4">
        <div>
          <Label>Telefonnummer</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 30 1234567" autoFocus />
        </div>
        <div>
          <Label>Anliegen (optional)</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Worum geht es?" />
        </div>
        <FieldError>{error}</FieldError>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Abbrechen
          </Button>
          <Button variant="gradient" onClick={submit} disabled={submitting}>
            {submitting ? "Wird gespeichert…" : "Rückruf erfassen"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

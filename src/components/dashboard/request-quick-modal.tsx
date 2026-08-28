"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { createQuickRequestAction, type QuickRequestCategory, type QuickRequestUrgency } from "@/lib/actions/requests";
import { findCustomerByPhoneAction } from "@/lib/actions/appointments";
import { TERMINOLOGY } from "@/lib/terminology";

const CATEGORY_LABEL: Record<QuickRequestCategory, string> = {
  general: "Allgemein",
  quote: "Angebot",
  complaint: "Beschwerde",
  information: "Information",
  other: "Sonstiges",
};

const URGENCY_LABEL: Record<QuickRequestUrgency, string> = {
  low: "Niedrig",
  normal: "Normal",
  high: "Hoch",
  urgent: "Dringend",
};

export function RequestQuickModal({ salonId, revalidate, onClose, onCreated }: { salonId: string; revalidate: string; onClose: () => void; onCreated: () => void }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [category, setCategory] = useState<QuickRequestCategory>("general");
  const [urgency, setUrgency] = useState<QuickRequestUrgency>("normal");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!subject.trim()) {
      setError("Bitte einen Betreff angeben.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const customer = contactPhone.trim() ? await findCustomerByPhoneAction(salonId, contactPhone) : null;
    const result = await createQuickRequestAction({
      salonId,
      category,
      subject,
      description,
      contactName,
      contactPhone,
      urgency,
      customerId: customer?.ok ? customer.data?.id ?? null : null,
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
    <Modal open onClose={onClose} title={`${TERMINOLOGY.request} erstellen`} subtitle="Anliegen ohne festen Termin erfassen." width="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Kategorie</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value as QuickRequestCategory)}>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Dringlichkeit</Label>
            <Select value={urgency} onChange={(e) => setUrgency(e.target.value as QuickRequestUrgency)}>
              {Object.entries(URGENCY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label>Betreff</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Worum geht es?" autoFocus />
        </div>
        <div>
          <Label>Beschreibung (optional)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Weitere Details" />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <Label>Name (optional)</Label>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Kontaktperson" />
          </div>
          <div>
            <Label>Telefonnummer (optional)</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+49 30 1234567" />
          </div>
        </div>
        <FieldError>{error}</FieldError>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Abbrechen
          </Button>
          <Button variant="gradient" onClick={submit} disabled={submitting}>
            {submitting ? "Wird gespeichert…" : `${TERMINOLOGY.request} erstellen`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

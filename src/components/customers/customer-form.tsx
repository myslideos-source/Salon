"use client";

import { useActionState, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCustomerAction, updateCustomerAction, type ActionState } from "@/lib/actions/customers";
import { CustomFieldValueInputs, type CustomFieldValues } from "@/components/shared/custom-field-value-inputs";
import { CUSTOMER_STATUSES, CUSTOMER_STATUS_LABEL } from "@/lib/validation/customers";
import type { CustomFieldDefinition } from "@/lib/validation/custom-fields";

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  preferred_employee_id: string | null;
  notes: string | null;
  status?: string;
  address?: string | null;
  company?: string | null;
  tags?: string[];
  consent_recording?: boolean;
  consent_marketing?: boolean;
  custom_fields?: unknown;
};

export function CustomerForm({
  salonId,
  redirectPath,
  employees,
  customFieldDefinitions,
  customer,
  onSuccess,
}: {
  salonId: string;
  redirectPath: string;
  employees: { id: string; first_name: string; last_name: string }[];
  customFieldDefinitions?: CustomFieldDefinition[];
  customer?: Customer;
  onSuccess?: () => void;
}) {
  const action = customer
    ? updateCustomerAction.bind(null, salonId, customer.id, redirectPath)
    : createCustomerAction.bind(null, salonId, redirectPath);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  const [tags, setTags] = useState<string[]>(customer?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValues>(
    (customer?.custom_fields as CustomFieldValues) ?? {}
  );
  const [consentRecording, setConsentRecording] = useState(customer?.consent_recording ?? false);
  const [consentMarketing, setConsentMarketing] = useState(customer?.consent_marketing ?? false);

  function addTag() {
    const t = tagDraft.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft("");
  }

  // Nur bei echtem Erfolg schließen - vorher schloss das Modal bei jedem
  // Submit sofort, wodurch Validierungsfehler und (mit dieser Änderung neu
  // hinzugekommen) der Dubletten-Hinweis nie sichtbar wurden.
  useEffect(() => {
    if (state?.ok && onSuccess) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the action result itself changes
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      <input type="hidden" name="custom_fields" value={JSON.stringify(customFieldValues)} />

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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="phone">Telefonnummer</Label>
          <Input id="phone" name="phone" required defaultValue={customer?.phone} placeholder="+49 151 23456789" />
        </div>
        <div>
          <Label htmlFor="email">E-Mail (optional)</Label>
          <Input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} placeholder="julia@example.com" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={customer?.status ?? "new"}>
            {CUSTOMER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CUSTOMER_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="company">Firma (optional)</Label>
          <Input id="company" name="company" defaultValue={customer?.company ?? ""} />
        </div>
        <div>
          <Label htmlFor="address">Adresse (optional)</Label>
          <Input id="address" name="address" defaultValue={customer?.address ?? ""} />
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs text-ink-soft">
              {t}
              <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`${t} entfernen`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Tag hinzufügen und Enter drücken"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={consentRecording}
            onChange={(e) => setConsentRecording(e.target.checked)}
            className="rounded border-border-strong"
          />
          Einwilligung Gesprächsaufzeichnung
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={consentMarketing}
            onChange={(e) => setConsentMarketing(e.target.checked)}
            className="rounded border-border-strong"
          />
          Einwilligung Marketing
        </label>
      </div>
      {/* Checkboxen fehlen unangeklickt komplett in FormData - explizite
          Hidden-Inputs senden immer "true"/"false" (siehe validation/customers.ts). */}
      <input type="hidden" name="consent_recording" value={String(consentRecording)} />
      <input type="hidden" name="consent_marketing" value={String(consentMarketing)} />

      {customFieldDefinitions && customFieldDefinitions.length > 0 && (
        <CustomFieldValueInputs fields={customFieldDefinitions} values={customFieldValues} onChange={setCustomFieldValues} />
      )}

      <div>
        <Label htmlFor="notes">Notizen</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={customer?.notes ?? ""} />
      </div>

      {state?.duplicates && state.duplicates.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning-soft px-3 py-2.5 text-sm">
          <p className="font-medium text-ink">Mögliche Dublette gefunden:</p>
          <ul className="mt-1 space-y-0.5 text-xs text-ink-soft">
            {state.duplicates.map((d) => (
              <li key={d.id}>
                {d.first_name} {d.last_name} — {d.matchedOn.includes("phone") ? d.phone : d.email}{" "}
                <Badge tone="neutral">{d.matchedOn.includes("phone") && d.matchedOn.includes("email") ? "Telefon + E-Mail" : d.matchedOn.includes("phone") ? "Telefon" : "E-Mail"}</Badge>
              </li>
            ))}
          </ul>
          <button
            type="submit"
            name="confirm_duplicate"
            value="true"
            className="mt-2 text-xs font-medium text-bronze-dark hover:underline"
          >
            Trotzdem anlegen/speichern
          </button>
        </div>
      )}

      <FieldError>{state?.error}</FieldError>
      <Button type="submit" variant="bronze" className="w-full" disabled={pending}>
        {pending ? "Wird gespeichert…" : customer ? "Speichern" : "Kunde anlegen"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { DraftList } from "@/components/onboarding/draft-list";
import { CustomQuestionsEditor } from "@/components/services/custom-questions-editor";
import { formatDuration, formatPrice } from "@/lib/utils";
import {
  createServiceSelfAction,
  updateServiceSelfAction,
  deleteServiceSelfAction,
  toggleServiceActiveSelfAction,
  type ActionState,
} from "@/lib/actions/services";
import type { CustomQuestion, RequiredField } from "@/lib/validation/services";

const PALETTE = ["#8A7159", "#4F7D5C", "#B8873F", "#4F6F8F", "#B1533F", "#7C8B6E", "#8C6D9E", "#5C554C"];

export type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  has_price: boolean;
  price_cents: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  color: string;
  location_id: string | null;
  bookable_phone: boolean;
  bookable_online: boolean;
  active: boolean;
  required_customer_fields: RequiredField[];
  custom_questions: CustomQuestion[];
  employee_ids: string[];
  resource_ids: string[];
};

type Option = { id: string; name: string };

export function ServicesManager({
  salonId,
  services,
  employees,
  resources,
  locations,
  canManage,
}: {
  salonId: string;
  services: Service[];
  employees: Option[];
  resources: Option[];
  locations: Option[];
  canManage: boolean;
}) {
  const [modalService, setModalService] = useState<Service | "new" | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-lg text-ink">Terminarten &amp; Leistungen</h2>
        {canManage && (
          <Button size="sm" variant="outline" onClick={() => setModalService("new")}>
            <Plus className="h-4 w-4" /> Terminart
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {services.map((s) => (
          <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">
                  {s.name} {s.category && <span className="text-xs text-ink-faint">· {s.category}</span>}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {formatDuration(s.duration_minutes)}
                  {s.has_price && ` · ${formatPrice(s.price_cents)}`}
                  {(s.buffer_before_minutes > 0 || s.buffer_after_minutes > 0) &&
                    ` · Puffer ${s.buffer_before_minutes}/${s.buffer_after_minutes} Min.`}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {s.bookable_phone && <Badge tone="neutral">Telefonisch buchbar</Badge>}
                  {s.bookable_online && <Badge tone="neutral">Online buchbar</Badge>}
                  {s.custom_questions.length > 0 && <Badge tone="neutral">{s.custom_questions.length} Buchungsfragen</Badge>}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Badge tone={s.active ? "success" : "neutral"} dot>
                {s.active ? "Aktiv" : "Inaktiv"}
              </Badge>
              {canManage && (
                <>
                  <button
                    onClick={() => toggleServiceActiveSelfAction(salonId, s.id, !s.active)}
                    className="rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink"
                    aria-label={s.active ? "Deaktivieren" : "Aktivieren"}
                    title={s.active ? "Deaktivieren" : "Aktivieren"}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setModalService(s)}
                    className="rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink"
                    aria-label="Bearbeiten"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </Card>
        ))}
        {services.length === 0 && <Card className="p-8 text-center text-sm text-ink-soft">Noch keine Terminarten angelegt.</Card>}
      </div>

      <Modal
        open={modalService !== null}
        onClose={() => setModalService(null)}
        title={modalService === "new" ? "Terminart anlegen" : "Terminart bearbeiten"}
        width="lg"
      >
        {modalService && (
          <ServiceForm
            salonId={salonId}
            service={modalService === "new" ? null : modalService}
            employees={employees}
            resources={resources}
            locations={locations}
            onDone={() => setModalService(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function ServiceForm({
  salonId,
  service,
  employees,
  resources,
  locations,
  onDone,
}: {
  salonId: string;
  service: Service | null;
  employees: Option[];
  resources: Option[];
  locations: Option[];
  onDone: () => void;
}) {
  const action = service ? updateServiceSelfAction.bind(null, salonId, service.id) : createServiceSelfAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result?.ok) onDone();
    return result;
  }, null);
  const [, startTransition] = useTransition();

  const [hasPrice, setHasPrice] = useState(service?.has_price ?? true);
  const [priceEuro, setPriceEuro] = useState(service ? (service.price_cents / 100).toString() : "");
  const [active, setActive] = useState(service?.active ?? true);
  const [bookablePhone, setBookablePhone] = useState(service?.bookable_phone ?? true);
  const [bookableOnline, setBookableOnline] = useState(service?.bookable_online ?? true);
  const [requiredFields, setRequiredFields] = useState<RequiredField[]>(service?.required_customer_fields ?? []);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(service?.custom_questions ?? []);
  const [employeeIds, setEmployeeIds] = useState<string[]>(service?.employee_ids ?? []);
  const [resourceIds, setResourceIds] = useState<string[]>(service?.resource_ids ?? []);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function toggleId(list: string[], id: string, setList: (v: string[]) => void) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="required_customer_fields" value={JSON.stringify(requiredFields)} />
      <input type="hidden" name="custom_questions" value={JSON.stringify(customQuestions)} />
      <input type="hidden" name="has_price" value={String(hasPrice)} />
      <input type="hidden" name="active" value={String(active)} />
      <input type="hidden" name="bookable_phone" value={String(bookablePhone)} />
      <input type="hidden" name="bookable_online" value={String(bookableOnline)} />
      {employeeIds.map((id) => (
        <input key={id} type="hidden" name="employee_ids" value={id} />
      ))}
      {resourceIds.map((id) => (
        <input key={id} type="hidden" name="resource_ids" value={id} />
      ))}

      <div>
        <Label htmlFor="s_name">Name</Label>
        <Input id="s_name" name="name" required defaultValue={service?.name} placeholder="Beratungstermin" />
      </div>
      <div>
        <Label htmlFor="s_description">Beschreibung</Label>
        <Textarea id="s_description" name="description" rows={2} defaultValue={service?.description ?? ""} placeholder="Was beinhaltet dieser Termin?" />
      </div>
      <div>
        <Label htmlFor="s_category">Kategorie</Label>
        <Input id="s_category" name="category" defaultValue={service?.category ?? ""} placeholder="Optional" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="s_duration">Dauer (Min.)</Label>
          <Input id="s_duration" name="duration_minutes" type="number" min={5} step={5} required defaultValue={service?.duration_minutes ?? 60} />
        </div>
        <div>
          <Label htmlFor="s_price">Preis (€)</Label>
          <Input
            id="s_price"
            type="number"
            min={0}
            step="0.5"
            disabled={!hasPrice}
            value={priceEuro}
            onChange={(e) => setPriceEuro(e.target.value)}
            placeholder="59"
            className="disabled:opacity-50"
          />
          <input type="hidden" name="price_cents" value={Math.round(Number(priceEuro || 0) * 100)} />
          <label className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-soft">
            <input type="checkbox" checked={hasPrice} onChange={(e) => setHasPrice(e.target.checked)} className="rounded border-border-strong" />
            Preis hinterlegen
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="s_buffer_before">Vorbereitungszeit (Min.)</Label>
          <Input id="s_buffer_before" name="buffer_before_minutes" type="number" min={0} defaultValue={service?.buffer_before_minutes ?? 0} />
        </div>
        <div>
          <Label htmlFor="s_buffer_after">Nachbereitungszeit (Min.)</Label>
          <Input id="s_buffer_after" name="buffer_after_minutes" type="number" min={0} defaultValue={service?.buffer_after_minutes ?? 0} />
        </div>
      </div>

      {locations.length > 0 && (
        <div>
          <Label htmlFor="s_location">Standort</Label>
          <Select id="s_location" name="location_id" defaultValue={service?.location_id ?? ""}>
            <option value="">Alle Standorte</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label>Kalenderfarbe</Label>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={(service?.color ?? PALETTE[0]) === c} className="peer sr-only" />
              <span className="block h-7 w-7 rounded-full ring-offset-2 peer-checked:ring-2 ring-ink" style={{ backgroundColor: c }} />
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={bookablePhone} onChange={(e) => setBookablePhone(e.target.checked)} className="rounded border-border-strong" />
          Telefonisch buchbar
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={bookableOnline} onChange={(e) => setBookableOnline(e.target.checked)} className="rounded border-border-strong" />
          Online buchbar
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-border-strong" />
          Aktiv
        </label>
      </div>

      {employees.length > 0 && (
        <div>
          <Label>Verfügbare Mitarbeiter</Label>
          <div className="flex flex-wrap gap-2">
            {employees.map((e) => (
              <label
                key={e.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-strong bg-sand px-2.5 py-1.5 text-xs text-ink-soft"
              >
                <input
                  type="checkbox"
                  checked={employeeIds.includes(e.id)}
                  onChange={() => toggleId(employeeIds, e.id, setEmployeeIds)}
                  className="rounded border-border-strong"
                />
                {e.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {resources.length > 0 && (
        <div>
          <Label>Benötigte Ressourcen</Label>
          <div className="flex flex-wrap gap-2">
            {resources.map((r) => (
              <label
                key={r.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-strong bg-sand px-2.5 py-1.5 text-xs text-ink-soft"
              >
                <input
                  type="checkbox"
                  checked={resourceIds.includes(r.id)}
                  onChange={() => toggleId(resourceIds, r.id, setResourceIds)}
                  className="rounded border-border-strong"
                />
                {r.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <DraftList
        label="Notwendige Kundenangaben"
        hint="Welche Angaben braucht ihr von der Kundschaft für diesen Termin?"
        placeholder="z. B. Adresse hinzufügen"
        items={requiredFields}
        onChange={setRequiredFields}
      />

      <div>
        <Label>Individuelle Buchungsfragen</Label>
        <p className="mb-2 text-xs text-ink-faint">Was soll Mia bei der Buchung dieser Terminart zusätzlich abfragen?</p>
        <CustomQuestionsEditor questions={customQuestions} onChange={setCustomQuestions} />
      </div>

      <FieldError>{state?.error}</FieldError>
      {deleteError && (
        <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger">
          {deleteError}
          <button
            type="button"
            onClick={() => {
              if (!service) return;
              startTransition(async () => {
                await toggleServiceActiveSelfAction(salonId, service.id, false);
                onDone();
              });
            }}
            className="ml-2 font-medium underline underline-offset-2"
          >
            Jetzt deaktivieren
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 pt-2">
        {service && (
          <button
            type="button"
            onClick={() => {
              if (!confirm(`${service.name} wirklich löschen?`)) return;
              setDeleteError(null);
              startTransition(async () => {
                const result = await deleteServiceSelfAction(salonId, service.id);
                if (result?.error) setDeleteError(result.error);
                else onDone();
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"
          >
            <Trash2 className="h-4 w-4" /> Löschen
          </button>
        )}
        <Button type="submit" variant="bronze" className="ml-auto" disabled={pending}>
          {pending ? "Wird gespeichert…" : service ? "Speichern" : "Anlegen"}
        </Button>
      </div>
    </form>
  );
}

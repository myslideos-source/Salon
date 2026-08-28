"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import {
  createFaqAction,
  updateFaqAction,
  deleteFaqAction,
  toggleFaqActiveAction,
  type ActionState,
} from "@/lib/actions/faq";
import type { Tables } from "@/lib/supabase/database.types";

type Faq = Tables<"faq">;

export function FaqManager({ salonId, faqs }: { salonId: string; faqs: Faq[] }) {
  const [modalFaq, setModalFaq] = useState<Faq | "new" | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-ink-soft">Mia beantwortet diese Fragen direkt, ohne zu raten.</p>
        <Button size="sm" variant="outline" onClick={() => setModalFaq("new")}>
          <Plus className="h-4 w-4" /> Frage
        </Button>
      </div>

      {faqs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-ink-faint">
          Noch keine häufigen Fragen hinterlegt.
        </p>
      ) : (
        <div className="space-y-2">
          {faqs.map((f) => (
            <Card key={f.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-ink">{f.question}</p>
                  {!f.active && <Badge tone="neutral">Inaktiv</Badge>}
                  {f.category && <Badge tone="neutral">{f.category}</Badge>}
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{f.answer}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  title={f.active ? "Deaktivieren" : "Aktivieren"}
                  onClick={() => startTransition(() => toggleFaqActiveAction(salonId, f.id, !f.active))}
                  className="rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink"
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Bearbeiten"
                  onClick={() => setModalFaq(f)}
                  className="rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Löschen"
                  onClick={() => {
                    if (confirm("Diese Frage wirklich löschen?")) startTransition(() => deleteFaqAction(salonId, f.id));
                  }}
                  className="rounded-lg p-2 text-ink-soft hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalFaq !== null} onClose={() => setModalFaq(null)} title={modalFaq === "new" ? "Neue Frage" : "Frage bearbeiten"}>
        {modalFaq && <FaqForm salonId={salonId} faq={modalFaq === "new" ? null : modalFaq} onSaved={() => setModalFaq(null)} />}
      </Modal>
    </div>
  );
}

function FaqForm({ salonId, faq, onSaved }: { salonId: string; faq: Faq | null; onSaved: () => void }) {
  const boundAction = faq ? updateFaqAction.bind(null, salonId, faq.id) : createFaqAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await boundAction(prev, formData);
    if (result?.ok) onSaved();
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="question">Frage</Label>
        <Input id="question" name="question" defaultValue={faq?.question ?? ""} required maxLength={300} />
      </div>
      <div>
        <Label htmlFor="answer">Antwort</Label>
        <Textarea id="answer" name="answer" rows={4} defaultValue={faq?.answer ?? ""} required maxLength={1000} />
      </div>
      <div>
        <Label htmlFor="category">Kategorie (optional)</Label>
        <Input id="category" name="category" defaultValue={faq?.category ?? ""} maxLength={80} placeholder="z. B. Preise, Anfahrt" />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="active" defaultChecked={faq?.active ?? true} className="rounded border-border-strong" />
        Aktiv (wird von Mia genutzt)
      </label>
      <FieldError>{state?.error}</FieldError>
      <div className="flex justify-end">
        <Button type="submit" variant="bronze" disabled={pending}>
          {pending ? "Wird gespeichert…" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}

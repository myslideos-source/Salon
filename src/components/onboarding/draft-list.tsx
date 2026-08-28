"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/field";
import type { DraftItem } from "@/lib/validation/onboarding";

/** Editierbare/löschbare Vorschlagsliste (Terminarten, Buchungsfragen,
 * benötigte Felder). Reiner Entwurf — nichts hier ist bereits ein echter
 * Datensatz, alles bleibt frei änderbar oder entfernbar. */
export function DraftList({
  label,
  hint,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  items: DraftItem[];
  onChange: (items: DraftItem[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addItem() {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, { id: `custom-${Date.now()}-${items.length}`, text }]);
    setDraft("");
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink-soft">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
      <div className="mt-2 space-y-1.5">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              value={item.text}
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...item, text: e.target.value };
                onChange(next);
              }}
              className="h-9 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              aria-label={`${item.text} entfernen`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-ink-faint italic">Noch keine Einträge.</p>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          className="h-9 text-sm"
        />
        <button
          type="button"
          onClick={addItem}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bronze-soft text-bronze-dark transition-colors hover:bg-bronze hover:text-white"
          aria-label="Hinzufügen"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

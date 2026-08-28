"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import {
  CUSTOM_QUESTION_TYPES,
  CUSTOM_QUESTION_TYPE_LABEL,
  type CustomQuestion,
  type CustomQuestionType,
} from "@/lib/validation/services";

/**
 * Frei konfigurierbare individuelle Buchungsfragen einer Terminart. Jede
 * Frage hat einen geeigneten Feldtyp, eine Pflichtfeldsteuerung und eine
 * Reihenfolge (= Position in der Liste, per Pfeiltasten änderbar). Keine
 * Frage ist hier fest vorgegeben — Beispiele wie "Fahrzeug" oder
 * "Haarlänge" entstehen ausschließlich durch Nutzereingabe oder, im
 * Onboarding, durch eine editierbare Branchenvorlagen-Vorschlagsliste.
 */
export function CustomQuestionsEditor({ questions, onChange }: { questions: CustomQuestion[]; onChange: (q: CustomQuestion[]) => void }) {
  const [nextId, setNextId] = useState(0);

  function addQuestion() {
    const id = `q-${Date.now()}-${nextId}`;
    setNextId((n) => n + 1);
    onChange([...questions, { id, label: "", type: "text", required: false, options: [] }]);
  }

  function updateQuestion(index: number, patch: Partial<CustomQuestion>) {
    const next = [...questions];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {questions.map((q, index) => (
        <div key={q.id} className="rounded-lg border border-border-strong bg-sand/60 p-3">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 pt-1.5">
              <button
                type="button"
                onClick={() => moveQuestion(index, -1)}
                disabled={index === 0}
                aria-label="Nach oben"
                className="rounded p-0.5 text-ink-faint hover:bg-white/60 hover:text-ink disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveQuestion(index, 1)}
                disabled={index === questions.length - 1}
                aria-label="Nach unten"
                className="rounded p-0.5 text-ink-faint hover:bg-white/60 hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={q.label}
                onChange={(e) => updateQuestion(index, { label: e.target.value })}
                placeholder="z. B. Um welches Fahrzeug handelt es sich?"
                className="h-9 text-sm"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={q.type}
                  onChange={(e) => updateQuestion(index, { type: e.target.value as CustomQuestionType })}
                  className="h-9 w-auto text-sm"
                >
                  {CUSTOM_QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {CUSTOM_QUESTION_TYPE_LABEL[t]}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                    className="rounded border-border-strong"
                  />
                  Pflichtfeld
                </label>
              </div>
              {q.type === "select" && (
                <Input
                  value={q.options.join(", ")}
                  onChange={(e) =>
                    updateQuestion(index, {
                      options: e.target.value
                        .split(",")
                        .map((o) => o.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Optionen, mit Komma getrennt (z. B. Neubau, Altbau)"
                  className="h-9 text-sm"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => removeQuestion(index)}
              aria-label="Frage entfernen"
              className="mt-1 shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-danger-soft hover:text-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {questions.length === 0 && <p className="text-xs text-ink-faint italic">Noch keine individuellen Buchungsfragen.</p>}
      <button
        type="button"
        onClick={addQuestion}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-bronze-dark hover:bg-bronze-soft"
      >
        <Plus className="h-4 w-4" /> Frage hinzufügen
      </button>
    </div>
  );
}

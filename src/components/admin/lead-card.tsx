"use client";

import { useState, useTransition } from "react";
import { Phone, Mail, Globe, MapPin, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateLeadStatusAction, updateLeadNotesAction, deleteLeadAction } from "@/lib/actions/leads";
import type { LeadStatus } from "@/lib/validation/leads";
import type { Tables } from "@/lib/supabase/database.types";

const STATUS_OPTIONS: { status: LeadStatus; label: string; activeClass: string }[] = [
  { status: "interessiert", label: "Interessiert", activeClass: "bg-info text-white border-info" },
  { status: "gekauft", label: "Kauft / Erworben", activeClass: "brand-gradient-bg text-white border-transparent" },
  { status: "nicht_interessiert", label: "Nicht interessiert", activeClass: "bg-danger text-white border-danger" },
];

export function LeadCard({ lead }: { lead: Tables<"sales_leads"> }) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(lead.notes ?? "");

  function toggleStatus(status: LeadStatus) {
    const next = lead.status === status ? "neu" : status;
    startTransition(() => updateLeadStatusAction(lead.id, next));
  }

  function saveNotes() {
    if (notes === (lead.notes ?? "")) return;
    startTransition(() => updateLeadNotesAction(lead.id, notes));
  }

  return (
    <Card className={cn("p-4 transition-opacity", pending && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{lead.name}</p>
          {lead.address && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-soft">
              <MapPin className="h-3 w-3 shrink-0" /> {lead.address}
              {lead.distance_km !== null && <span className="shrink-0 text-ink-faint">· {lead.distance_km} km</span>}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (confirm(`"${lead.name}" wirklich löschen?`)) startTransition(() => deleteLeadAction(lead.id));
          }}
          className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-danger-soft hover:text-danger"
          aria-label="Lead löschen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-bronze-dark">
            <Phone className="h-3 w-3" /> {lead.phone}
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-bronze-dark">
            <Mail className="h-3 w-3" /> {lead.email}
          </a>
        )}
        {lead.website && (
          <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-bronze-dark">
            <Globe className="h-3 w-3" /> {lead.website}
          </a>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.status}
            onClick={() => toggleStatus(opt.status)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              lead.status === opt.status ? opt.activeClass : "border-border-strong text-ink-soft hover:bg-sand"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={saveNotes}
        rows={2}
        placeholder="Notizen…"
        className="mt-3 w-full resize-y rounded-lg border border-border-strong bg-sand px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze"
      />
    </Card>
  );
}

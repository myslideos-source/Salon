"use client";

import { useMemo, useState } from "react";
import { LeadCard } from "./lead-card";
import { NewLeadModal } from "./new-lead-modal";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";
import type { LeadStatus } from "@/lib/validation/leads";

const TABS: { key: LeadStatus | "alle"; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "neu", label: "Neu" },
  { key: "interessiert", label: "Interessiert" },
  { key: "gekauft", label: "Kauft / Erworben" },
  { key: "nicht_interessiert", label: "Nicht interessiert" },
];

export function LeadsBoard({ leads }: { leads: Tables<"sales_leads">[] }) {
  const [tab, setTab] = useState<LeadStatus | "alle">("alle");

  const counts = useMemo(() => {
    const c: Record<string, number> = { alle: leads.length };
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [leads]);

  const filtered = tab === "alle" ? leads : leads.filter((l) => l.status === tab);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.key ? "brand-gradient-bg border-transparent text-white" : "border-border-strong text-ink-soft hover:bg-sand"
              )}
            >
              {t.label} <span className="text-[10px] opacity-80">({counts[t.key] ?? 0})</span>
            </button>
          ))}
        </div>
        <NewLeadModal />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white/[0.03] p-10 text-center text-sm text-ink-faint">
          {leads.length === 0 ? "Noch keine Leads erfasst." : "Keine Leads in diesem Filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

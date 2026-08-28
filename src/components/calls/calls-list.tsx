"use client";

import { useMemo, useState, useTransition } from "react";
import { Phone, PhoneMissed, Voicemail, ChevronDown, CalendarCheck, PhoneCall, StickyNote, FileText, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTranscript } from "@/lib/calls/transcript";
import { matchesCallFilters, CALL_FILTER_KEYS, CALL_FILTER_LABELS, type CallFilterKey } from "@/lib/calls/filters";
import { updateCallNotesAction } from "@/lib/actions/calls";
import { CUSTOMER_STATUS_LABEL, type CustomerStatus } from "@/lib/validation/customers";

const OUTCOME_LABEL: Record<string, { label: string; tone: "success" | "info" | "warning" | "neutral" }> = {
  appointment_booked: { label: "Termin gebucht", tone: "success" },
  appointment_rescheduled: { label: "Termin verschoben", tone: "info" },
  appointment_cancelled: { label: "Termin storniert", tone: "warning" },
  info_given: { label: "Info gegeben", tone: "neutral" },
  callback_requested: { label: "Rückruf erbeten", tone: "warning" },
  handoff: { label: "Weitergeleitet", tone: "info" },
  no_action: { label: "Keine Aktion", tone: "neutral" },
};

const STATUS_ICON = { completed: Phone, missed: PhoneMissed, voicemail: Voicemail, in_progress: Phone };
const URGENCY_TONE: Record<string, "danger" | "warning" | "neutral"> = { urgent: "danger", high: "warning", normal: "neutral", low: "neutral" };
const URGENCY_LABEL: Record<string, string> = { urgent: "Dringend", high: "Erhöht", normal: "Normal", low: "Niedrig" };

export type CallListItem = {
  id: string;
  startedAt: string;
  durationSeconds: number;
  phoneNumber: string | null;
  customerName: string | null;
  customerStatus: string | null;
  topic: string | null;
  summary: string | null;
  outcome: string | null;
  status: string;
  urgency: "low" | "normal" | "high" | "urgent" | null;
  resolved: boolean;
  notes: string | null;
  transcript: unknown;
  recordingUrl: string | null;
  hasCallback: boolean;
  appointmentId: string | null;
  appointment: { startAt: string; employeeName: string | null; serviceNames: string[] } | null;
};

function fmtDateTime(iso: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function CallsList({ salonId, calls, redirectPath }: { salonId: string; calls: CallListItem[]; redirectPath: string }) {
  const [active, setActive] = useState<Set<CallFilterKey>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleFilter(key: CallFilterKey) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtered = useMemo(
    () =>
      calls.filter((c) =>
        matchesCallFilters(
          { appointmentId: c.appointmentId, hasCallback: c.hasCallback, resolved: c.resolved, urgency: c.urgency, customerStatus: c.customerStatus },
          active
        )
      ),
    [calls, active]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
        <button
          onClick={() => setActive(new Set())}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            active.size === 0 ? "border-bronze bg-bronze text-white" : "border-border-strong text-ink-soft hover:bg-sand"
          }`}
        >
          Alle Gespräche
        </button>
        {CALL_FILTER_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active.has(key) ? "border-bronze bg-bronze text-white" : "border-border-strong text-ink-soft hover:bg-sand"
            }`}
          >
            {CALL_FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="divide-y divide-border">
        {filtered.map((c) => (
          <CallRow
            key={c.id}
            salonId={salonId}
            call={c}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId((id) => (id === c.id ? null : c.id))}
            redirectPath={redirectPath}
          />
        ))}
        {filtered.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-faint">
            {calls.length === 0 ? "Noch keine Anrufe erfasst." : "Kein Gespräch entspricht den gewählten Filtern."}
          </p>
        )}
      </div>
    </div>
  );
}

function CallRow({
  salonId,
  call,
  expanded,
  onToggle,
  redirectPath,
}: {
  salonId: string;
  call: CallListItem;
  expanded: boolean;
  onToggle: () => void;
  redirectPath: string;
}) {
  const outcome = call.outcome ? OUTCOME_LABEL[call.outcome] : null;
  const StatusIcon = STATUS_ICON[call.status as keyof typeof STATUS_ICON] ?? Phone;
  const transcript = formatTranscript(call.transcript);

  return (
    <div className="px-5 py-4">
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-3 text-left">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-ink-soft">
            <StatusIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-ink">
              {call.customerName || call.phoneNumber || "Unbekannt"}
              {call.customerStatus && (
                <Badge tone="neutral" className="font-normal">
                  {CUSTOMER_STATUS_LABEL[call.customerStatus as CustomerStatus] ?? call.customerStatus}
                </Badge>
              )}
              {(call.urgency === "urgent" || call.urgency === "high") && (
                <Badge tone={URGENCY_TONE[call.urgency]} className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {URGENCY_LABEL[call.urgency]}
                </Badge>
              )}
              {!call.resolved && <Badge tone="warning">Nicht gelöst</Badge>}
            </p>
            <p className="text-xs text-ink-soft">
              {fmtDateTime(call.startedAt)} · {Math.round(call.durationSeconds / 60)} Min.
              {call.topic ? ` · ${call.topic}` : ""}
            </p>
            {call.summary && <p className="mt-1 text-xs text-ink-soft line-clamp-2">{call.summary}</p>}
            {call.appointment && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-bronze-dark">
                <CalendarCheck className="h-3 w-3" />
                {call.appointment.serviceNames.join(", ")}
                {call.appointment.employeeName ? ` · ${call.appointment.employeeName}` : ""} · {fmtDateTime(call.appointment.startAt)}
              </p>
            )}
            {call.hasCallback && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-warning">
                <PhoneCall className="h-3 w-3" /> Rückruf gewünscht
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {outcome && <Badge tone={outcome.tone}>{outcome.label}</Badge>}
          <ChevronDown className={`h-4 w-4 text-ink-faint transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 rounded-xl border border-border bg-cream-soft/60 p-4 text-sm">
          {call.recordingUrl ? (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                <FileText className="h-3.5 w-3.5" /> Audioaufnahme
              </p>
              <audio controls src={call.recordingUrl} className="w-full" />
            </div>
          ) : (
            <p className="text-xs text-ink-faint">Keine Audioaufnahme vorhanden.</p>
          )}

          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <FileText className="h-3.5 w-3.5" /> Transkript
            </p>
            {!transcript && <p className="text-xs text-ink-faint">Kein Transkript verfügbar.</p>}
            {typeof transcript === "string" && <p className="whitespace-pre-wrap text-xs text-ink">{transcript}</p>}
            {Array.isArray(transcript) && (
              <div className="max-h-64 space-y-1.5 overflow-y-auto scroll-thin">
                {transcript.map((line, i) => (
                  <p key={i} className="text-xs text-ink">
                    {line.speaker && <span className="font-medium text-ink-soft">{line.speaker}: </span>}
                    {line.text}
                  </p>
                ))}
              </div>
            )}
          </div>

          <NotesEditor salonId={salonId} callId={call.id} initialNotes={call.notes} redirectPath={redirectPath} />
        </div>
      )}
    </div>
  );
}

function NotesEditor({
  salonId,
  callId,
  initialNotes,
  redirectPath,
}: {
  salonId: string;
  callId: string;
  initialNotes: string | null;
  redirectPath: string;
}) {
  const [value, setValue] = useState(initialNotes ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateCallNotesAction(salonId, callId, value, redirectPath);
      setSaved(true);
    });
  }

  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
        <StickyNote className="h-3.5 w-3.5" /> Interne Notizen
      </p>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        onBlur={() => value !== (initialNotes ?? "") && save()}
        rows={2}
        placeholder="Nur intern sichtbar…"
        className="w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-xs text-ink outline-none focus:border-bronze"
      />
      {pending && <p className="mt-1 text-[11px] text-ink-faint">Wird gespeichert…</p>}
      {saved && !pending && <p className="mt-1 text-[11px] text-success">Gespeichert.</p>}
    </div>
  );
}

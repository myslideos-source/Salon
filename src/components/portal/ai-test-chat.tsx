"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, FlaskConical, RotateCcw, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { sendTestChatMessageAction, type TestChatMessage } from "@/lib/actions/ai-test-chat";

const TOOL_LABELS: Record<string, string> = {
  createCustomer: "Kunde anlegen",
  createAppointment: "Termin buchen",
  rescheduleAppointment: "Termin verschieben",
  cancelAppointment: "Termin stornieren",
  createCallbackRequest: "Rückruf anlegen",
};

export function TestChat({ salonId }: { salonId: string }) {
  const [messages, setMessages] = useState<TestChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastSimulated, setLastSimulated] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    startTransition(async () => {
      const result = await sendTestChatMessageAction(salonId, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessages([...next, { role: "assistant", content: result.reply }]);
      setLastSimulated(result.simulatedActions);
    });
  }

  function reset() {
    setMessages([]);
    setInput("");
    setError(null);
    setLastSimulated([]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-bronze/30 bg-bronze-soft px-4 py-3 text-sm text-bronze-dark">
        <FlaskConical className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Das ist eine Simulation.</p>
          <p className="mt-0.5">
            Mia antwortet hier mit exakt deinen gespeicherten Einstellungen, prüft echte Öffnungszeiten und Verfügbarkeiten - aber
            Termine, Kunden und Rückrufe werden dabei niemals wirklich angelegt, egal was im Gespräch „bestätigt“ wird.
          </p>
        </div>
      </div>

      <Card className="flex h-[60vh] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto scroll-thin p-4">
          {messages.length === 0 && (
            <p className="text-sm text-ink-faint">
              Stell Mia eine typische Kundenfrage, z. B. „Habt ihr am Samstag noch einen Termin frei?“ oder „Was kostet das bei
              euch?“.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "user" ? "bg-ink text-cream" : "bg-sand text-ink"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {pending && <p className="text-sm text-ink-faint">Mia tippt…</p>}
          <div ref={endRef} />
        </div>

        {lastSimulated.length > 0 && (
          <div className="flex items-center gap-2 border-t border-border bg-warning-soft px-4 py-2 text-xs text-warning">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Simuliert, nicht wirklich gespeichert: {lastSimulated.map((t) => TOOL_LABELS[t] ?? t).join(", ")}
          </div>
        )}

        {error && <p className="border-t border-border px-4 py-2 text-sm text-danger">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-border p-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nachricht an Mia…"
            disabled={pending}
            className="flex-1"
          />
          <Button type="submit" variant="bronze" disabled={pending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>

      <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={messages.length === 0}>
        <RotateCcw className="h-4 w-4" /> Neues Testgespräch
      </Button>
    </div>
  );
}

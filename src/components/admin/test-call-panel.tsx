"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };
type TraceEntry =
  | { kind: "message"; role: "user" | "assistant"; content: string }
  | { kind: "tool_call"; tool: string; args: unknown }
  | { kind: "tool_result"; tool: string; result: unknown };

export function TestCallPanel({ salonId, greeting }: { salonId: string; greeting: string }) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [trace, setTrace] = useState<TraceEntry[]>([{ kind: "message", role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [trace]);

  async function send() {
    if (!input.trim() || loading) return;
    const nextHistory: ChatMessage[] = [...history, { role: "user", content: input }];
    setTrace((t) => [...t, { kind: "message", role: "user", content: input }]);
    setHistory(nextHistory);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/voice/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonId, messages: nextHistory }),
    });

    if (res.status === 501) {
      setNotConfigured(true);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setTrace((t) => [...t, { kind: "message", role: "assistant", content: `Fehler: ${data.error ?? "Unbekannt"}` }]);
      return;
    }

    let assistantReply = "";
    for (const entry of data.trace as { role: string; content?: string; tool?: string; args?: unknown; result?: unknown }[]) {
      if (entry.role === "tool_call") {
        setTrace((t) => [...t, { kind: "tool_call", tool: entry.tool!, args: entry.args }]);
      } else if (entry.role === "tool_result") {
        setTrace((t) => [...t, { kind: "tool_result", tool: entry.tool!, result: entry.result }]);
      } else if (entry.role === "assistant") {
        assistantReply = entry.content ?? "";
        setTrace((t) => [...t, { kind: "message", role: "assistant", content: assistantReply }]);
      }
    }
    setHistory((h) => [...h, { role: "assistant", content: assistantReply }]);
  }

  if (notConfigured) {
    return (
      <Card className="p-6 text-sm text-ink-soft">
        <p className="font-medium text-ink mb-1">Testanruf ist noch nicht aktiv</p>
        <p>
          Trage einen <code className="rounded bg-sand px-1 py-0.5">OPENAI_API_KEY</code> in <code className="rounded bg-sand px-1 py-0.5">.env.local</code> ein, um den
          Voice Test Mode zu aktivieren. Die Tools (Kalenderprüfung, Buchung, Kundenanlage …) sind bereits vollständig angebunden — der Testanruf
          simuliert lediglich das Sprachverständnis über OpenAI.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex h-[560px] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-bronze" />
        <p className="text-sm font-medium text-ink">Voice Test Mode</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto scroll-thin p-4">
        {trace.map((entry, i) => {
          if (entry.kind === "message") {
            return (
              <div key={i} className={cn("flex", entry.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    entry.role === "user" ? "bg-ink text-cream" : "bg-sand text-ink"
                  )}
                >
                  {entry.content}
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] rounded-xl border border-bronze-soft bg-bronze-soft/40 px-3 py-2 font-mono text-[11px] text-bronze-dark">
                <div className="mb-1 flex items-center gap-1.5 font-sans font-medium">
                  <Wrench className="h-3 w-3" />
                  {entry.kind === "tool_call" ? `${entry.tool}(…)` : `→ ${entry.tool} Ergebnis`}
                </div>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(entry.kind === "tool_call" ? entry.args : entry.result, null, 2)}
                </pre>
              </div>
            </div>
          );
        })}
        {loading && <p className="text-xs text-ink-faint">Die KI denkt nach…</p>}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="z. B. „Ich hätte gerne Freitag einen Termin zum Schneiden bei Anna.“"
        />
        <Button variant="bronze" size="sm" onClick={send} disabled={loading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

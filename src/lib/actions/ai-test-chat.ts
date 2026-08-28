"use server";

// Testfunktion für "Meine Mia" (Konzeptabschnitt "KI-Assistent
// konfigurieren"): ein simulierter Chat, der exakt den Prompt nutzt, den
// auch der echte Telefonassistent bekommt (buildPromptFromConfig +
// dieselben tatsächlich gespeicherten voice_settings) - keine separate,
// abweichende Test-Logik. Lesende Tools (Öffnungszeiten, Leistungen, FAQ,
// Verfügbarkeit, Kundensuche) laufen live gegen die echte, RLS-geschützte
// Datenbank dieses Unternehmens, damit die Antworten genauso verlässlich
// sind wie am echten Telefon. Schreibende Tools (Termin buchen/verschieben/
// stornieren, Kunde/Rückruf anlegen) werden NICHT ausgeführt, sondern nur
// simuliert zurückgemeldet - der Testchat kann dadurch nie einen echten
// Termin oder Datensatz erzeugen, unabhängig davon, was in der Simulation
// "bestätigt" wird.
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { loadVoiceAgentContext } from "@/lib/voice/build-config";
import { buildPromptFromConfig } from "@/lib/voice/prompt";
import { runTool, toolSchemas, type ToolName } from "@/lib/voice/tools";
import { toolJsonSchemas, toolDescriptions } from "@/lib/voice/tool-json-schemas";

const WRITE_TOOLS = new Set<ToolName>([
  "createCustomer",
  "createAppointment",
  "rescheduleAppointment",
  "cancelAppointment",
  "createCallbackRequest",
]);

export type TestChatMessage = { role: "user" | "assistant"; content: string };

export type TestChatResult =
  | { ok: true; reply: string; simulatedActions: string[] }
  | { ok: false; error: string };

const MAX_TOOL_ROUNDS = 6;

export async function sendTestChatMessageAction(salonId: string, history: TestChatMessage[]): Promise<TestChatResult> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session) !== salonId) return { ok: false, error: "Kein Zugriff auf dieses Unternehmen." };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Die Testfunktion ist noch nicht eingerichtet (OPENAI_API_KEY fehlt). Bitte den Support kontaktieren." };
  }

  const supabase = await createClient();
  const context = await loadVoiceAgentContext(supabase, salonId);
  if (!context.ok) return { ok: false, error: context.error };

  const systemPrompt = [
    buildPromptFromConfig({ ...context.configBase, voiceId: "", webhookUrl: "" }),
    "",
    "SIMULATIONS-MODUS: Dies ist kein echtes Telefonat, sondern ein interner Testchat für das Unternehmen selbst, das gerade seine Mia-Einstellungen prüft. Verhalte dich inhaltlich trotzdem exakt so, wie du es am echten Telefon tun würdest (gleiche Regeln, gleicher Ton, gleiche Tools). Termine, Kunden und Rückrufe, die du in diesem Testchat anlegst, werden NICHT wirklich gespeichert, auch nach einer Bestätigung nicht - das System simuliert diese Aktionen nur, damit getestet werden kann, wie das Gespräch verlaufen würde.",
  ].join("\n");

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_TEST_CHAT_MODEL || "gpt-4o-mini";

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content }) as OpenAI.ChatCompletionMessageParam),
  ];

  const tools: OpenAI.ChatCompletionTool[] = (Object.keys(toolJsonSchemas) as ToolName[]).map((name) => ({
    type: "function",
    function: {
      name,
      description: toolDescriptions[name],
      parameters: toolJsonSchemas[name],
    },
  }));

  const simulatedActions: string[] = [];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await client.chat.completions.create({
        model,
        messages,
        tools,
        tool_choice: "auto",
      });

      const message = completion.choices[0]?.message;
      if (!message) return { ok: false, error: "Keine Antwort erhalten." };

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return { ok: true, reply: message.content ?? "", simulatedActions };
      }

      messages.push(message);

      for (const call of message.tool_calls) {
        if (call.type !== "function") continue;
        const name = call.function.name as ToolName;
        let args: unknown = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }

        if (!(name in toolSchemas)) {
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ ok: false, error: "Unbekanntes Tool." }) });
          continue;
        }

        if (WRITE_TOOLS.has(name)) {
          simulatedActions.push(name);
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              ok: true,
              data: { simulated: true, note: "Simulation: In einem echten Gespräch wäre dies jetzt ausgeführt worden. In diesem Testchat wurde nichts gespeichert." },
            }),
          });
          continue;
        }

        const result = await runTool(supabase, salonId, name, args);
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }

    return { ok: false, error: "Der Testchat konnte innerhalb der Zeit keine Antwort abschließen. Bitte erneut versuchen." };
  } catch (e) {
    console.error("[ai-test-chat] failed:", e);
    return { ok: false, error: "Der Testchat ist gerade nicht erreichbar. Bitte in ein paar Minuten erneut versuchen." };
  }
}

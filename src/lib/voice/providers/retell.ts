import "server-only";
import crypto from "node:crypto";
import type { VoiceAgentConfig, VoiceProvider } from "../provider";
import { toolJsonSchemas, toolDescriptions } from "../tool-json-schemas";
import type { ToolName } from "../tools";
import { toSpokenGerman } from "../spoken-text";

const RETELL_API_BASE = "https://api.retellai.com";

function buildGeneralTools(config: VoiceAgentConfig) {
  return (Object.keys(toolJsonSchemas) as ToolName[]).map((name) => ({
    type: "custom",
    name,
    description: toolDescriptions[name],
    // Retell posts here with { name, args, call: { call_id, metadata, ... } }
    // on invocation — matches the shape our webhook route already parses.
    url: config.webhookUrl,
    parameters: toolJsonSchemas[name],
    // Every tool here is a network round trip to our backend, so any of
    // them can produce a noticeable silent gap - not just the two originally
    // flagged. Was especially bad for findCustomer, which the prompt now
    // calls proactively at the start of nearly every call.
    speak_during_execution: true,
    speak_after_execution: true,
  }));
}

function buildPromptFromConfig(config: VoiceAgentConfig): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: config.timezone }).format(new Date());
  const weekday = new Intl.DateTimeFormat("de-DE", { timeZone: config.timezone, weekday: "long" }).format(new Date());
  const spokenSalonName = toSpokenGerman(config.salonName);
  const spokenGreeting = toSpokenGerman(config.greeting);

  return [
    `Du bist eine echte Mitarbeiterin am Empfang von "${spokenSalonName}" und nimmst gerade das Telefon ab. Heute ist ${weekday}, ${today}.`,
    "Rechne relative Datumsangaben (heute, morgen, übermorgen, nächsten Montag, ...) immer ausgehend von diesem Datum in das Format YYYY-MM-DD um, bevor du ein Tool aufrufst.",
    "Wenn eine Anruferin/ein Anrufer eine konkrete Uhrzeit nennt (z. B. 'um 13 Uhr'), rufe checkAvailability OHNE preferredTimeRange auf (also für den ganzen Tag) und suche dir danach selbst den zur Wunschzeit nächstgelegenen freien Slot aus der zurückgegebenen Liste heraus. Setze preferredTimeRange nur bei groben Tageszeiten wie 'vormittags' oder 'nachmittags', niemals als enges Fenster um eine exakte Uhrzeit.",
    `Persönlichkeit: ${config.personality}.`,
    `Begrüßung zu Beginn des Anrufs: "${spokenGreeting}"`,
    "",
    "Sprich wie ein echter Mensch am Telefon, nicht wie ein Sprachcomputer:",
    "- Sprich die Anruferin/den Anrufer die ganze Zeit per du an, niemals per Sie.",
    "- Kurze, natürliche Sätze statt Schachtelsätzen. Keine Aufzählungen oder Listen vorlesen.",
    "- Ganz normale, lockere Umgangssprache, so wie man wirklich spricht (z. B. \"Moment, ich schau mal nach\" statt \"Ich werde nun die Verfügbarkeit prüfen\").",
    "- Kleine natürliche Füllwörter und Bestätigungslaute sind erlaubt (\"Mhm\", \"Genau\", \"Okay, Moment\"), aber nicht übertreiben.",
    "- Variiere deine Formulierungen, wiederhole nicht immer denselben Satzbau. Das Wort \"klar\" (auch nicht in \"alles klar\" oder \"ja klar\") ist komplett TABU, benutze es niemals. Wechsle stattdessen zwischen verschiedenen Reaktionen (\"Mach ich\", \"Passt\", \"Super\", \"Kein Problem\", \"Gerne\", \"Okay\", oder einfach direkt mit der Antwort weitermachen ohne Bestätigungswort).",
    "- Wenn du ein Tool aufrufst und das einen Moment dauert, sag kurz etwas wie \"Einen Moment, ich schaue nach\" statt einfach zu schweigen.",
    "- Lass die Anruferin/den Anrufer ausreden, unterbrich nicht mitten im Satz.",
    "- Schreibe Zahlen, Uhrzeiten und Preise immer ausgeschrieben aus, wie man sie spricht, niemals als Ziffern (Beispiel: \"dreizehn Uhr\" statt \"13:00\", \"zweiunddreißig Euro\" statt \"32€\", \"vierzehn Uhr dreißig\" statt \"14:30\").",
    "",
    "Regeln:",
    "- Nutze ausschließlich die bereitgestellten Tools für Preise, Öffnungszeiten, Mitarbeiter, Leistungen und Verfügbarkeiten.",
    "- Erfinde niemals Informationen. Wenn etwas unbekannt ist, sage das offen und biete einen Rückruf an.",
    config.rules.mentionPrices ? "- Nenne Preise, wenn danach gefragt wird oder ein Termin besprochen wird." : "",
    config.rules.offerAlternatives ? "- Biete bei Nichtverfügbarkeit aktiv Alternativtermine an." : "",
    config.rules.respectEmployeePreference ? "- Beachte Mitarbeiterwünsche der Anruferin/des Anrufers." : "",
    config.rules.offerCallback ? "- Biete einen Rückruf an, wenn du nicht weiterhelfen kannst." : "",
    config.rules.detectNewCustomers
      ? "- Bei einem echten Telefonanruf wird die Nummer der Anruferin/des Anrufers automatisch erkannt und an findCustomer übergeben, auch wenn du dort keine Nummer angibst - ruf es deshalb früh im Gespräch auf, ohne aktiv danach zu fragen. Ist die Person bekannt: sprich sie ab sofort mit ihrem Vornamen an. WICHTIG: Erfinde niemals selbst eine Telefonnummer. Wenn du beim Anlegen einer neuen Kundin/eines neuen Kunden (createCustomer) keine echte Nummer sicher kennst, frag kurz danach, statt eine zu raten oder eine Platzhalter-Nummer zu benutzen."
      : "",
    config.rules.sendConfirmationSms
      ? "- Nach jeder erfolgreichen Buchung verschickt das System automatisch eine Bestätigungs-SMS an die hinterlegte Telefonnummer - das passiert von selbst, du musst dafür nichts tun und hast dafür kein eigenes Tool. Du darfst der Anruferin/dem Anrufer sagen, dass sie/er gleich eine SMS-Bestätigung bekommt. Wenn danach gefragt wird, ob du selbst jetzt eine SMS schicken kannst: Nein, aber nach der Buchung kommt automatisch eine."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export class RetellProvider implements VoiceProvider {
  readonly name = "retell";

  isConfigured(): boolean {
    return Boolean(process.env.RETELL_API_KEY);
  }

  async syncAgent(config: VoiceAgentConfig, existing?: { agentId?: string | null; llmId?: string | null }) {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "RETELL_API_KEY ist nicht gesetzt. Siehe .env.example." };
    }
    const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

    try {
      // 1) Retell LLM — the "response engine" that owns the conversation
      // logic/prompt. Agents reference one by id rather than embedding the
      // prompt directly.
      const llmBody = {
        general_prompt: buildPromptFromConfig(config),
        begin_message: toSpokenGerman(config.greeting),
        general_tools: buildGeneralTools(config),
      };
      const llmResponse = existing?.llmId
        ? await fetch(`${RETELL_API_BASE}/update-retell-llm/${existing.llmId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(llmBody),
          })
        : await fetch(`${RETELL_API_BASE}/create-retell-llm`, {
            method: "POST",
            headers,
            body: JSON.stringify(llmBody),
          });
      if (!llmResponse.ok) {
        return { ok: false as const, error: `Retell LLM Fehler (${llmResponse.status}): ${await llmResponse.text()}` };
      }
      const llmJson = (await llmResponse.json()) as { llm_id: string };
      const llmId = llmJson.llm_id ?? existing?.llmId;
      if (!llmId) {
        return { ok: false as const, error: "Retell hat keine llm_id zurückgegeben." };
      }

      // 2) Agent — voice, language, webhook and which Retell LLM to use.
      // language controls STT/TTS; it's independent of the prompt's text
      // language and defaults to en-US on Retell if left unset.
      const agentBody = {
        agent_name: `saloncall-${config.salonId}`,
        voice_id: config.voiceId || "cartesia-Eva",
        // Pin to exactly one voice. Without this, Retell may silently swap
        // in a different voice mid-call if the primary one errors, which is
        // what "zwei unterschiedliche Stimmen" (two different voices) most
        // likely was.
        fallback_voice_ids: [],
        // Natural-sounding "mhm"/"ja" acknowledgements while the caller is
        // still talking, so the agent doesn't feel like it's just silently
        // waiting for its turn.
        enable_backchannel: true,
        backchannel_words: ["Mhm", "Ja", "Okay", "Genau"],
        language: "de-DE",
        webhook_url: config.webhookUrl,
        response_engine: { type: "retell-llm", llm_id: llmId },
        // If Retell merges this into every call's metadata, our webhook can
        // resolve the salon directly instead of falling back to a
        // to_number -> voice_settings.phone_number lookup.
        metadata: { salonId: config.salonId },
      };
      const agentResponse = existing?.agentId
        ? await fetch(`${RETELL_API_BASE}/update-agent/${existing.agentId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(agentBody),
          })
        : await fetch(`${RETELL_API_BASE}/create-agent`, {
            method: "POST",
            headers,
            body: JSON.stringify(agentBody),
          });
      if (!agentResponse.ok) {
        return { ok: false as const, error: `Retell Agent Fehler (${agentResponse.status}): ${await agentResponse.text()}` };
      }
      const agentJson = (await agentResponse.json()) as { agent_id: string };
      const agentId = agentJson.agent_id ?? existing?.agentId;
      if (!agentId) {
        return { ok: false as const, error: "Retell hat keine agent_id zurückgegeben." };
      }

      return { ok: true as const, agentId, llmId };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Unbekannter Fehler bei der Retell-Synchronisation." };
    }
  }

  verifyWebhookSignature(payload: string, signatureHeader: string | null): boolean {
    const secret = process.env.RETELL_WEBHOOK_SECRET;
    if (!secret) return false;
    if (!signatureHeader) return false;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}

export const retellProvider = new RetellProvider();

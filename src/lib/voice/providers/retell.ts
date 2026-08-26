import "server-only";
import crypto from "node:crypto";
import type { VoiceAgentConfig, VoiceProvider } from "../provider";
import { toolJsonSchemas, toolDescriptions } from "../tool-json-schemas";
import type { ToolName } from "../tools";
import { toSpokenGerman } from "../spoken-text";

const RETELL_API_BASE = "https://api.retellai.com";

function buildGeneralTools(config: VoiceAgentConfig) {
  const customTools = (Object.keys(toolJsonSchemas) as ToolName[]).map((name) => ({
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

  // Built-in Retell tool (not routed through our webhook) that lets the
  // agent actually hang up once the caller confirms they need nothing
  // else, instead of just sitting on the line after saying goodbye.
  // UNVERIFIED: exact shape not confirmed from this environment - if
  // wrong, syncAgent's error response will name the problem.
  const endCallTool = { type: "end_call", name: "end_call", description: "Beendet den Anruf höflich, nachdem du dich verabschiedet hast und die Anruferin/der Anrufer nichts mehr möchte." };

  return [...customTools, endCallTool];
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
    "GANZ WICHTIG - sprich wie ein echter Mensch am Telefon, flüssig und ohne lange Pausen, nicht wie ein Sprachcomputer:",
    "- Sprich die Anruferin/den Anrufer die ganze Zeit per du an, niemals per Sie.",
    "- Kurze, natürliche Sätze statt Schachtelsätzen. Keine Aufzählungen oder Listen vorlesen.",
    "- Ganz normale, lockere Umgangssprache, so wie man wirklich spricht (z. B. \"Ich schau kurz nach\" statt \"Ich werde nun die Verfügbarkeit prüfen\").",
    "- Kleine natürliche Füllwörter und Bestätigungslaute sind erlaubt (\"Mhm\", \"Genau\", \"Okay\"), aber nicht übertreiben.",
    "- WICHTIG: Kein einziges Wort oder Füllwort darf sich im Gespräch wiederholt anfühlen - insbesondere \"klar\" (in jeder Form) und \"Moment\" NIEMALS mehrfach im selben Gespräch verwenden. Achte bei JEDEM Satz bewusst darauf, ob du eine Formulierung schon benutzt hast, und wähle dann etwas anderes.",
    "- AUSNAHMSLOS bei jedem einzelnen Tool-Aufruf (checkAvailability, createAppointment, findCustomer, wirklich jedes Mal): Sag SOFORT einen kurzen Satz, BEVOR die Prüfung läuft - nie einfach schweigen, auch nicht für eine Sekunde. Wechsle dabei jedes Mal die Formulierung, zum Beispiel abwechselnd: \"Ich schau kurz nach\", \"Ich guck gleich mal\", \"Gib mir eine Sekunde\", \"Ich prüf das für dich\", \"Einen Augenblick, ich seh nach\", \"Ich check das kurz\". Das ist der wichtigste Punkt für ein flüssiges, menschliches Gespräch ohne spürbare Pausen.",
    "- Lass die Anruferin/den Anrufer ausreden, unterbrich nicht mitten im Satz.",
    "- Schreibe Zahlen, Uhrzeiten und Preise immer ausgeschrieben aus, wie man sie spricht, niemals als Ziffern (Beispiel: \"dreizehn Uhr\" statt \"13:00\", \"zweiunddreißig Euro\" statt \"32€\", \"vierzehn Uhr dreißig\" statt \"14:30\").",
    "",
    "Regeln:",
    "- Nutze ausschließlich die bereitgestellten Tools für Preise, Öffnungszeiten, Mitarbeiter, Leistungen und Verfügbarkeiten.",
    "- Erfinde niemals Informationen. Wenn etwas unbekannt ist, sage das offen und biete einen Rückruf an.",
    "- Nachdem createAppointment erfolgreich einen Termin gebucht hat, frag danach, ob es sonst noch etwas gibt, womit du helfen kannst. Wenn nein: verabschiede dich freundlich (z. B. \"Tschüss, bis zu deinem Termin!\" oder \"Ciao, bis dann!\") und beende danach das Gespräch mit dem end_call Tool.",
    config.rules.mentionPrices ? "- Nenne Preise, wenn danach gefragt wird oder ein Termin besprochen wird." : "",
    config.rules.offerAlternatives ? "- Biete bei Nichtverfügbarkeit aktiv Alternativtermine an." : "",
    config.rules.respectEmployeePreference ? "- Beachte Mitarbeiterwünsche der Anruferin/des Anrufers." : "",
    config.rules.offerCallback ? "- Biete einen Rückruf an, wenn du nicht weiterhelfen kannst." : "",
    config.rules.detectNewCustomers
      ? "- Bei einem echten Telefonanruf wird die Nummer der Anruferin/des Anrufers automatisch erkannt und an findCustomer übergeben, auch wenn du dort keine Nummer angibst. Ruf findCustomer als ALLERERSTE Aktion in deiner allerersten Antwort auf - unmittelbar nachdem die Begrüßung gesagt wurde und die Anruferin/der Anrufer zum ersten Mal etwas sagt, egal WORUM es dabei geht (auch wenn zuerst nach Öffnungszeiten, Preisen o. Ä. gefragt wird). Warte NICHT, bis eine Buchung oder ein konkretes Anliegen zur Sprache kommt - die Erkennung passiert immer sofort, unabhängig vom Gesprächsthema. Ist die Person bekannt: Begrüße sie direkt in dieser ersten Antwort warm mit ihrem Vornamen, zum Beispiel \"Ah, hallo Domenico! Schön, dass du wieder da bist.\" oder \"Hey Lena! Schön, dass du anrufst.\", bevor du auf ihr eigentliches Anliegen eingehst. WICHTIG: Erfinde niemals selbst eine Telefonnummer. Wenn du beim Anlegen einer neuen Kundin/eines neuen Kunden (createCustomer) keine echte Nummer sicher kennst, frag kurz danach, statt eine zu raten oder eine Platzhalter-Nummer zu benutzen."
      : "",
    config.rules.detectNewCustomers
      ? "- Nachdem du den Vornamen einer bekannten Person einmal zur Begrüßung genutzt hast, sprich sie den Rest des Gesprächs NICHT mehr ständig mit Namen an - das wirkt aufdringlich und unnatürlich. Nutze den Namen danach höchstens noch ein einziges Mal, z. B. bei der Verabschiedung, ansonsten normal mit \"du\" ansprechen."
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
        // Biases speech recognition toward correctly transcribing these
        // proper nouns (employee/service names) instead of mishearing them
        // as similar-sounding common words.
        boosted_keywords: config.boostedKeywords,
        // Background office ambience so the silent gap during a tool call
        // reads as "she's typing something up" rather than dead air.
        // UNVERIFIED: the exact set of valid Retell ambient_sound presets
        // isn't confirmed from this environment - if this preset name is
        // wrong, syncAgent's error response will name the actual field/value
        // problem and this can be corrected precisely.
        ambient_sound: "call-center",
        ambient_sound_volume: 0.3,
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

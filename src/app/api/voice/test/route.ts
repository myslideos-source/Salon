import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSession, resolveActiveSalonId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { runTool, toolSchemas, type ToolName } from "@/lib/voice/tools";
import { toolJsonSchemas } from "@/lib/voice/tool-json-schemas";
import { toSpokenGerman } from "@/lib/voice/spoken-text";

export type TestMessage =
  | { role: "user" | "assistant"; content: string }
  | { role: "tool_call"; tool: string; args: unknown }
  | { role: "tool_result"; tool: string; result: unknown };

const MAX_TOOL_ROUNDS = 6;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { salonId?: string; messages: { role: "user" | "assistant"; content: string }[] };
  const salonId = resolveActiveSalonId(session, body.salonId);
  const authorized = session.isPlatformAdmin || session.salons.some((s) => s.salonId === salonId);
  if (!salonId || !authorized) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY ist nicht gesetzt. Trage den Key in .env.local ein, um den Testanruf zu aktivieren." },
      { status: 501 }
    );
  }

  const supabase = await createClient();
  const { data: salon } = await supabase.from("salons").select("name, timezone").eq("id", salonId).single();
  const { data: voiceSettings } = await supabase.from("voice_settings").select("*").eq("salon_id", salonId).maybeSingle();

  if (!salon) return NextResponse.json({ error: "salon not found" }, { status: 404 });

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: salon.timezone }).format(new Date());
  const weekday = new Intl.DateTimeFormat("de-DE", { timeZone: salon.timezone, weekday: "long" }).format(new Date());

  const spokenSalonName = toSpokenGerman(salon.name);
  const spokenGreeting = toSpokenGerman(voiceSettings?.greeting ?? `Hallo und herzlich willkommen bei ${salon.name}.`);

  const systemPrompt = [
    `Du bist die digitale Telefonassistenz von "${spokenSalonName}". Heute ist ${weekday}, ${today}.`,
    `Persönlichkeit: ${voiceSettings?.personality ?? "freundlich"}.`,
    `Begrüßung zu Beginn: "${spokenGreeting}"`,
    "Nutze ausschließlich die bereitgestellten Tools für Preise, Öffnungszeiten, Mitarbeiter, Leistungen, Kunden, Verfügbarkeiten und Termine.",
    "Erfinde niemals Preise, Mitarbeiter, Termine, Leistungen oder Öffnungszeiten.",
    "Sprich die Anruferin/den Anrufer die ganze Zeit per du an, niemals per Sie.",
    "Wenn eine Anruferin/ein Anrufer eine konkrete Uhrzeit nennt (z. B. 'um 13 Uhr'), rufe checkAvailability OHNE preferredTimeRange auf (also für den ganzen Tag) und suche dir danach selbst den zur Wunschzeit nächstgelegenen freien Slot aus der zurückgegebenen Liste heraus. Setze preferredTimeRange nur bei groben Tageszeiten wie 'vormittags' oder 'nachmittags', niemals als enges Fenster um eine exakte Uhrzeit.",
    "Wenn eine Information nicht sicher über ein Tool ermittelt werden kann, sage das offen und biete an, den Wunsch an den Salon weiterzugeben (createCallbackRequest).",
    "Bevor du einen Termin verschiebst oder stornierst, bestätige ihn zuerst mit der Anruferin/dem Anrufer (z. B. 'Meinst du deinen Termin am Freitag um 14:30 Uhr bei Anna?').",
    "Antworte immer auf Deutsch, in kurzen, natürlich klingenden Sätzen wie am Telefon.",
    "Schreibe Zahlen, Uhrzeiten und Preise immer ausgeschrieben aus, wie man sie spricht, niemals als Ziffern (Beispiel: \"dreizehn Uhr\" statt \"13:00\", \"zweiunddreißig Euro\" statt \"32€\", \"vierzehn Uhr dreißig\" statt \"14:30\").",
    voiceSettings?.send_confirmation_sms
      ? "Nach jeder erfolgreichen Buchung verschickt das System automatisch eine Bestätigungs-SMS an die hinterlegte Telefonnummer - das passiert von selbst, du musst dafür nichts tun und hast dafür kein eigenes Tool. Du darfst der Anruferin/dem Anrufer sagen, dass sie/er gleich eine SMS-Bestätigung bekommt."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const client = new OpenAI({ apiKey });
  const tools = (Object.keys(toolSchemas) as ToolName[]).map((name) => ({
    type: "function" as const,
    function: {
      name,
      parameters: toolJsonSchemas[name],
    },
  }));

  const conversation: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...body.messages.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam),
  ];

  const trace: TestMessage[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversation,
      tools,
    });

    const choice = completion.choices[0];
    const message = choice.message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      trace.push({ role: "assistant", content: message.content ?? "" });
      return NextResponse.json({ trace });
    }

    conversation.push(message);

    for (const call of message.tool_calls) {
      if (call.type !== "function") continue;
      let args: unknown = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      trace.push({ role: "tool_call", tool: call.function.name, args });

      const result = await runTool(supabase, salonId, call.function.name as ToolName, args);
      trace.push({ role: "tool_result", tool: call.function.name, result });

      conversation.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  trace.push({ role: "assistant", content: "Entschuldigung, das dauert gerade zu lange. Ich gebe deinen Wunsch an den Salon weiter." });
  return NextResponse.json({ trace });
}

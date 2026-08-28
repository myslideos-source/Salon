// Retell/ElevenLabs/Twilio each report a call transcript in their own
// shape (or not at all) — see the "UNVERIFIED" notes in the webhook
// routes. Parsed defensively here rather than assumed, same spirit as the
// webhook parsing itself.

export type TranscriptLine = { speaker: string; text: string };

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export function formatTranscript(raw: unknown): TranscriptLine[] | string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") return raw.trim() || null;

  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    const lines: TranscriptLine[] = [];
    for (const entry of raw) {
      if (typeof entry === "string") {
        lines.push({ speaker: "", text: entry });
        continue;
      }
      if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        const speakerRaw = asString(obj.role) ?? asString(obj.speaker) ?? asString(obj.sender) ?? "";
        const speaker = speakerRaw === "agent" || speakerRaw === "assistant" ? "Mia" : speakerRaw === "user" ? "Anrufer" : speakerRaw;
        const text = asString(obj.content) ?? asString(obj.text) ?? asString(obj.message) ?? "";
        if (text) lines.push({ speaker, text });
      }
    }
    return lines.length > 0 ? lines : null;
  }

  return null;
}

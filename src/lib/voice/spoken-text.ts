import "server-only";

// Some salon names use English connector words (e.g. "Isi by Schnittpunkt")
// that German TTS engines mispronounce when read as if they were German.
// The first fix (phonetic respelling "by" -> "bai") apparently still didn't
// read right, so this now substitutes the real German word "bei" instead -
// same meaning in context ("Isi bei Schnittpunkt"), and since it's an actual
// German word rather than an invented phonetic spelling, every German voice
// engine already knows how to pronounce it correctly.
export function toSpokenGerman(text: string): string {
  return text.replace(/\bby\b/gi, "bei");
}

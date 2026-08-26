import "server-only";

// Some salon names use English connector words (e.g. "Isi by Schnittpunkt")
// that German TTS engines mispronounce when read as if they were German.
// Respelling them phonetically before they reach the prompt/begin_message
// fixes this the same way the digit-spelling rule fixes number
// mispronunciation - by changing what gets *written*, not the voice engine.
export function toSpokenGerman(text: string): string {
  return text.replace(/\bby\b/gi, "bai");
}

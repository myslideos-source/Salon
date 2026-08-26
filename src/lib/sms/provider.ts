import "server-only";

// Provider pattern (same shape as lib/voice/provider.ts): HalloMia talks to
// whichever SMS vendor is configured through this interface, so swapping
// providers later never touches the booking engine that calls it.
export interface SmsProvider {
  readonly name: string;
  isConfigured(): boolean;
  send(to: string, body: string): Promise<{ ok: true } | { ok: false; error: string }>;
}

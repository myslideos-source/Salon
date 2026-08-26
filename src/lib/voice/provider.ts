import "server-only";

// Provider pattern (section 54): SalonCall talks to whichever Voice-AI
// vendor is configured through this interface, so swapping Retell for
// another provider later never touches the tool implementations in
// `lib/voice/tools.ts` or the booking engine.

export interface VoiceAgentConfig {
  salonId: string;
  salonName: string;
  greeting: string;
  personality: string;
  voiceId: string;
  phoneNumber: string | null;
  forwardingNumber: string | null;
  rules: {
    mentionPrices: boolean;
    offerAlternatives: boolean;
    respectEmployeePreference: boolean;
    offerCallback: boolean;
    detectNewCustomers: boolean;
  };
  webhookUrl: string;
}

export interface VoiceProvider {
  readonly name: string;
  /** Whether this provider is fully configured (API key present etc.). */
  isConfigured(): boolean;
  /** Push/update the agent configuration with the provider. */
  syncAgent(config: VoiceAgentConfig): Promise<{ ok: true; agentId: string } | { ok: false; error: string }>;
  /** Verify an inbound webhook actually came from this provider. */
  verifyWebhookSignature(payload: string, signatureHeader: string | null): boolean;
}

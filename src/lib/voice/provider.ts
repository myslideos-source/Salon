import "server-only";

// Provider pattern (section 54): HalloMia talks to whichever Voice-AI
// vendor is configured through this interface, so swapping Retell for
// another provider later never touches the tool implementations in
// `lib/voice/tools.ts` or the booking engine.

export interface VoiceAgentConfig {
  salonId: string;
  salonName: string;
  timezone: string;
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
    sendConfirmationSms: boolean;
  };
  webhookUrl: string;
  /** Proper nouns worth biasing speech recognition toward (employee names,
   * service names) - helps the provider transcribe them correctly instead
   * of mishearing them as similar-sounding common words. */
  boostedKeywords: string[];
}

export interface VoiceProvider {
  readonly name: string;
  /** Whether this provider is fully configured (API key present etc.). */
  isConfigured(): boolean;
  /** Push/update the agent configuration with the provider. Pass the
   * previously-stored ids (if any) so this updates in place instead of
   * creating duplicates on every sync. */
  syncAgent(
    config: VoiceAgentConfig,
    existing?: { agentId?: string | null; llmId?: string | null }
  ): Promise<{ ok: true; agentId: string; llmId: string } | { ok: false; error: string }>;
  /** Verify an inbound webhook actually came from this provider. */
  verifyWebhookSignature(payload: string, signatureHeader: string | null): boolean;
}

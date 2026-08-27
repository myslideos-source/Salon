import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "Name ist erforderlich"),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  distance_km: z.coerce.number().min(0).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const LEAD_STATUSES = ["neu", "interessiert", "gekauft", "nicht_interessiert"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

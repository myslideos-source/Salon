import { z } from "zod";

// Self-Service-Gegenstück zu `src/lib/validation/salon.ts` (admin-only) für
// den Sonderauftrag "Standorte, Team, Ressourcen und Verfügbarkeit". Gleiche
// Validierungstiefe wie die bestehenden Admin-Schemas — echte serverseitige
// Prüfung, keine reine Client-Kosmetik.

export const RESOURCE_TYPES = ["room", "seat", "vehicle", "equipment", "table", "other"] as const;
export const RESOURCE_TYPE_LABEL: Record<(typeof RESOURCE_TYPES)[number], string> = {
  room: "Raum",
  seat: "Behandlungsplatz",
  vehicle: "Fahrzeug",
  equipment: "Gerät",
  table: "Tisch",
  other: "Sonstige",
};

export const locationSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").max(120),
  address: z.string().max(300).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  timezone: z.string().max(60).optional().or(z.literal("")),
  active: z.coerce.boolean().default(true),
});
export type LocationInput = z.infer<typeof locationSchema>;

export const resourceSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").max(120),
  type: z.enum(RESOURCE_TYPES),
  description: z.string().max(500).optional().or(z.literal("")),
  location_id: z.string().uuid().optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Ungültige Farbe"),
  active: z.coerce.boolean().default(true),
});
export type ResourceInput = z.infer<typeof resourceSchema>;

export const resourceWorkingHourSchema = z.object({
  resource_id: z.string().uuid(),
  weekday: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});
export type ResourceWorkingHourInput = z.infer<typeof resourceWorkingHourSchema>;

export const businessHourExceptionSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum"),
    is_closed: z.coerce.boolean(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
    end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
    note: z.string().max(200).optional().or(z.literal("")),
    location_id: z.string().uuid().optional().or(z.literal("")),
  })
  .refine((v) => v.is_closed || (v.start_time && v.end_time), {
    message: "Bitte Uhrzeiten angeben oder als geschlossen markieren.",
    path: ["start_time"],
  });
export type BusinessHourExceptionInput = z.infer<typeof businessHourExceptionSchema>;

export const callbackWindowSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});
export type CallbackWindowInput = z.infer<typeof callbackWindowSchema>;

export const bookingRulesSchema = z.object({
  slot_granularity_minutes: z.coerce.number().int().refine((v) => [5, 10, 15, 30].includes(v), {
    message: "Ungültige Granularität",
  }),
  earliest_booking_lead_minutes: z.coerce.number().int().min(0),
  max_advance_booking_days: z.coerce.number().int().min(1),
  max_parallel_appointments: z.coerce.number().int().min(1).optional(),
  max_appointments_per_day: z.coerce.number().int().min(1).optional(),
});
export type BookingRulesInput = z.infer<typeof bookingRulesSchema>;

import { z } from "zod";

export const salonSchema = z.object({
  name: z.string().min(2, "Name ist erforderlich"),
  slug: z
    .string()
    .min(2, "Slug ist erforderlich")
    .regex(/^[a-z0-9-]+$/, "Nur Kleinbuchstaben, Zahlen und Bindestriche"),
  timezone: z.string().min(1).default("Europe/Berlin"),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  slot_granularity_minutes: z.coerce.number().int().refine((v) => [5, 10, 15, 30].includes(v), {
    message: "Ungültige Granularität",
  }),
  earliest_booking_lead_minutes: z.coerce.number().int().min(0),
  max_advance_booking_days: z.coerce.number().int().min(1),
});

export type SalonInput = z.infer<typeof salonSchema>;

export const employeeSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Ungültige Farbe"),
  active: z.coerce.boolean().default(true),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

export const serviceSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  category: z.string().optional().or(z.literal("")),
  duration_minutes: z.coerce.number().int().min(5, "Mindestens 5 Minuten"),
  price_cents: z.coerce.number().int().min(0),
  buffer_before_minutes: z.coerce.number().int().min(0),
  buffer_after_minutes: z.coerce.number().int().min(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Ungültige Farbe"),
  active: z.coerce.boolean().default(true),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const workingHourSchema = z.object({
  employee_id: z.string().uuid(),
  weekday: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

export const businessHourSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  is_closed: z.coerce.boolean(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
});

export const absenceSchema = z.object({
  employee_id: z.string().uuid(),
  type: z.enum(["vacation", "sick", "break", "training", "private", "other"]),
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  note: z.string().optional().or(z.literal("")),
});

export const customerSchema = z.object({
  first_name: z.string().optional().or(z.literal("")),
  last_name: z.string().optional().or(z.literal("")),
  phone: z.string().min(3, "Telefonnummer ist erforderlich"),
  email: z.string().email().optional().or(z.literal("")),
  preferred_employee_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

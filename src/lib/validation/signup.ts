import { z } from "zod";

export const signupRequestSchema = z.object({
  salon_name: z.string().min(2, "Salon-Name ist erforderlich"),
  contact_name: z.string().min(2, "Name ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().optional().or(z.literal("")),
  plan: z.enum(["starter", "salon", "pro"], { message: "Bitte ein Paket wählen" }),
  message: z.string().optional().or(z.literal("")),
});

export type SignupRequestInput = z.infer<typeof signupRequestSchema>;

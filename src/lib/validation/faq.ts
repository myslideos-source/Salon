import { z } from "zod";

export const faqSchema = z.object({
  question: z.string().min(1, "Frage ist erforderlich").max(300),
  answer: z.string().min(1, "Antwort ist erforderlich").max(1000),
  category: z.string().max(80).optional().or(z.literal("")),
  active: z.coerce.boolean(),
});

export type FaqInput = z.infer<typeof faqSchema>;

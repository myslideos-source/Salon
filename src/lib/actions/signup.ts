"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { signupRequestSchema } from "@/lib/validation/signup";

export type SignupActionState = { error?: string; ok?: boolean } | null;

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

// Public landing-page form, no session - runs with the service-role client
// (same pattern as the voice webhook) since an anonymous visitor has no
// Supabase auth to satisfy the signup_requests RLS policy.
export async function createSignupRequestAction(
  _prev: SignupActionState,
  formData: FormData
): Promise<SignupActionState> {
  const parsed = signupRequestSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = createAdminClient();
  const { error } = await supabase.from("signup_requests").insert({
    salon_name: parsed.data.salon_name,
    contact_name: parsed.data.contact_name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    plan: parsed.data.plan,
    message: parsed.data.message || null,
  });

  if (error) return { error: "Anfrage konnte nicht gesendet werden. Bitte versuch es nochmal." };
  return { ok: true };
}

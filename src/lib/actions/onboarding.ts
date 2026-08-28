"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession, requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { onboardingCompanySchema, onboardingDetailsSchema, onboardingDraftSchema } from "@/lib/validation/onboarding";

export type OnboardingActionState = { error?: string; ok?: boolean } | null;

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function mapCreateSalonError(message: string): string {
  if (message.includes("already has a company")) return "Für dieses Konto ist bereits ein Unternehmen angelegt.";
  if (message.includes("duplicate key") || message.includes("salons_slug_key")) {
    return "Dieser Kurzname ist bereits vergeben. Bitte einen anderen wählen.";
  }
  if (message.includes("not authenticated")) return "Bitte melde dich erneut an.";
  return "Unternehmen konnte nicht angelegt werden. Bitte versuch es erneut.";
}

// Schritt 1 — Unternehmen anlegen. Läuft für einen angemeldeten Nutzer, der
// noch keinem Unternehmen zugeordnet ist (self-service, siehe
// `create_own_salon`-RPC). Bereits bestehende Mitgliedschaften werden nicht
// verändert — ein Nutzer kann sich hierüber nicht in ein zweites,
// unabhängiges Unternehmen "hineinlegen".
export async function createCompanyOnboardingAction(
  _prev: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.isPlatformAdmin) redirect("/admin/dashboard");
  if (session.salons.length > 0) redirect("/app/onboarding");

  const parsed = onboardingCompanySchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_own_salon", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
  });
  if (error) return { error: mapCreateSalonError(error.message) };

  redirect("/app/onboarding");
}

// Schritt 1 (erneut bearbeiten) — Name und Kurzname eines bereits
// angelegten Unternehmens ändern. Wie alle Vorschläge/Angaben im
// Einrichtungsassistenten bleibt das jederzeit editierbar.
export async function updateCompanyBasicsAction(
  salonId: string,
  _prev: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session) !== salonId) return { error: "Kein Zugriff auf dieses Unternehmen." };

  const parsed = onboardingCompanySchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_salon_onboarding", {
    target_salon_id: salonId,
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_onboarding_step: 2,
  });
  if (error) {
    return { error: error.message.includes("duplicate key") ? "Dieser Kurzname ist bereits vergeben." : error.message };
  }

  revalidatePath("/app/onboarding");
  return { ok: true };
}

// Schritt 2 — Branche auswählen. `draft` ist der frei bearbeitbare/löschbare
// Vorschlags-Entwurf (Terminarten, Buchungsfragen, benötigte Felder) aus
// der gewählten Vorlage; nichts davon wird hier als echte Terminart o. Ä.
// angelegt. Wird auch für die reine Autospeicherung beim Bearbeiten der
// Vorschläge verwendet (ohne Schrittwechsel).
export async function saveIndustryStepAction(
  salonId: string,
  industryTemplateId: string,
  draft: unknown,
  advance: boolean
): Promise<OnboardingActionState> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session) !== salonId) return { error: "Kein Zugriff auf dieses Unternehmen." };

  const parsedDraft = onboardingDraftSchema.safeParse(draft);
  if (!parsedDraft.success) return { error: "Ungültige Vorschlagsdaten." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_salon_onboarding", {
    target_salon_id: salonId,
    p_industry_template_id: industryTemplateId,
    p_onboarding_draft: parsedDraft.data,
    p_onboarding_step: advance ? 3 : 2,
  });
  if (error) return { error: error.message };

  revalidatePath("/app/onboarding");
  return { ok: true };
}

// Schritt 3 — Unternehmensdaten eintragen.
export async function saveCompanyDetailsAction(
  salonId: string,
  _prev: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session) !== salonId) return { error: "Kein Zugriff auf dieses Unternehmen." };

  const parsed = onboardingDetailsSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const advance = formData.get("advance") === "true";

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_salon_onboarding", {
    target_salon_id: salonId,
    p_phone: parsed.data.phone || "",
    p_address: parsed.data.address || "",
    p_timezone: parsed.data.timezone,
    p_onboarding_step: advance ? 4 : 3,
  });
  if (error) return { error: error.message };

  revalidatePath("/app/onboarding");
  return { ok: true };
}

// Schritte 4–6 (Standort, Öffnungszeiten, Team & Ressourcen) speichern über
// ihre eigenen, bereits bestehenden Self-Service-Aktionen (locations.ts,
// availability-settings.ts, team-resources.ts) — hier wird nach jedem
// Schritt nur noch der Fortschritts-Zeiger weitergesetzt, analog zum
// `p_onboarding_step`-Parameter der übrigen Schritte.
export async function advanceOnboardingStepAction(salonId: string, step: number): Promise<void> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session) !== salonId) throw new Error("Kein Zugriff auf dieses Unternehmen.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_salon_onboarding", {
    target_salon_id: salonId,
    p_onboarding_step: step,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/onboarding");
}

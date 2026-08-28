import { redirect } from "next/navigation";
import { getSession, resolveActiveSalonId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { parseOnboardingDraft } from "@/lib/onboarding/steps";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");
  // Der Einrichtungsassistent ist ein Self-Service-Flow für Unternehmen,
  // nicht für das HalloMia-Team — Plattform-Admins ohne eigenes
  // Unternehmen gehören ins Admin-Portal.
  if (session.isPlatformAdmin && session.salons.length === 0) redirect("/admin/dashboard");

  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("industry_templates")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  const salonId = resolveActiveSalonId(session);
  if (!salonId) {
    return <OnboardingWizard templates={templates ?? []} salon={null} />;
  }

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, slug, phone, address, timezone, industry_template_id, onboarding_step, onboarding_draft")
    .eq("id", salonId)
    .single();

  if (!salon) redirect("/app/login");

  return (
    <OnboardingWizard
      templates={templates ?? []}
      salon={{
        id: salon.id,
        name: salon.name,
        slug: salon.slug,
        phone: salon.phone ?? "",
        address: salon.address ?? "",
        timezone: salon.timezone,
        industryTemplateId: salon.industry_template_id,
        onboardingStep: salon.onboarding_step,
        draft: parseOnboardingDraft(salon.onboarding_draft),
      }}
    />
  );
}

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

  const [{ data: salon }, { data: locations }, { data: businessHours }, { data: employees }, { data: resources }] = await Promise.all([
    supabase
      .from("salons")
      .select("id, name, slug, phone, address, timezone, industry_template_id, onboarding_step, onboarding_draft")
      .eq("id", salonId)
      .single(),
    supabase
      .from("locations")
      .select("id, name, address, phone, timezone, active, is_default")
      .eq("salon_id", salonId)
      .order("sort_order"),
    supabase.from("business_hours").select("weekday, is_closed, start_time, end_time").eq("salon_id", salonId).order("weekday"),
    supabase
      .from("employees")
      .select("id, first_name, last_name, color, active, location_id")
      .eq("salon_id", salonId)
      .order("sort_order"),
    supabase
      .from("resources")
      .select("id, name, type, description, color, active, location_id")
      .eq("salon_id", salonId)
      .order("sort_order"),
  ]);

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
        locations: locations ?? [],
        businessHours: businessHours ?? [],
        employees: employees ?? [],
        resources: resources ?? [],
      }}
    />
  );
}

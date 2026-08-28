import { redirect } from "next/navigation";
import { getSession, resolveActiveSalonId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { parseOnboardingDraft } from "@/lib/onboarding/steps";
import { parseCustomQuestions, parseRequiredFields } from "@/lib/validation/services";
import type { Service } from "@/components/services/services-manager";

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

  const [
    { data: salon },
    { data: locations },
    { data: businessHours },
    { data: employees },
    { data: resources },
    { data: services },
    { data: employeeServices },
    { data: serviceResources },
    { data: voiceSettings },
    { data: faqs },
  ] = await Promise.all([
    supabase
      .from("salons")
      .select("id, name, slug, phone, address, timezone, industry_template_id, onboarding_step, onboarding_draft, description")
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
    supabase.from("services").select("*").eq("salon_id", salonId).order("sort_order").order("name"),
    supabase.from("employee_services").select("employee_id, service_id").eq("salon_id", salonId),
    supabase.from("service_resources").select("resource_id, service_id").eq("salon_id", salonId),
    supabase.from("voice_settings").select("assistant_name, greeting, personality, formality").eq("salon_id", salonId).maybeSingle(),
    supabase.from("faq").select("*").eq("salon_id", salonId).order("sort_order"),
  ]);

  if (!salon) redirect("/app/login");

  const employeesByService = new Map<string, string[]>();
  for (const row of employeeServices ?? []) {
    employeesByService.set(row.service_id, [...(employeesByService.get(row.service_id) ?? []), row.employee_id]);
  }
  const resourcesByService = new Map<string, string[]>();
  for (const row of serviceResources ?? []) {
    resourcesByService.set(row.service_id, [...(resourcesByService.get(row.service_id) ?? []), row.resource_id]);
  }
  const serviceRows: Service[] = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category,
    duration_minutes: s.duration_minutes,
    has_price: s.has_price,
    price_cents: s.price_cents,
    buffer_before_minutes: s.buffer_before_minutes,
    buffer_after_minutes: s.buffer_after_minutes,
    color: s.color,
    location_id: s.location_id,
    bookable_phone: s.bookable_phone,
    bookable_online: s.bookable_online,
    active: s.active,
    required_customer_fields: parseRequiredFields(s.required_customer_fields),
    custom_questions: parseCustomQuestions(s.custom_questions),
    employee_ids: employeesByService.get(s.id) ?? [],
    resource_ids: resourcesByService.get(s.id) ?? [],
  }));

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
        services: serviceRows,
        description: salon.description ?? "",
        voiceSettings: voiceSettings ?? null,
        faqs: faqs ?? [],
      }}
    />
  );
}

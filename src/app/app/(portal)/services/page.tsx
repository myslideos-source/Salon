import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { Topbar } from "@/components/layout/topbar";
import { ServicesManager, type Service } from "@/components/services/services-manager";
import { parseCustomQuestions, parseRequiredFields } from "@/lib/validation/services";
import { DEFAULT_COMPANY_LABEL, TERMINOLOGY } from "@/lib/terminology";

export default async function SalonServicesPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const [{ data: services }, { data: employees }, { data: resources }, { data: locations }, { data: employeeServices }, { data: serviceResources }, canManage] =
    await Promise.all([
      supabase.from("services").select("*").eq("salon_id", salonId).order("sort_order").order("name"),
      supabase.from("employees").select("id, first_name, last_name").eq("salon_id", salonId).eq("active", true).order("sort_order"),
      supabase.from("resources").select("id, name").eq("salon_id", salonId).eq("active", true).order("sort_order"),
      supabase.from("locations").select("id, name").eq("salon_id", salonId).eq("active", true).order("sort_order"),
      supabase.from("employee_services").select("employee_id, service_id").eq("salon_id", salonId),
      supabase.from("service_resources").select("resource_id, service_id").eq("salon_id", salonId),
      checkPermission(salonId, "manage_services"),
    ]);

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
    <div>
      <Topbar
        title={TERMINOLOGY.servicePlural}
        subtitle="Terminarten und Leistungen, die Mia telefonisch und online anbieten kann."
        avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL}
      />
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <ServicesManager
          salonId={salonId}
          services={serviceRows}
          employees={(employees ?? []).map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}`.trim() }))}
          resources={(resources ?? []).map((r) => ({ id: r.id, name: r.name }))}
          locations={locations ?? []}
          canManage={canManage}
        />
      </div>
    </div>
  );
}

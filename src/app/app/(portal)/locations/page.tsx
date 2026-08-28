import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { Topbar } from "@/components/layout/topbar";
import { LocationsManager } from "@/components/locations/locations-manager";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

export default async function LocationsPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const [{ data: locations }, canManage] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name, address, phone, timezone, active, is_default")
      .eq("salon_id", salonId)
      .order("sort_order"),
    checkPermission(salonId, "manage_settings"),
  ]);

  return (
    <div>
      <Topbar
        title="Standorte"
        subtitle="Filialen und Standorte deines Unternehmens — jeder Mitarbeiter und jede Ressource kann einem Standort zugeordnet werden."
        avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL}
      />
      <div className="max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <LocationsManager salonId={salonId} locations={locations ?? []} canManage={canManage} />
      </div>
    </div>
  );
}

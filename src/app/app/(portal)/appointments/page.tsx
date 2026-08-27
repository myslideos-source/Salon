import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { AppointmentsListView } from "@/components/appointments/appointments-list-view";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

export default async function SalonAppointmentsPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  return <AppointmentsListView salonId={salonId} basePath="/app/appointments" avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} />;
}

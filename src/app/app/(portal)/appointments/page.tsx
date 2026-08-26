import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { AppointmentsListView } from "@/components/appointments/appointments-list-view";

export default async function SalonAppointmentsPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  return <AppointmentsListView salonId={salonId} basePath="/app/appointments" avatarLabel={session.email ?? "Salon"} />;
}

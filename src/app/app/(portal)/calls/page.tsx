import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { CallsView } from "@/components/calls/calls-view";

export default async function SalonCallsPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  return <CallsView salonId={salonId} avatarLabel={session.email ?? "Salon"} basePath="/app/calls" />;
}

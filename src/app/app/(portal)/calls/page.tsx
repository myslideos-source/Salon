import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { CallsView } from "@/components/calls/calls-view";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

export default async function SalonCallsPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  return <CallsView salonId={salonId} avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} basePath="/app/calls" />;
}

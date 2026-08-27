import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { CustomersView } from "@/components/customers/customers-view";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

export default async function SalonCustomersPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  return <CustomersView salonId={salonId} basePath="/app/customers" avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} />;
}

import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { CustomerProfileView } from "@/components/customers/customer-profile-view";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

export default async function SalonCustomerProfilePage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const { customerId } = await params;
  return (
    <CustomerProfileView
      salonId={salonId}
      customerId={customerId}
      basePath="/app/customers"
      avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL}
    />
  );
}

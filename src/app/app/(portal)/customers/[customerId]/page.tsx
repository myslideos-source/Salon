import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { CustomerProfileView } from "@/components/customers/customer-profile-view";

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
      avatarLabel={session.email ?? "Salon"}
    />
  );
}

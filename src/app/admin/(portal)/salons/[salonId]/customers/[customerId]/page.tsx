import { CustomerProfileView } from "@/components/customers/customer-profile-view";
import { ADMIN_AVATAR_URL } from "@/lib/utils";

export default async function AdminCustomerProfilePage({
  params,
}: {
  params: Promise<{ salonId: string; customerId: string }>;
}) {
  const { salonId, customerId } = await params;
  return (
    <CustomerProfileView
      salonId={salonId}
      customerId={customerId}
      basePath={`/admin/salons/${salonId}/customers`}
      avatarLabel="Admin"
      avatarImageUrl={ADMIN_AVATAR_URL}
    />
  );
}

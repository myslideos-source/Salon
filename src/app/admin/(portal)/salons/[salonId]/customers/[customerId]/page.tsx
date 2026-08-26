import { CustomerProfileView } from "@/components/customers/customer-profile-view";

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
    />
  );
}

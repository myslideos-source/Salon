import { CustomersView } from "@/components/customers/customers-view";
import { ADMIN_AVATAR_URL } from "@/lib/utils";

export default async function AdminCustomersPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  return <CustomersView salonId={salonId} basePath={`/admin/salons/${salonId}/customers`} avatarLabel="Admin" avatarImageUrl={ADMIN_AVATAR_URL} />;
}

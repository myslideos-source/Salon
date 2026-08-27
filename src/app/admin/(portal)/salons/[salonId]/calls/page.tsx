import { CallsView } from "@/components/calls/calls-view";
import { ADMIN_AVATAR_URL } from "@/lib/utils";

export default async function AdminCallsPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  return <CallsView salonId={salonId} avatarLabel="Admin" avatarImageUrl={ADMIN_AVATAR_URL} basePath={`/admin/salons/${salonId}/calls`} />;
}

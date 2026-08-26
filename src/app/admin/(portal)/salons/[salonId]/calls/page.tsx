import { CallsView } from "@/components/calls/calls-view";

export default async function AdminCallsPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  return <CallsView salonId={salonId} avatarLabel="Admin" basePath={`/admin/salons/${salonId}/calls`} />;
}

import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { TestChat } from "@/components/portal/ai-test-chat";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

export default async function MiaTestPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;

  return (
    <div>
      <Topbar title="Mia testen" subtitle="Simuliertes Gespräch mit deinen gespeicherten Mia-Einstellungen" avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} />
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
        <TestChat salonId={salonId} />
      </div>
    </div>
  );
}

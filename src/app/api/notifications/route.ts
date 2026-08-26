import { NextResponse } from "next/server";
import { getSession, resolveActiveSalonId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Notification = { id: string; title: string; detail: string | null; createdAt: string };

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ notifications: [] });

  const supabase = await createClient();
  const notifications: Notification[] = [];

  if (session.isPlatformAdmin) {
    const { data: signups } = await supabase
      .from("signup_requests")
      .select("id, salon_name, plan, created_at")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(10);
    for (const s of signups ?? []) {
      notifications.push({
        id: `signup-${s.id}`,
        title: `Neue Paket-Anfrage: ${s.salon_name}`,
        detail: `Paket: ${s.plan}`,
        createdAt: s.created_at,
      });
    }
  }

  const salonId = resolveActiveSalonId(session);
  if (salonId) {
    const { data: callbacks } = await supabase
      .from("callback_requests")
      .select("id, phone_number, reason, requested_at, customers(first_name, last_name)")
      .eq("salon_id", salonId)
      .eq("status", "open")
      .order("requested_at", { ascending: false })
      .limit(10);
    for (const cb of callbacks ?? []) {
      const customer = cb.customers as unknown as { first_name: string; last_name: string } | null;
      const who = customer ? `${customer.first_name} ${customer.last_name}`.trim() : cb.phone_number;
      notifications.push({
        id: `callback-${cb.id}`,
        title: `Rückruf erbeten: ${who}`,
        detail: cb.reason,
        createdAt: cb.requested_at,
      });
    }
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ notifications });
}

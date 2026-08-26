import { NextResponse } from "next/server";
import { getSession, resolveActiveSalonId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ notifications: [] });

  const salonId = resolveActiveSalonId(session);
  if (!salonId) return NextResponse.json({ notifications: [] });

  const supabase = await createClient();
  const { data } = await supabase
    .from("callback_requests")
    .select("id, phone_number, reason, requested_at, customers(first_name, last_name)")
    .eq("salon_id", salonId)
    .eq("status", "open")
    .order("requested_at", { ascending: false })
    .limit(10);

  const notifications = (data ?? []).map((cb) => {
    const customer = cb.customers as unknown as { first_name: string; last_name: string } | null;
    const who = customer ? `${customer.first_name} ${customer.last_name}`.trim() : cb.phone_number;
    return {
      id: cb.id,
      title: `Rückruf erbeten: ${who}`,
      detail: cb.reason,
      createdAt: cb.requested_at,
    };
  });

  return NextResponse.json({ notifications });
}

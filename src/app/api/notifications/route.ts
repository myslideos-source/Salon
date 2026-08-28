import { NextResponse } from "next/server";
import { getSession, resolveActiveSalonId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Notification = { id: string; title: string; detail: string | null; createdAt: string; read: boolean; href: string };

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
        read: false,
        href: "/admin/signups",
      });
    }
  }

  const salonId = resolveActiveSalonId(session);
  if (salonId) {
    const { data: rows } = await supabase
      .from("notifications")
      .select("id, type, title, body, created_at, read_at")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: false })
      .limit(20);
    for (const n of rows ?? []) {
      notifications.push({
        id: n.id,
        title: n.title,
        detail: n.body,
        createdAt: n.created_at,
        read: n.read_at !== null,
        href: "/app/notifications",
      });
    }
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ notifications });
}

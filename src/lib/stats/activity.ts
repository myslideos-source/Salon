import "server-only";
import type { DbClient } from "@/lib/scheduling/engine";

export type ActivityItem = {
  id: string;
  type: "appointment" | "call" | "customer" | "callback" | "request";
  title: string;
  subtitle: string | null;
  timestamp: string;
  href: string;
};

function customerName(row: { first_name: string; last_name: string } | null): string {
  return row ? `${row.first_name} ${row.last_name}`.trim() || "Kunde" : "Kunde";
}

/** Kombinierter, chronologisch sortierter Aktivitäten-Feed über Termine,
 * Anrufe, neue Kunden und Rückruf-/Anfragen-Eingänge (Konzeptabschnitt
 * "Dashboard": "aktuelle Aktivitäten"). Rein lesend, ausschließlich echte
 * Zeilen der letzten Tage - keine synthetischen Einträge. */
export async function getRecentActivity(supabase: DbClient, salonId: string, limit = 8): Promise<ActivityItem[]> {
  const [{ data: appointments }, { data: calls }, { data: customers }, { data: callbacks }, { data: requests }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, created_at, status, source, customers(first_name, last_name)")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("calls")
      .select("id, started_at, phone_number, outcome, customers(first_name, last_name)")
      .eq("salon_id", salonId)
      .order("started_at", { ascending: false })
      .limit(limit),
    supabase
      .from("customers")
      .select("id, created_at, first_name, last_name")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("callback_requests")
      .select("id, requested_at, phone_number, customers(first_name, last_name)")
      .eq("salon_id", salonId)
      .order("requested_at", { ascending: false })
      .limit(limit),
    supabase
      .from("requests")
      .select("id, created_at, subject, category")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: ActivityItem[] = [];

  for (const a of appointments ?? []) {
    const customer = a.customers as unknown as { first_name: string; last_name: string } | null;
    const label = a.status === "cancelled" ? "Termin storniert" : "Termin gebucht";
    items.push({
      id: `appointment-${a.id}`,
      type: "appointment",
      title: `${label}: ${customerName(customer)}`,
      subtitle: a.source === "voice_ai" ? "von Mia" : null,
      timestamp: a.created_at,
      href: "/app/calendar",
    });
  }

  for (const c of calls ?? []) {
    const customer = c.customers as unknown as { first_name: string; last_name: string } | null;
    items.push({
      id: `call-${c.id}`,
      type: "call",
      title: `Anruf: ${customer ? customerName(customer) : c.phone_number}`,
      subtitle: c.outcome === "appointment_booked" ? "Termin gebucht" : null,
      timestamp: c.started_at,
      href: "/app/calls",
    });
  }

  for (const c of customers ?? []) {
    items.push({
      id: `customer-${c.id}`,
      type: "customer",
      title: `Neuer Kunde: ${customerName(c)}`,
      subtitle: null,
      timestamp: c.created_at,
      href: "/app/customers",
    });
  }

  for (const cb of callbacks ?? []) {
    const customer = cb.customers as unknown as { first_name: string; last_name: string } | null;
    items.push({
      id: `callback-${cb.id}`,
      type: "callback",
      title: `Rückrufwunsch: ${customer ? customerName(customer) : cb.phone_number}`,
      subtitle: null,
      timestamp: cb.requested_at,
      href: "/app/requests",
    });
  }

  for (const r of requests ?? []) {
    items.push({
      id: `request-${r.id}`,
      type: "request",
      title: `Neue Anfrage: ${r.subject ?? "Ohne Betreff"}`,
      subtitle: null,
      timestamp: r.created_at,
      href: "/app/requests",
    });
  }

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Otherwise Next.js may statically cache this GET handler at build time.
export const dynamic = "force-dynamic";

// Public, unauthenticated route - phone calendar apps (Apple/Google Kalender
// "per URL abonnieren") fetch this periodically with a plain GET and no
// session, so the token query param IS the credential (see migration
// 0012_calendar_feed_token.sql). Uses the admin client to bypass RLS since
// there's no user session to evaluate is_salon_member() against.
function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcsDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token fehlt" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("id, name")
    .eq("calendar_feed_token", token)
    .maybeSingle();
  if (salonError) return NextResponse.json({ error: salonError.message }, { status: 500 });
  if (!salon) return NextResponse.json({ error: "unbekannter Kalender-Link" }, { status: 404 });

  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, start_at, end_at, notes, updated_at, customers(first_name, last_name, phone), employees(first_name, last_name), appointment_services(sort_order, services(name))"
    )
    .eq("salon_id", salon.id)
    .neq("status", "cancelled")
    .gte("start_at", from)
    .lte("start_at", to)
    .order("start_at");

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "CALSCALE:GREGORIAN", "PRODID:-//HalloMia//Kalender-Abo//DE", `X-WR-CALNAME:${escapeIcsText(salon.name)} (HalloMia)`, "X-PUBLISHED-TTL:PT1H"];

  for (const a of appointments ?? []) {
    const customer = a.customers as unknown as { first_name: string; last_name: string; phone: string } | null;
    const employee = a.employees as unknown as { first_name: string; last_name: string } | null;
    const services = ((a.appointment_services ?? []) as unknown as { sort_order: number; services: { name: string } | null }[])
      .sort((x, y) => x.sort_order - y.sort_order)
      .map((s) => s.services?.name)
      .filter((n): n is string => Boolean(n));

    const customerName = customer ? `${customer.first_name} ${customer.last_name}`.trim() : "Kunde/in unbekannt";
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}`.trim() : null;
    const summary = `${services.join(", ") || "Termin"} – ${customerName}`;
    const descriptionParts = [
      employeeName ? `Mitarbeiter/in: ${employeeName}` : null,
      customer ? `Kunde/in: ${customerName} (${customer.phone})` : null,
      a.notes,
    ].filter(Boolean);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${a.id}@hallomia.ai`,
      `DTSTAMP:${toIcsDateTime(a.updated_at)}`,
      `DTSTART:${toIcsDateTime(a.start_at)}`,
      `DTEND:${toIcsDateTime(a.end_at)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      ...(descriptionParts.length ? [`DESCRIPTION:${escapeIcsText(descriptionParts.join("\n"))}`] : []),
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

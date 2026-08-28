import type { createClient } from "@/lib/supabase/server";

// Dubletten-Erkennung (Konzeptabschnitt "Kundenverwaltung": "Doppelte Kunden
// sollen anhand von Telefonnummer und E-Mail erkannt werden"). Bewusst nur
// eine Erkennung, kein automatischer Merge — der Nutzer entscheidet selbst,
// ob und wie zwei Datensätze zusammengehören.

/** Normalisiert eine Telefonnummer auf eine vergleichbare Ziffernfolge:
 * Trennzeichen entfernt, "00"-Ländervorwahl auf "+" vereinheitlicht,
 * führende Nullen einer nationalen Schreibweise entfernt. Kein vollständiger
 * E.164-Parser (keine Ländererkennung) — für die Dublettensuche innerhalb
 * eines einzelnen Unternehmens reicht dieser Heuristik-Abgleich aus. */
export function normalizePhone(raw: string): string {
  let digits = raw.trim().replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  digits = digits.replace(/^\+/, "");
  digits = digits.replace(/^0+/, "");
  return digits;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export type DuplicateMatch = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  matchedOn: ("phone" | "email")[];
};

/** Sucht innerhalb eines Unternehmens nach Kunden, deren normalisierte
 * Telefonnummer oder E-Mail-Adresse übereinstimmt. `excludeId` blendet den
 * gerade bearbeiteten Datensatz selbst aus. */
export async function findDuplicateCustomers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  salonId: string,
  params: { phone?: string; email?: string; excludeId?: string }
): Promise<DuplicateMatch[]> {
  const phone = params.phone ? normalizePhone(params.phone) : "";
  const email = params.email ? normalizeEmail(params.email) : "";
  if (!phone && !email) return [];

  const { data } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone, email")
    .eq("salon_id", salonId)
    .is("deleted_at", null);

  const matches: DuplicateMatch[] = [];
  for (const c of data ?? []) {
    if (params.excludeId && c.id === params.excludeId) continue;
    const matchedOn: ("phone" | "email")[] = [];
    if (phone && normalizePhone(c.phone) === phone) matchedOn.push("phone");
    if (email && c.email && normalizeEmail(c.email) === email) matchedOn.push("email");
    if (matchedOn.length > 0) matches.push({ ...c, matchedOn });
  }
  return matches;
}

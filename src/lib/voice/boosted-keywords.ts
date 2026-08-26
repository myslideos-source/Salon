import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Proper nouns (employee first names, service names) worth biasing the
 * provider's speech recognition toward, so a caller saying "Termin bei
 * Lisa" or "Ansatzfarbe" gets transcribed correctly instead of mistaken
 * for a similar-sounding common word.
 */
export async function computeBoostedKeywords(
  supabase: SupabaseClient<Database>,
  salonId: string
): Promise<string[]> {
  const [{ data: employees }, { data: services }] = await Promise.all([
    supabase.from("employees").select("first_name").eq("salon_id", salonId).eq("active", true),
    supabase.from("services").select("name").eq("salon_id", salonId).eq("active", true),
  ]);

  const keywords = [
    ...(employees ?? []).map((e) => e.first_name),
    ...(services ?? []).map((s) => s.name),
  ].filter(Boolean);

  return [...new Set(keywords)];
}

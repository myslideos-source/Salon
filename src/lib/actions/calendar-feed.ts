"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";

function feedUrls(token: string): { url: string; webcalUrl: string } {
  const appUrl = process.env.APP_URL ?? "";
  const url = `${appUrl}/api/calendar/feed.ics?token=${token}`;
  const webcalUrl = url.replace(/^https?:\/\//, "webcal://");
  return { url, webcalUrl };
}

// Lazily creates the salon's calendar-feed token on first use so existing
// salons don't need a backfill migration - most will never open this card.
export async function getOrCreateCalendarFeedUrlAction(): Promise<
  { ok: true; url: string; webcalUrl: string } | { ok: false; error: string }
> {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session);
  if (!salonId) return { ok: false, error: "Kein Salon gefunden." };

  const supabase = await createClient();
  const { data: salon, error } = await supabase.from("salons").select("calendar_feed_token").eq("id", salonId).single();
  if (error) return { ok: false, error: error.message };

  if (salon.calendar_feed_token) return { ok: true, ...feedUrls(salon.calendar_feed_token) };

  const { data: token, error: rpcError } = await supabase.rpc("regenerate_calendar_feed_token", { target_salon_id: salonId });
  if (rpcError || !token) return { ok: false, error: rpcError?.message ?? "Token konnte nicht erstellt werden." };
  return { ok: true, ...feedUrls(token) };
}

// Rotates the token, invalidating any calendar app already subscribed to
// the old URL - use only if a link leaked and needs to be revoked.
export async function regenerateCalendarFeedUrlAction(): Promise<
  { ok: true; url: string; webcalUrl: string } | { ok: false; error: string }
> {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session);
  if (!salonId) return { ok: false, error: "Kein Salon gefunden." };

  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("regenerate_calendar_feed_token", { target_salon_id: salonId });
  if (error || !token) return { ok: false, error: error?.message ?? "Token konnte nicht erneuert werden." };
  return { ok: true, ...feedUrls(token) };
}

import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SalonMembership = {
  salonId: string;
  salonName: string;
  salonSlug: string;
  role: "owner" | "staff";
};

export type AppSession = {
  userId: string;
  email: string | null;
  isPlatformAdmin: boolean;
  salons: SalonMembership[];
};

export async function getSession(): Promise<AppSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: adminRow }, { data: memberships }] = await Promise.all([
    supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("salon_users")
      .select("role, salons(id, name, slug)")
      .eq("user_id", user.id),
  ]);

  const salons: SalonMembership[] = (memberships ?? [])
    .filter((m) => m.salons)
    .map((m) => ({
      salonId: (m.salons as unknown as { id: string; name: string; slug: string }).id,
      salonName: (m.salons as unknown as { id: string; name: string; slug: string }).name,
      salonSlug: (m.salons as unknown as { id: string; name: string; slug: string }).slug,
      role: m.role as "owner" | "staff",
    }));

  return {
    userId: user.id,
    email: user.email ?? null,
    isPlatformAdmin: Boolean(adminRow),
    salons,
  };
}

export async function requirePlatformAdmin(): Promise<AppSession> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!session.isPlatformAdmin) redirect("/admin/login?error=forbidden");
  return session;
}

export async function requireSalonSession(): Promise<AppSession> {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (!session.isPlatformAdmin && session.salons.length === 0) {
    redirect("/app/login?error=no_salon");
  }
  return session;
}

/** Resolves which salon the current request should operate on. Platform
 * admins may pass an explicit salonId (e.g. via query param); salon users
 * are always pinned to their own (first / only) salon. */
export function resolveActiveSalonId(
  session: AppSession,
  requestedSalonId?: string | null
): string | null {
  if (session.isPlatformAdmin && requestedSalonId) return requestedSalonId;
  return session.salons[0]?.salonId ?? requestedSalonId ?? null;
}

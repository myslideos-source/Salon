import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SalonRole } from "@/lib/auth/session";

/**
 * The configurable permission keys from `role_permissions`
 * (supabase/migrations/0016_roles_permissions.sql). The database is the
 * source of truth — a salon may override any of these per role — this list
 * only exists so callers get autocomplete instead of a bare string.
 */
export const PERMISSION_KEYS = [
  "manage_company",
  "manage_users",
  "manage_settings",
  "manage_services",
  "manage_team",
  "manage_calendar",
  "manage_customers",
  "manage_requests",
  "view_calls",
  "view_statistics",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/** Platform-wide default matrix, mirrored from the seed rows in
 * 0016_roles_permissions.sql. Non-authoritative — RLS and `has_permission()`
 * always decide what a request may actually do — but useful for
 * client-side UI decisions (e.g. hiding a button) without a round trip. A
 * salon may override any of these; call `checkPermission` for the real
 * answer when it matters. */
export const DEFAULT_ROLE_PERMISSIONS: Record<SalonRole, Record<PermissionKey, boolean>> = {
  owner: {
    manage_company: true,
    manage_users: true,
    manage_settings: true,
    manage_services: true,
    manage_team: true,
    manage_calendar: true,
    manage_customers: true,
    manage_requests: true,
    view_calls: true,
    view_statistics: true,
  },
  administrator: {
    manage_company: false,
    manage_users: true,
    manage_settings: true,
    manage_services: true,
    manage_team: true,
    manage_calendar: true,
    manage_customers: true,
    manage_requests: true,
    view_calls: true,
    view_statistics: true,
  },
  staff: {
    manage_company: false,
    manage_users: false,
    manage_settings: false,
    manage_services: false,
    manage_team: false,
    manage_calendar: true,
    manage_customers: true,
    manage_requests: true,
    view_calls: true,
    view_statistics: false,
  },
  reception: {
    manage_company: false,
    manage_users: false,
    manage_settings: false,
    manage_services: false,
    manage_team: false,
    manage_calendar: true,
    manage_customers: true,
    manage_requests: true,
    view_calls: true,
    view_statistics: false,
  },
  calendar_only: {
    manage_company: false,
    manage_users: false,
    manage_settings: false,
    manage_services: false,
    manage_team: false,
    manage_calendar: true,
    manage_customers: false,
    manage_requests: false,
    view_calls: false,
    view_statistics: false,
  },
};

/** Authoritative permission check for the signed-in user, via the
 * `has_permission` SQL function (SECURITY DEFINER, salon-scoped). Use this
 * in Server Actions before a write that isn't already covered by a
 * narrower RLS policy or RPC. */
export async function checkPermission(salonId: string, permission: PermissionKey): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", {
    target_salon_id: salonId,
    p_permission_key: permission,
  });
  if (error) return false;
  return Boolean(data);
}

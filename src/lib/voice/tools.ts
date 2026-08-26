import "server-only";
import { z } from "zod";
import type { DbClient } from "@/lib/scheduling/engine";
import {
  checkAvailability as engineCheckAvailability,
  createAppointment as engineCreateAppointment,
  rescheduleAppointment as engineRescheduleAppointment,
  cancelAppointment as engineCancelAppointment,
  SchedulingError,
} from "@/lib/scheduling/engine";

// ─────────────────────────────────────────────────────────────────────────
// The structured Voice Tools (section 28). These are the ONLY way the voice
// agent may touch salon data — it never invents prices, employees, services
// or availability. Every tool is scoped to a single salonId and returns
// plain, already-verified data straight from SalonCall's own database.
// ─────────────────────────────────────────────────────────────────────────

export type ToolResult<T> = { ok: true; data: T } | { ok: false; error: string };

function fail(message: string): ToolResult<never> {
  return { ok: false, error: message };
}
function ok<T>(data: T): ToolResult<T> {
  return { ok: true, data };
}

const WEEKDAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export async function getSalonInformation(supabase: DbClient, salonId: string) {
  const { data, error } = await supabase
    .from("salons")
    .select("name, phone, address, timezone")
    .eq("id", salonId)
    .single();
  if (error || !data) return fail("Salon nicht gefunden.");
  return ok(data);
}

export async function getOpeningHours(supabase: DbClient, salonId: string) {
  const { data, error } = await supabase
    .from("business_hours")
    .select("weekday, is_closed, start_time, end_time")
    .eq("salon_id", salonId)
    .order("weekday");
  if (error) return fail(error.message);
  return ok(
    (data ?? []).map((d) => ({
      weekday: WEEKDAY_NAMES[d.weekday],
      isClosed: d.is_closed,
      startTime: d.start_time?.slice(0, 5) ?? null,
      endTime: d.end_time?.slice(0, 5) ?? null,
    }))
  );
}

export async function getEmployees(supabase: DbClient, salonId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("sort_order");
  if (error) return fail(error.message);
  return ok((data ?? []).map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}`.trim() })));
}

export async function getServices(supabase: DbClient, salonId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, category, duration_minutes, price_cents")
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("sort_order");
  if (error) return fail(error.message);
  return ok(
    (data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      durationMinutes: s.duration_minutes,
      priceEuro: s.price_cents / 100,
    }))
  );
}

export async function findCustomer(supabase: DbClient, salonId: string, phone: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone, preferred_employee_id")
    .eq("salon_id", salonId)
    .eq("phone", phone.trim())
    .maybeSingle();
  if (error) return fail(error.message);
  return ok(data ? { found: true as const, ...data } : { found: false as const });
}

export async function createCustomer(
  supabase: DbClient,
  salonId: string,
  input: { firstName: string; lastName?: string; phone: string }
) {
  const { data, error } = await supabase
    .from("customers")
    .insert({ salon_id: salonId, first_name: input.firstName, last_name: input.lastName ?? "", phone: input.phone.trim() })
    .select("id, first_name, last_name, phone")
    .single();
  if (error) return fail(error.code === "23505" ? "Diese Telefonnummer ist bereits erfasst." : error.message);
  return ok(data);
}

/** Resolves which employee to check when the caller has no explicit preference. */
export async function resolveEmployeeForService(
  supabase: DbClient,
  salonId: string,
  serviceIds: string[],
  preferredEmployeeId?: string | null
): Promise<ToolResult<{ employeeId: string; employeeName: string }>> {
  if (preferredEmployeeId) {
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("id", preferredEmployeeId)
      .eq("salon_id", salonId)
      .eq("active", true)
      .maybeSingle();
    if (data) return ok({ employeeId: data.id, employeeName: `${data.first_name} ${data.last_name}`.trim() });
  }

  // Employees explicitly capable of every requested service…
  const { data: capable } = await supabase
    .from("employee_services")
    .select("employee_id, employees!inner(id, first_name, last_name, active, sort_order)")
    .eq("salon_id", salonId)
    .in("service_id", serviceIds);

  const counts = new Map<string, number>();
  for (const row of capable ?? []) counts.set(row.employee_id, (counts.get(row.employee_id) ?? 0) + 1);
  const fullyCapableIds = [...counts.entries()].filter(([, n]) => n === serviceIds.length).map(([id]) => id);

  if (fullyCapableIds.length > 0) {
    const { data: employee } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .in("id", fullyCapableIds)
      .eq("active", true)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (employee) return ok({ employeeId: employee.id, employeeName: `${employee.first_name} ${employee.last_name}`.trim() });
  }

  // …otherwise fall back to any active employee (no explicit skill mapping set up yet).
  const { data: any } = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  if (!any) return fail("Für diesen Salon ist kein Mitarbeiter verfügbar.");
  return ok({ employeeId: any.id, employeeName: `${any.first_name} ${any.last_name}`.trim() });
}

export async function checkAvailability(
  supabase: DbClient,
  salonId: string,
  input: { employeeId?: string | null; serviceIds: string[]; date: string; preferredTimeRange?: { fromTime: string; toTime: string } | null }
) {
  try {
    let employeeId = input.employeeId ?? undefined;
    let employeeName: string | undefined;
    if (!employeeId) {
      const resolved = await resolveEmployeeForService(supabase, salonId, input.serviceIds);
      if (!resolved.ok) return fail(resolved.error);
      employeeId = resolved.data.employeeId;
      employeeName = resolved.data.employeeName;
    }

    const result = await engineCheckAvailability(supabase, {
      salonId,
      employeeId,
      serviceIds: input.serviceIds,
      date: input.date,
      preferredTimeRange: input.preferredTimeRange ?? undefined,
    });

    return ok({
      employeeId,
      employeeName,
      date: input.date,
      durationMinutes: result.combo.durationMinutes,
      priceEuro: result.combo.totalPriceCents / 100,
      slots: result.slots,
    });
  } catch (e) {
    return fail(e instanceof SchedulingError ? e.message : "Verfügbarkeit konnte nicht geprüft werden.");
  }
}

export async function createAppointment(
  supabase: DbClient,
  salonId: string,
  input: { customerId: string; employeeId: string; serviceIds: string[]; startAt: string; notes?: string }
) {
  try {
    const appt = await engineCreateAppointment(supabase, {
      salonId,
      customerId: input.customerId,
      employeeId: input.employeeId,
      serviceIds: input.serviceIds,
      startAt: input.startAt,
      notes: input.notes,
      source: "voice_ai",
    });
    return ok(appt);
  } catch (e) {
    return fail(e instanceof SchedulingError ? e.message : "Termin konnte nicht gebucht werden.");
  }
}

export async function findAppointment(supabase: DbClient, salonId: string, phone: string) {
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("salon_id", salonId)
    .eq("phone", phone.trim())
    .maybeSingle();
  if (!customer) return ok({ appointments: [] });

  const { data, error } = await supabase
    .from("appointments")
    .select("id, start_at, end_at, status, employees(first_name), appointment_services(services(name))")
    .eq("salon_id", salonId)
    .eq("customer_id", customer.id)
    .eq("status", "booked")
    .gte("start_at", new Date().toISOString())
    .order("start_at")
    .limit(5);
  if (error) return fail(error.message);

  return ok({
    appointments: (data ?? []).map((a) => ({
      id: a.id,
      startAt: a.start_at,
      endAt: a.end_at,
      employeeName: (a.employees as unknown as { first_name: string } | null)?.first_name ?? "",
      services: ((a.appointment_services ?? []) as unknown as { services: { name: string } | null }[])
        .map((s) => s.services?.name)
        .filter(Boolean),
    })),
  });
}

export async function rescheduleAppointment(
  supabase: DbClient,
  salonId: string,
  input: { appointmentId: string; newEmployeeId: string; newStartAt: string }
) {
  try {
    const appt = await engineRescheduleAppointment(supabase, { salonId, ...input });
    return ok(appt);
  } catch (e) {
    return fail(e instanceof SchedulingError ? e.message : "Termin konnte nicht verschoben werden.");
  }
}

export async function cancelAppointment(supabase: DbClient, salonId: string, appointmentId: string) {
  try {
    const appt = await engineCancelAppointment(supabase, salonId, appointmentId);
    return ok(appt);
  } catch (e) {
    return fail(e instanceof SchedulingError ? e.message : "Termin konnte nicht storniert werden.");
  }
}

export async function createCallbackRequest(
  supabase: DbClient,
  salonId: string,
  input: { phone: string; customerId?: string | null; reason?: string; note?: string; callId?: string | null }
) {
  const { data, error } = await supabase
    .from("callback_requests")
    .insert({
      salon_id: salonId,
      customer_id: input.customerId ?? null,
      call_id: input.callId ?? null,
      phone_number: input.phone,
      reason: input.reason ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) return fail(error.message);
  return ok(data);
}

// ─────────────────────────────────────────────────────────────────────────
// Registry — one entry point used by the webhook, the test-call route and
// any future provider. `parameters` is the JSON-schema-ish zod definition
// handed to the LLM function-calling layer.
// ─────────────────────────────────────────────────────────────────────────

export const toolSchemas = {
  getSalonInformation: z.object({}),
  getOpeningHours: z.object({}),
  getEmployees: z.object({}),
  getServices: z.object({}),
  findCustomer: z.object({ phone: z.string() }),
  createCustomer: z.object({ firstName: z.string(), lastName: z.string().optional(), phone: z.string() }),
  checkAvailability: z.object({
    employeeId: z.string().uuid().nullable().optional(),
    serviceIds: z.array(z.string().uuid()).min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    preferredTimeRange: z.object({ fromTime: z.string(), toTime: z.string() }).nullable().optional(),
  }),
  createAppointment: z.object({
    customerId: z.string().uuid(),
    employeeId: z.string().uuid(),
    serviceIds: z.array(z.string().uuid()).min(1),
    startAt: z.string(),
    notes: z.string().optional(),
  }),
  findAppointment: z.object({ phone: z.string() }),
  rescheduleAppointment: z.object({
    appointmentId: z.string().uuid(),
    newEmployeeId: z.string().uuid(),
    newStartAt: z.string(),
  }),
  cancelAppointment: z.object({ appointmentId: z.string().uuid() }),
  createCallbackRequest: z.object({
    phone: z.string(),
    customerId: z.string().uuid().nullable().optional(),
    reason: z.string().optional(),
    note: z.string().optional(),
  }),
} as const;

export type ToolName = keyof typeof toolSchemas;

export async function runTool(supabase: DbClient, salonId: string, tool: ToolName, rawArgs: unknown): Promise<ToolResult<unknown>> {
  const schema = toolSchemas[tool];
  const parsed = schema.safeParse(rawArgs ?? {});
  if (!parsed.success) return fail(`Ungültige Parameter für ${tool}: ${parsed.error.issues[0]?.message}`);
  const args = parsed.data as never;

  switch (tool) {
    case "getSalonInformation":
      return getSalonInformation(supabase, salonId);
    case "getOpeningHours":
      return getOpeningHours(supabase, salonId);
    case "getEmployees":
      return getEmployees(supabase, salonId);
    case "getServices":
      return getServices(supabase, salonId);
    case "findCustomer":
      return findCustomer(supabase, salonId, (args as { phone: string }).phone);
    case "createCustomer":
      return createCustomer(supabase, salonId, args as { firstName: string; lastName?: string; phone: string });
    case "checkAvailability":
      return checkAvailability(supabase, salonId, args as Parameters<typeof checkAvailability>[2]);
    case "createAppointment":
      return createAppointment(supabase, salonId, args as Parameters<typeof createAppointment>[2]);
    case "findAppointment":
      return findAppointment(supabase, salonId, (args as { phone: string }).phone);
    case "rescheduleAppointment":
      return rescheduleAppointment(supabase, salonId, args as Parameters<typeof rescheduleAppointment>[2]);
    case "cancelAppointment":
      return cancelAppointment(supabase, salonId, (args as { appointmentId: string }).appointmentId);
    case "createCallbackRequest":
      return createCallbackRequest(supabase, salonId, args as Parameters<typeof createCallbackRequest>[2]);
    default:
      return fail("Unbekanntes Tool.");
  }
}

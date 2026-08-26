import "server-only";
import type { ToolName } from "./tools";

// Hand-written JSON Schemas mirroring `toolSchemas` in tools.ts, used only
// for the OpenAI function-calling `tools` parameter. Kept separate (rather
// than derived from the zod schemas at runtime) because zod v4's internal
// representation isn't yet reliably supported by JSON-schema converters —
// these ten tools are small and stable enough that hand-authored schemas
// are the more robust choice. Keep in sync with `toolSchemas`.
export const toolJsonSchemas: Record<ToolName, Record<string, unknown>> = {
  getSalonInformation: { type: "object", properties: {}, additionalProperties: false },
  getOpeningHours: { type: "object", properties: {}, additionalProperties: false },
  getEmployees: { type: "object", properties: {}, additionalProperties: false },
  getServices: { type: "object", properties: {}, additionalProperties: false },
  findCustomer: {
    type: "object",
    properties: { phone: { type: "string", description: "Telefonnummer der Anruferin/des Anrufers" } },
    required: ["phone"],
    additionalProperties: false,
  },
  createCustomer: {
    type: "object",
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      phone: { type: "string" },
    },
    required: ["firstName", "phone"],
    additionalProperties: false,
  },
  checkAvailability: {
    type: "object",
    properties: {
      employeeId: { type: ["string", "null"], description: "UUID des gewünschten Mitarbeiters, falls bekannt" },
      serviceIds: { type: "array", items: { type: "string" }, description: "UUIDs der gewünschten Leistungen" },
      date: { type: "string", description: "Datum im Format YYYY-MM-DD" },
      preferredTimeRange: {
        type: ["object", "null"],
        properties: { fromTime: { type: "string" }, toTime: { type: "string" } },
        description: "z. B. Nachmittag = 12:00 bis 18:00",
      },
    },
    required: ["serviceIds", "date"],
    additionalProperties: false,
  },
  createAppointment: {
    type: "object",
    properties: {
      customerId: { type: "string" },
      employeeId: { type: "string" },
      serviceIds: { type: "array", items: { type: "string" } },
      startAt: { type: "string", description: "ISO-Zeitstempel des gewählten freien Slots" },
      notes: { type: "string" },
    },
    required: ["customerId", "employeeId", "serviceIds", "startAt"],
    additionalProperties: false,
  },
  findAppointment: {
    type: "object",
    properties: { phone: { type: "string" } },
    required: ["phone"],
    additionalProperties: false,
  },
  rescheduleAppointment: {
    type: "object",
    properties: {
      appointmentId: { type: "string" },
      newEmployeeId: { type: "string" },
      newStartAt: { type: "string" },
    },
    required: ["appointmentId", "newEmployeeId", "newStartAt"],
    additionalProperties: false,
  },
  cancelAppointment: {
    type: "object",
    properties: { appointmentId: { type: "string" } },
    required: ["appointmentId"],
    additionalProperties: false,
  },
  createCallbackRequest: {
    type: "object",
    properties: {
      phone: { type: "string" },
      customerId: { type: ["string", "null"] },
      reason: { type: "string" },
      note: { type: "string" },
    },
    required: ["phone"],
    additionalProperties: false,
  },
};

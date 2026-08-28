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
  getFaq: { type: "object", properties: {}, additionalProperties: false },
  findCustomer: {
    type: "object",
    properties: { phone: { type: "string", description: "Telefonnummer der Anruferin/des Anrufers" } },
    required: ["phone"],
    additionalProperties: false,
  },
  createCustomer: {
    type: "object",
    properties: {
      firstName: { type: "string", description: "Vorname der Kundin/des Kunden" },
      lastName: { type: "string", description: "Nachname der Kundin/des Kunden, falls bekannt" },
      phone: { type: "string", description: "Telefonnummer der Kundin/des Kunden" },
    },
    required: ["firstName", "phone"],
    additionalProperties: false,
  },
  checkAvailability: {
    type: "object",
    properties: {
      employeeId: { type: ["string", "null"], description: "UUID des gewünschten Mitarbeiters, falls bekannt" },
      serviceIds: {
        type: "array",
        items: { type: "string", description: "UUID einer gewünschten Leistung" },
        description: "UUIDs der gewünschten Leistungen",
      },
      date: { type: "string", description: "Datum im Format YYYY-MM-DD" },
      preferredTimeRange: {
        type: ["object", "null"],
        properties: { fromTime: { type: "string" }, toTime: { type: "string" } },
        description:
          "Nur für grobe Tageszeiten verwenden, z. B. Nachmittag = 12:00 bis 18:00. NIEMALS ein enges oder Null-breites Fenster um eine exakte Uhrzeit setzen (z. B. NICHT 13:00 bis 13:00 für 'um 13 Uhr') - das liefert fälschlich keine Treffer. Bei einer konkreten Wunschuhrzeit dieses Feld stattdessen weglassen (null) und aus der vollständigen Ergebnisliste den nächstgelegenen Slot auswählen.",
      },
    },
    required: ["serviceIds", "date"],
    additionalProperties: false,
  },
  createAppointment: {
    type: "object",
    properties: {
      customerId: { type: "string", description: "UUID der Kundin/des Kunden" },
      employeeId: { type: "string", description: "UUID des gewählten Mitarbeiters" },
      serviceIds: {
        type: "array",
        items: { type: "string", description: "UUID einer gebuchten Leistung" },
        description: "UUIDs der gebuchten Leistungen",
      },
      startAt: { type: "string", description: "ISO-Zeitstempel des gewählten freien Slots" },
      notes: { type: "string", description: "Optionale Notiz zum Termin" },
    },
    required: ["customerId", "employeeId", "serviceIds", "startAt"],
    additionalProperties: false,
  },
  findAppointment: {
    type: "object",
    properties: { phone: { type: "string", description: "Telefonnummer der Anruferin/des Anrufers" } },
    required: ["phone"],
    additionalProperties: false,
  },
  rescheduleAppointment: {
    type: "object",
    properties: {
      appointmentId: { type: "string", description: "UUID des zu verschiebenden Termins" },
      newEmployeeId: { type: "string", description: "UUID des Mitarbeiters für die neue Zeit" },
      newStartAt: { type: "string", description: "ISO-Zeitstempel der neuen gewünschten Startzeit" },
    },
    required: ["appointmentId", "newEmployeeId", "newStartAt"],
    additionalProperties: false,
  },
  cancelAppointment: {
    type: "object",
    properties: { appointmentId: { type: "string", description: "UUID des zu stornierenden Termins" } },
    required: ["appointmentId"],
    additionalProperties: false,
  },
  createCallbackRequest: {
    type: "object",
    properties: {
      phone: { type: "string", description: "Telefonnummer für den Rückruf" },
      customerId: { type: ["string", "null"], description: "UUID der Kundin/des Kunden, falls bekannt" },
      reason: { type: "string", description: "Kurzer Grund für den Rückrufwunsch" },
      note: { type: "string", description: "Zusätzliche Notiz zum Rückrufwunsch" },
    },
    required: ["phone"],
    additionalProperties: false,
  },
};

// Short descriptions so the LLM knows *when* to call each tool. Used by the
// Retell sync (general_tools) and could equally back the OpenAI test route.
export const toolDescriptions: Record<ToolName, string> = {
  getSalonInformation: "Liefert Name, Adresse, Telefonnummer und Zeitzone des Salons.",
  getOpeningHours: "Liefert die tatsächlichen Öffnungszeiten des Salons je Wochentag.",
  getEmployees: "Liefert die Liste der aktiven Mitarbeiter des Salons.",
  getServices: "Liefert die Liste der buchbaren Leistungen mit Dauer und Preis.",
  getFaq: "Liefert die vom Unternehmen hinterlegten häufigen Fragen mit Antworten. Vor einer allgemeinen Frage zuerst hier nachsehen, statt selbst zu antworten.",
  findCustomer: "Sucht eine Kundin/einen Kunden anhand der Telefonnummer, um sie/ihn zu erkennen.",
  createCustomer: "Legt eine neue Kundin/einen neuen Kunden mit Namen und Telefonnummer an.",
  checkAvailability:
    "Prüft echte freie Termine für eine Kombination aus Leistung(en), Mitarbeiter und Datum. Muss vor jedem Terminvorschlag aufgerufen werden. Liefert alle freien Slots des Tages zurück - bei einer konkreten Wunschuhrzeit (z. B. 'um 13 Uhr') preferredTimeRange weglassen und selbst den nächstgelegenen Slot aus der Ergebnisliste auswählen, statt das Zeitfenster künstlich einzuengen.",
  createAppointment:
    "Bucht verbindlich einen zuvor über checkAvailability bestätigten freien Termin. Nur mit einer echten, gerade geprüften Startzeit aufrufen.",
  findAppointment: "Findet die anstehenden Termine einer Anruferin/eines Anrufers anhand der Telefonnummer, z. B. zum Verschieben oder Stornieren.",
  rescheduleAppointment: "Verschiebt einen bestehenden, zuvor bestätigten Termin auf eine neue, über checkAvailability geprüfte Zeit.",
  cancelAppointment: "Storniert einen bestehenden, zuvor mit der Anruferin/dem Anrufer bestätigten Termin.",
  createCallbackRequest: "Speichert einen Rückrufwunsch, wenn die Anfrage nicht direkt gelöst werden kann.",
};

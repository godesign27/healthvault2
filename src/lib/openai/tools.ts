import { getIncompleteForms } from "../tools/getIncompleteForms";
import { getHealthRecords } from "../tools/getHealthRecords";
import { summarizeRecord } from "../tools/summarizeRecord";
import { getCareOverview } from "../tools/getCareOverview";
import { getMedications } from "../tools/getMedications";
import { getAppointments } from "../tools/getAppointments";
import { getEncounters } from "../tools/getEncounters";
import { getConditions } from "../tools/getConditions";
import { getAllergies } from "../tools/getAllergies";
import { getImmunizations } from "../tools/getImmunizations";
import { getInsuranceCoverages } from "../tools/getInsuranceCoverages";
import { getMedicalID } from "../tools/getMedicalID";
import { getPreventiveCare } from "../tools/getPreventiveCare";
import { getCareTimeline } from "../tools/getCareTimeline";
import { getMedicalProfile } from "../tools/getMedicalProfile";
import { getFormDetails } from "../tools/getFormDetails";
import { saveFormAnswers } from "../tools/saveFormAnswers";
import { resolveProviderRecordConnection } from "../tools/resolveProviderRecordConnection";
import { getConnectedProviders } from "../tools/getConnectedProviders";
import { searchProviderOrganizations } from "../tools/searchProviderOrganizations";
import { startProviderConnection } from "../tools/startProviderConnection";
import { startEpicConnection } from "../tools/startEpicConnection";
import { fetchProviderRecordPreview } from "../tools/fetchProviderRecordPreview";

export const assistantToolDefinitions = [
  {
    type: "function" as const,
    name: "getIncompleteForms",
    description:
      "Get incomplete medical forms for a user. Returns form titles, categories, and completion progress.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getHealthRecords",
    description:
      "Get the user's health records. Supports filtering by category (lab, imaging, pathology, specialist_report, other) and source (connected, uploaded, shared).",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        category: {
          type: "string",
          enum: ["lab", "imaging", "pathology", "specialist_report", "other"],
          description: "Filter by record category",
        },
        source: {
          type: "string",
          enum: ["connected", "uploaded", "shared"],
          description: "Filter by how the record was obtained",
        },
        limit: {
          type: "number",
          description: "Max records to return (default 50)",
        },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "summarizeRecord",
    description:
      "Get details of a specific health record for summarization. Returns title, category, provider, date, existing AI summary, and tags. Does not invent medical conclusions.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        recordId: { type: "string", description: "The health record's ID" },
      },
      required: ["userId", "recordId"],
    },
  },
  {
    type: "function" as const,
    name: "getCareOverview",
    description:
      "Get a high-level care dashboard summary: care team count, active medications, active conditions, allergies, health records, upcoming appointments, past encounters, insurance claims, and upcoming immunizations.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getMedications",
    description:
      "Get the user's medications with name, dosage, frequency, prescriber, refills remaining/total, and active/inactive status. Can filter to active-only.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        activeOnly: {
          type: "boolean",
          description: "If true, only return active medications",
        },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getAppointments",
    description:
      "Get the user's appointments. Can filter to upcoming scheduled appointments only. Returns provider, type, date/time, location, and status.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        upcomingOnly: {
          type: "boolean",
          description: "If true, only return future scheduled appointments",
        },
        limit: {
          type: "number",
          description: "Max appointments to return (default 20)",
        },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getEncounters",
    description:
      "Get the user's past clinical encounters/visits. Returns title, date, provider, location, type, and description.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        limit: {
          type: "number",
          description: "Max encounters to return (default 20)",
        },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getConditions",
    description:
      "Get the user's medical conditions (diagnoses). Returns condition name, diagnosed date, status (Active / In remission / Resolved), managing physician, and notes. Can filter to active-only.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        activeOnly: {
          type: "boolean",
          description: "If true, only return active conditions",
        },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getAllergies",
    description:
      "Get the user's allergies. Returns allergen, reaction, severity (Mild / Moderate / Severe), diagnosed date, and notes.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getImmunizations",
    description:
      "Get the user's immunization history. Returns vaccine name, administered date, provider, lot number, next dose date, and whether a dose is upcoming.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getInsuranceCoverages",
    description:
      "Get the user's insurance coverages. Returns provider name, plan name, member ID, group number, primary status, coverage status, effective dates, and verification status. Can filter to active-only.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        activeOnly: {
          type: "boolean",
          description: "If true, only return active coverages",
        },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getMedicalID",
    description:
      "Get the user's Medical ID card data: name, date of birth, blood type, organ donor status, emergency contact, active conditions, and allergies.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getPreventiveCare",
    description:
      "Get the user's preventive care items (screenings, checkups, vaccinations). Returns item name, category, status (due / overdue / scheduled / completed / declined), dates, frequency, provider, and overdue flags. Can filter by status.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        statusFilter: {
          type: "string",
          enum: ["due", "overdue", "scheduled", "completed", "declined"],
          description: "Filter by item status",
        },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getCareTimeline",
    description:
      "Get a chronological timeline of care events: health records, form completions, record shares, appointments, and encounters. Supports filtering by event type.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        filter: {
          type: "string",
          enum: ["record", "form", "share", "appointment", "encounter"],
          description: "Filter to a specific event type",
        },
        limit: {
          type: "number",
          description: "Max events to return (default 25, max 50)",
        },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getMedicalProfile",
    description:
      "Get the user's full medical profile: patient card (name, DOB, blood type, organ donor, emergency contact), plus conditions, medications, allergies, immunizations, and preventive care items with details.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getFormDetails",
    description:
      "Get full details for a specific medical form: title, category, status, field definitions (label, type, required, options), and the user's saved answers. Use this when the user asks about a specific form or wants help filling one out.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        formId: {
          type: "string",
          description: "The form response ID to retrieve",
        },
      },
      required: ["userId", "formId"],
    },
  },
  {
    type: "function" as const,
    name: "saveFormAnswers",
    description:
      "Save partial or complete answers for a medical form. Merges new values with existing saved answers. Set markComplete=true only when all required fields are filled.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        formId: {
          type: "string",
          description: "The form response ID to save answers for",
        },
        values: {
          type: "object",
          additionalProperties: true,
          description:
            "Key-value pairs of form field answers (keys are field linkIds)",
        },
        markComplete: {
          type: "boolean",
          description:
            "If true, marks the form as complete. Only set when all required fields are answered.",
        },
      },
      required: ["userId", "formId", "values"],
    },
  },
  {
    type: "function" as const,
    name: "resolveProviderRecordConnection",
    description:
      "Determine the best connection strategy for importing records from a provider. Checks existing connections first, then direct/Epic paths, then manual fallback. Use this when a user wants to import or connect to a provider.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        providerName: {
          type: "string",
          description: "Name of the provider or organization to connect to",
        },
        providerOrganizationId: {
          type: "string",
          description: "ID of a known provider organization",
        },
        careNetworkProviderId: {
          type: "string",
          description: "ID of a provider from the user's care network",
        },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "getConnectedProviders",
    description:
      "Get the user's connected provider organizations for record import. Returns connection method, status, and last sync time for each.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
      },
      required: ["userId"],
    },
  },
  {
    type: "function" as const,
    name: "searchProviderOrganizations",
    description:
      "Search the provider organization directory by name, EHR vendor, or location. Returns organizations with their connection capabilities (direct, Epic, manual).",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term (organization name, EHR vendor, or city)",
        },
      },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    name: "startProviderConnection",
    description:
      "Initiate a direct provider connection for record import. Creates a pending connection record. Returns launch URL when SMART on FHIR credentials are configured, otherwise returns a pending status.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        providerOrganizationId: {
          type: "string",
          description: "ID of the provider organization to connect to",
        },
      },
      required: ["userId", "providerOrganizationId"],
    },
  },
  {
    type: "function" as const,
    name: "startEpicConnection",
    description:
      "Initiate an Epic/MyChart-compatible connection for record import. Creates a pending connection record. Returns launch URL when Epic OAuth credentials are configured, otherwise returns a pending status.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        providerOrganizationId: {
          type: "string",
          description: "ID of the Epic-compatible provider organization",
        },
      },
      required: ["userId", "providerOrganizationId"],
    },
  },
  {
    type: "function" as const,
    name: "fetchProviderRecordPreview",
    description:
      "Fetch a preview of records available for import from a connected provider. Shows counts and items by type (conditions, medications, allergies, immunizations) before the user confirms import.",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "The user's ID" },
        providerConnectionId: {
          type: "string",
          description: "ID of an active provider connection",
        },
        providerOrganizationId: {
          type: "string",
          description: "ID of the provider organization",
        },
        strategy: {
          type: "string",
          enum: [
            "existing_connection",
            "direct_provider_connection",
            "epic_connection",
            "manual_fallback",
          ],
          description: "The connection strategy being used",
        },
      },
      required: ["userId"],
    },
  },
];

export const assistantToolHandlers: Record<
  string,
  (args: Record<string, unknown>) => Promise<unknown>
> = {
  getIncompleteForms,
  getHealthRecords,
  summarizeRecord,
  getCareOverview,
  getMedications,
  getAppointments,
  getEncounters,
  getConditions,
  getAllergies,
  getImmunizations,
  getInsuranceCoverages,
  getMedicalID,
  getPreventiveCare,
  getCareTimeline,
  getMedicalProfile,
  getFormDetails,
  saveFormAnswers,
  resolveProviderRecordConnection,
  getConnectedProviders,
  searchProviderOrganizations,
  startProviderConnection,
  startEpicConnection,
  fetchProviderRecordPreview,
};

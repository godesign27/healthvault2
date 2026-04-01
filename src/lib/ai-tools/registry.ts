import type { ToolDefinition, ToolResult } from './types';
import { getUserId } from './types';
import {
  getIncompleteForms, GetIncompleteFormsInputZ,
  openForm, OpenFormInputZ,
  saveFormAnswers, SaveFormAnswersInputZ,
  shareForm, ShareFormInputZ,
} from './forms';
import {
  getHealthRecords, GetHealthRecordsInputZ,
  summarizeRecord, SummarizeRecordInputZ,
  requestHealthRecord, RequestHealthRecordInputZ,
} from './records';
import {
  searchInsuranceProvider, SearchInsuranceProviderInputZ,
  getUserCoverages, GetUserCoveragesInputZ,
  setPrimaryInsurance, SetPrimaryInsuranceInputZ,
  verifyInsurance, VerifyInsuranceInputZ,
} from './insurance';
import {
  searchInNetworkProviders, SearchInNetworkProvidersInputZ,
  searchPharmacies, SearchPharmaciesInputZ,
  addProvider, AddProviderInputZ,
  setPreferredPharmacy, SetPreferredPharmacyInputZ,
} from './network';
import {
  getMedicalHistory, GetMedicalHistoryInputZ,
} from './medical-history';
import {
  getMedications, GetMedicationsInputZ,
  summarizeMedication, SummarizeMedicationInputZ,
  checkRefillStatus, CheckRefillStatusInputZ,
} from './medications';
import {
  getCareTeam, GetCareTeamInputZ,
  getCareTimeline, GetCareTimelineInputZ,
  getCareOverview, GetCareOverviewInputZ,
} from './care';
import {
  getMedicalProfile, GetMedicalProfileInputZ,
  updateMedicalProfile, UpdateMedicalProfileInputZ,
} from './profile';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'getMedicalHistory',
    description: 'Retrieves the user\'s medical history including conditions, medications, allergies, and immunizations. Can filter to a specific section.',
    parameters: GetMedicalHistoryInputZ,
    handler: (input, userId) => getMedicalHistory(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'getIncompleteForms',
    description: 'Returns the list of incomplete medical forms for the current user, with completion metadata.',
    parameters: GetIncompleteFormsInputZ,
    handler: (input, userId) => getIncompleteForms(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'openForm',
    description: 'Returns a form definition, its fields, and the current saved answers. Use either formId (for an existing response) or templateId (to start a new form).',
    parameters: OpenFormInputZ,
    handler: (input, userId) => openForm(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'saveFormAnswers',
    description: 'Saves partial or complete answers for a medical form. Supports incremental saves. Set markComplete=true only when all required fields are filled.',
    parameters: SaveFormAnswersInputZ,
    handler: (input, userId) => saveFormAnswers(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'shareForm',
    description: 'Shares one or more completed forms with a recipient via secure link. Requires explicit confirmation (confirmed=true). Only completed forms can be shared.',
    parameters: ShareFormInputZ,
    handler: (input, userId) => shareForm(input as any, userId),
    requiresAuth: true,
    confirmationRequired: true,
  },
  {
    name: 'getHealthRecords',
    description: 'Returns health records for the current user. Supports filtering by category (lab, imaging, pathology, specialist_report, other), source, date range, and text search.',
    parameters: GetHealthRecordsInputZ,
    handler: (input, userId) => getHealthRecords(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'summarizeRecord',
    description: 'Returns a safe, non-diagnostic plain-language summary of a specific health record. Does not invent medical conclusions.',
    parameters: SummarizeRecordInputZ,
    handler: (input, userId) => summarizeRecord(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'requestHealthRecord',
    description: 'Submits a request to obtain health records from a provider. Requires confirmation. Creates a pending record request.',
    parameters: RequestHealthRecordInputZ,
    handler: (input, userId) => requestHealthRecord(input as any, userId),
    requiresAuth: true,
    confirmationRequired: true,
  },
  {
    name: 'searchInsuranceProvider',
    description: 'Searches for insurance providers/plans by name, slug, or payer ID from the internal catalog.',
    parameters: SearchInsuranceProviderInputZ,
    handler: (input, userId) => searchInsuranceProvider(input as any, userId),
    requiresAuth: false,
    confirmationRequired: false,
  },
  {
    name: 'getUserCoverages',
    description: 'Returns insurance coverages for the current user, optionally filtering to active-only.',
    parameters: GetUserCoveragesInputZ,
    handler: (input, userId) => getUserCoverages(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'setPrimaryInsurance',
    description: 'Sets a specific insurance coverage as the primary plan. Requires confirmation.',
    parameters: SetPrimaryInsuranceInputZ,
    handler: (input, userId) => setPrimaryInsurance(input as any, userId),
    requiresAuth: true,
    confirmationRequired: true,
  },
  {
    name: 'verifyInsurance',
    description: 'Marks an insurance coverage as verified. Updates the verification status and timestamp.',
    parameters: VerifyInsuranceInputZ,
    handler: (input, userId) => verifyInsurance(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'searchInNetworkProviders',
    description: 'Searches the user\'s saved care providers/doctors by name, specialty, relationship type, or in-network status.',
    parameters: SearchInNetworkProvidersInputZ,
    handler: (input, userId) => searchInNetworkProviders(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'searchPharmacies',
    description: 'Searches the user\'s saved pharmacies by name, chain, preferred status, or in-network status.',
    parameters: SearchPharmaciesInputZ,
    handler: (input, userId) => searchPharmacies(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'addProvider',
    description: 'Adds a new care provider/doctor to the user\'s care network. Requires confirmation.',
    parameters: AddProviderInputZ,
    handler: (input, userId) => addProvider(input as any, userId),
    requiresAuth: true,
    confirmationRequired: true,
  },
  {
    name: 'setPreferredPharmacy',
    description: 'Sets a pharmacy as the user\'s preferred pharmacy. Requires confirmation.',
    parameters: SetPreferredPharmacyInputZ,
    handler: (input, userId) => setPreferredPharmacy(input as any, userId),
    requiresAuth: true,
    confirmationRequired: true,
  },
  {
    name: 'getMedications',
    description: 'Returns the user\'s medications with dosage, frequency, and active/inactive status. Supports filtering to active-only.',
    parameters: GetMedicationsInputZ,
    handler: (input, userId) => getMedications(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'summarizeMedication',
    description: 'Returns a plain-language summary of a specific medication including dosage, frequency, prescriber, and duration.',
    parameters: SummarizeMedicationInputZ,
    handler: (input, userId) => summarizeMedication(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'checkRefillStatus',
    description: 'Checks which medications may need a refill based on end dates. Flags medications expiring within 30 days.',
    parameters: CheckRefillStatusInputZ,
    handler: (input, userId) => checkRefillStatus(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'getCareTeam',
    description: 'Returns the user\'s care team members (doctors, specialists, therapists) with contact info and primary status.',
    parameters: GetCareTeamInputZ,
    handler: (input, userId) => getCareTeam(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'getCareTimeline',
    description: 'Returns a chronological timeline of care events: health records, form completions, and shares.',
    parameters: GetCareTimelineInputZ,
    handler: (input, userId) => getCareTimeline(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'getCareOverview',
    description: 'Returns a high-level summary of the user\'s care status: care team count, active medications, pending forms, records, conditions, allergies, and upcoming immunizations.',
    parameters: GetCareOverviewInputZ,
    handler: (input, userId) => getCareOverview(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'getMedicalProfile',
    description: 'Returns the user\'s medical profile overview: personal info and counts of conditions, medications, allergies, and immunizations with completion status.',
    parameters: GetMedicalProfileInputZ,
    handler: (input, userId) => getMedicalProfile(input as any, userId),
    requiresAuth: true,
    confirmationRequired: false,
  },
  {
    name: 'updateMedicalProfile',
    description: 'Updates the user\'s profile information (name, phone, date of birth). Requires confirmation.',
    parameters: UpdateMedicalProfileInputZ,
    handler: (input, userId) => updateMedicalProfile(input as any, userId),
    requiresAuth: true,
    confirmationRequired: true,
  },
];

const toolMap = new Map<string, ToolDefinition>(
  TOOL_DEFINITIONS.map(t => [t.name, t])
);

export function getToolByName(name: string): ToolDefinition | undefined {
  return toolMap.get(name);
}

export function listToolNames(): string[] {
  return TOOL_DEFINITIONS.map(t => t.name);
}

export async function executeTool(
  name: string,
  input: unknown,
  authUserId: string | null
): Promise<ToolResult> {
  const tool = getToolByName(name);
  if (!tool) {
    return { success: false, error: `Unknown tool: ${name}` };
  }

  const userId = getUserId(authUserId);

  const parseResult = tool.parameters.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: `Invalid input for ${name}: ${parseResult.error.issues.map(i => i.message).join(', ')}`,
    };
  }

  return tool.handler(parseResult.data, userId);
}

export function toOpenAIFunctionDefinitions(): Array<{
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}> {
  return TOOL_DEFINITIONS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.parameters),
    },
  }));
}

function zodToJsonSchema(schema: any): Record<string, unknown> {
  if (schema._def?.typeName === 'ZodObject') {
    const shape = schema._def.shape();
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(value as any);
      if (!(value as any).isOptional?.()) {
        const def = (value as any)?._def;
        if (def?.typeName !== 'ZodOptional' && def?.typeName !== 'ZodDefault') {
          required.push(key);
        }
      }
    }

    return { type: 'object', properties, ...(required.length > 0 ? { required } : {}) };
  }

  if (schema._def?.typeName === 'ZodString') {
    return { type: 'string' };
  }

  if (schema._def?.typeName === 'ZodNumber') {
    return { type: 'number' };
  }

  if (schema._def?.typeName === 'ZodBoolean') {
    return { type: 'boolean' };
  }

  if (schema._def?.typeName === 'ZodEnum') {
    return { type: 'string', enum: schema._def.values };
  }

  if (schema._def?.typeName === 'ZodArray') {
    return { type: 'array', items: zodToJsonSchema(schema._def.type) };
  }

  if (schema._def?.typeName === 'ZodOptional') {
    return zodToJsonSchema(schema._def.innerType);
  }

  if (schema._def?.typeName === 'ZodDefault') {
    return zodToJsonSchema(schema._def.innerType);
  }

  if (schema._def?.typeName === 'ZodRecord') {
    return { type: 'object', additionalProperties: true };
  }

  if (schema._def?.typeName === 'ZodEffects') {
    return zodToJsonSchema(schema._def.schema);
  }

  return { type: 'string' };
}

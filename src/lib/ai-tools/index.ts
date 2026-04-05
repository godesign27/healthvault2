export type { ToolResult, ToolDefinition } from './types';
export { toolSuccess, toolError, getUserId, DEMO_USER_ID } from './types';

export {
  getIncompleteForms,
  openForm,
  saveFormAnswers,
  shareForm,
  type FormListItem,
  type FormDetail,
  type FormField,
  type SaveFormResult,
  type ShareFormResult,
} from './forms';

export {
  getHealthRecords,
  getHealthRecordRequests,
  summarizeRecord,
  requestHealthRecord,
  deleteHealthRecordRequest,
  type HealthRecordRow,
  type HealthRecordRequestRow,
  type RecordSummary,
  type RecordRequestResult,
} from './records';

export {
  searchInsuranceProvider,
  getUserCoverages,
  setPrimaryInsurance,
  verifyInsurance,
  type InsuranceProviderResult,
  type UserCoverageResult,
} from './insurance';

export {
  searchInNetworkProviders,
  searchPharmacies,
  addProvider,
  setPreferredPharmacy,
  type CareProviderResult,
  type PharmacyResult,
} from './network';

export {
  getMedicalHistory,
  type MedicalHistoryResult,
} from './medical-history';

export {
  getMedications,
  summarizeMedication,
  checkRefillStatus,
  type MedicationResult,
  type MedicationSummary,
  type RefillStatusResult,
} from './medications';

export {
  getCareTeam,
  getCareTimeline,
  getCareOverview,
  type CareTeamMember,
  type CareTimelineEvent,
  type CareOverviewResult,
} from './care';

export {
  getMedicalProfile,
  updateMedicalProfile,
  type MedicalProfileResult,
  type UpdateMedicalProfileResult,
} from './profile';

export {
  TOOL_DEFINITIONS,
  getToolByName,
  listToolNames,
  executeTool,
  toOpenAIFunctionDefinitions,
} from './registry';

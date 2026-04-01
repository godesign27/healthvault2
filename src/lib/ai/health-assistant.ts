import { uploadRecord, shareRecord, requestInsights, listRecords } from '../records/query';
import { UploadInput, ShareInput, InsightInput } from '../records/zod';
import { HealthRecord, RecordKind } from '../records/types';

export type CommandIntent =
  | "UPLOAD_RECORD"
  | "CONNECT_PROVIDER"
  | "SEARCH_RECORDS"
  | "SUMMARIZE_RECORD"
  | "COMPARE_RECORDS"
  | "SHARE_RECORD"
  | "FILTER_BY_KIND"
  | "FILTER_BY_DATE"
  | "EXPLAIN_RECORD"
  | "REQUEST_RECORDS";

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  action?: 'UPDATE_LIST' | 'SHOW_INSIGHT' | 'SHOW_SHARE_FORM' | 'SHOW_UPLOAD_FORM' | 'SHOW_CONNECT_FLOW' | 'SHOW_REQUEST_FORM';
}

export async function routeCommand(
  intent: CommandIntent,
  params?: any
): Promise<CommandResult> {
  switch (intent) {
    case "UPLOAD_RECORD":
      return await handleUploadRecord(params as UploadInput);

    case "CONNECT_PROVIDER":
      return handleConnectProvider();

    case "SEARCH_RECORDS":
      return await handleSearchRecords(params);

    case "SUMMARIZE_RECORD":
      return await handleSummarizeRecord(params);

    case "COMPARE_RECORDS":
      return await handleCompareRecords(params);

    case "SHARE_RECORD":
      return await handleShareRecord(params as ShareInput);

    case "FILTER_BY_KIND":
      return await handleFilterByKind(params);

    case "FILTER_BY_DATE":
      return await handleFilterByDate(params);

    case "EXPLAIN_RECORD":
      return await handleExplainRecord(params);

    case "REQUEST_RECORDS":
      return handleRequestRecords();

    default:
      return {
        success: false,
        message: "I didn't understand that command. Try asking me to upload, search, summarize, compare, or share records."
      };
  }
}

async function handleUploadRecord(input: UploadInput): Promise<CommandResult> {
  try {
    const record = await uploadRecord(input);
    return {
      success: true,
      message: `✓ Uploaded "${record.title}" successfully.`,
      data: record,
      action: 'UPDATE_LIST'
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to upload record. Please try again."
    };
  }
}

function handleConnectProvider(): CommandResult {
  return {
    success: true,
    message: "Opening provider connection flow...",
    action: 'SHOW_CONNECT_FLOW'
  };
}

function handleRequestRecords(): CommandResult {
  return {
    success: true,
    message: "I can help you find or request medical records. Opening the request form so you can select a provider or enter details manually.",
    action: 'SHOW_REQUEST_FORM'
  };
}

async function handleSearchRecords(params: { query?: string; kind?: RecordKind }): Promise<CommandResult> {
  try {
    const records = await listRecords({ kind: params.kind });
    return {
      success: true,
      message: `Found ${records.length} matching records.`,
      data: records,
      action: 'UPDATE_LIST'
    };
  } catch (error) {
    return {
      success: false,
      message: "Search failed. Please try again."
    };
  }
}

async function handleSummarizeRecord(params: { recordIds: string[] }): Promise<CommandResult> {
  try {
    const insight = await requestInsights({
      intent: "SUMMARIZE",
      recordIds: params.recordIds
    } as InsightInput);

    return {
      success: true,
      message: "Here's a summary of the selected records:",
      data: insight,
      action: 'SHOW_INSIGHT'
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to generate summary. Please try again."
    };
  }
}

async function handleCompareRecords(params: { recordIds: string[] }): Promise<CommandResult> {
  try {
    if (params.recordIds.length < 2) {
      return {
        success: false,
        message: "Please select at least 2 records to compare."
      };
    }

    const insight = await requestInsights({
      intent: "COMPARE",
      recordIds: params.recordIds
    } as InsightInput);

    return {
      success: true,
      message: "Here's a comparison of the selected records:",
      data: insight,
      action: 'SHOW_INSIGHT'
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to compare records. Please try again."
    };
  }
}

async function handleShareRecord(input: ShareInput): Promise<CommandResult> {
  try {
    const shareLink = await shareRecord(input);
    return {
      success: true,
      message: `✓ Shared securely with ${input.recipientEmail}. The link expires in ${input.expiresInHours} hours.`,
      data: shareLink
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create share link. Please try again."
    };
  }
}

async function handleFilterByKind(params: { kind: RecordKind }): Promise<CommandResult> {
  try {
    const records = await listRecords({ kind: params.kind });
    return {
      success: true,
      message: `Showing ${records.length} ${params.kind.toLowerCase()} records.`,
      data: records,
      action: 'UPDATE_LIST'
    };
  } catch (error) {
    return {
      success: false,
      message: "Filter failed. Please try again."
    };
  }
}

async function handleFilterByDate(params: { from?: string; to?: string }): Promise<CommandResult> {
  try {
    const insight = await requestInsights({
      intent: "FIND_DATE_RANGE",
      filters: {
        from: params.from,
        to: params.to
      }
    } as InsightInput);

    return {
      success: true,
      message: insight.result,
      data: insight
    };
  } catch (error) {
    return {
      success: false,
      message: "Date filter failed. Please try again."
    };
  }
}

async function handleExplainRecord(params: { recordId: string }): Promise<CommandResult> {
  try {
    const insight = await requestInsights({
      intent: "EXPLAIN",
      recordIds: [params.recordId]
    } as InsightInput);

    return {
      success: true,
      message: "Here's an explanation:",
      data: insight,
      action: 'SHOW_INSIGHT'
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to generate explanation. Please try again."
    };
  }
}

export const STARTER_PROMPTS = [
  { label: "Upload a new health record", intent: "UPLOAD_RECORD" as CommandIntent },
  { label: "Show my imaging from this year", intent: "FILTER_BY_KIND" as CommandIntent, params: { kind: RecordKind.Imaging } },
  { label: "Summarize my latest bloodwork", intent: "FILTER_BY_KIND" as CommandIntent, params: { kind: RecordKind.Lab } },
  { label: "Find my specialist reports", intent: "FILTER_BY_KIND" as CommandIntent, params: { kind: RecordKind.SpecialistReport } },
];

import type { ProductKey } from '@health-vault/admin-contracts';

export type PrivacyClassification = 'aggregate' | 'minimized' | 'sensitive';

export interface AnalyticsEvent<TPayload extends Record<string, unknown>> {
  eventId: string;
  productKey: ProductKey;
  eventName: string;
  schemaVersion: number;
  occurredAt: string;
  receivedAt: string;
  actorRef: string | null;
  sessionId: string | null;
  requestId: string | null;
  correlationId: string | null;
  cohortId: string | null;
  privacyClassification: PrivacyClassification;
  payload: TPayload;
}

export interface MetricIdentity {
  productKey: ProductKey;
  metricKey: string;
  metricVersion: number;
}

export interface GptActivityPoint {
  date: string;
  activeUsers: number;
  meaningfulTasks: number;
}

export interface GptOutcomeSummary {
  success: number;
  partialSuccess: number;
  failure: number;
  abandoned: number;
  unsupported: number;
  unknown: number;
}

export interface GptIntentSummary {
  intent: string;
  tasks: number;
  users: number;
  successRate: number;
  changePercent: number;
}

export interface GptUserMetrics {
  newUsers: number;
  activatedUsers: number;
  activationRate: number;
  engagedUsers: number;
  atRiskUsers: number;
  returningUsers: number;
  activationFunnel: Array<{ stage: string; users: number; conversionRate: number }>;
  cohorts: Array<{ cohort: string; users: number; activated: number; engaged30d: number; tasksPerUser: number }>;
}

export interface GptInteractionMetrics {
  correctionRate: number;
  rephraseRate: number;
  abandonmentRate: number;
  toolFailureRate: number;
  explicitFeedbackRate: number;
  failureReasons: Array<{ reason: string; tasks: number; users: number; changePercent: number }>;
}

export interface GptCapabilitySummary {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unavailable' | 'insufficient_data';
  requests: number;
  users: number;
  successRate: number;
  p95LatencyMs: number;
  topFailure: string;
}

export interface GptCapabilityMetrics {
  healthy: number;
  degraded: number;
  unavailable: number;
  capabilities: GptCapabilitySummary[];
}

export interface GptUnmetNeedCluster {
  label: string;
  signals: number;
  users: number;
  growthPercent: number;
  opportunityScore: number;
  confidence: number;
  dominantSignal: string;
}

export interface GptUnmetNeedMetrics {
  totalSignals: number;
  affectedUsers: number;
  growingClusters: number;
  reviewedPercent: number;
  clusters: GptUnmetNeedCluster[];
}

export interface GptWeeklyBriefItem {
  type: 'observed_fact' | 'model_interpretation' | 'recommendation';
  title: string;
  body: string;
  evidence: string | null;
}

export interface GptWeeklyBrief {
  status: 'draft' | 'reviewed';
  weekEnding: string;
  generatedAt: string;
  items: GptWeeklyBriefItem[];
}

export interface GptInsightsMetrics {
  activeUsers: number;
  activeUsersChangePercent: number;
  meaningfulTasks: number;
  meaningfulTasksChangePercent: number;
  successRate: number;
  successRateChangePoints: number;
  tasksPerActiveUser: number;
  tasksPerActiveUserChangePercent: number;
  p95LatencyMs: number;
  unsupportedRate: number;
  unknownOutcomeRate: number;
  activity: GptActivityPoint[];
  outcomes: GptOutcomeSummary;
  topIntents: GptIntentSummary[];
  users: GptUserMetrics;
  interactions: GptInteractionMetrics;
  capabilityHealth: GptCapabilityMetrics;
  unmetNeeds: GptUnmetNeedMetrics;
  weeklyBrief: GptWeeklyBrief;
}

export interface GptInsightsSnapshot {
  snapshotId: string;
  productKey: 'gpt_app';
  snapshotVersion: number;
  dataStatus: 'synthetic' | 'live';
  periodStart: string;
  periodEnd: string;
  comparisonStart: string;
  comparisonEnd: string;
  generatedAt: string;
  sourceVersion: string;
  metrics: GptInsightsMetrics;
}

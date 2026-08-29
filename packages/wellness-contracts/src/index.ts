import { z } from "zod";

export const PARTNER_KEY = "nourished_rebel" as const;
export const CHECK_IN_QUESTION_KEYS = [
  "sleep", "meal_rhythm", "energy_cravings", "stress", "hydration", "movement",
] as const;
export type CheckInQuestionKey = typeof CHECK_IN_QUESTION_KEYS[number];

export const CheckInAnswersSchema = z.object({
  sleep: z.string().max(1000).nullable().optional(),
  meal_rhythm: z.string().max(1000).nullable().optional(),
  energy_cravings: z.string().max(1000).nullable().optional(),
  stress: z.string().max(1000).nullable().optional(),
  hydration: z.string().max(1000).nullable().optional(),
  movement: z.string().max(1000).nullable().optional(),
}).strict();
export type CheckInAnswers = z.infer<typeof CheckInAnswersSchema>;

export function answeredQuestionCount(answers: Partial<Record<CheckInQuestionKey, string | null>>): number {
  return CHECK_IN_QUESTION_KEYS.filter((key) => Boolean(answers[key]?.trim())).length;
}

export const PillarStatusSchema = z.enum(["strong", "needs_support", "significant_opportunity"]);
export const PillarAssessmentSchema = z.object({
  status: PillarStatusSchema,
  summary: z.string().min(1).max(1200),
  contributingFactors: z.array(z.string().max(500)).max(8),
  suggestions: z.array(z.string().max(500)).min(1).max(5),
});

export const WellnessInsightSchema = z.object({
  snapshot: z.string().min(1).max(1200),
  pillars: z.object({
    sleep: PillarAssessmentSchema,
    blood_sugar: PillarAssessmentSchema,
    nourishment: PillarAssessmentSchema,
    stress: PillarAssessmentSchema,
  }),
  topPriorities: z.array(z.string().max(500)).min(1).max(4),
  startingPoints: z.array(z.string().max(500)).min(1).max(5),
  followUpRecommended: z.boolean(),
  ctaRelevant: z.boolean(),
  disclaimer: z.string().min(1).max(500),
  provenance: z.object({
    frameworkVersion: z.number().int().positive(),
    promptVersion: z.number().int().positive(),
    generatedAt: z.string().datetime(),
    sourceKinds: z.array(z.enum(["check_in", "life_signals", "diet_log", "profile", "lab_summary"])),
  }),
});
export type WellnessInsight = z.infer<typeof WellnessInsightSchema>;

export const WellnessPartnerPublicConfigSchema = z.object({
  partnerKey: z.string(),
  displayName: z.string(),
  status: z.enum(["draft", "active", "paused", "disabled"]),
  launchStage: z.enum(["internal", "closed_beta", "public"]),
  frameworkVersion: z.number().int().positive(),
  promptVersion: z.number().int().positive(),
  disclaimer: z.string(),
  consentCopy: z.string(),
  websiteUrl: z.string().url(),
  gptEnabled: z.boolean(),
  cloudEnabled: z.boolean(),
  generationEnabled: z.boolean(),
});

const unsafePatterns = [
  /\b(you have|you are suffering from|this is)\s+(diabetes|prediabetes|cancer|anemia|a disorder|a disease)\b/i,
  /\b(stop|start|increase|decrease|change|skip)\s+(taking\s+)?(your\s+)?(medication|medicine|prescription|dose)\b/i,
  /\bdiagnos(?:e|ed|is|tic)\b/i,
  /\bcure[sd]?\b/i,
];

export function containsUnsafeWellnessLanguage(value: unknown): boolean {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return unsafePatterns.some((pattern) => pattern.test(text));
}

export const WELLNESS_DISCLAIMER = "Wellness guidance from Nourished Rebel, not medical advice.";

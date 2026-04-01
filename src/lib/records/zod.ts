import { z } from "zod";

export const UploadInputSchema = z.object({
  fileName: z.string(),
  fileType: z.enum(["pdf", "jpg", "png", "dicom", "txt"]),
  serviceDate: z.string().optional(),
  providerName: z.string().optional(),
  kind: z.enum(["LAB", "IMAGING", "PATHOLOGY", "SPECIALIST_REPORT", "OTHER"]).optional(),
});

export const ShareInputSchema = z.object({
  recordId: z.string(),
  recipientEmail: z.string().email(),
  message: z.string().optional(),
  expiresInHours: z.number().int().min(1).max(336).default(72),
});

export const InsightInputSchema = z.object({
  intent: z.enum(["SUMMARIZE", "COMPARE", "SEARCH", "EXPLAIN", "FIND_KIND", "FIND_DATE_RANGE"]),
  recordIds: z.array(z.string()).optional(),
  filters: z.object({
    kind: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
  prompt: z.string().optional(),
});

export type UploadInput = z.infer<typeof UploadInputSchema>;
export type ShareInput = z.infer<typeof ShareInputSchema>;
export type InsightInput = z.infer<typeof InsightInputSchema>;

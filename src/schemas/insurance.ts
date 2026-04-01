import { z } from 'zod';

export const RelationshipZ = z.enum(['self', 'spouse', 'dependent', 'other']);

export const VerificationStatusZ = z.enum(['connected', 'verifying', 'needs_attention', 'expiring']);

export const ConnectionSourceZ = z.enum(['oauth', 'upload', 'manual']);

export const CoverageStatusZ = z.enum(['active', 'stopped', 'expired']);

export const InsuranceProviderZ = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Provider name is required'),
  payerId: z.string().optional(),
  logoUrl: z.string().url().optional(),
  slug: z.string().min(1),
  isPopular: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
});

export const CoverageZ = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  providerId: z.string().uuid('Provider is required'),
  planName: z.string().min(1, 'Plan name is required'),
  memberId: z.string().min(1, 'Member ID is required'),
  memberIdHash: z.string().optional(),
  groupNumber: z.string().optional(),
  bin: z.string().optional(),
  pcn: z.string().optional(),
  relationship: RelationshipZ.default('self'),
  effectiveStart: z.string().datetime('Effective start date is required'),
  effectiveEnd: z.string().datetime().nullable().optional(),
  isPrimary: z.boolean().default(false),
  verificationStatus: VerificationStatusZ.default('connected'),
  lastVerifiedAt: z.string().datetime().optional(),
  source: ConnectionSourceZ.default('manual'),
  coverageStatus: CoverageStatusZ.default('active'),
  stoppedAt: z.string().datetime().nullable().optional(),
  rawFhir: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const CoverageWithProviderZ = CoverageZ.extend({
  provider: InsuranceProviderZ,
});

export const AuditEventZ = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  entity: z.string(),
  action: z.enum(['create', 'update', 'delete', 'verify', 'set_primary']),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime().optional(),
});

export type InsuranceProvider = z.infer<typeof InsuranceProviderZ>;
export type Coverage = z.infer<typeof CoverageZ>;
export type CoverageWithProvider = z.infer<typeof CoverageWithProviderZ>;
export type AuditEvent = z.infer<typeof AuditEventZ>;
export type VerificationStatus = z.infer<typeof VerificationStatusZ>;
export type ConnectionSource = z.infer<typeof ConnectionSourceZ>;
export type Relationship = z.infer<typeof RelationshipZ>;
export type CoverageStatus = z.infer<typeof CoverageStatusZ>;

export function hashMemberId(memberId: string): string {
  let hash = 0;
  for (let i = 0; i < memberId.length; i++) {
    const char = memberId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function maskMemberId(memberId: string): string {
  if (memberId.length <= 4) return memberId;
  return '•'.repeat(memberId.length - 4) + memberId.slice(-4);
}

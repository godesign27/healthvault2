import { Coverage, CoverageZ, hashMemberId } from '../../schemas/insurance';

export interface FHIRCoverage {
  resourceType: 'Coverage';
  id?: string;
  status: 'active' | 'cancelled' | 'draft' | 'entered-in-error';
  type?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  };
  subscriberId?: string;
  beneficiary: {
    reference: string;
  };
  payor?: Array<{
    reference?: string;
    display?: string;
  }>;
  class?: Array<{
    type: {
      coding?: Array<{
        system?: string;
        code?: string;
      }>;
    };
    value: string;
    name?: string;
  }>;
  period?: {
    start?: string;
    end?: string;
  };
}

export function fhirToCoverage(
  fhirCoverage: FHIRCoverage,
  providerId: string,
  userId: string
): Partial<Coverage> {
  const planName = fhirCoverage.type?.coding?.[0]?.display || 'Unknown Plan';

  const memberId = fhirCoverage.subscriberId || 'UNKNOWN';

  const groupNumber = fhirCoverage.class?.find(
    c => c.type.coding?.[0]?.code === 'group'
  )?.value;

  const bin = fhirCoverage.class?.find(
    c => c.type.coding?.[0]?.code === 'rxbin'
  )?.value;

  const pcn = fhirCoverage.class?.find(
    c => c.type.coding?.[0]?.code === 'rxpcn'
  )?.value;

  const effectiveStart = fhirCoverage.period?.start || new Date().toISOString();
  const effectiveEnd = fhirCoverage.period?.end || null;

  const coverage: Partial<Coverage> = {
    userId,
    providerId,
    planName,
    memberId,
    memberIdHash: hashMemberId(memberId),
    groupNumber,
    bin,
    pcn,
    relationship: 'self',
    effectiveStart,
    effectiveEnd,
    isPrimary: false,
    verificationStatus: fhirCoverage.status === 'active' ? 'connected' : 'needs_attention',
    source: 'oauth',
    rawFhir: fhirCoverage,
  };

  return CoverageZ.partial().parse(coverage);
}

export function validateFHIRCoverage(data: unknown): data is FHIRCoverage {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  return (
    obj.resourceType === 'Coverage' &&
    typeof obj.status === 'string' &&
    typeof obj.beneficiary === 'object' &&
    obj.beneficiary !== null
  );
}

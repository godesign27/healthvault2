/** Payload shape expected by the `share` Edge Function POST handler. */

export interface ShareFormItem {
  id: string;
  title: string;
  version: string;
  signedAt?: string;
}

export interface ShareRecipient {
  displayName: string;
  orgName?: string;
  email: string;
  method: 'SecureLink' | 'Direct' | 'FHIR';
  patientName: string;
  patientDob?: string;
  providerName: string;
}

export interface ShareRequestBody {
  patientId: string;
  forms: ShareFormItem[];
  recipient: ShareRecipient;
  note?: string;
  options?: {
    package?: { pdf?: boolean; fhirBundle?: boolean };
    cc?: { me?: boolean; patient?: boolean };
  };
}

export function buildShareRequestBody(params: {
  patientId: string;
  forms: ShareFormItem[];
  recipientName: string;
  recipientEmail: string;
  recipientOrg?: string;
  patientName?: string;
  patientDob?: string;
  note?: string;
}): ShareRequestBody {
  const displayName = params.recipientName.trim();
  const orgName = params.recipientOrg?.trim();

  return {
    patientId: params.patientId,
    forms: params.forms,
    recipient: {
      displayName,
      orgName: orgName || undefined,
      email: params.recipientEmail,
      method: 'SecureLink',
      patientName: params.patientName?.trim() || '',
      patientDob: params.patientDob || undefined,
      providerName: orgName || displayName,
    },
    note: params.note || '',
    options: {
      package: { pdf: true, fhirBundle: true },
      cc: { me: true, patient: false },
    },
  };
}

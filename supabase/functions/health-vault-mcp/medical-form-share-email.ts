export type MedicalFormShareEmailDetails = {
  recipientName: string;
  patientName: string;
  shareUrl: string;
  expiresAt: string;
};

type DeliveryResult = { sent: boolean; id?: string; error?: string };

export type SendMedicalFormShareEmailInput = MedicalFormShareEmailDetails & {
  apiKey: string;
  from: string;
  recipientEmail: string;
  patientEmail?: string | null;
  sendPatientCopy: boolean;
  fetcher?: typeof fetch;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character] ?? character);

export function buildMedicalFormShareEmail(details: MedicalFormShareEmailDetails) {
  const recipientName = escapeHtml(details.recipientName);
  const patientName = escapeHtml(details.patientName);
  const shareUrl = escapeHtml(details.shareUrl);
  const expiration = escapeHtml(new Date(details.expiresAt).toLocaleString("en-US", { timeZone: "America/Denver", timeZoneName: "short" }));
  return {
    subject: "A patient shared a secure Health Vault form with you",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17223b"><h1 style="font-size:24px">Health Vault</h1><p>Hello ${recipientName},</p><p>${patientName} has shared a private medical form with you through Health Vault.</p><p><a href="${shareUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#17223b;color:#fff;text-decoration:none;font-weight:700">Open secure form</a></p><p style="color:#667085">This read-only link expires ${expiration}. Do not forward it. Health Vault will never ask for a password through this email.</p></div>`,
  };
}

async function deliver(fetcher: typeof fetch, apiKey: string, payload: Record<string, unknown>): Promise<DeliveryResult> {
  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    if (!response.ok) return { sent: false, error: `Email service returned ${response.status}: ${text}` };
    const body = JSON.parse(text) as { id?: string };
    return { sent: true, id: body.id };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : "Unknown email delivery error" };
  }
}

export async function sendMedicalFormShareEmail(input: SendMedicalFormShareEmailInput) {
  const fetcher = input.fetcher ?? fetch;
  const providerEmail = buildMedicalFormShareEmail(input);
  const recipient = await deliver(fetcher, input.apiKey, {
    from: input.from,
    to: [input.recipientEmail],
    subject: providerEmail.subject,
    html: providerEmail.html,
  });

  let patientCopy: DeliveryResult | undefined;
  if (input.sendPatientCopy && input.patientEmail) {
    patientCopy = await deliver(fetcher, input.apiKey, {
      from: input.from,
      to: [input.patientEmail],
      subject: "Your Health Vault secure-share receipt",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17223b"><h1 style="font-size:24px">Health Vault</h1><p>Your secure form link for ${escapeHtml(input.recipientName)} was created and sent.</p><p>The link expires ${escapeHtml(new Date(input.expiresAt).toLocaleString("en-US", { timeZone: "America/Denver", timeZoneName: "short" }))}. You can revoke it from Health Vault.</p></div>`,
    });
  }

  return { recipient, patientCopy };
}

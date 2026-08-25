import type { SupabaseClient } from "@supabase/supabase-js";
import { getPatientProfileId, GPT_MEDICAL_FORMS } from "./medical-forms.ts";

export type MedicalFormShareInput = {
  templateId: string;
  recipientName: string;
  recipientOrganization?: string;
  recipientEmail: string;
  expiresInHours: number;
  note?: string;
  sendPatientCopy?: boolean;
};

type EmailDeliveryResult = {
  recipient: { sent: boolean; id?: string; error?: string };
  patientCopy?: { sent: boolean; id?: string; error?: string };
};

type EmailSender = (input: {
  recipientEmail: string;
  patientEmail: string | null;
  sendPatientCopy: boolean;
  recipientName: string;
  patientName: string;
  shareUrl: string;
  expiresAt: string;
}) => Promise<EmailDeliveryResult>;

const clean = (value?: string | null) => value?.trim() || null;
const validEmail = (value: string) => value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function hasAllRequiredAnswers(definition: (typeof GPT_MEDICAL_FORMS)[number], answers: unknown) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return false;
  const values = answers as Record<string, unknown>;
  return definition.fields
    .filter(({ required }) => required !== false)
    .every(({ key }) => typeof values[key] === "string" && Boolean(values[key].trim()));
}

async function completedForm(supabase: SupabaseClient, userId: string, templateId: string) {
  const definition = GPT_MEDICAL_FORMS.find(({ id }) => id === templateId);
  if (!definition) throw new Error("This medical form is not available for secure sharing.");
  const patientId = await getPatientProfileId(supabase, userId);
  const { data, error } = await supabase.from("form_responses")
    .select("id, status, answers_json, updated_at")
    .eq("patient_id", patientId)
    .eq("template_id", templateId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load the completed medical form: ${error.message}`);
  // The answer set is the durable source of truth. In particular, a response
  // written by the confirmation card can be read before status-based clients
  // have refreshed their saved-state cache.
  if (!data || (!['complete', 'completed'].includes(data.status) && !hasAllRequiredAnswers(definition, data.answers_json))) {
    throw new Error(`${definition.title} must be completed before it can be shared.`);
  }
  return { definition, patientId, response: data };
}

export async function previewMedicalFormShare(supabase: SupabaseClient, userId: string, input: MedicalFormShareInput) {
  if (input.expiresInHours < 1 || input.expiresInHours > 168) throw new Error("Secure form shares must expire within 1 to 168 hours.");
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  if (!validEmail(recipientEmail)) throw new Error("Enter a valid recipient email before preparing the secure share.");
  const { definition, response } = await completedForm(supabase, userId, input.templateId);
  if (input.sendPatientCopy) {
    const { data: profile, error } = await supabase.from("user_profiles")
      .select("email, email_verified")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(`Unable to verify the patient's receipt email: ${error.message}`);
    if (!profile?.email_verified || !clean(profile.email)) {
      throw new Error("Verify the patient's Health Vault email before requesting an email receipt.");
    }
  }
  return {
    templateId: definition.id,
    templateTitle: definition.title,
    responseId: response.id,
    recipientName: input.recipientName.trim(),
    recipientOrganization: clean(input.recipientOrganization),
    recipientEmail,
    expiresInHours: input.expiresInHours,
    note: clean(input.note),
    sendPatientCopy: Boolean(input.sendPatientCopy),
    requiresConfirmation: true,
    confirmationState: "pending",
    safeSummary: `Review this secure ${definition.title} share. No link has been created yet.`,
  };
}

export async function createMedicalFormShare(
  supabase: SupabaseClient,
  userId: string,
  appUrl: string,
  input: MedicalFormShareInput,
  sendEmail?: EmailSender,
) {
  const preview = await previewMedicalFormShare(supabase, userId, input);
  const { patientId, response } = await completedForm(supabase, userId, input.templateId);
  const [{ data: userProfile, error: userProfileError }, { data: patientProfile, error: patientProfileError }] = await Promise.all([
    supabase.from("user_profiles").select("first_name, last_name, email, email_verified").eq("user_id", userId).maybeSingle(),
    supabase.from("patient_profiles").select("name, contact_email").eq("id", patientId).maybeSingle(),
  ]);
  if (userProfileError) throw new Error(`Unable to load the patient identity: ${userProfileError.message}`);
  if (patientProfileError) throw new Error(`Unable to load the patient profile: ${patientProfileError.message}`);
  const profileName = [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(" ").trim();
  const patientName = profileName || patientProfile?.name?.trim() || "Health Vault patient";
  const patientEmail = userProfile?.email_verified ? clean(userProfile.email) : null;
  const shareId = crypto.randomUUID();
  const shareToken = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + preview.expiresInHours * 3_600_000).toISOString();
  const shareUrl = `${appUrl.replace(/\/$/, "")}/share/${shareId}?token=${shareToken}`;
  const recipient = {
    displayName: preview.recipientName,
    orgName: preview.recipientOrganization,
    email: preview.recipientEmail,
    patientName,
  };
  const createdAudit = [{ event: "created", at: createdAt, actor: "patient" }];
  const { error } = await supabase.from("share_events").insert({
    id: shareId,
    patient_id: patientId,
    form_response_ids: [response.id],
    method: "SecureLink",
    recipient,
    status: "sent",
    sent_at: createdAt,
    expires_at: expiresAt,
    note: preview.note,
    options: { medicalFormShare: { version: 1, templateId: preview.templateId, templateTitle: preview.templateTitle, responseUpdatedAt: response.updated_at } },
    audit: createdAudit,
    share_token: shareToken,
    is_revoked: false,
  });
  if (error) throw new Error(`Unable to create the secure form share: ${error.message}`);

  const emailDelivery = sendEmail
    ? await sendEmail({ recipientEmail: preview.recipientEmail, patientEmail, sendPatientCopy: preview.sendPatientCopy, recipientName: preview.recipientName, patientName, shareUrl, expiresAt })
    : { recipient: { sent: false, error: "Email delivery is not configured." } };
  const deliveredAt = new Date().toISOString();
  const audit: Array<Record<string, unknown>> = [...createdAudit, {
    event: emailDelivery.recipient.sent ? "email_accepted" : "email_delivery_failed",
    at: deliveredAt,
    actor: "system",
    recipientEmail: preview.recipientEmail,
    ...(emailDelivery.recipient.id ? { providerMessageId: emailDelivery.recipient.id } : {}),
    ...(emailDelivery.recipient.error ? { error: emailDelivery.recipient.error } : {}),
  }];
  if (emailDelivery.patientCopy) {
    audit.push({
      event: emailDelivery.patientCopy.sent ? "patient_receipt_accepted" : "patient_receipt_failed",
      at: deliveredAt,
      actor: "system",
      ...(emailDelivery.patientCopy.id ? { providerMessageId: emailDelivery.patientCopy.id } : {}),
      ...(emailDelivery.patientCopy.error ? { error: emailDelivery.patientCopy.error } : {}),
    });
  }
  const { error: deliveryUpdateError } = await supabase.from("share_events").update({
    status: "sent",
    recipient: {
      ...recipient,
      emailDelivery: emailDelivery.recipient.sent ? "accepted" : "failed",
      ...(emailDelivery.patientCopy ? { patientReceipt: emailDelivery.patientCopy.sent ? "accepted" : "failed" } : {}),
    },
    audit,
  }).eq("id", shareId).eq("patient_id", patientId);

  return {
    ...preview,
    id: shareId,
    shareUrl,
    expiresAt,
    emailDelivery,
    deliveryReceiptSaved: !deliveryUpdateError,
    requiresConfirmation: false,
    confirmationState: "confirmed",
    canBeRevoked: true,
    safeSummary: emailDelivery.recipient.sent
      ? `Secure ${preview.templateTitle} share created and its email was accepted for delivery to ${preview.recipientName}.`
      : `Secure ${preview.templateTitle} share created for ${preview.recipientName}, but the email could not be delivered. Copy the secure link instead.`,
  };
}

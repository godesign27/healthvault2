import type { SupabaseClient } from "@supabase/supabase-js";
import { getPatientProfileId, GPT_MEDICAL_FORMS } from "./medical-forms.ts";

export type MedicalFormShareInput = {
  templateId: string;
  recipientName: string;
  recipientOrganization?: string;
  expiresInHours: number;
  note?: string;
};

const clean = (value?: string | null) => value?.trim() || null;

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
  if (!data || !["complete", "completed"].includes(data.status)) {
    throw new Error(`${definition.title} must be completed before it can be shared.`);
  }
  return { definition, patientId, response: data };
}

export async function previewMedicalFormShare(supabase: SupabaseClient, userId: string, input: MedicalFormShareInput) {
  if (input.expiresInHours < 1 || input.expiresInHours > 168) throw new Error("Secure form shares must expire within 1 to 168 hours.");
  const { definition, response } = await completedForm(supabase, userId, input.templateId);
  return {
    templateId: definition.id,
    templateTitle: definition.title,
    responseId: response.id,
    recipientName: input.recipientName.trim(),
    recipientOrganization: clean(input.recipientOrganization),
    expiresInHours: input.expiresInHours,
    note: clean(input.note),
    requiresConfirmation: true,
    confirmationState: "pending",
    safeSummary: `Review this secure ${definition.title} share. No link has been created yet.`,
  };
}

export async function createMedicalFormShare(supabase: SupabaseClient, userId: string, appUrl: string, input: MedicalFormShareInput) {
  const preview = await previewMedicalFormShare(supabase, userId, input);
  const { patientId, response } = await completedForm(supabase, userId, input.templateId);
  const shareId = crypto.randomUUID();
  const shareToken = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + preview.expiresInHours * 3_600_000).toISOString();
  const { error } = await supabase.from("share_events").insert({
    id: shareId,
    patient_id: patientId,
    form_response_ids: [response.id],
    method: "SecureLink",
    recipient: { displayName: preview.recipientName, orgName: preview.recipientOrganization },
    status: "delivered",
    sent_at: createdAt,
    expires_at: expiresAt,
    note: preview.note,
    options: { medicalFormShare: { version: 1, templateId: preview.templateId, templateTitle: preview.templateTitle, responseUpdatedAt: response.updated_at } },
    audit: [{ event: "created", at: createdAt, actor: "patient" }],
    share_token: shareToken,
    is_revoked: false,
  });
  if (error) throw new Error(`Unable to create the secure form share: ${error.message}`);
  return { ...preview, id: shareId, shareUrl: `${appUrl.replace(/\/$/, "")}/share/${shareId}?token=${shareToken}`, expiresAt, requiresConfirmation: false, confirmationState: "confirmed", canBeRevoked: true, safeSummary: `Secure ${preview.templateTitle} share created for ${preview.recipientName}.` };
}

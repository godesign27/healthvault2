import { z } from 'zod';
import { supabase } from '../supabase';
import { toolSuccess, toolError, type ToolResult } from './types';

export const GetIncompleteFormsInputZ = z.object({
  category: z.string().optional(),
});

export type GetIncompleteFormsInput = z.infer<typeof GetIncompleteFormsInputZ>;

export interface FormListItem {
  id: string;
  templateId: string;
  title: string;
  description: string;
  category: string;
  status: 'complete' | 'incomplete';
  answeredFields: number;
  totalFields: number;
  updatedAt: string;
}

export async function getIncompleteForms(
  input: GetIncompleteFormsInput,
  userId: string
): Promise<ToolResult<FormListItem[]>> {
  try {
    const parsed = GetIncompleteFormsInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    let query = supabase
      .from('form_responses')
      .select(`
        id,
        template_id,
        answers_json,
        status,
        updated_at,
        form_templates!inner (
          id,
          title,
          description,
          category,
          fhir_questionnaire_json
        )
      `)
      .eq('status', 'incomplete')
      .order('updated_at', { ascending: false });

    const patientResult = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (patientResult.data?.id) {
      query = query.eq('patient_id', patientResult.data.id);
    }

    if (parsed.data.category) {
      query = query.eq('form_templates.category', parsed.data.category);
    }

    const { data, error } = await query;

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    const forms: FormListItem[] = (data || []).map((row: any) => {
      const template = row.form_templates;
      const answers = row.answers_json || {};
      const questionnaire = template?.fhir_questionnaire_json;
      const totalFields = questionnaire?.item?.length || 0;
      const answeredFields = Object.keys(answers).length;

      return {
        id: row.id,
        templateId: row.template_id,
        title: template?.title || 'Untitled Form',
        description: template?.description || '',
        category: template?.category || '',
        status: row.status,
        answeredFields,
        totalFields,
        updatedAt: row.updated_at,
      };
    });

    return toolSuccess(forms, `Found ${forms.length} incomplete form${forms.length !== 1 ? 's' : ''}.`);
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const OpenFormInputZ = z.object({
  formId: z.string().optional(),
  templateId: z.string().optional(),
}).refine(
  (data) => data.formId || data.templateId,
  { message: 'Either formId or templateId is required' }
);

export type OpenFormInput = z.infer<typeof OpenFormInputZ>;

export interface FormDetail {
  responseId: string | null;
  templateId: string;
  title: string;
  description: string;
  category: string;
  version: string;
  fields: FormField[];
  savedAnswers: Record<string, unknown>;
  status: 'complete' | 'incomplete' | 'new';
  signedAt: string | null;
}

export interface FormField {
  linkId: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
}

export async function openForm(
  input: OpenFormInput,
  _userId: string
): Promise<ToolResult<FormDetail>> {
  try {
    const parsed = OpenFormInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    let templateId = parsed.data.templateId;
    let existingResponse: any = null;

    if (parsed.data.formId) {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*, form_templates(*)')
        .eq('id', parsed.data.formId)
        .maybeSingle();

      if (error) return toolError(`Database error: ${error.message}`);
      if (!data) return toolError('Form response not found.');

      existingResponse = data;
      templateId = data.template_id;
    }

    const { data: template, error: templateError } = await supabase
      .from('form_templates')
      .select('*')
      .eq('id', templateId)
      .maybeSingle();

    if (templateError) return toolError(`Database error: ${templateError.message}`);
    if (!template) return toolError('Form template not found.');

    const questionnaire = template.fhir_questionnaire_json || {};
    const fields: FormField[] = (questionnaire.item || []).map((item: any) => ({
      linkId: item.linkId || '',
      text: item.text || '',
      type: item.type || 'string',
      required: item.required || false,
      options: item.answerOption?.map((opt: any) => opt.valueCoding?.display || opt.valueString) || undefined,
    }));

    const detail: FormDetail = {
      responseId: existingResponse?.id || null,
      templateId: template.id,
      title: template.title,
      description: template.description,
      category: template.category,
      version: template.version || '1.0',
      fields,
      savedAnswers: existingResponse?.answers_json || {},
      status: existingResponse ? existingResponse.status : 'new',
      signedAt: existingResponse?.signed_at || null,
    };

    return toolSuccess(detail, `Loaded form: ${template.title}`);
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const SaveFormAnswersInputZ = z.object({
  formId: z.string().optional(),
  templateId: z.string(),
  answers: z.record(z.string(), z.unknown()),
  markComplete: z.boolean().default(false),
});

export type SaveFormAnswersInput = z.infer<typeof SaveFormAnswersInputZ>;

export interface SaveFormResult {
  formId: string;
  status: 'complete' | 'incomplete';
  savedFields: number;
}

export async function saveFormAnswers(
  input: SaveFormAnswersInput,
  userId: string
): Promise<ToolResult<SaveFormResult>> {
  try {
    const parsed = SaveFormAnswersInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const { formId, templateId, answers, markComplete } = parsed.data;
    const status = markComplete ? 'complete' : 'incomplete';
    const signedAt = markComplete ? new Date().toISOString() : null;

    const patientResult = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const patientId = patientResult.data?.id;
    if (!patientId) {
      return toolError('Patient profile not found. Cannot save form answers without a patient profile.');
    }

    if (formId) {
      const { data: existing, error: fetchErr } = await supabase
        .from('form_responses')
        .select('answers_json')
        .eq('id', formId)
        .maybeSingle();

      if (fetchErr) return toolError(`Database error: ${fetchErr.message}`);
      if (!existing) return toolError('Form response not found.');

      const mergedAnswers = { ...(existing.answers_json || {}), ...answers };

      const { error: updateErr } = await supabase
        .from('form_responses')
        .update({
          answers_json: mergedAnswers,
          status,
          signed_at: signedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formId);

      if (updateErr) return toolError(`Save failed: ${updateErr.message}`);

      return toolSuccess(
        { formId, status, savedFields: Object.keys(mergedAnswers).length },
        `Form answers saved successfully.`
      );
    }

    const { data: newResponse, error: insertErr } = await supabase
      .from('form_responses')
      .insert({
        template_id: templateId,
        patient_id: patientId,
        answers_json: answers,
        status,
        signed_at: signedAt,
      })
      .select('id')
      .single();

    if (insertErr) return toolError(`Save failed: ${insertErr.message}`);

    return toolSuccess(
      { formId: newResponse.id, status, savedFields: Object.keys(answers).length },
      `New form response created and answers saved.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const ShareFormInputZ = z.object({
  formIds: z.array(z.string()).min(1, 'At least one form is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientEmail: z.string().email('Valid email is required'),
  recipientOrg: z.string().optional(),
  note: z.string().optional(),
  confirmed: z.boolean(),
});

export type ShareFormInput = z.infer<typeof ShareFormInputZ>;

export interface ShareFormResult {
  shareId: string;
  status: string;
  recipientEmail: string;
  expiresAt: string;
}

export async function shareForm(
  input: ShareFormInput,
  userId: string
): Promise<ToolResult<ShareFormResult>> {
  try {
    const parsed = ShareFormInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    if (!parsed.data.confirmed) {
      return toolError('Share action requires explicit confirmation. Set confirmed: true to proceed.');
    }

    const { formIds, recipientName, recipientEmail, recipientOrg, note } = parsed.data;

    for (const formId of formIds) {
      const { data: response, error } = await supabase
        .from('form_responses')
        .select('status')
        .eq('id', formId)
        .maybeSingle();

      if (error) return toolError(`Database error checking form ${formId}: ${error.message}`);
      if (!response) return toolError(`Form ${formId} not found.`);
      if (response.status !== 'complete') {
        return toolError(`Form ${formId} is not complete. Only completed forms can be shared.`);
      }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const sharePayload = {
      patientId: userId,
      formResponseIds: formIds,
      method: 'SecureLink',
      recipient: {
        providerName: recipientOrg || recipientName,
        patientName: '',
        email: recipientEmail,
        displayName: recipientName,
      },
      note: note || '',
    };

    const res = await fetch(`${supabaseUrl}/functions/v1/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(sharePayload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return toolError(`Share request failed: ${body.error || res.statusText}`);
    }

    const result = await res.json();

    return toolSuccess(
      {
        shareId: result.id,
        status: result.status || 'sent',
        recipientEmail,
        expiresAt: result.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      `Forms shared with ${recipientName} (${recipientEmail}). They will receive a secure link.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

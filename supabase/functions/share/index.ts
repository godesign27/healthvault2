import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

function getFormTitle(formId: string): string {
  const formTitles: Record<string, string> = {
    'patient-reg': 'Patient Registration',
    'medical-id': 'Medical ID Information',
    'medical-history': 'Medical History',
    'hipaa': 'HIPAA Authorization & Privacy',
    'consent-treat': 'Consent to Treat',
    'privacy-practices': 'Notice of Privacy Practices',
    'release-info': 'Release of Information',
    'advance-directives': 'Advance Directives',
    'emergency-contact': 'Emergency Contact Information',
    'communication-prefs': 'Communication Preferences',
    'cultural-accessibility': 'Cultural & Accessibility Preferences',
    'insurance-info': 'Insurance Information',
    'financial-responsibility': 'Financial Responsibility Agreement',
    'payment-info': 'Payment Information',
    'social-history': 'Social History',
    'current-medications': 'Current Medications',
    'allergy-info': 'Allergy Information',
    'immunization-record': 'Immunization Record',
  };

  return formTitles[formId] || 'Unknown Form';
}

function answerLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function printable(value: unknown): string {
  const text = Array.isArray(value)
    ? value.join(', ')
    : typeof value === 'object' && value !== null
      ? JSON.stringify(value)
      : String(value);
  return text.replace(/[^\x20-\x7E]/g, ' ');
}

function wrapText(text: string, maxCharacters = 88): string[] {
  const words = printable(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

async function createPdfPacket(input: {
  patientName: string;
  patientDob?: string | null;
  recipientName: string;
  forms: any[];
}): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [612, 792];
  const margin = 48;
  let page = document.addPage(pageSize);
  let y = 742;

  const addPage = () => {
    page = document.addPage(pageSize);
    y = 742;
  };
  const ensureSpace = (height: number) => {
    if (y - height < 48) addPage();
  };
  const drawLine = (text: string, options: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const size = options.size ?? 10;
    ensureSpace(size + 7);
    page.drawText(printable(text), {
      x: margin,
      y,
      size,
      font: options.bold ? bold : regular,
      color: options.color ?? rgb(0.12, 0.16, 0.22),
    });
    y -= size + 7;
  };

  drawLine('HEALTH VAULT', { bold: true, size: 11, color: rgb(0.04, 0.53, 0.39) });
  drawLine('Medical Forms Packet', { bold: true, size: 22 });
  y -= 8;
  drawLine(`Patient: ${input.patientName}`, { bold: true });
  if (input.patientDob) drawLine(`Date of Birth: ${input.patientDob}`);
  drawLine(`Shared With: ${input.recipientName}`);
  drawLine(`Generated: ${new Date().toISOString()}`);
  y -= 12;

  for (const form of input.forms) {
    ensureSpace(52);
    drawLine(getFormTitle(form.template_id), { bold: true, size: 15 });
    const answers = Object.entries(form.answers_json || {})
      .filter(([, value]) => value !== null && value !== undefined && value !== '');
    if (!answers.length) {
      drawLine('No answers recorded.', { color: rgb(0.45, 0.49, 0.55) });
    }
    for (const [key, value] of answers) {
      const lines = wrapText(`${answerLabel(key)}: ${printable(value)}`);
      for (const [index, line] of lines.entries()) {
        drawLine(index === 0 ? line : `  ${line}`);
      }
      y -= 2;
    }
    y -= 12;
  }

  for (const currentPage of document.getPages()) {
    currentPage.drawText('Shared securely via Health Vault. Contains protected health information.', {
      x: margin,
      y: 24,
      size: 8,
      font: regular,
      color: rgb(0.55, 0.59, 0.64),
    });
  }
  return document.save();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean).slice(1);

  try {
    if (req.method === 'GET' && pathParts.length >= 1) {
      const shareId = pathParts[0];
      const token = url.searchParams.get('token');

      const { data: shareEvent, error } = await supabase
        .from('share_events')
        .select('*')
        .eq('id', shareId)
        .single();

      if (error || !shareEvent) {
        return new Response(
          JSON.stringify({ error: 'Share not found' }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (shareEvent.is_revoked || shareEvent.status === 'revoked') {
        return new Response(
          JSON.stringify({ error: 'Share revoked' }),
          {
            status: 403,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const now = new Date();
      const expiresAt = shareEvent.expires_at ? new Date(shareEvent.expires_at) : null;
      if (expiresAt && now > expiresAt) {
        return new Response(
          JSON.stringify({ error: 'Share expired' }),
          {
            status: 410,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (token !== shareEvent.share_token) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          {
            status: 403,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (pathParts[1] === 'pdf' || pathParts[1] === 'bundle') {
        const isPdf = pathParts[1] === 'pdf';
        if (isPdf) {
          const { data: sharedForms, error: sharedFormsError } = await supabase
            .from('form_responses')
            .select('id, template_id, answers_json')
            .in('id', shareEvent.form_response_ids || []);
          if (sharedFormsError || !sharedForms?.length) {
            return new Response(JSON.stringify({ error: 'Shared forms are unavailable' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          const { data: ownerProfile } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, date_of_birth')
            .eq('user_id', shareEvent.patient_id)
            .maybeSingle();
          const patientName = shareEvent.recipient?.patientName
            || [ownerProfile?.first_name, ownerProfile?.last_name].filter(Boolean).join(' ')
            || 'Health Vault patient';
          const pdfBytes = await createPdfPacket({
            patientName,
            patientDob: ownerProfile?.date_of_birth,
            recipientName: shareEvent.recipient?.providerName || shareEvent.recipient?.displayName || 'Provider',
            forms: sharedForms,
          });
          return new Response(pdfBytes, {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="health-vault-forms.pdf"',
              'Cache-Control': 'private, no-store, max-age=0',
            },
          });
        }
        const objectPath = `${shareId}/${isPdf ? 'packet.pdf' : 'bundle.json'}`;
        const { data: file, error: downloadError } = await supabase.storage
          .from('shares')
          .download(objectPath);
        if (downloadError || !file) {
          return new Response(JSON.stringify({ error: 'Shared file is unavailable' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(file, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': isPdf ? 'application/pdf' : 'application/fhir+json',
            'Content-Disposition': `attachment; filename="health-vault-${isPdf ? 'forms.pdf' : 'bundle.json'}"`,
            'Cache-Control': 'private, no-store, max-age=0',
          },
        });
      }

      const formResponseIds = shareEvent.form_response_ids || [];
      // form_response_ids are form_responses UUIDs; resolve titles via their template_id.
      let formRows: any[] = [];
      if (formResponseIds.length > 0) {
        const { data: frs } = await supabase
          .from('form_responses')
          .select('id, template_id, signed_at, answers_json')
          .in('id', formResponseIds);
        formRows = frs || [];
      }
      const formRowById = new Map(formRows.map((fr: any) => [fr.id, fr]));
      const forms = formResponseIds.map((formId: string) => {
        const fr = formRowById.get(formId);
        const templateId = fr?.template_id || formId;
        return {
          id: formId,
          title: getFormTitle(templateId),
          version: '2025.01',
          signedAt: fr?.signed_at || shareEvent.sent_at || new Date().toISOString(),
          answers: fr?.answers_json || {},
        };
      });

      // New MCP shares persist the patient name in recipient metadata. Resolve
      // older shares through their owner profile so valid links do not display
      // "Unknown" while keeping contact details out of the recipient payload.
      let patientName = shareEvent.recipient?.patientName || '';
      let patientBirthDate = shareEvent.patient_dob || null;
      if (!patientName) {
        let { data: patientProfile } = await supabase
          .from('patient_profiles')
          .select('user_id, name, birth_date')
          .eq('id', shareEvent.patient_id)
          .maybeSingle();
        if (!patientProfile) {
          const byUser = await supabase
            .from('patient_profiles')
            .select('user_id, name, birth_date')
            .eq('user_id', shareEvent.patient_id)
            .maybeSingle();
          patientProfile = byUser.data;
        }
        patientName = patientProfile?.name || '';
        patientBirthDate = patientBirthDate || patientProfile?.birth_date || null;
        const profileUserId = patientProfile?.user_id || shareEvent.patient_id;
        if (!patientName && profileUserId) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, date_of_birth')
            .eq('user_id', profileUserId)
            .maybeSingle();
          patientName = [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ').trim();
          patientBirthDate = patientBirthDate || userProfile?.date_of_birth || null;
        }
      }

      const payload = {
        id: shareEvent.id,
        status: shareEvent.status,
        patient: {
          id: shareEvent.patient_id,
          name: patientName || 'Health Vault patient',
          birthDate: patientBirthDate,
        },
        recipient: {
          displayName: shareEvent.recipient?.providerName || shareEvent.recipient?.displayName || 'Unknown',
          orgName: shareEvent.recipient?.orgName,
        },
        forms: forms,
        files: {
          pdfUrl: `${supabaseUrl}/functions/v1/share/${shareId}/pdf?token=${encodeURIComponent(token || '')}`,
          bundleUrl: shareEvent.bundle_url
            ? `${supabaseUrl}/functions/v1/share/${shareId}/bundle?token=${encodeURIComponent(token || '')}`
            : undefined,
        },
        expiresAt: shareEvent.expires_at,
        openedAt: shareEvent.opened_at,
        revokedAt: shareEvent.revoked_at,
        healthData: shareEvent.options?.healthShare || null,
      };

      return new Response(
        JSON.stringify(payload),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }

    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'opened') {
      const shareId = pathParts[0];
      const body = await req.json().catch(() => ({}));
      const token = body.token || url.searchParams.get('token');

      // Validate share token before marking as opened (recipient-side action)
      const { data: shareEvent } = await supabase
        .from('share_events')
        .select('id, share_token')
        .eq('id', shareId)
        .maybeSingle();

      if (!shareEvent) {
        return new Response(JSON.stringify({ error: 'Share not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!token || token !== shareEvent.share_token) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('share_events')
        .update({ status: 'opened', opened_at: new Date().toISOString() })
        .eq('id', shareId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'revoke') {
      const shareId = pathParts[0];

      // Auth check: only the patient who created the share can revoke it
      const authHeader = req.headers.get('Authorization');
      const authenticatedSupabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader || '' } }
      });
      const { data: { user } } = await authenticatedSupabase.auth.getUser(
        authHeader?.split(' ')[1] || ''
      );

      if (!user) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify ownership before revoking
      const { data: shareEvent } = await supabase
        .from('share_events')
        .select('id, patient_id')
        .eq('id', shareId)
        .maybeSingle();

      if (!shareEvent) {
        return new Response(JSON.stringify({ error: 'Share not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (shareEvent.patient_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('share_events')
        .update({ status: 'revoked', is_revoked: true, revoked_at: new Date().toISOString() })
        .eq('id', shareId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && pathParts.length === 0) {
      const body = await req.json();
      const { patientId, forms, recipient, note, options } = body;

      if (!patientId || !forms || !Array.isArray(forms) || forms.length === 0) {
        throw new Error('Missing required fields');
      }
      if (!recipient?.email || typeof recipient.email !== 'string') {
        return new Response(JSON.stringify({ error: 'A recipient email is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authHeader = req.headers.get('Authorization');
      const authenticatedSupabase = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader || '' } } },
      );
      const { data: { user } } = await authenticatedSupabase.auth.getUser(
        authHeader?.split(' ')[1] || '',
      );
      if (!user) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (patientId !== user.id) {
        return new Response(JSON.stringify({ error: 'You can only share your own forms' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const formIds = forms.map((f: any) => f.id);

      console.log('Sharing forms:', {
        patientId,
        formIds,
        recipient,
        note,
        options,
      });

      // Fetch patient DOB to store with the share event
      const { data: patientProfile } = await supabase
        .from('user_profiles')
        .select('date_of_birth, first_name, last_name, email, email_verified')
        .eq('user_id', user.id)
        .maybeSingle();
      const patientDob = patientProfile?.date_of_birth || null;
      const patientFullName = patientProfile
        ? `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim()
        : (recipient?.patientName || 'Unknown');

      // Fetch real form_responses data for the forms being shared
      const { data: ownerPatientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!ownerPatientProfile?.id) throw new Error('Complete your patient profile before sharing forms');

      const { data: formResponses, error: formResponsesError } = await supabase
        .from('form_responses')
        .select('id, template_id, answers_json, status, signed_at')
        .in('id', formIds)
        .eq('patient_id', ownerPatientProfile.id);
      if (formResponsesError) throw formResponsesError;
      if (!formResponses || formResponses.length !== formIds.length) {
        return new Response(JSON.stringify({ error: 'One or more selected forms are unavailable' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const shareEventId = crypto.randomUUID();
      const shareToken = crypto.randomUUID();
      const appUrl = Deno.env.get('APP_URL') || req.headers.get('origin') || supabaseUrl;
      const shareUrl = `${appUrl}/share/${shareEventId}?token=${shareToken}`;
      const bundleUrl = `${supabaseUrl}/functions/v1/share/${shareEventId}/bundle?token=${shareToken}`;
      const pdfUrl = `${supabaseUrl}/functions/v1/share/${shareEventId}/pdf?token=${shareToken}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Generate FHIR bundle
      const fhirBundle = {
        resourceType: "Bundle",
        type: "document",
        timestamp: new Date().toISOString(),
        entry: forms.map((form: any) => ({
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: "DocumentReference",
            id: form.id,
            status: "current",
            docStatus: "final",
            type: {
              coding: [{
                system: "http://loinc.org",
                code: "34133-9",
                display: "Summary of episode note"
              }]
            },
            subject: {
              reference: `Patient/${patientId}`
            },
            date: form.signedAt || new Date().toISOString(),
            description: form.title,
            content: [{
              attachment: {
                contentType: "application/pdf",
                title: form.title
              }
            }]
          }
        }))
      };

      // Upload FHIR bundle
      const bundleBlob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
      const { error: bundleUploadError } = await supabase.storage
        .from('shares')
        .upload(`${shareEventId}/bundle.json`, bundleBlob, {
          contentType: 'application/json',
          upsert: true
        });

      if (bundleUploadError) {
        console.error('Error uploading bundle:', bundleUploadError);
      }

      // Generate a real PDF packet from the authorized form responses.
      const pdfBytes = await createPdfPacket({
        patientName: patientFullName,
        patientDob,
        recipientName: recipient?.providerName || recipient?.displayName || 'Unknown',
        forms: formResponses,
      });
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const { error: pdfUploadError } = await supabase.storage
        .from('shares')
        .upload(`${shareEventId}/packet.pdf`, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (pdfUploadError) {
        console.error('Error uploading PDF:', pdfUploadError);
      }

      const { error: insertError } = await supabase
        .from('share_events')
        .insert({
          id: shareEventId,
          patient_id: user.id,
          form_response_ids: formIds,
          method: recipient.method,
          recipient: { ...recipient, patientName: patientFullName },
          bundle_url: bundleUrl,
          pdf_url: pdfUrl,
          status: 'sent',
          sent_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          note: note || null,
          options: options,
          audit: [],
          share_token: shareToken,
        });

      if (insertError) throw insertError;

      const emailHtml = generateEmailHtml({
        recipientName: recipient.providerName || 'Provider',
        patientName: recipient.patientName || 'Patient',
        shareUrl,
        expiryDate: expiresAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });

      let emailSent = false;
      let emailError = null;
      let patientReceiptSent = false;
      let patientReceiptError = null;

      try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!resendApiKey) {
          emailError = 'RESEND_API_KEY not configured';
          console.error(emailError);
        } else {
          const emailPayload = {
            from: 'Health Vault <team@healthvault.me>',
            to: [recipient.email],
            subject: `${recipient.patientName || 'A patient'} shared health forms with you via Health Vault`,
            html: emailHtml,
          };

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
          });

          const responseText = await emailResponse.text();

          if (!emailResponse.ok) {
            emailError = `Failed to send email: ${emailResponse.status} ${responseText}`;
            console.error(emailError);
          } else {
            emailSent = true;
            console.log('Email sent successfully:', responseText);
          }

          const wantsPatientReceipt = Boolean(options?.cc?.me || options?.cc?.patient);
          if (wantsPatientReceipt) {
            if (!patientProfile?.email_verified || !patientProfile?.email) {
              patientReceiptError = 'The patient email is not verified';
            } else {
              const receiptResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'Health Vault <team@healthvault.me>',
                  to: [patientProfile.email],
                  subject: 'Your Health Vault secure-share receipt',
                  html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17223b"><h1 style="font-size:24px">Health Vault</h1><p>Your secure form link for ${recipient.providerName || recipient.displayName || 'your recipient'} was created and sent.</p><p>You can revoke it from Health Vault.</p></div>`,
                }),
              });
              const receiptText = await receiptResponse.text();
              if (receiptResponse.ok) {
                patientReceiptSent = true;
                console.log('Patient receipt sent successfully:', receiptText);
              } else {
                patientReceiptError = `Failed to send patient receipt: ${receiptResponse.status} ${receiptText}`;
                console.error(patientReceiptError);
              }
            }
          }
        }
      } catch (err: any) {
        emailError = err.message || 'Unknown error sending email';
        console.error('Exception sending email:', err);
      }

      const deliveredAt = new Date().toISOString();
      const { error: deliveryUpdateError } = await supabase
        .from('share_events')
        .update({
          status: emailSent ? 'delivered' : 'sent',
          recipient: {
            ...recipient,
            patientName: patientFullName,
            emailDelivery: emailSent ? 'accepted' : 'failed',
            patientReceipt: patientReceiptSent ? 'accepted' : 'failed',
          },
          audit: [
            { event: 'created', at: deliveredAt, actor: 'patient' },
            {
              event: emailSent ? 'email_accepted' : 'email_delivery_failed',
              at: deliveredAt,
              actor: 'system',
              ...(emailError ? { error: emailError } : {}),
            },
            {
              event: patientReceiptSent ? 'patient_receipt_accepted' : 'patient_receipt_failed',
              at: deliveredAt,
              actor: 'system',
              ...(patientReceiptError ? { error: patientReceiptError } : {}),
            },
          ],
        })
        .eq('id', shareEventId)
        .eq('patient_id', user.id);

      const response = {
        id: shareEventId,
        status: emailSent ? 'delivered' : 'sent',
        bundleUrl: bundleUrl,
        pdfUrl: pdfUrl,
        shareUrl,
        message: 'Forms shared successfully',
        emailSent,
        emailError,
        patientReceiptSent,
        patientReceiptError,
        deliveryReceiptSaved: !deliveryUpdateError,
      };

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function generateEmailHtml(params: {
  recipientName: string;
  patientName: string;
  shareUrl: string;
  expiryDate: string;
}): string {
  const { recipientName, patientName, shareUrl, expiryDate } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Forms Shared</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f4; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 32px; text-align: center; background-color: #ffffff;">
              <img src="https://sgwekxjlvadvdosyudgj.supabase.co/storage/v1/object/public/profile-images/hv_logo-light.png" alt="Health Vault Logo" style="width: 80px; height: 80px; margin: 0 auto 16px;" />
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1c1917;">Health Forms Shared</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; background-color: #ffffff;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #44403c;">Hello ${recipientName},</p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #44403c;"><strong>${patientName}</strong> has securely shared their health forms with you through Health Vault.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${shareUrl}" style="display: inline-block; padding: 14px 32px; background-color: #292524; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">View Shared Forms</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 21px; color: #57534e;">This secure link will expire on <strong>${expiryDate}</strong>.</p>

              <div style="margin: 24px 0; padding: 16px; background-color: #fafaf9; border-radius: 6px; border-left: 3px solid: #6366f1;">
                <p style="margin: 0; font-size: 13px; line-height: 19px; color: #57534e;"><strong>Security Note:</strong> This link is intended only for you. Do not forward this email or share the link with others.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #fafaf9; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0; font-size: 13px; line-height: 19px; color: #78716c; text-align: center;">
                © ${new Date().getFullYear()} Health Vault. All rights reserved.<br>
                This email was sent to you because a patient shared their health information with you.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

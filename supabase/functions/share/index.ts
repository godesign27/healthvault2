import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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

      const formResponseIds = shareEvent.form_response_ids || [];
      const forms = formResponseIds.map((formId: string) => ({
        id: formId,
        title: getFormTitle(formId),
        version: '2025.01',
        signedAt: shareEvent.sent_at || new Date().toISOString(),
      }));

      const payload = {
        id: shareEvent.id,
        status: shareEvent.status,
        patient: {
          id: shareEvent.patient_id,
          name: shareEvent.recipient?.patientName || 'Unknown',
          birthDate: '1985-06-22',
        },
        recipient: {
          displayName: shareEvent.recipient?.providerName || shareEvent.recipient?.displayName || 'Unknown',
          orgName: shareEvent.recipient?.orgName,
        },
        forms: forms,
        files: {
          pdfUrl: shareEvent.pdf_url,
          bundleUrl: shareEvent.bundle_url,
        },
        expiresAt: shareEvent.expires_at,
        openedAt: shareEvent.opened_at,
        revokedAt: shareEvent.revoked_at,
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

      const { error } = await supabase
        .from('share_events')
        .update({
          status: 'opened',
          opened_at: new Date().toISOString(),
        })
        .eq('id', shareId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'revoke') {
      const shareId = pathParts[0];

      const { error } = await supabase
        .from('share_events')
        .update({
          status: 'revoked',
          is_revoked: true,
          revoked_at: new Date().toISOString(),
        })
        .eq('id', shareId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (req.method === 'POST' && pathParts.length === 0) {
      const body = await req.json();
      const { patientId, forms, recipient, note, options } = body;

      if (!patientId || !forms || !Array.isArray(forms) || forms.length === 0) {
        throw new Error('Missing required fields');
      }

      const formIds = forms.map((f: any) => f.id);

      console.log('Sharing forms:', {
        patientId,
        formIds,
        recipient,
        note,
        options,
      });

      const shareEventId = crypto.randomUUID();
      const shareToken = crypto.randomUUID();
      const appUrl = Deno.env.get('APP_URL') || req.headers.get('origin') || supabaseUrl;
      const shareUrl = `${appUrl}/share/${shareEventId}?token=${shareToken}`;
      const bundleUrl = `${supabaseUrl}/storage/v1/object/public/shares/${shareEventId}/bundle.json`;
      const pdfUrl = `${supabaseUrl}/storage/v1/object/public/shares/${shareEventId}/packet.pdf`;

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

      // Generate PDF content
      const pdfContent = `Medical Forms Packet
Patient: ${recipient.patientName || 'Unknown'}
Generated: ${new Date().toLocaleString()}

Included Forms:
${forms.map((f: any) => `- ${f.title} (v${f.version})`).join('\n')}

This is a placeholder PDF. In production, this would contain the actual form data.`;

      const pdfBlob = new Blob([pdfContent], { type: 'text/plain' });
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
          patient_id: patientId,
          form_response_ids: formIds,
          method: recipient.method,
          recipient: recipient,
          bundle_url: bundleUrl,
          pdf_url: pdfUrl,
          status: 'delivered',
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

      try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!resendApiKey) {
          emailError = 'RESEND_API_KEY not configured';
          console.error(emailError);
          console.log('Share URL would be:', shareUrl);
        } else {
          const emailPayload = {
            from: 'Health Vault <team@healthvault27.com>',
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
        }
      } catch (err: any) {
        emailError = err.message || 'Unknown error sending email';
        console.error('Exception sending email:', err);
      }

      const response = {
        id: shareEventId,
        status: 'delivered',
        bundleUrl: bundleUrl,
        pdfUrl: pdfUrl,
        shareUrl,
        message: 'Forms shared successfully',
        emailSent,
        emailError,
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

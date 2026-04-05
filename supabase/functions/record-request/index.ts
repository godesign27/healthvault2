import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean).slice(1);

  try {
    if (req.method === "POST" && pathParts.length === 0) {
      return await handleCreateRequest(req, supabase, supabaseUrl);
    }

    if (req.method === "GET" && pathParts.length === 1) {
      return await handleGetRequest(pathParts[0], url, supabase);
    }

    if (
      req.method === "POST" &&
      pathParts.length === 2 &&
      pathParts[1] === "submit"
    ) {
      return await handleSubmitRecords(pathParts[0], req, supabase);
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (error: any) {
    console.error("Error:", error);
    return jsonResponse({ error: error.message || "Internal server error" }, 500);
  }
});

async function handleCreateRequest(
  req: Request,
  supabase: any,
  supabaseUrl: string
) {
  const body = await req.json();
  const {
    userId,
    providerName,
    providerEmail,
    doctorName,
    recordTypes,
    message,
    patientName,
    urgency,
    notes,
    dateRangeStart,
    dateRangeEnd,
  } = body;

  if (!providerName || !providerEmail || !recordTypes?.length) {
    return jsonResponse(
      { error: "providerName, providerEmail, and recordTypes are required" },
      400
    );
  }

  const resolvedUserId = userId || "00000000-0000-0000-0000-000000000000";

  let displayName = patientName || "";
  if (!displayName) {
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, display_name")
        .eq("user_id", resolvedUserId)
        .maybeSingle();
      if (profile?.display_name || profile?.full_name) {
        displayName = profile.display_name || profile.full_name;
      }
    } catch {}
  }
  if (!displayName) {
    try {
      const { data: patient } = await supabase
        .from("patient_profiles")
        .select("first_name, last_name")
        .eq("user_id", resolvedUserId)
        .maybeSingle();
      if (patient?.first_name) {
        displayName = `${patient.first_name}${patient.last_name ? " " + patient.last_name : ""}`;
      }
    } catch {}
  }
  if (!displayName) {
    displayName = "Health Vault Patient";
  }

  const secureToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { data: request, error: insertError } = await supabase
    .from("health_record_requests")
    .insert({
      user_id: resolvedUserId,
      provider_name: providerName,
      provider_email: providerEmail,
      doctor_name: doctorName || null,
      record_types: recordTypes,
      message: message || null,
      patient_name: displayName,
      secure_token: secureToken,
      urgency: urgency || "routine",
      status: "sent",
      notes: notes || null,
      date_range_start: dateRangeStart || null,
      date_range_end: dateRangeEnd || null,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (insertError) throw insertError;

  const appUrl =
    Deno.env.get("APP_URL") ||
    req.headers.get("origin") ||
    supabaseUrl;
  const submitUrl = `${appUrl}/record-request/${request.id}?token=${secureToken}`;

  let emailSent = false;
  let emailError = null;

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      emailError = "RESEND_API_KEY not configured";
      console.error(emailError);
    } else {
      const kindLabels: Record<string, string> = {
        LAB: "Lab Results",
        IMAGING: "Imaging & Scans",
        PATHOLOGY: "Pathology Reports",
        SPECIALIST_REPORT: "Specialist Reports",
        OTHER: "Other Records",
      };
      const typeLabels = (recordTypes as string[])
        .map((t: string) => kindLabels[t] || t)
        .join(", ");

      const emailHtml = generateRequestEmailHtml({
        providerName: doctorName || providerName,
        patientName: displayName,
        recordTypeLabels: typeLabels,
        message: message || "",
        urgency: urgency || "routine",
        submitUrl,
        expiryDate: expiresAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });

      const fromField = "Health Vault <noreply@healthvault27.com>";

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromField,
          to: [providerEmail],
          subject: `${displayName} is requesting health records via Health Vault`,
          html: emailHtml,
        }),
      });

      const responseText = await emailResponse.text();
      console.log("Resend response:", emailResponse.status, responseText);

      if (!emailResponse.ok) {
        emailError = `Email send failed: ${emailResponse.status} ${responseText}`;
        console.error(emailError);
      } else {
        emailSent = true;
      }
    }
  } catch (err: any) {
    emailError = err.message || "Unknown email error";
    console.error("Email exception:", err);
  }

  return jsonResponse({
    id: request.id,
    status: request.status,
    emailSent,
    emailError,
    submitUrl,
  });
}

async function handleGetRequest(
  requestId: string,
  url: URL,
  supabase: any
) {
  const token = url.searchParams.get("token");
  if (!token) {
    return jsonResponse({ error: "Token required" }, 401);
  }

  const { data: request, error } = await supabase
    .from("health_record_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (error || !request) {
    return jsonResponse({ error: "Request not found" }, 404);
  }

  if (request.secure_token !== token) {
    return jsonResponse({ error: "Invalid token" }, 403);
  }

  const now = new Date();
  if (request.expires_at && now > new Date(request.expires_at)) {
    return jsonResponse({ error: "This request has expired" }, 410);
  }

  if (!request.opened_at) {
    await supabase
      .from("health_record_requests")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", requestId);
  }

  const { data: files } = await supabase
    .from("record_request_files")
    .select("*")
    .eq("request_id", requestId);

  return jsonResponse({
    id: request.id,
    patientName: request.patient_name,
    providerName: request.provider_name,
    doctorName: request.doctor_name,
    recordTypes: request.record_types,
    message: request.message,
    urgency: request.urgency,
    status: request.status,
    expiresAt: request.expires_at,
    submittedAt: request.submitted_at,
    files: files || [],
  });
}

async function handleSubmitRecords(
  requestId: string,
  req: Request,
  supabase: any
) {
  const body = await req.json();
  const { token, files, providerNotes } = body;

  if (!token) {
    return jsonResponse({ error: "Token required" }, 401);
  }

  const { data: request, error } = await supabase
    .from("health_record_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (error || !request) {
    return jsonResponse({ error: "Request not found" }, 404);
  }

  if (request.secure_token !== token) {
    return jsonResponse({ error: "Invalid token" }, 403);
  }

  if (request.expires_at && new Date() > new Date(request.expires_at)) {
    return jsonResponse({ error: "This request has expired" }, 410);
  }

  const fileRecords = [];
  if (files && Array.isArray(files)) {
    for (const file of files) {
      const storagePath = `${requestId}/${crypto.randomUUID()}-${file.fileName}`;

      const fileBytes = Uint8Array.from(atob(file.base64), (c) =>
        c.charCodeAt(0)
      );
      const { error: uploadError } = await supabase.storage
        .from("record-request-files")
        .upload(storagePath, fileBytes, {
          contentType: file.contentType || "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("File upload error:", uploadError);
        continue;
      }

      const { data: fileRow, error: fileInsertError } = await supabase
        .from("record_request_files")
        .insert({
          request_id: requestId,
          file_name: file.fileName,
          file_type: file.fileType || "pdf",
          file_size_bytes: fileBytes.length,
          storage_path: storagePath,
          record_kind: file.recordKind || "other",
          provider_notes: file.notes || providerNotes || null,
        })
        .select()
        .single();

      if (!fileInsertError && fileRow) {
        fileRecords.push(fileRow);
      }
    }
  }

  const kindToRecordKind: Record<string, string> = {
    LAB: "lab",
    IMAGING: "imaging",
    PATHOLOGY: "pathology",
    SPECIALIST_REPORT: "specialist_report",
    OTHER: "other",
  };

  for (const file of fileRecords) {
    await supabase.from("health_records").insert({
      user_id: request.user_id,
      kind: kindToRecordKind[file.record_kind] || file.record_kind,
      title: file.file_name.replace(/\.[^/.]+$/, ""),
      provider_name: request.doctor_name || request.provider_name,
      source: "shared",
      file_type: file.file_type,
      file_size_bytes: file.file_size_bytes,
      ai_summary: file.provider_notes || null,
      tags: [`from-request:${requestId}`],
      received_at: new Date().toISOString(),
    });
  }

  await supabase
    .from("health_record_requests")
    .update({
      status: "received",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  return jsonResponse({
    success: true,
    filesReceived: fileRecords.length,
    message: "Records submitted successfully",
  });
}

function generateRequestEmailHtml(params: {
  providerName: string;
  patientName: string;
  recordTypeLabels: string;
  message: string;
  urgency: string;
  submitUrl: string;
  expiryDate: string;
}): string {
  const {
    providerName,
    patientName,
    recordTypeLabels,
    message,
    urgency,
    submitUrl,
    expiryDate,
  } = params;

  const urgencyBadge =
    urgency === "urgent"
      ? '<span style="display:inline-block;padding:4px 12px;background-color:#fef3c7;color:#92400e;border-radius:4px;font-size:12px;font-weight:600;">URGENT</span>'
      : '<span style="display:inline-block;padding:4px 12px;background-color:#ecfdf5;color:#065f46;border-radius:4px;font-size:12px;font-weight:600;">Routine</span>';

  const messageBlock = message
    ? `<div style="margin:24px 0;padding:16px;background-color:#fafaf9;border-radius:6px;border-left:3px solid #a8a29e;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#78716c;text-transform:uppercase;letter-spacing:0.5px;">Message from patient</p>
        <p style="margin:0;font-size:14px;line-height:21px;color:#44403c;">${message}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Records Request</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:32px;text-align:center;background-color:#ffffff;">
              <img src="https://sgwekxjlvadvdosyudgj.supabase.co/storage/v1/object/public/profile-images/hv_logo-light.png" alt="Health Vault" style="width:80px;height:80px;margin:0 auto 16px;" />
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1c1917;">Health Records Request</h1>
              <div>${urgencyBadge}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;background-color:#ffffff;">
              <p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#44403c;">Hello ${providerName},</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#44403c;"><strong>${patientName}</strong> is requesting health records from your office through Health Vault.</p>

              <div style="margin:20px 0;padding:16px;background-color:#fafaf9;border-radius:6px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#78716c;text-transform:uppercase;letter-spacing:0.5px;">Requested Records</p>
                <p style="margin:0;font-size:15px;font-weight:500;color:#1c1917;">${recordTypeLabels}</p>
              </div>

              ${messageBlock}

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${submitUrl}" style="display:inline-block;padding:14px 36px;background-color:#292524;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;font-size:16px;">Upload Records</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:14px;line-height:21px;color:#57534e;">This secure link will expire on <strong>${expiryDate}</strong>.</p>

              <div style="margin:24px 0;padding:16px;background-color:#fafaf9;border-radius:6px;border-left:3px solid #a8a29e;">
                <p style="margin:0;font-size:13px;line-height:19px;color:#57534e;"><strong>Security Note:</strong> This link is intended only for the provider. Do not forward this email or share the link.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#fafaf9;border-top:1px solid #e7e5e4;">
              <p style="margin:0;font-size:13px;line-height:19px;color:#78716c;text-align:center;">
                &copy; ${new Date().getFullYear()} Health Vault. All rights reserved.<br>
                This email was sent because a patient requested health records from your practice.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

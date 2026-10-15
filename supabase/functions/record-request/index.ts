import { requestFileFingerprint } from "./fingerprint.ts";
import { readJsonObject, RequestBodyError, UPLOAD_BODY_LIMIT, CONTROL_BODY_LIMIT } from "../inbound-records/body.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

import { ImportAccessError, requireActiveAccount, requireVerifiedUser } from "../inbound-records/access.ts";
import { persistImport } from "../inbound-records/persist.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });
}

interface PatientIdentity {
  fullName: string;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  healthVaultId: string | null;
  address: string | null;
}

const KIND_LABELS: Record<string, string> = {
  LAB: "Lab Results",
  IMAGING: "Imaging & Scans",
  PATHOLOGY: "Pathology Reports",
  SPECIALIST_REPORT: "Specialist Reports",
  OTHER: "Other Records",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean).slice(1);

  try {
    if (req.method === "POST" && pathParts.length === 0) {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace(/^Bearer\s+/i, "") || "";
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader || "" } },
      });
      const { data: { user } } = await userClient.auth.getUser(token);

      if (!user) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      await requireActiveAccount(supabase, user.id);
      return await handleCreateRequest(req, supabase, supabaseUrl, user.id);
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

    if (
      req.method === "POST" &&
      pathParts.length === 2 &&
      pathParts[1] === "resend"
    ) {
      return await handleResendRequest(pathParts[0], req, supabase, supabaseUrl);
    }

    if (req.method === "POST" && pathParts.length === 2 && pathParts[1] === "cancel") {
      const userId = await requireVerifiedUser(supabase, req);
      const { data, error } = await supabase.rpc("transition_record_request", {
        p_request_id: pathParts[0], p_user_id: userId, p_action: "cancel",
      });
      if (error) throw error;
      if (data?.state === "not_found") return jsonResponse({ error: "Request not found" }, 404);
      if (data?.state !== "cancelled") return jsonResponse({ error: "This request cannot be cancelled" }, 409);
      return jsonResponse({ id: data.id, status: "cancelled" });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (error: any) {
    if (error instanceof RequestBodyError) return jsonResponse({ error: error.message, code: "request_body_rejected" }, error.status);
    if (error instanceof ImportAccessError) return jsonResponse({ error: error.message }, error.status);
    return jsonResponse(
      { error: "Unable to process this request." },
      500
    );
  }
});

async function fetchPatientIdentity(
  supabase: any,
  userId: string,
  fallbackName: string
): Promise<PatientIdentity> {
  const identity: PatientIdentity = {
    fullName: fallbackName,
    dateOfBirth: null,
    phone: null,
    email: null,
    healthVaultId: null,
    address: null,
  };

  try {
    const { data: up } = await supabase
      .from("user_profiles")
      .select(
        "first_name, last_name, display_name, full_name, date_of_birth, phone, email, address_line1, address_line2, city, state, postal_code"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (up) {
      const name =
        up.display_name ||
        up.full_name ||
        [up.first_name, up.last_name].filter(Boolean).join(" ");
      if (name) identity.fullName = name;
      if (up.date_of_birth) identity.dateOfBirth = up.date_of_birth;
      if (up.phone) identity.phone = up.phone;
      if (up.email) identity.email = up.email;

      const parts = [
        up.address_line1,
        up.address_line2,
        [up.city, up.state].filter(Boolean).join(", "),
        up.postal_code,
      ].filter(Boolean);
      if (parts.length > 0) identity.address = parts.join(", ");
    }
  } catch {}

  try {
    const { data: pp } = await supabase
      .from("patient_profiles")
      .select("name, birth_date, contact_phone, contact_email")
      .eq("user_id", userId)
      .maybeSingle();

    if (pp) {
      if (!identity.fullName || identity.fullName === fallbackName) {
        if (pp.name) identity.fullName = pp.name;
      }
      if (!identity.dateOfBirth && pp.birth_date)
        identity.dateOfBirth = pp.birth_date;
      if (!identity.phone && pp.contact_phone)
        identity.phone = pp.contact_phone;
      if (!identity.email && pp.contact_email)
        identity.email = pp.contact_email;
    }
  } catch {}

  const shortId = userId.replace(/-/g, "").slice(0, 5).toUpperCase();
  const numericSuffix = parseInt(shortId, 16) % 100000;
  identity.healthVaultId = `HV-${String(numericSuffix).padStart(5, "0")}`;

  return identity;
}

function formatDob(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const d = new Date(raw + "T00:00:00");
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

function formatRequestDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

async function handleCreateRequest(
  req: Request,
  supabase: any,
  supabaseUrl: string,
  authenticatedUserId: string
) {
  const body = await readJsonObject(req, CONTROL_BODY_LIMIT);
  const {
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

  const resolvedUserId = authenticatedUserId;

  const patient = await fetchPatientIdentity(
    supabase,
    resolvedUserId,
    patientName || "Health Vault Patient"
  );

  const secureToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 10);

  const { data: request, error: insertError } = await supabase
    .from("health_record_requests")
    .insert({
      user_id: resolvedUserId,
      provider_name: providerName,
      provider_email: providerEmail,
      doctor_name: doctorName || null,
      record_types: recordTypes,
      message: message || null,
      patient_name: patient.fullName,
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
    Deno.env.get("APP_URL") || req.headers.get("origin") || supabaseUrl;
  const submitUrl = `${appUrl}/record-request/${request.id}?token=${secureToken}`;

  let emailSent = false;
  let emailError = null;

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      emailError = "RESEND_API_KEY not configured";
      console.error(emailError);
    } else {
      const typeLabels = (recordTypes as string[])
        .map((t: string) => KIND_LABELS[t] || t)
        .join(", ");

      const emailHtml = generateRequestEmailHtml({
        providerName: doctorName || providerName,
        patient,
        recordTypeLabels: typeLabels,
        recordTypes: recordTypes as string[],
        message: message || "",
        notes: notes || "",
        urgency: urgency || "routine",
        submitUrl,
        expiryDate: expiresAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        requestDate: formatRequestDate(request.created_at),
        dateRangeStart: dateRangeStart || null,
        dateRangeEnd: dateRangeEnd || null,
      });

      const fromField = "Health Vault <noreply@healthvault.me>";

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromField,
          to: [providerEmail],
          subject: `${patient.fullName} is requesting health records via Health Vault`,
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

async function handleResendRequest(
  requestId: string,
  req: Request,
  supabase: any,
  supabaseUrl: string
) {
  const userId = await requireVerifiedUser(supabase, req);

  const { data: request, error } = await supabase
    .from("health_record_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (error || !request) {
    return jsonResponse({ error: "Request not found" }, 404);
  }

  if (request.user_id !== userId) return jsonResponse({ error: "Request not found" }, 404);

  const newToken = crypto.randomUUID();
  // Serialize the state change with cancellation and upload finalization.
  const { data: transition, error: updateError } = await supabase.rpc("transition_record_request", {
    p_request_id: requestId, p_user_id: userId, p_action: "resend", p_token: newToken,
  });
  if (updateError) throw updateError;
  if (transition?.state === "not_found") return jsonResponse({ error: "Request not found" }, 404);
  if (transition?.state !== "sent") return jsonResponse({ error: "This request is closed" }, 409);
  const expiresAt = new Date(transition.expiresAt);

  const appUrl =
    Deno.env.get("APP_URL") || req.headers.get("origin") || supabaseUrl;
  const submitUrl = `${appUrl}/record-request/${requestId}?token=${newToken}`;

  let emailSent = false;
  let emailError = null;

  const patient: PatientIdentity = {
    fullName: request.patient_name,
    dateOfBirth: null,
    phone: null,
    email: null,
    healthVaultId: null,
    address: null,
  };

  if (request.user_id) {
    const enriched = await fetchPatientIdentity(supabase, request.user_id, request.patient_name);
    Object.assign(patient, enriched);
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      emailError = "RESEND_API_KEY not configured";
    } else {
      const typeLabels = (request.record_types as string[])
        .map((t: string) => KIND_LABELS[t] || t)
        .join(", ");

      const emailHtml = generateRequestEmailHtml({
        providerName: request.doctor_name || request.provider_name,
        patient,
        recordTypeLabels: typeLabels,
        recordTypes: request.record_types as string[],
        message: request.message || "",
        notes: request.notes || "",
        urgency: request.urgency || "routine",
        submitUrl,
        expiryDate: expiresAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        requestDate: formatRequestDate(new Date().toISOString()),
        dateRangeStart: request.date_range_start || null,
        dateRangeEnd: request.date_range_end || null,
      });

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Health Vault <noreply@healthvault.me>",
          to: [request.provider_email],
          subject: `${patient.fullName} is re-sending a health records request via Health Vault`,
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const responseText = await emailResponse.text();
        emailError = `Email send failed: ${emailResponse.status} ${responseText}`;
      } else {
        emailSent = true;
      }
    }
  } catch (err: any) {
    emailError = err.message || "Unknown email error";
  }

  return jsonResponse({
    id: requestId,
    status: "sent",
    emailSent,
    emailError,
    submitUrl,
  });
}

async function handleGetRequest(requestId: string, url: URL, supabase: any) {
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

  if (request.status === "cancelled") return jsonResponse({ error: "This request is closed" }, 410);

  if (request.secure_token !== token) {
    return jsonResponse({ error: "Invalid token" }, 403);
  }

  const now = new Date();
  if (request.expires_at && now > new Date(request.expires_at)) {
    return jsonResponse({ error: "This request has expired" }, 410);
  }

  await requireActiveAccount(supabase, request.user_id);

  if (!request.opened_at) {
    await supabase
      .from("health_record_requests")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", requestId);
  }

  const { data: files } = await supabase
    .from("record_request_files")
    .select("id,file_name,file_type,file_size_bytes,record_kind,created_at")
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
  const body = await readJsonObject(req, UPLOAD_BODY_LIMIT);
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

  await requireActiveAccount(supabase, request.user_id);
  if (!["pending", "sent", "received"].includes(request.status)) return jsonResponse({ error: "This request is not accepting files." }, 409);
  if (!Array.isArray(files) || files.length === 0 || files.length > 20) {
    return jsonResponse({ error: "Send between 1 and 20 files." }, 400);
  }
  const saved: Array<{ index: number; id: string }> = [];
  const fileErrors: Array<{ index: number; code: string; attemptId?: string }> = [];
  for (const [index, file] of files.entries()) {
    if (!file || typeof file.base64 !== "string" || !file.base64.length || typeof file.fileName !== "string") {
      fileErrors.push({ index, code: "invalid_file" }); continue;
    }
    const kind = typeof file.recordKind === "string" ? file.recordKind.toLowerCase() : "other";
    const result = await persistImport({
      authorize: () => requireActiveAccount(supabase, request.user_id),
      prepare: async (id, _path, input) => {
        const fingerprint = await requestFileFingerprint(input.record, input.bytes!, input.contentType);
        const { data, error } = await supabase.rpc("reserve_request_upload", {
          p_request_id: requestId, p_token: token, p_attempt_id: id, p_fingerprint: fingerprint,
        });
        if (error || !data) throw error ?? new Error("Missing reservation");
        if (data.state === "prepared") return;
        if (data.state === "committed" || data.state === "busy") return data;
        throw new Error("Invalid reservation");
      },
      upload: async (path, bytes, contentType) => {
        const { error } = await supabase.storage.from("record-request-files").upload(path, bytes, { contentType, cacheControl: "0", upsert: false });
        if (error) throw error;
      },
      finalize: async (id, record) => {
        const { data, error } = await supabase.rpc("finalize_request_upload", { p_attempt_id: id, p_token: token, p_record: record });
        if (error || !data) throw error ?? new Error("Missing receipt");
        return data;
      },
      abandon: async (id) => {
        const { data, error } = await supabase.rpc("abandon_inbound_upload", { p_attempt_id: id });
        if (error || !data) throw error ?? new Error("Missing recovery receipt");
        return data;
      },
      remove: async (path) => {
        const { error } = await supabase.storage.from("record-request-files").remove([path]);
        if (error) throw error;
      },
    }, requestId, { kind, title: KIND_LABELS[kind.toUpperCase()] || "Health Record", file_name: file.fileName,
      file_type: file.fileType || "pdf", notes: file.notes || providerNotes || null }, file.base64, file.contentType || "application/pdf");
    if ("saved" in result) saved.push({ index, id: result.saved.id });
    else fileErrors.push({ index, code: result.error, ...(result.attemptId ? { attemptId: result.attemptId } : {}) });
  }
  let complete = false;
  if (!fileErrors.length) {
    const { data, error } = await supabase.rpc("complete_request_upload", {
      p_request_id: requestId, p_token: token, p_attempt_ids: saved.map(file => file.id),
    });
    complete = !error && data === true;
  }
  return jsonResponse({ success: complete, filesReceived: saved.length, filesFailed: fileErrors.length,
    saved, fileErrors, completionPending: !fileErrors.length && !complete,
    message: complete ? "Records submitted successfully" : "Some files or the request status need attention. Review the results before retrying.",
  }, complete ? 200 : saved.length ? 207 : 422);
}

function generateRequestEmailHtml(params: {
  providerName: string;
  patient: PatientIdentity;
  recordTypeLabels: string;
  recordTypes: string[];
  message: string;
  notes: string;
  urgency: string;
  submitUrl: string;
  expiryDate: string;
  requestDate: string;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
}): string {
  const {
    providerName,
    patient,
    recordTypeLabels,
    recordTypes,
    message,
    notes,
    urgency,
    submitUrl,
    expiryDate,
    requestDate,
    dateRangeStart,
    dateRangeEnd,
  } = params;

  const urgencyBadge =
    urgency === "urgent"
      ? '<span style="display:inline-block;padding:4px 12px;background-color:#fef3c7;color:#92400e;border-radius:4px;font-size:12px;font-weight:600;">URGENT</span>'
      : '<span style="display:inline-block;padding:4px 12px;background-color:#ecfdf5;color:#065f46;border-radius:4px;font-size:12px;font-weight:600;">Routine</span>';

  const verificationRows: string[] = [];
  verificationRows.push(verificationRow("Full Name", patient.fullName));
  if (patient.dateOfBirth) {
    verificationRows.push(
      verificationRow("Date of Birth", formatDob(patient.dateOfBirth)!)
    );
  }
  if (patient.phone) {
    verificationRows.push(verificationRow("Phone Number", patient.phone));
  }
  if (patient.email) {
    verificationRows.push(verificationRow("Email Address", patient.email));
  }
  if (patient.healthVaultId) {
    verificationRows.push(
      verificationRow("Health Vault ID", patient.healthVaultId)
    );
  }
  if (patient.address) {
    verificationRows.push(
      verificationRow("Mailing Address", patient.address)
    );
  }

  const verificationBlock = `
    <div style="margin:24px 0;border:1px solid #e7e5e4;border-radius:8px;overflow:hidden;">
      <div style="padding:12px 16px;background-color:#fafaf9;border-bottom:1px solid #e7e5e4;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#57534e;text-transform:uppercase;letter-spacing:0.5px;">Patient Identity Verification</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
        ${verificationRows.join("")}
      </table>
    </div>`;

  const authorizationBlock = `
    <div style="margin:24px 0;padding:16px;background-color:#fafaf9;border-radius:8px;border-left:3px solid #292524;">
      <p style="margin:0;font-size:13px;font-style:italic;line-height:20px;color:#44403c;">
        &ldquo;I am the patient listed above and authorize the release of my health records as requested through Health Vault.&rdquo;
      </p>
    </div>`;

  let dateRangeText = "";
  if (dateRangeStart || dateRangeEnd) {
    const from = dateRangeStart
      ? formatRequestDate(dateRangeStart)
      : "Any date";
    const to = dateRangeEnd ? formatRequestDate(dateRangeEnd) : "Present";
    dateRangeText = `<p style="margin:8px 0 0;font-size:13px;color:#57534e;">Date Range: ${from} &ndash; ${to}</p>`;
  }

  const notesFromPatient = notes || message;
  const messageBlock = notesFromPatient
    ? `<div style="margin:24px 0;padding:16px;background-color:#fafaf9;border-radius:8px;border-left:3px solid #a8a29e;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#78716c;text-transform:uppercase;letter-spacing:0.5px;">Message from Patient</p>
        <p style="margin:0;font-size:14px;line-height:21px;color:#44403c;">${notesFromPatient}</p>
      </div>`
    : "";

  const digitalConfirmation = `
    <div style="margin:24px 0;padding:16px;background-color:#fafaf9;border-radius:8px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;">
            <span style="font-size:12px;color:#78716c;">Digitally confirmed by:</span>
            <span style="font-size:13px;font-weight:600;color:#1c1917;margin-left:8px;">${patient.fullName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;">
            <span style="font-size:12px;color:#78716c;">Date:</span>
            <span style="font-size:13px;font-weight:600;color:#1c1917;margin-left:8px;">${requestDate}</span>
          </td>
        </tr>
      </table>
    </div>`;

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

          <!-- Header -->
          <tr>
            <td style="padding:32px;text-align:center;background-color:#ffffff;">
              <div style="margin:0 auto 16px;text-align:center;">
                <span style="display:inline-block;padding:3px 10px;background-color:#fef3c7;color:#92400e;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Beta</span>
              </div>
              <img src="https://sgwekxjlvadvdosyudgj.supabase.co/storage/v1/object/public/profile-images/hv_logo-light.png" alt="Health Vault" style="width:80px;height:80px;margin:0 auto 16px;" />
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1c1917;">Health Records Request</h1>
              <div>${urgencyBadge}</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 32px 32px;background-color:#ffffff;">

              <!-- Greeting & Intro -->
              <p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#44403c;">Hello ${providerName},</p>
              <p style="margin:0 0 8px;font-size:16px;line-height:24px;color:#44403c;"><strong>${patient.fullName}</strong> is requesting their health records from your office through their authenticated Health Vault account.</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#57534e;">The patient listed below has authorized release of the requested records and provided identifying information to help your staff verify the request.</p>

              <!-- Patient Identity Verification -->
              ${verificationBlock}

              <!-- Authorization Statement -->
              ${authorizationBlock}

              <!-- Requested Records -->
              <div style="margin:24px 0;padding:16px;background-color:#fafaf9;border-radius:8px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#78716c;text-transform:uppercase;letter-spacing:0.5px;">Requested Records</p>
                <p style="margin:0;font-size:15px;font-weight:500;color:#1c1917;">${recordTypeLabels}</p>
                ${dateRangeText}
              </div>

              <!-- Message From Patient -->
              ${messageBlock}

              <!-- Digital Confirmation -->
              ${digitalConfirmation}

              <!-- CTA -->
              <p style="margin:0 0 16px;font-size:14px;line-height:21px;color:#57534e;text-align:center;">Please use the secure link below to upload the requested records to Health Vault.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td align="center">
                    <a href="${submitUrl}" style="display:inline-block;padding:14px 36px;background-color:#292524;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;font-size:16px;">Upload Records</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#78716c;text-align:center;">If your office cannot use the upload link, please contact the patient directly using the information above.</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:21px;color:#57534e;text-align:center;">This secure link will expire on <strong>${expiryDate}</strong>.</p>

              <!-- Security Note -->
              <div style="margin:0;padding:16px;background-color:#fafaf9;border-radius:8px;border-left:3px solid #a8a29e;">
                <p style="margin:0;font-size:13px;line-height:19px;color:#57534e;"><strong>Security Note:</strong> This secure link is intended only for the provider receiving this request. Do not forward or share this link.</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
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

function verificationRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f5f5f4;vertical-align:top;width:140px;">
        <span style="font-size:12px;font-weight:600;color:#78716c;">${label}</span>
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #f5f5f4;vertical-align:top;">
        <span style="font-size:14px;color:#1c1917;">${value}</span>
      </td>
    </tr>`;
}

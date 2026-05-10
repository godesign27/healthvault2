import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

interface WelcomeEmailPayload {
  email: string;
  firstName?: string;
}

function buildEmailHtml(firstName: string, email: string, appUrl: string): string {
  const displayName = firstName || "there";
  const dashboardUrl = `${appUrl}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Health Vault</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f5f4;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background-color:#1c1917;border-radius:12px;padding:10px 14px;">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding-right:8px;">
                          <div style="width:28px;height:28px;background-color:#0ea5e9;border-radius:6px;display:inline-block;"></div>
                        </td>
                        <td>
                          <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-0.3px;">Health Vault</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">

              <!-- Hero Banner -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);padding:48px 40px 40px;">
                    <p style="margin:0 0 12px;color:#7dd3fc;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Welcome to Health Vault</p>
                    <h1 style="margin:0 0 16px;color:#ffffff;font-size:28px;font-weight:700;line-height:1.3;letter-spacing:-0.5px;">
                      Congratulations, ${displayName}!
                    </h1>
                    <p style="margin:0;color:#94a3b8;font-size:15px;line-height:1.6;">
                      Your personal health vault is ready. You now have a secure, intelligent home for all your health information.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Body Content -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:36px 40px;">

                    <!-- Intro -->
                    <p style="margin:0 0 28px;color:#44403c;font-size:15px;line-height:1.7;">
                      You've taken a meaningful step toward better health management. Health Vault gives you one secure place to store, understand, and act on all your medical information — powered by AI.
                    </p>

                    <!-- Benefits -->
                    <p style="margin:0 0 16px;color:#1c1917;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">What you can do</p>

                    <!-- Benefit 1 -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:12px;">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width:32px;height:32px;background-color:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                            <span style="font-size:16px;">📋</span>
                          </div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;color:#1c1917;font-size:14px;font-weight:600;">Centralize Your Health Records</p>
                          <p style="margin:0;color:#78716c;font-size:13px;line-height:1.5;">Upload, connect, and organize all your medical documents in one secure place.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Benefit 2 -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:12px;">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width:32px;height:32px;background-color:#f0fdf4;border-radius:8px;">
                            <span style="font-size:16px;">🤖</span>
                          </div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;color:#1c1917;font-size:14px;font-weight:600;">AI Health Assistant</p>
                          <p style="margin:0;color:#78716c;font-size:13px;line-height:1.5;">Ask questions about your labs, medications, and health history in plain language.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Benefit 3 -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:12px;">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width:32px;height:32px;background-color:#fff7ed;border-radius:8px;">
                            <span style="font-size:16px;">🛡️</span>
                          </div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;color:#1c1917;font-size:14px;font-weight:600;">Insurance & Benefits Tracking</p>
                          <p style="margin:0;color:#78716c;font-size:13px;line-height:1.5;">Connect your insurance, track coverage, and understand your benefits at a glance.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Benefit 4 -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width:32px;height:32px;background-color:#fdf4ff;border-radius:8px;">
                            <span style="font-size:16px;">👥</span>
                          </div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;color:#1c1917;font-size:14px;font-weight:600;">Care Team Network</p>
                          <p style="margin:0;color:#78716c;font-size:13px;line-height:1.5;">Manage your providers, specialists, and pharmacies all in one organized network.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td align="center">
                          <a href="${dashboardUrl}"
                            style="display:inline-block;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:-0.1px;">
                            Open My Health Vault →
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background-color:#f5f5f4;"></div>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:24px 40px 32px;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;width:100%;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;color:#1c1917;font-size:13px;font-weight:600;">🔒 Your privacy is our priority</p>
                          <p style="margin:0;color:#78716c;font-size:12px;line-height:1.6;">
                            Your health data is encrypted, HIPAA-compliant, and only accessible by you. We never share or sell your personal health information.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;" align="center">
              <p style="margin:0 0 6px;color:#a8a29e;font-size:12px;">
                This email was sent to ${email}
              </p>
              <p style="margin:0;color:#a8a29e;font-size:12px;">
                &copy; ${new Date().getFullYear()} Health Vault. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, firstName }: WelcomeEmailPayload = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Health Vault <onboarding@resend.dev>";
    const appUrl = Deno.env.get("APP_URL") || "https://healthvault.app";

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = buildEmailHtml(firstName || "", email, appUrl);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Welcome to Health Vault — Your health, organized.",
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

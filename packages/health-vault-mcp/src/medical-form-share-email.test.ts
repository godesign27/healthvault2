import assert from "node:assert/strict";
import test from "node:test";

import { buildMedicalFormShareEmail, sendMedicalFormShareEmail } from "./medical-form-share-email.ts";
import { sendMedicalFormShareEmail as sendEdgeEmail } from "../../../supabase/functions/health-vault-mcp/medical-form-share-email.ts";

for (const sender of [sendMedicalFormShareEmail, sendEdgeEmail]) {
  for (const outcome of ["accepted", "rejected", "timeout"] as const) {
    test(`${sender === sendEdgeEmail ? "edge" : "package"} patient receipt accurately describes ${outcome} recipient delivery`, async () => {
      const messages: Array<{ html: string; to: string[] }> = [];
      const result = await sender({
        apiKey: "test-only", from: "test@example.com",
        recipientEmail: "recipient@example.com", patientEmail: "patient@example.com",
        sendPatientCopy: true, recipientName: "Test <Recipient>", patientName: "Test Patient",
        shareUrl: "https://example.com/share/test?token=test", expiresAt: "2026-09-20T12:00:00Z",
        fetcher: async (_url, init) => {
          messages.push(JSON.parse(String(init?.body)));
          if (messages.length === 1) {
            if (outcome === "timeout") throw new Error("Timed out after request");
            if (outcome === "rejected") return new Response("Rejected", { status: 422 });
          }
          return new Response(JSON.stringify({ id: "mock-message" }), { status: 200 });
        },
      });
      assert.equal(messages.length, 2);
      assert.equal(result.recipient.sent, outcome === "accepted");
      assert.equal(result.patientCopy?.sent, true);
      const receipt = messages[1].html;
      assert.match(receipt, /Test &lt;Recipient&gt;/);
      assert.doesNotMatch(receipt, /created and sent|token=test/);
      if (outcome === "accepted") {
        assert.match(receipt, /email service accepted/);
        assert.match(receipt, /Inbox delivery is not yet confirmed/);
      } else {
        assert.match(receipt, /could not confirm/);
        assert.match(receipt, /before trying again/);
      }
    });
  }
}

test("share email contains a generic secure-link message without form answers", () => {
  const email = buildMedicalFormShareEmail({
    recipientName: "Dr. Amy Rose",
    patientName: "Timothy McGuire",
    shareUrl: "https://healthvault.me/share/share-id?token=secret-token",
    expiresAt: "2026-08-28T15:11:55.952Z",
  });

  assert.equal(email.subject, "A patient shared a secure Health Vault form with you");
  assert.match(email.html, /Dr\. Amy Rose/);
  assert.match(email.html, /secret-token/);
  assert.doesNotMatch(email.html, /Penicillin|Asthma|date of birth/i);
});

test("email sender reports provider delivery and optional patient receipt independently", async () => {
  const recipients: string[] = [];
  const fetcher: typeof fetch = async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    recipients.push(payload.to[0]);
    return new Response(JSON.stringify({ id: `email-${recipients.length}` }), { status: 200 });
  };

  const result = await sendMedicalFormShareEmail({
    apiKey: "test-key",
    from: "Health Vault <team@healthvault.me>",
    recipientEmail: "amy@clinic.example",
    patientEmail: "timothy@example.com",
    sendPatientCopy: true,
    recipientName: "Dr. Amy Rose",
    patientName: "Timothy McGuire",
    shareUrl: "https://healthvault.me/share/share-id?token=secret-token",
    expiresAt: "2026-08-28T15:11:55.952Z",
    fetcher,
  });

  assert.deepEqual(recipients, ["amy@clinic.example", "timothy@example.com"]);
  assert.equal(result.recipient.sent, true);
  assert.equal(result.patientCopy?.sent, true);
});

test("provider email failure is returned instead of being reported as delivered", async () => {
  const result = await sendMedicalFormShareEmail({
    apiKey: "test-key",
    from: "Health Vault <team@healthvault.me>",
    recipientEmail: "amy@clinic.example",
    sendPatientCopy: false,
    recipientName: "Dr. Amy Rose",
    patientName: "Timothy McGuire",
    shareUrl: "https://healthvault.me/share/share-id?token=secret-token",
    expiresAt: "2026-08-28T15:11:55.952Z",
    fetcher: async () => new Response("rejected", { status: 422 }),
  });

  assert.equal(result.recipient.sent, false);
  assert.match(result.recipient.error ?? "", /422/);
});

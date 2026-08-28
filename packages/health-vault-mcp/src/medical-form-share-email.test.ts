import assert from "node:assert/strict";
import test from "node:test";

import { buildMedicalFormShareEmail, sendMedicalFormShareEmail } from "./medical-form-share-email.ts";

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

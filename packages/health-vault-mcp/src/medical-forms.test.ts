import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { MEDICAL_FORM_REVIEW_WIDGET_HTML } from "./medical-form-review-widget.ts";
import { MEDICAL_FORM_SHARE_WIDGET_HTML, MEDICAL_FORM_SHARE_WIDGET_URI } from "./medical-form-share-widget.ts";
import { previewMedicalFormShare } from "./medical-form-sharing.ts";
import { GPT_MEDICAL_FORMS } from "./medical-forms.ts";

test("Patient Registration exposes 13 required safe fields and no restricted fields", () => {
  const registration = GPT_MEDICAL_FORMS.find(({ id }) => id === "patient-reg");
  assert.ok(registration);

  const required = registration.fields.filter(({ required }) => required !== false);
  assert.equal(required.length, 13);

  const keys = new Set(registration.fields.map(({ key }) => key));
  for (const restricted of ["ssn", "social_security_number", "signature", "legal_consent", "payment_information"]) {
    assert.equal(keys.has(restricted), false);
  }
});

test("new-form proposal schema defaults an omitted response timestamp to null", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );

  assert.match(
    edgeIndex,
    /expectedUpdatedAt:\s*z\.string\(\)\.datetime\(\{ offset: true \}\)\.nullable\(\)\.optional\(\)\.default\(null\)/,
  );
});

test("confirmation card reports tool errors and retains the post-save secure-share offer", () => {
  assert.match(MEDICAL_FORM_REVIEW_WIDGET_HTML, /result\?\.isError/);
  assert.match(MEDICAL_FORM_REVIEW_WIDGET_HTML, /prepare a secure share/);
  assert.match(MEDICAL_FORM_REVIEW_WIDGET_HTML, /confirmed:true/);
});

test("secure-share preview widget emits executable JavaScript", () => {
  const script = MEDICAL_FORM_SHARE_WIDGET_HTML.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(() => new Function(script));
});

test("secure-share widget does not rewrite the loading DOM while polling", () => {
  const script = MEDICAL_FORM_SHARE_WIDGET_HTML.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);

  let writes = 0;
  let markup = '<section class="card loading">Loading secure share review…</section>';
  const polls: Array<() => void> = [];
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  const parent = { postMessage() {} };
  const app = {
    dataset: { state: "loading" },
    get innerHTML() { return markup; },
    set innerHTML(value: string) { writes += 1; markup = value; },
  };
  const document = {
    getElementById(id: string) { return id === "app" ? app : null; },
  };
  const window = {
    parent,
    openai: undefined,
    addEventListener(name: string, handler: (event: Record<string, unknown>) => void) {
      listeners.set(name, handler);
    },
  };

  new Function("window", "document", "setInterval", "clearInterval", script)(
    window,
    document,
    (callback: () => void) => { polls.push(callback); return 1; },
    () => {},
  );

  assert.equal(writes, 0);
  polls[0]?.();
  polls[0]?.();
  assert.equal(writes, 0);

  listeners.get("message")?.({
    source: parent,
    data: {
      jsonrpc: "2.0",
      method: "ui/notifications/tool-result",
      params: {
        structuredContent: {
          share: {
            templateId: "patient-reg",
            templateTitle: "Patient Registration",
            recipientName: "Dr. Rivera",
            recipientEmail: "rivera@clinic.example",
            expiresInHours: 72,
            confirmationState: "pending",
          },
        },
      },
    },
  });

  assert.equal(writes, 1);
  assert.match(markup, /Patient Registration/);
  assert.match(markup, /Confirm & Email Secure Share/);
});

test("a newly saved complete answer set is immediately shareable", async () => {
  const registration = GPT_MEDICAL_FORMS.find(({ id }) => id === "patient-reg");
  assert.ok(registration);
  const answers = Object.fromEntries(
    registration.fields
      .filter(({ required }) => required !== false)
      .map(({ key }) => [key, "confirmed value"]),
  );
  const rows: Record<string, unknown> = {
    patient_profiles: { id: "patient-1" },
    form_responses: {
      id: "response-1",
      status: "incomplete",
      answers_json: answers,
      updated_at: "2026-08-25T00:00:00.000Z",
    },
  };
  const supabase = {
    from(table: string) {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({ data: rows[table] ?? null, error: null }),
      };
      return query;
    },
  };

  const preview = await previewMedicalFormShare(supabase as never, "user-1", {
    templateId: "patient-reg",
    recipientName: "Dr. Rivera",
    recipientEmail: "rivera@clinic.example",
    expiresInHours: 24,
  });

  assert.equal(preview.responseId, "response-1");
  assert.equal(preview.confirmationState, "pending");
  assert.equal(preview.recipientEmail, "rivera@clinic.example");
  assert.equal(preview.sendPatientCopy, false);
});

test("secure-share widget confirms the exact email and optional patient receipt", () => {
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Confirm & Email Secure Share/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /recipientEmail:output\.recipientEmail/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /sendPatientCopy:Boolean\(output\.sendPatientCopy\)/);
});

test("secure-share preview rejects an invalid recipient email before reading health data", async () => {
  await assert.rejects(
    previewMedicalFormShare({ from: () => { throw new Error("should not query"); } } as never, "user-1", {
      templateId: "patient-reg",
      recipientName: "Dr. Rivera",
      recipientEmail: "not-an-email",
      expiresInHours: 24,
    }),
    /valid recipient email/,
  );
});

test("secure-share widget avoids rendering an empty confirmation card", () => {
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /if\(!output\.templateId\|\|!output\.recipientEmail\)/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Loading secure share review/);
});

test("MCP instructions require one compact share preview without unrelated cards", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  assert.match(edgeIndex, /call preview_medical_form_email_share exactly once/);
  assert.match(edgeIndex, /Do not call onboarding, dashboard, form-progress, or recipient-resolution tools/);
  assert.match(edgeIndex, /Do not repeat the card as a prose checklist/);
  assert.match(edgeIndex, /Do not ask for a typed confirmation when the card has a confirmation button/);
});

test("medical form share preview permits its widget to call the confirmed save tool", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  const previewRegistration = edgeIndex.slice(
    edgeIndex.indexOf('"preview_medical_form_email_share"'),
    edgeIndex.indexOf('"create_medical_form_email_share"'),
  );
  assert.match(previewRegistration, /"openai\/widgetAccessible": true/);
});

test("typed share confirmation reuses the preview without extra reads or verbose PII", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  assert.match(edgeIndex, /When the user types confirmation after a medical-form share preview, call create_medical_form_email_share exactly once/);
  assert.match(edgeIndex, /Do not call any read or preview tool again/);
  assert.match(edgeIndex, /Never repeat patient details, recipient details, share IDs, or expiration details in prose/);
  assert.match(edgeIndex, /Secure share result is shown in the card\./);
});

test("medical-form email widget uses a versioned resource and contains no legacy non-email CTA", async () => {
  assert.match(MEDICAL_FORM_SHARE_WIDGET_URI, /-v9\.html$/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Confirm & Email Secure Share/);
  assert.doesNotMatch(MEDICAL_FORM_SHARE_WIDGET_HTML, /Nothing is sent automatically|>Confirm Secure Share</);

  const legacyEdgeWidget = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/medical-form-share-widget.ts", import.meta.url)),
    "utf8",
  );
  assert.doesNotMatch(legacyEdgeWidget, /Nothing is sent automatically|>Confirm Secure Share</);
});

test("medical-form share widget waits for late ChatGPT tool output without becoming blank", () => {
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /globals\.toolOutput\|\|detail\.toolOutput/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Loading secure share review/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /setInterval/);
  assert.doesNotMatch(MEDICAL_FORM_SHARE_WIDGET_HTML, /setInterval\(function\(\)\{render\(\)/);
  assert.doesNotMatch(MEDICAL_FORM_SHARE_WIDGET_HTML, /document\.body\.hidden=true/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /ui\/notifications\/tool-result/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /request\('tools\/call'/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /\(function\(\)\{/);
});

test("medical-form share uses the current MCP Apps resource contract", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  const resourceRegistration = edgeIndex.slice(
    edgeIndex.indexOf('"health-vault-medical-form-share"'),
    edgeIndex.indexOf('server.registerTool(', edgeIndex.indexOf('"health-vault-medical-form-share"')),
  );
  assert.match(resourceRegistration, /text\/html;profile=mcp-app/);
  assert.match(resourceRegistration, /ui:\s*\{\s*prefersBorder:\s*true/);

  const previewTool = edgeIndex.slice(
    edgeIndex.indexOf('"preview_medical_form_email_share"'),
    edgeIndex.indexOf('"create_medical_form_email_share"'),
  );
  assert.match(previewTool, /ui:\s*\{\s*resourceUri:\s*MEDICAL_FORM_SHARE_WIDGET_URI/);
});

test("medical-form sharing uses Health Vault delivery without Gmail or another email plugin", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  assert.match(edgeIndex, /Never invoke, suggest, or install Gmail or another email plugin/);
  assert.match(edgeIndex, /Health Vault sends both emails server-side through its configured delivery service/);
});

test("medical-form result card reports patient receipt acceptance or failure", () => {
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Patient receipt accepted for delivery/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /Patient receipt email failed/);
});

test("public secure-share page links back to the authenticated Health Vault profile", async () => {
  const landingPage = await readFile(
    fileURLToPath(new URL("../../../src/pages/SecureShareLanding.tsx", import.meta.url)),
    "utf8",
  );
  assert.match(landingPage, /href="\/"/);
  assert.match(landingPage, /Back to my Health Vault/);
});

test("medical-form share card is the complete minimal final review", () => {
  for (const text of [
    "FINAL REVIEW",
    "Completed fields",
    "Recipient email",
    "Secure, read-only link",
    "Expiration",
    "Note",
    "Patient receipt",
  ]) {
    assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, new RegExp(text));
  }
  assert.doesNotMatch(MEDICAL_FORM_SHARE_WIDGET_HTML, /Date of birth|Address:|Phone:|Emergency contact/);
});

test("versioned medical-form email tools replace the stale legacy tool names", async () => {
  const edgeIndex = await readFile(
    fileURLToPath(new URL("../../../supabase/functions/health-vault-mcp/index.ts", import.meta.url)),
    "utf8",
  );
  assert.match(edgeIndex, /"preview_medical_form_email_share"/);
  assert.match(edgeIndex, /"create_medical_form_email_share"/);
  assert.doesNotMatch(edgeIndex, /registerTool\(\s*"preview_medical_form_share"/);
  assert.doesNotMatch(edgeIndex, /registerTool\(\s*"create_medical_form_share"/);
  assert.match(MEDICAL_FORM_SHARE_WIDGET_HTML, /callTool\('create_medical_form_email_share'/);
});

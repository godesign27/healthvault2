# Public pages and account controls — release audit

Verified 2026-10-02. This is a functional audit, not legal approval.

## Findings

| Destination/control | Evidence | Result |
| --- | --- | --- |
| https://healthvault.me/privacy | HTTP 200; browser renders “Your Health. Your Data. Your Power.” homepage. Footer Privacy Policy points to #privacy and does not display a policy. | Fail |
| https://healthvault.me/terms | HTTP 200; browser renders homepage, not terms. Footer source links to #terms. | Fail |
| https://healthvault.me/support | HTTP 200; browser renders homepage, not a support page. | Fail |
| Download My Data | src/components/ProfileSettingsDrawer.tsx:698, button has no handler or link. | Not implemented in inspected source |
| Delete Account | src/components/ProfileSettingsDrawer.tsx:704, button has no handler or link. | Not implemented in inspected source |

HTTP success is insufficient: the SPA fallback serves the homepage for these paths.
The footer publishes team@healthvault.me under Media Inquiries. This audit does not
establish that it is a monitored support or privacy-request inbox.
No account deletion or export was attempted. No messages sent. No marketing pages
or legal promises changed, and no production deployment made for this audit.

## Implementation order and acceptance

1. Account export: inventory owner-scoped tables and storage objects; define included
   and excluded data; implement authenticated export with cross-owner denial tests,
   a usable downloaded file, clear progress/error feedback, and no secrets in output.
2. Account deletion: define retained data and retention periods with the owner before
   implementation; require recent authentication and explicit confirmation. Cover
   records, files, active share links, OAuth access, queued work, receipts and failures.
   Exercise only a dedicated disposable account, not a real account.
3. Public privacy/terms: obtain approved text or prepare drafts for review. Content
   must describe actual data use, service providers, ChatGPT integration, sharing,
   retention, export/deletion and contact details. Do not invent legal entity details,
   service guarantees, retention periods or compliance certifications.
4. Support: confirm monitored contact/ownership and publish a working destination.
5. Route acceptance: direct visits and footer links must render the intended content
   without authentication; verify on mobile and desktop. Re-test after deployment.

User was asked whether approved policy text already exists; answer pending.

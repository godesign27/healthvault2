# Medical forms release acceptance

Updated 2026-10-03. This is a scoped checklist, not certification of the whole product.
Production has not received the recovery migration or the updated share handler.

## Verified

- Shared catalog and autofill; native saved response UUIDs and owner/patient scoping.
- Local consent, save receipt, uncertain-send guard and account-change regression checks.
- Preview private claim table grants/RLS/unique key; concurrent database claims yield one winner.
- Correlation migration applied to preview; v52 seeded pending/receipt replay, private status/table
  boundaries, revocation and owner-deletion cascade verified with disposable fixtures.
- Preview authenticated status lookup, cross-owner isolation, anonymous rejection, client-table denial.
- Preview concurrent **seeded** pending/receipt replays, payload conflict and unchanged share count.
- Preview owner revocation and denied access to revoked links, including version 51 persistence tightening.
- Local correlation checks: pre-upload share ID, pre-dispatch attempt, optional provider ID,
  failed/missing tracking writes block further sends; private evidence excluded from status. Normal preview v57 restored after isolated hosted first-send tests; see evidence below.
- Actual handler with isolated adapters: concurrent first calls, transport ambiguity, server errors,
  rejected email, upload failures, receipt failures/missing rows, and revocation failure/missing rows.
- Synthetic iOS consent → receipt → history → revoke interaction; maximum-text sharing and receipt.
- Local native support reference: UUID-only, selectable, persisted-marker lookup, clears on
  recovery/account switch; malformed/legacy markers retained. Device copy/VoiceOver checks remain.
- Wrapping recipient summary and receipt scroll reset; background controls excluded from modal AX tree.

## Remaining release gates

1. Real-provider acceptance and hosted receipt-write failure testing; isolated sink concurrency passed.
2. Automated support resolution remains unavailable; follow `INTERRUPTED_SEND_SUPPORT.md` for conservative read-only triage.
3. Physical iPhone VoiceOver: initial modal focus, traversal, field hints, checked/disabled states,
   result announcement, Close focus return; ensure background navigation is unreachable.
4. Android/TalkBack and physical-device keyboard/maximum-text/dark-theme interaction acceptance.
5. Audited support resolution tooling remains unimplemented.
   Never clear pending claims or invent new request IDs merely because time elapsed.
6. Production release review: apply migration before deploying backend, then release compatible mobile.

## Latest hosted acceptance

Six concurrent first calls per accepted/lost-reply/server-error scenario passed against
preview Auth/DB/Storage with an isolated provider adapter. Independently recorded sink rows
confirmed one dispatch per scenario, persisted correlation and one accepted receipt.
No external email was sent. Fixtures and temporary sink table were removed; normal handler
restored as v57. See `../release/2026-10-03-validation.md` for boundaries and remaining gates.

## Reproducible local checks

From repository root:

```sh
node scripts/test-medical-share-handler.mjs
node scripts/test-medical-share-claims.mjs
node scripts/test-mobile-medical-forms.mjs
node scripts/test-mobile-adaptive-layout.mjs
```

Remote scripts require separately seeded disposable fixtures and private mode-0600 configuration:
`test-medical-share-status-preview.mjs` and `test-medical-share-replay-preview.mjs`.
They pin the preview project. Never point them at production; remove fixture accounts, associated
profile/form/share rows and temporary credentials after testing. Replay tests require existing claims
and intentionally do not test a new email dispatch.

The UI harness in `apps/mobile/tests/medical-screen-harness.js` substitutes in-memory services.
Use dummy Supabase environment values; restore the normal entry after each run. Simulator results
must not be described as real email delivery, patient persistence or VoiceOver speech acceptance.

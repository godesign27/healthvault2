# ChatGPT widget release review — 2026-09-19

Reviewed production `health-vault-mcp` version 122 and the local widget sources.
This is a targeted confirmation-flow review, not a full security audit.

## Follow-up: version 124

- Life Signal, general sharing, standalone form review, form interview, and form
  email sharing now embed one shared host bridge. It supports standard
  initialization/calls and legacy calls, ignores unrelated/repeated globals,
  preserves confirmation state, rejects tool errors, and bounds waiting to 30
  seconds. Confirmed requests cannot be dispatched again from the same card.
- All 59 package tests pass, including ten tests of the actual five cards across
  both bridges, timeout/error tests, and isolated sharing-handler rejection tests.
- Local sharing-handler tests reject revoked, expired, and incorrect-token
  requests before reading form contents. A snapshot test verifies only selected
  categories are queried/included. A duplicate-condition test prevents insertion.
- Production RLS is enabled on shares, diet logs, Life Signals, and form
  proposals; policies require owner identity for reads/writes. This inspection
  does not substitute for a second-account integration test.
- ChatGPT's **Enforce CSP in developer mode** switch was enabled and verified on.
  Existing diet cards still render, and dashboard v2 renders in a newly opened browser page under enforcement. Full fresh-card coverage remains pending.
- The source findings below describe the pre-124 implementation; the shared host
  changes resolve their bridge, redraw, timeout, and same-card retry gaps.
- Still pending: cross-card/server idempotency, simultaneous duplicate writes,
  second-account RLS exercise, and a full set of live CSP-on widget interactions.
  The condition duplicate check reads at most 100 rows and is not atomic; do not
  treat its passing unit test as a guarantee against concurrent duplicates.

## Follow-up: version 125 — atomic wellness saves

- Diet batch/single-entry and Life Signal tools now use the same authenticated
  `SECURITY INVOKER` RPC. A transaction-scoped advisory lock serializes saves for
  each user. An exact match (event timestamp plus normalized content) returns the
  existing row; new entries are inserted atomically as a batch. Existing rows
  are neither deleted nor rewritten. This applies to these RPC-based writes,
  not arbitrary direct inserts from other clients.
- Preview timestamps are required for saving. Life Signal check-in output now
  includes a stable timestamp that its card sends back. A newly requested
  check-in is a new event; this does not collapse different timestamps or
  differently described foods into the same event.
- Applied `20260919175918_atomic_wellness_confirmation.sql`. Anonymous execution
  is revoked. RLS remains active and the database derives identity from
  `auth.uid()`, not an input user ID.
- `supabase/tests/wellness-confirmation.sql` passed against the database under
  the authenticated role using two synthetic JWT identities: repeated saves,
  no partial batch after validation failure, read/update/insert isolation, and
  missing identity rejection. The transaction rolled back and a subsequent
  count confirmed zero remaining test rows. No new auth accounts were created.
- A freshly requested Life Signal card rendered all five sliders and its button in ChatGPT with CSP enforcement enabled. No ratings were submitted.
- 62 Node tests pass. Browser OAuth isolation still needs separate signed-in
  accounts; database identity simulation is not a browser sign-in test.
- Remaining server work: durable share/email retry protection and atomic
  duplicate protection for the other health-data writes.

## Verified

- The user successfully saved a diet preview with its button. A subsequent
  authenticated read found the two intended current-day entries exactly once.
  No health data was inserted or shared during this review.
- Dashboard and diet widgets support legacy and standard host messages.
- Diet requests omit nullable display fields and preview-only metadata. The
  server also normalizes nullable optional values from older cached cards.
- Diet confirmation retains its preview across incidental host updates and
  prevents another dispatch after a mutation starts. Ambiguous outcomes direct
  the user to check Wellness. This is a per-card guard, not server idempotency.
- All 40 MCP package tests pass using Node 24. These include tests of both diet
  bridges using the actual server preview formatter. Whitespace checks pass.
- Live public discovery GET: HTTP 200. POST without a token: HTTP 401 with
  `WWW-Authenticate`. POST with a deliberately invalid token: HTTP 401.
- Live source validates tokens with `auth.getUser` before creating the MCP
  server and passes the user's token to the database client. Gateway
  `verify_jwt=false` does not remove the handler's authentication checks.

## Other confirmation buttons: source findings

| Flow | Input contract | Remaining reliability gap |
| --- | --- | --- |
| Life Signal | Builds numeric slider values; omits an empty note. No diet-style null forwarding found. | Legacy `callTool` only; no timeout; ambiguous failures re-enable the write button. |
| General health share | Selects expected fields and omits empty organization/note. | Legacy bridge only; globals redraw the card, potentially removing feedback; no timeout or persistent attempted-write guard. |
| Medical form review | Sends only proposal ID and explicit confirmation. | Standalone review redraws on every globals event, including after success; legacy bridge only; no timeout. |
| Medical form interview | Confirmation sends proposal ID, not the full display preview. | Handles standard incoming results but only legacy outgoing calls; `call` does not reject `isError` before rendering; no timeout. |
| Medical form email share | Selects expected fields and normalizes optional values. | Standard fallback lacks initialization and timeout; globals may redraw an enabled button while a request is pending; ambiguous failures permit retry. |

These are source-level findings, not evidence that every flow has failed in
the user's client. No provider emails, shares, or form writes were triggered.
The passing existing tests do not establish end-to-end success for these paths.

## Before broader release

1. Apply the diet flow's tested lifecycle protections to the remaining buttons:
   standard initialization/call responses, stable pending/success states,
   explicit tool-error handling, and bounded waiting without automatic retries.
   Use isolated fixtures for writes and email delivery.
2. Add durable request IDs/server idempotency for mutations where a response can
   be lost after the database write or email request succeeds. A fresh card must
   not bypass duplicate protection.
3. Test with ChatGPT CSP enforcement enabled. The user's latest screenshots show
   **CSP off**, so successful rendering does not yet verify CSP enforcement.
   Dashboard metadata allows only the Supabase resource origin, with no direct
   connections; diet metadata allows neither. Other resources still primarily
   declare legacy CSP fields. Check all assets and tool calls under enforcement.
4. Complete the existing second-account RLS isolation test. This review checked
   unauthenticated rejection, not cross-account authorization.
5. Reconcile production/local source drift before deploying the entire checkout.
   Production contains unrelated changes absent from this worktree. Versions
   120–122 were deployed by patching the latest production snapshot, preserving
   those changes. This commit is not a complete production source snapshot.

Full package typecheck/build was not run: dependencies are not installed in this
worktree. The tests use Node 24's native TypeScript stripping. Publishing and
changes to the ChatGPT installation's CSP setting were not performed.

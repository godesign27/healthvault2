# ChatGPT widget release review — 2026-09-19

Reviewed production `health-vault-mcp` version 122 and the local widget sources.
This is a targeted confirmation-flow review, not a full security audit.

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

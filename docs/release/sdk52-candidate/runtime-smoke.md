# SDK 52 runtime smoke — 2026-10-03

Environment: clean simulator `A5FB3E5D-6D21-4C89-B281-9D7877A214A2`, iPhone 16 Pro,
iOS 18.6; unsigned Debug build. Metro on loopback port 8092. Placeholder backend
configuration and synthetic local-only auth service on 54321; no real credentials,
production requests, patient mutations or email. No server-side authorization certification.

Verified in native UI:
- SDK 52 dev client loads the actual `apps/mobile/index.js` entry point and reaches sign-in.
- Empty form shows required-field error; unavailable backend shows network error and recovers.
- Synthetic local session reaches dashboard; session persists across reload.
- Records navigation loads and shows retryable error with unavailable API.
- Corrected dashboard suppresses fabricated history and false unavailable/unsupported counts.
- Medical Forms quick action navigates and shows recoverable load error.
- Actual dashboard component regression checks all three navigation callbacks, accessibility
  button roles, real record count and unavailable count presentation.

Found and fixed in working source and candidate: hardcoded dashboard medical activity,
unsupported zero counts and inert quick actions. Labels now describe opening screens;
no immediate download or scheduling is promised.

Remaining release blockers found in the active entry point:
- CareScreen still binds encounters/claims to sample arrays; needs real data integration.
- LoginScreen Forgot password has no handler; password toggle and input/button semantics
  need accessibility work. Existing HIPAA-compliance copy needs evidence/review.
- Vitals and some menu routes still use placeholders; full parity is not established.
- A development refresh hit `Timed out waiting for modules to be invalidated`;
  the dev-client Reload action recovered. Release behavior remains untested.
- Local fixtures deliberately return API failures: successful authenticated data flows,
  sharing, provider connection, uploads, physical VoiceOver and Android remain unverified.

The candidate is not ready for promotion. These findings supersede any broad feature-parity
assumption; compilation and bounded smoke checks do not establish production readiness.

## Follow-up implementation
Care samples and incorrect stats sources replaced with owner-scoped appointments/encounters/claims.
Login recovery request, callback, password update and sign-out implemented; labelled controls,
minimum targets, announcements and scroll layout added; compliance claim removed.
Service/hook regressions pass and both SDKs export iOS bundles. These changes supersede the
source findings above, but are not yet interactively certified. Hosted Supabase must allow
`healthvault://auth/recovery` and deliver the implicit recovery fragment (`type=recovery`,
access/refresh tokens). Validate with a dedicated preview account before enabling release.
Never record tokens in logs/evidence. No hosted auth settings were changed and no email sent.

## Interactive Care/recovery follow-up — 2026-10-03
- Actual native Care screen displays one synthetic appointment, encounter and claim from
  loopback fixture; encounter/claim counts each show 1. Claims filter shows only the claim.
- Found calendar dates shifting one day early in Mountain Time. Added shared date parser
  preserving calendar days and a missing/invalid fallback. Native UI now shows October 1
  and September 30 correctly; regression checks pass in Denver, UTC and Tokyo.
- Removed inert Care Share Link CTA; care-history sharing remains unimplemented, not certified.
- Native sign-in fields/buttons expose labels. Recovery blank email fails validation; local
  recovery endpoint returns account-neutral acknowledgement. Expired-link deep link shows
  error and disables password update. No recovery email or real account operation performed.
- Cleared stale request notices when entering recovery mode. Service/auth-hook regressions
  cover password update/sign-out, but no real password was changed through native UI.
- Hosted redirect/template check blocked by dashboard authentication. Automatic browser
  approval review denied GitHub sign-in as an unapproved private-account OAuth flow.
  User must complete Supabase sign-in. No alternate access path or auth setting change attempted.

## Additional regression evidence
`test-mobile-care-refresh.mjs` checks overlapping responses, stale-row clearing, errors and
unmount exclusion. `test-mobile-auth-recovery-state.mjs` additionally checks restart gate,
cancel cleanup and rejected-token update prevention. All pass. Care copy distinguishes
filtered no-match from empty history and describes only encounters/claims. Hosted OAuth
inspection remains pending explicit sign-in authorization or user-completed sign-in.

## Vitals/menu interactive check — 2026-10-03
Local synthetic BP reading renders with paired values, mmHg, MDT timestamp, source and device.
Drawer AX tree exposes selected Dashboard, named navigation buttons, Close menu and Dark Mode
switch. At text-size slider 11 after app relaunch, body text scales and wraps. Found clipped
avatar initials and overly verbose refresh/introduction; fixed decorative initial scaling,
shortened copy on web/native and added bottom floating-action clearance. Revised initials and
labels verified visually. End-of-list scroll/drag through Device Hub was inconclusive; full
large-text reachability and physical VoiceOver remain open. Text slider reduced to 4 (original
3 was not restored by further decrement actions); this affects only the isolated QA simulator.
Simulator shut down and loopback services stopped. No hosted requests or data changes.

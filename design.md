# Health Vault product design reference

Last reviewed: 2026-10-03. Scope: authenticated SaaS, native app, and GPT widgets. Marketing has its own design requirements.

## Intent

Make health information easy to read and actions easy to understand. Preserve the existing Health Vault identity: navy headings, quiet surfaces, restrained accents, and clear review/confirmation states. Match meaning and hierarchy across clients, while respecting native and embedded UI conventions. This document is a working implementation reference, not a claim that every screen already complies.

## Sources of truth

| Area | Implementation to consult |
| --- | --- |
| Web semantic colors | `src/tokens/semantic/{surface,text,action,border}.css` |
| Web component dimensions | `src/tokens/component/` |
| Steel theme | `src/tokens/themes/theme.steel.css` |
| Dark theme | `src/tokens/themes/theme.dark.css` |
| Web buttons | `src/components/ui/Button.tsx` |
| Web Records | `src/pages/HealthRecordsPage.tsx`, `src/components/records/` |
| Native shell | `apps/mobile/index.js`, `apps/mobile/src/components/SteelSurfaceBackground.js` |
| Native Records | `apps/mobile/src/screens/RecordsScreen.js` |
| Native Records actions | `apps/mobile/src/components/ui/AdaptiveControls.js` (RecordActionButton compatibility export) |
| GPT import review | `packages/health-vault-mcp/src/clinical-import-widget.ts` |
| GPT host interaction | `packages/health-vault-mcp/src/widget-host.ts` |

Check these files before introducing another component or token. Prefer existing semantic tokens over copying raw color values. Native Records uses `apps/mobile/src/theme/records.js`, selected by the shell’s dark-mode setting and shared with its forms and sheets. Other screens still need an incremental theme audit.

## Color roles and platform differences

| Role | Web | Native Records | GPT clinical-import widget |
| --- | --- | --- | --- |
| Main text | `--hv-color-text-primary` | `colors.textPrimary` | Light navy / dark near-white |
| Supporting text | `--hv-color-text-secondary` | `colors.textSecondary` | Metadata color; needs dark contrast audit |
| Card | `--hv-color-surface-raised` | `colors.surface` | White / dark charcoal |
| Border | `--hv-color-border-default` | `colors.border` | Quiet neutral separator |
| Primary action | `--hv-color-action-primary-default` (Steel brand blue) | `colors.navy` (navy light / blue dark) | Blue |
| Secondary action | Existing secondary button variant | Surface with border and main text | Quiet outlined/secondary control where present |
| Success | Semantic success foreground + surface | Explicit saved message | Green notice with explicit saved message |

Do not describe these as one synchronized palette. Preserve platform defaults during scoped fixes; a future palette migration should update shared tokens and verify every consumer. Do not use `surface` as a universal on-action token in new dark palettes: use `colors.onAction` for native Records action labels.

## Adaptive mobile typography and layout

Implementation: `apps/mobile/src/theme/layout.js`, `components/ui/AppText.js`, and `components/ui/AdaptiveControls.js`.

| Role | Base size / line height (points) | Use | OS scaling |
| --- | --- | --- | --- |
| `page` | 28 / 35 | Screen title | Up to 2× |
| `title` | 24 / 31 | Dialog or prominent group heading | Up to 2× |
| `section` | 20 / 27 | Section/accordion heading | Up to 2× |
| `body` | 17 / 25 | Reading content, fields | Full user preference |
| `label` | 17 / 23, semibold | Buttons, checkbox and field labels | Full user preference |
| `secondary` | 15 / 22 | Supporting text and metadata | Full user preference |
| `caption` | 13 / 18 | Short, nonessential annotation | Full user preference |

Use `<AppText variant="body">`, not raw `Text` plus a new numeric font size. `AppTextInput` establishes the input baseline; `AppField` adds persistent labels, hint/error text and semantic colors. Do not shrink clinical content into captions to fit a card. Display-heading caps prevent oversized headings consuming the viewport; they are defined centrally, never copied into screens. Do not disable OS scaling or apply a global text cap. Do not manually multiply font sizes by `fontScale` (React Native already scales them).

Use `typeStyles` only for legacy styles and input/interop cases; new components should choose semantic variants directly. Do not override their font size or line height. Preserve the system font; weight, spacing and grouping establish hierarchy.

`useAdaptiveLayout()` responds to available width and OS font scale. When effective reading width falls below 300 points, compact horizontal arrangements stack. This is a layout decision, not a formula that stretches all typography with screen width. Gutters are 12 points below 360-point width and 16 otherwise; wide content can be constrained to the shared 720-point maximum. Do not force phone controls to fill a tablet's full width.

Spacing tokens: `xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=24`, `xxl=32`. Control radius is 12; card radius 16. Use these tokens in new/reworked components. Existing screen-specific spacing is not yet fully migrated.

### Adaptive control contract

- Use `AppButton` (the older `Button` and `RecordActionButton` delegate to it). Minimum target 48 points; automatic height; multiline labels; explicit busy/disabled semantics; primary and secondary color roles. Never apply a fixed height to a text-bearing control.
- Use `SelectionControl` for checkbox/radio rows. Whole row toggles, selected icon plus checked state, wrapping label/description. Compact icon-only selection retains a 48×48 target and requires a meaningful accessibility label.
- Use `DisclosureButton` for accordion/disclosure triggers. Preserve controlled expanded state, expose it to accessibility, and render expanded content in normal scroll flow. Do not animate to a guessed fixed content height.
- Use `AppField` for new labeled inputs. Keep its visible label when text is entered; show errors adjacent to the field. Multiline fields grow/scroll without hiding recovery actions.
- Text-bearing cards/rows must grow. On narrow or large-text layouts, stack metadata, paired actions and selection groups; retain logical reading order.
- Use icon components for close/chevron/check affordances, not font glyphs that expand like body text. Icon visuals may remain 24 points while their touch targets remain at least 48.
- Do not truncate consent, recipient, expiry, errors, or primary actions. List previews may truncate only when the complete value is reachable in details.

### Migration coverage and limits

The main JS mobile shell and screen files now use shared text/input primitives and typography tokens. Records upload/provider/import actions, fields and choices use shared controls; Medical form selections and profile disclosure also use them. The older TypeScript Button delegates to the same primitive. This does not mean all screen layouts, older router components, local spacing, or dark palettes have been fully migrated or visually accepted. Keep migrating existing controls when working on their flow, without changing consent or data behavior.

Basis: [Apple Dynamic Type guidance](https://developer.apple.com/videos/play/wwdc2024/10074/), [React Native Text](https://reactnative.dev/docs/text), and [useWindowDimensions](https://reactnative.dev/docs/usewindowdimensions). The values and display-heading cap above are Health Vault product decisions, not claims that Apple prescribes this exact scale.

## Common components

| Component | Required behavior |
| --- | --- |
| Page header | Clear title, then actions; no split-word heading or overlap at narrow widths. |
| Primary button | One emphasized next action per step; verb plus object, e.g. “Confirm import (3).” Native Records uses `RecordActionButton primary`. |
| Secondary button | Less emphasis for cancel, choose another, and check status; same usable target size. |
| Field | Persistent visible label plus accessibility label; placeholder is an example, not the only label. |
| Selection row | Full row is a target; expose checked/disabled state; distinguish selection beyond color. |
| Statistic | Quiet non-interactive surface; label and value visible together; wrap the collection. |
| Record card | Title, source/provider, date, summary; consistent order and a reachable details action. |
| Review sheet/widget | Show exact scope and counts before the explicit confirmation action. Closing or cancelling must not save. |
| Status message | Say what happened and what the user can do next; announce asynchronous updates where supported. |
| Empty state | Explain the state and point to an available action; distinguish empty data from failed loading. |

## State and copy contract

1. **Loading:** show progress, prevent duplicate actions, expose busy/disabled state.
2. **Preview:** explicitly say nothing has been saved; present selected scope.
3. **Saving:** retain selection and durable retry identity; do not report success from a button click alone.
4. **Saved:** show the verified receipt/count. A subsequent list-refresh error must not erase saved success.
5. **Unknown outcome:** explain uncertainty; use the existing idempotent recovery flow rather than starting a duplicate operation.
6. **Error:** keep entered data where safe and offer a specific recovery action.

Use the same concepts across SaaS, native, and GPT: Records, provider, review, confirm, saved, already imported. Use correct singular/plural copy. Do not label deterministic import summaries “AI” without reliable provenance. Dates without times use `packages/api-client/src/record-date.ts` in web/native; time-bearing events and expiry labels must clearly identify their timezone.

## Accessibility and verification

For each changed flow, verify the actual rendered UI, not just compilation:

- Normal and narrow widths; long names and filenames; empty and populated states.
- Large OS text / browser zoom without clipped labels or unreachable confirmation.
- Light and dark foreground/background pairs, including metadata, badges, errors, focus and disabled states.
- Keyboard access and visible focus on web/GPT; semantic names, roles, checked and busy states on native.
- A target contrast ratio of at least 4.5:1 for normal text, 3:1 for large text and meaningful UI boundaries/icons.
- Scrollable sheets with reachable actions and close controls; no keyboard-obscured fields.
- Review, cancel, success, failure, uncertain outcome, retry, and refresh failure where applicable.
- Record whether evidence is static review, synthetic simulator, live sandbox, or physical device. These are not interchangeable.

## Known gaps and next work

- Records now receives `darkShell` via `darkMode`; its page and provider-review sheet were checked in a synthetic iOS simulator. Other Records sheets, populated states and full-app dark acceptance remain to verify.
- Maximum iOS accessibility text was checked on the Records page, provider sheet and populated record-detail sheet using synthetic data. Page/sheet display headings cap scaling at 2× while body text keeps OS scaling; compact detail tabs and request rows now use the shared effective-width policy. Remaining form flows and physical-iPhone/Android acceptance remain open.
- Some record summaries use an AI badge despite lacking generation provenance; audit web/native together before relabeling.
- GPT clinical-import dark mode needs metadata/type-chip contrast verification.
- Shared controls now cover Records review/upload/provider flows and Medical selections/disclosure. Other native forms and older router components still need layout and component migration.

When changing this reference, identify the implementation and validation supporting the change. Update `WORK_LOG.md` and `tasks.md` alongside completed work.


### Accessibility rules and audit — 2026-10-03

Use WCAG AA as the web/GPT baseline and equivalent native accessibility behavior. Our 48-point native target is a product usability rule, not a claim that WCAG 2.1 AA requires 48 points.

- Keep native OS text scaling enabled. Body, field, consent and action labels are uncapped; only display headings cap at 2×. Use shared roles, not screen-specific font sizes. Reflow actions using available width and font scale, never shrink body text to fit.
- All controls need a meaningful name, role and applicable checked, expanded, selected, disabled or busy state. Decorative icons must not pollute spoken names. Selection descriptions and field guidance/errors must be available to assistive technology.
- Keep text contrast at least 4.5:1 (3:1 for qualifying large text); meaningful enabled control boundaries/icons at least 3:1. Use `controlBorder` for input/control boundaries and `border` for decorative separators. Check actual composed backgrounds; token tests do not prove every screen passes.
- Maintain reading order, visible focus on web/GPT, keyboard operation, and return focus to the initiating control after dismissing a modal. Never trap focus outside the modal or hide a primary action behind the keyboard.
- Errors must be visible beside the field and conveyed without color alone. Asynchronous errors/success need platform-appropriate announcements; Android live regions alone do not establish VoiceOver support.
- Honor reduced motion for new animations. Do not rely on motion, color, hover or an icon alone to communicate state.
- No apparently enabled control without a working action. Existing placeholders are release blockers for the affected flow until removed, clearly disabled or implemented.

Audit evidence: shared controls were exercised in a synthetic iOS simulator at normal and maximum OS text sizes, including selection, disclosure, confirmation and light/dark appearance. Accessibility-tree inspection verified exposed control states. Four focused regression scripts pass, including text/control contrast and adaptive-layout checks. Fixed weak shared-control boundaries, missing disclosure names, selection descriptions, field hints and several Records close-control labels/targets. Normal app entry and OS text preferences were restored.

Open findings (not a full accessibility certification):

| Priority | Finding / required acceptance |
| --- | --- |
| High | Native record sharing and insights remain unimplemented. Inactive buttons and the unreachable demo notification were removed; truthful availability text now replaces the detail actions. |
| High | Medical now uses authenticated saves/shares/history; live sandbox acceptance, modal focus and server-backed recovery of uncertain sends remain release gates. |
| High | Full VoiceOver/TalkBack reading order, asynchronous announcements, modal focus/return and hardware-keyboard operation remain untested. |
| Medium | Older router components, remaining native forms and screen-specific palettes/layouts still need migration and contrast/large-text acceptance. |
| Medium | Physical iPhone/Android acceptance and SaaS/GPT keyboard, zoom and dark-widget contrast checks remain open. |

Repeat these checks after migrating each flow. A successful bundle or token contrast test alone is not accessibility acceptance.

### Form row accessibility follow-up — 2026-10-03

`apps/mobile/src/components/forms/FormSelectionRow.js` owns form-row layout. Selection, opening and sharing are sibling controls, never nested pressables. Use shared targets, spacing and typography; stack the row under the common adaptive-layout policy. Completion is explicit text, not color alone. Each action names its form, and selection exposes checked state.

Synthetic iOS acceptance verified three independently exposed controls and isolated callbacks: selection changed only selection; Open and Share retained the checked value and invoked only their own callback. Normal-size rendering was inspected. This is accessibility-tree and interaction evidence, not a VoiceOver audio/reading-order test, full form-flow acceptance or a real share. Maximum-text acceptance of this new row remains open.

## Semantic color adoption — 2026-10-03

Preserve Health Vault's existing core brand and primary actions. The supplied Deep Navy ramp is deliberately excluded per the user's correction. Raw semantic ramps live in `packages/design-tokens/palette.json`; `scripts/generate-design-colors.mjs` generates shared native semantics and web ramp CSS. Run with `--check` to detect drift. Do not copy raw hex values into components.

| Meaning | Ramp | Usage |
| --- | --- | --- |
| Success | Meadow | Verified success; explicit confirmation actions |
| Error/destructive | Ember | Errors, destructive actions, never routine navigation |
| Warning | Dijon | Expiry, pending attention and caution |
| Information | Slate | Neutral notices and sharing metadata |
| Focus | Focus Cyan | Keyboard focus indication, not selected state |
| AI | AI Brand Blue | Clearly identified AI content with reliable provenance |
| Key insight | HV Signal | Rare non-status emphasis, paired with a label/icon |

`zs-orange` is renamed `hv-signal`; all 11 supplied orange values are retained. Use step 80 (`#A54F00`) for light-surface emphasis, not the bright step 50 for body text. Signal is not a warning, pending status, success or replacement primary brand. Keep it to one key insight per view.

Light inline callouts use step 10 backgrounds and step 100 body text; step 30 borders are decorative, not sufficient input boundaries. Dark callouts use step 100 backgrounds and step 30 text. Solid semantic actions use step 80 plus white text; secondary actions stay neutral. Focus uses cyan 70 in light and 40 in dark. Solid notifications are reserved for error/warning/success and must wrap at large text sizes; do not copy the reference's single-line restriction onto mobile.

Implementation coverage: native Records consumes the generated semantics, import confirmation uses success tone, and shared-record metadata uses information rather than signal. Native core palette is unchanged. Web ramps are globally available; new feedback mapping is scoped to `data-hv-semantic` on the SaaS dashboard main content, leaving marketing/core themes unchanged. GPT widgets and other native/web surfaces still require incremental migration and rendered acceptance; this is not a claim of complete palette synchronization.

Verification: generated-file drift check and computed light/dark callout/action/focus contrast tests. The first AI 80-on-10 text pairing failed 4.5:1; body foregrounds now use step 100, matching the supplied light-callout intent. Existing Records contrast and provider-import recovery tests pass. These are token-level checks, not full rendered-theme acceptance.

## Data visualization — Option 1

The supplied reference defines the chart system, not a change to Health Vault's core brand. Canonical values are in `packages/design-tokens/dataviz.json`; `scripts/generate-dataviz.mjs` emits 132 categorical CSS variables plus surfaces, AI/HV Signal, diverging, status and motion tokens. The referenced ZDS kit and companion JSON were not present, so this implementation uses the existing React/SVG stack without adding dependencies. `DATA_01_HARBOR` becomes the specified CSS slug `--data-01-harbor-00` through `-100`, similarly for all 12 families. Only the external ZS signal naming changes to Health Vault (`--hv-signal-accent-light`, etc.).

- Keep categorical draw order: Harbor, Brass, Rose, Orchid, Jade, Indigo, Olive, Fern, Lapis, Ember, Slate, Clay. Preserve identity by key when filtering; do not recolor a category by its current visible position.
- Use per-slot light/dark steps from the canonical file. Categories are not semantic status colors. Existing series aliases now resolve to this ordered palette.
- At five or more series, add a second encoding by default. Brass/Olive and Indigo/Lapis always require one, even below five. Dash/marker/pattern assignments follow original slot identity, not draw-order index. For touching filled marks use a 1.5px surface separator; texture strokes must be measured against their fill, targeting 3.05:1.
- Text uses chart ink/soft tokens, never category color. Use inherited product typography, recessive axes and grid, 2px lines and at least 7px markers at intended display size. Provide a legend at two or more series and an exact-value table. On narrow displays preserve a readable plot size with scrolling/table access rather than shrinking text indefinitely.
- Sequential charts use Harbor 10–90. Diverging and chart-status scales remain outside the category rotation; use the supplied separate status values for charts only.
- HV Signal is attention, not category: one labelled highlight per chart; neutralize peers. AI Blue denotes provenance, not value: always label it and use dashed geometry or a tint. If both appear, HV Signal owns attention. Do not present ordinary summaries as AI output.
- Motion constants: enter 900ms/easeOutCubic, stagger 90ms, update 480ms/easeInOutSine, exit 260ms/easeInCubic, signal 1400ms/easeOutCubic, AI 1200ms/easeOutCubic, tooltip 120ms/linear. Never loop; animate entry once, updates move existing shapes. Above 300 points or with reduced motion, all durations and delays are zero. The spec's nominal 90ms stagger conflicts with its one-second total; preserve the token but cap effective six-step staggering to the remaining 100ms. Static charts are the current default.

Implementation: `src/components/charts/chartPolicy.ts` provides series resolution, encoding policy, motion budgeting and Highcharts/Power BI export objects; `TrendChart.tsx` uses CSS-variable colors and an exact-data table. The Colors component-library page includes labelled synthetic light/dark examples. No patient data is replaced with demo data.

Acceptance: deterministic token/order/encoding/motion/export tests and web build pass; browser inspection confirmed light/dark rendering, exposed legends/table values and Enter-key table toggling. These checks do not certify all categorical marks meet non-text contrast, colorblind simulation or every responsive layout. The reference's full 18-chart suite, texture generator, colorblind simulation and motion demos/bootstrap are not implemented by this palette adoption; add them as individually validated library work. GPT/native chart consumers remain to migrate when those charts are implemented.

### Medical forms integration — 2026-10-03

Native Medical uses the same catalog/autofill implementation as web (`packages/forms/`), semantic colors and adaptive shared fields/buttons/selection rows. Values come from the authenticated patient profile and saved responses; explicit saved blanks are retained on native. Saving marks completion only after a database receipt; sharing uses response UUIDs, explicit recipient authorization and a seven-day expiry matching the existing share endpoint. Do not equate email-provider acceptance with inbox delivery. Revocation requires a server receipt.

Uncertain sends persist a per-owner marker without health data or recipient details and block another send. The server recovery flow below can reconcile durable receipts; do not clear the marker automatically on refresh or imply every interrupted send is recoverable. Full native screen acceptance, VoiceOver/modal focus and live sandbox save/share/revoke remain unverified.

### Interrupted form-share recovery — 2026-10-03

The mobile send stores a random request UUID (no recipient or form data) before calling the server. A service-only `medical_share_requests` table atomically claims `(owner_id, request_id)`; repeated IDs never start another send, and changed payloads conflict. `share/status` authenticates the owner and returns a minimal receipt without private URLs. “Check interrupted send” performs only this status read and removes the local marker only for a matching confirmed request receipt.

If execution stops before a durable receipt, preserve pending state; do not infer failure from age or a missing row, and do not retry by minting another ID. Such cases still require support reconciliation. Older marker-only sends remain blocked for support. This provides at-most-once dispatch per request ID, not guaranteed delivery or automatic recovery from every crash. Legacy clients without request IDs retain their existing behavior.

Release order: migrate private request table, deploy share handler, verify preview DB permissions/concurrency and authenticated status isolation, then release the mobile client. Synthetic iOS acceptance verified autofill display, save receipt, 0→1 saved count and no-pending recovery feedback.

Preview evidence (2026-10-03): migration applied to `roeudwddxvniazwufdqf`, share function version 49 deployed. SQL permission/primary-key checks passed. Two concurrent database inserts using conflict arbitration returned one winner; this checks the actual unique constraint, not the full HTTP send race. Live status checks passed anonymous rejection, malformed ID rejection, missing/pending state, exact owner receipt, cross-owner isolation and direct-table denial. Synthetic accounts/claims and temporary credentials were removed; no email was sent. RLS without client policies is intentional for this service-only table, with client grants revoked.

Remaining gates: concurrent HTTP send requests, failure injection around email acceptance/receipt persistence, native sandbox save/share/revoke and full VoiceOver focus. Production migration/function deployment has not occurred for this change.

Failure-boundary follow-up: the real Request/Response handler now has an isolated adapter harness (`scripts/test-medical-share-handler.mjs`). Simultaneous requests produce one dispatch; receipt replay and changed-payload conflict do not dispatch again. Transport loss and provider server errors remain pending rather than reporting definite rejection. A successful provider HTTP response is acceptance even if its response body cannot be consumed. File upload failures stop before email; missing/failed durable receipt updates also remain pending. Recovery checks never send email. These tests exercise the handler with simulated services, not concurrent requests across deployed workers or real Resend failures; those live checks and native accessibility acceptance remain open.

Live preview replay/revoke follow-up: six concurrent HTTP requests against a seeded pending claim returned 202; six against a seeded receipt returned the original receipt, with no new share event. Changed content returned 409. Anonymous revocation returned 401; owner revocation persisted and the recipient link returned 403 `Share revoked`. These were synthetic fixtures with no email dispatch; fixtures and credentials were removed. This verifies deployed replay and revocation, not first-send worker arbitration or provider behavior. Mobile adaptive-layout and form data-layer regressions pass; native VoiceOver focus and interactive share/revoke acceptance are still outstanding.

### Native share completion state

After a confirmed share receipt, replace the editable recipient/consent/send controls with a read-only “Share recorded” view. Keep the recipient and revoke guidance visible alongside the actual email outcome; never leave a stale confirmation button available. History uses “email accepted” for provider acceptance and “email outcome unconfirmed” for ambiguous delivery, not an inbox-delivery claim. Email fields disable autocorrection. Labels pluralize counts.

Synthetic iOS acceptance verified consent gating, visible confirmation, populated history and revocation. The modal exposes labeled fields and checked state while hiding background controls from its accessibility tree. VoiceOver speech/focus order, maximum-text sharing and physical-device/Android checks remain outstanding. The test harness uses in-memory adapters only and is never the production entry.

Maximum-text sharing: keep a wrapping recipient summary directly before authorization, because a single-line email input can hide part of the destination at large Dynamic Type. On confirmed completion, reset the review scroll to the receipt heading without animation. Preserve uncapped body/control text and scroll access; do not shrink the user's text to fit one screen. Verified with maximum iOS accessibility text in the synthetic sharing flow. VoiceOver speech/focus must still be checked on a supported device; simulator AX inspection is insufficient.

Revocation confirmation follows the same receipt rule as saving and sharing: show success only after an owner-scoped update returns the revoked record. A missing update is unconfirmed, even if the database request itself returned no error. Current evidence and remaining release gates are consolidated in `docs/medical-forms/RELEASE_ACCEPTANCE.md`.

### Interrupted-send support reference

Medical forms shows a selectable request UUID with a visible Support reference label and
plain-language copy instructions. Use the shared uncapped AppText/body role, natural wrapping,
and semantic text colors; never shrink the reference or constrain it to a fixed-height row.
It is a diagnostic identifier, not authorization. Never display a bearer URL, recipient,
medical answers or internal provider evidence as the support reference. Hide on account
change and clear after confirmed recovery; do not discard an uncertain-send marker.
Device acceptance must include long-press copy, maximum text, and screen-reader traversal.


### Responsive chart and recovery feedback acceptance

Keep plot labels at readable size: narrow containers scroll the chart plot horizontally
instead of shrinking its typography. Provide a named keyboard-focusable plot region and
an exact-value table. Legends wrap independently. Render canonical series order in both
legend and table; when noncolor encoding is required, use matching marker shapes in the
plot and legend as well as line dashes. Verify both themes at 320px; this does not replace
color-vision, mark-contrast or screen-reader checks.

Place recovery results beside the action that produced them. In long Medical history
screens, Check interrupted send feedback belongs directly after that control, not above
the form catalog. Announce results through the shared accessible feedback treatment and
preserve honest pending wording until a durable receipt exists.


### Shared component state contracts

Accordion callers use `isExpanded` and `onToggle`; supply either `content` or children
(explicit content takes precedence). Keyboard activation supports Enter and Space, respects
disabled state, and must not toggle from a nested control's key event. Segmented options
must have unique values and expose selection with `aria-pressed`. Wizard descriptions
must actually render; current steps expose `aria-current="step"`. Prefer minimum heights
with wrapping content over clipping descriptions to a fixed height. Gallery examples must
use supported component props so the examples demonstrate working APIs.


### Native authentication and care data states
- Sign-in and recovery forms scroll at large text sizes and with the keyboard open. Inputs have explicit labels; visibility toggles expose Show/Hide password; action targets use `control.minTarget`. Announce errors and outcomes without reading passwords or tokens.
- Recovery has request, verifying, new-password, failure and completion states. Disable duplicate submissions, retain recovery intent across restarts, and keep the normal app behind the recovery screen until completion or sign-out. Never claim an email address exists.
- Health counts and histories must come from owner-scoped records. Query failures show an error/retry state, never sample medical facts or a successful empty state. Unsupported counts use a dash with a destination label.

- Preserve date-only clinical values as calendar days; do not parse them as midnight UTC and shift them in local time. Missing or invalid dates say “Date not recorded.” Do not render action buttons with no implementation.

### Saved vital measurements
- Web and native Vitals use the shared patient-scoped reader and value/date formatters in `packages/api-client/src/vitals/`. Show newest observations first and disclose the 100-measurement limit.
- Keep recorded units, blood-pressure pairs, source/device labels, and local timestamps with a timezone. Do not infer normal/abnormal status or connect different units in a chart.
- Use semantic surfaces and adaptive text with wrapping content. Refresh must be a labeled accessible action as well as a native pull gesture. Loading, failed reads, and a successful empty history are separate states; no sample values or stale results after refresh.

### Native navigation accessibility
- Patient menus list implemented destinations only. Keep internal galleries and unavailable routes out of the production menu.
- Navigation rows expose button role and selected state. Theme toggles expose switch role and checked state. Icon-only dismiss controls require explicit labels; decorative backdrops stay out of accessibility traversal.
- Menu, profile and close targets use `control.minTarget` (48 logical points). Drawer rows grow with text rather than using fixed heights. Use modal accessibility isolation and the accessibility escape action; verify focus entry/return with VoiceOver on device.
- Sign-out prevents repeat submissions, exposes busy/disabled state, and keeps the menu open with actionable feedback when the request fails.
- At accessibility text sizes, prefer short context-specific action labels (for example, “Refresh” on Vitals). Preserve body-text scaling and wrapping. Decorative avatar initials may cap scaling at 1.2 when the containing button already has a complete accessible label.
- Native histories need bottom clearance for floating actions, in addition to normal content padding. Verify the last item remains reachable at the largest text size; source-level scroll support alone is insufficient evidence.
- Derive floating-action list clearance with `floatingContentInset(insets.bottom)` from the same `floatingAction` size/gap used by the shell. Leave at least `space.lg` between the final content and the button's top edge at maximum scroll; do not substitute a fixed bottom-padding estimate. Vitals and Records use this rule.
- On native drawer presentation, request accessibility focus on its labeled Close button using the mounted native node. On iOS dismissal, return focus to the menu opener. Exclude the underlying screen from accessibility traversal while either drawer or assistant modal is open; modal controls must remain outside that hidden subtree. Missing/unmounted nodes must not receive a focus request. Android needs separate dismissal/focus acceptance because React Native's `onDismiss` lifecycle is iOS-specific.
- Sign-in's light card uses light semantic surfaces, text, input borders and danger feedback even over a dark backdrop; backdrop labels use dark-theme text tokens. Insurance status badges use success/info/warning action colors paired with onAction text and explicit status labels. Avoid white text on bright warning yellows.
- Care consumes the current shell theme through a scoped theme provider, including nested history, stat and empty-state components. History-type badges use neutral informational colors: record type alone must not imply clinical urgency. Selected filter fills pair action/onAction tokens. Time-range dropdowns anchor below the control's actual height and expose expanded/selected state; controls retain 48-point minimum targets.
- Insurance theme tokens must flow through cards, status badges, notices and action controls. Error notices use danger (not warning); stopped coverage is informational. Primary markers use action/onAction pairs. Coverage action labels wrap within 48-point minimum-height controls; dismiss icons have labeled button roles and full-sized targets.
- Insurance empty-state copy requires a successful read. Coverage or provider lookup failures remain visible with Retry; refresh and account changes clear stale records, and late responses must not repopulate an old account's screen.

### Insurance status semantics

Stored `connected`/`verified` workflow flags display **Saved**, using the informational semantic pair. They are not evidence of eligibility or benefits. Use `insurance-status.ts` for shared labels and calendar date handling; distinguish **End date passed** from **Ending soon**. Show the eligibility notice alongside saved plans. Query errors get a persistent labeled retry state, never a successful empty-state message. Primary-selection success requires a matching persisted RPC receipt; do not optimistically claim the old plan was replaced after only one of two writes.

Insurance mutations disable conflicting actions and show progress while saving. Use a synchronous guard in addition to rendered disabled state so rapid taps cannot dispatch duplicate writes. After an account change or unmount, suppress old receipts and refreshes; never imply this cancels an already-dispatched request. Labels describe local record changes: **Mark Stopped**, **Mark Active**, **Remove saved coverage**. Removing a Vault entry does not cancel insurance.

Insurance member-ID displays must use an explicit member-ID field. Never label a hash suffix as the member ID's last digits, and never autofill a hash into registration forms. Where storage provenance is uncertain, display **Not available** and leave editable/autofill values empty. Shared `displayInsuranceMemberId` masks explicit values; it does not decode legacy storage.

New insurance identifiers are written to explicit `member_id` using `insuranceMemberIdFields`; `member_id_hash` is legacy-only and never an ID fallback. Export/autofill can use an explicit ID under the existing authenticated access rules. Mask card/assistant summaries, do not log identifier payloads or returned records, and never claim this field is application-level encrypted.

Existing coverage IDs can be re-entered inline, in a blank editor labeled **Member ID from your insurance card**. Expand the field across the card while editing; keep explicit Save ID and Cancel actions, preserving the draft on failure. Do not prefill ambiguous legacy values. Stopped plans retain usable controls at full contrast; the Stopped label communicates status without disabling the card's available actions.

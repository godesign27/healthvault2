# Website data, policy, and mark checks

## Medication end dates
- Shared `src/lib/medicationStatus.ts` defines ended status for Medical Profile and Dashboard counts.
- A date-only end date stays active through that local calendar day. A timestamp ends when its instant is past. Missing/invalid timestamps are not labeled ended.
- Medical Profile displays ended labels without adding save behavior. Dashboard uses an exact server count filtered by the same shared local calendar cutoff (end_date is a SQL date), avoiding result-row limits. Recent activity remains based on actual saved rows.

## Care
- Existing appointment timestamp now includes local time next to date.
- Encounter notes were already mapped/displayed; preserved and now retain line breaks.
- Billed amounts include zero and accept numeric strings without calling string.toFixed. Missing/invalid amounts remain absent.

## Account policy link audit / PR note
All current links resolve to existing routes in src/App.tsx: `/`, `/dashboard`, `/privacy`, `/terms`, `/support`. The support mailto is unchanged. No missing public-page destinations were found, and no policy copy or links required edits. Terms remain visibly draft, unchanged.

## Mark contrast
Reproduce with `node --test tests/markContrast.test.mjs`. This dependency-free Node test decodes the original PNG RGBA pixels using node:zlib (all PNG scanline filters), verifies opaque interior ink colors, and asserts the recorded ratios using WCAG sRGB relative luminance. No image dependency/install is required.

Computed WCAG relative luminance from opaque interior pixels of public/hv_logo-light.png and hv_logo-dark.png. Violet #180B3A, white #FFFFFF, red #ED1C24. Translucent antialiasing excluded.

| Asset/surface | Main mark | Red heart |
| --- | ---: | ---: |
| Light / #FFFFFF | 18.30:1 | 4.38:1 |
| Light / #F8FAFC | 17.49:1 | 4.19:1 |
| Dark / #0F172A | 17.85:1 | 4.07:1 |
| Dark / #1C2938 | 14.75:1 | 3.37:1 |

ColorsPage records measurements and shows the existing light/dark assets on fixed surfaces. No core colors/assets changed. Logo contrast is exempt from WCAG text thresholds; not a certification of neighboring UI.

## Validation
- `node --test tests/medicationStatus.test.mjs`: 12 boundary tests passed.
- `npm run typecheck`: only the 12 pre-existing marketing/public unused diagnostics; no diagnostics in this scope.
- No live data requests or mutations were used for these checks.

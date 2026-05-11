# Design System Migration Guide (Authenticated Product)

Effective date: 2026-05-10
Migration mode: Clean-breaking
Scope: Authenticated product pages/components

## What Changed

- Established token-foundation additions for component shape/focus/shadow:
  - Button radius + focus ring tokens
  - Card radius + shadow tokens
  - Dialog radius + shadow tokens
  - Drawer radius + shadow tokens
- Updated Tailwind extensions to expose those tokenized primitives (`rounded-hv-*`, `shadow-hv-*`).
- Migrated shared primitives to token-first styling:
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Card.tsx`
  - `src/components/ui/Dialog.tsx`
  - `src/components/ui/Drawer.tsx`
- Dialog and Drawer internals now use Radix dialog primitives for accessibility and state handling.

## Token Mapping Reference

### Canonical -> Runtime CSS Variable

- `component.button.background.primary.default`
  -> `--hv-component-button-background-primary-default`
- `component.button.text.primary.default`
  -> `--hv-component-button-text-primary-default`
- `component.button.focus.ring.default`
  -> `--hv-component-button-focus-ring-default`
- `component.card.shadow.default`
  -> `--hv-component-card-shadow-default`
- `component.dialog.shadow.default`
  -> `--hv-component-dialog-shadow-default`
- `component.drawer.shadow.default`
  -> `--hv-component-drawer-shadow-default`

## About the `--hv-` prefix and surface themes

The `hv` segment is only a **namespace** on the CSS custom property name (for example `--hv-color-brand-500`). Surface themes work by **redefining the same variable names** under a scope such as `[data-theme="dark"]` in `src/tokens/themes/theme.dark.css`. The prefix does not block theming.

What *does* break or weaken surface themes is:

- Hardcoded palette utilities (for example Tailwind `stone-*`, raw hex) that never read your tokens
- Components that do not live under a subtree where `data-theme` applies, so globals never swap

If you prefer names like `--color-brand-500` instead of `--hv-color-brand-500`, that is a **large rename** across `src/tokens/`, `tailwind.config.js`, and any `var(--hv-...)` usage. It does not fix theming by itself; it is mostly consistency and collision avoidance with third-party `--*` variables.

## Authenticated shell: `data-theme` + semantic classes

The dashboard root in `src/pages/DashboardPage.tsx` sets `data-theme="dark"` when the in-app dark toggle is on. That activates the same global overrides as `theme.dark.css`, so semantic utilities (`text-content-primary`, `bg-surface-page`, `border-stroke-subtle`, etc.) track the active surface without duplicating `darkMode ? ... : ...` color branches.

## Design system gallery: `data-surface` vs `data-theme`

Some documentation describes surface themes as `data-theme` on a container. In this repo, **light/dark** for the whole app is still `data-theme` on `document.documentElement` (see `ThemeProvider`). **Nested surface themes** (default, bold, subdued, overlay, **steel**) are implemented as **`data-surface="…"`** on a subtree, with overrides in `src/tokens/themes/theme.bold.css`, `theme.steel.css`, and siblings.

The design-system route wraps the gallery chrome in `Surface` from `src/providers/SurfaceProvider.tsx`. The sidebar **Surface theme** control switches among **`default`** (inherits `:root` / html theme tokens), **`bold`** (dark brand surface), and **`steel`** (frosted-glass gallery with indigo/teal radial wash + masked grid). The choice is persisted as `sessionStorage` key `hv-ds-surface-theme`.

**Steel** does not require `@radix-ui/themes`; it remaps the same `--hv-color-*` / `--hv-component-*` variables plus scoped chrome:

- `data-steel-chrome="sidebar"` on the app gallery sidebar and `data-steel-chrome="main"` on `DesignSystemDemoShell` enable `backdrop-filter` / borders that cannot be expressed as color variables alone.
- `data-steel-glass="true"` wraps gallery page content for a glassmorphic panel behind demos.
- Optional heading utility: class **`hv-steel-text-grad`** (indigo → teal gradient text) from `theme.steel.css` for one-off headings.

Steel **dark** appearance follows **`[data-theme="dark"] [data-surface="steel"]`** so it tracks global html light/dark from `ThemeProvider` (no separate `steel-theme` localStorage).

When **Surface theme** is set to Steel in the gallery sidebar, the same `data-surface="steel"` wrapper is applied to **Health Vault** (dashboard) and the **Projects** list so the look persists until you switch surface back to Default or Bold (`App.tsx` + `sessionStorage` `hv-ds-surface-theme`). The dashboard rail and main use the same `data-steel-chrome` hooks as the design-system shell.

## Dashboard slice (2026-05-11)

- `src/pages/DashboardPage.tsx`: removed `stone-*` / ad-hoc shell colors in favor of semantic surface and content tokens; added `data-theme` on the dashboard root.
- `src/components/DashboardSidebar.tsx`: aligned borders, backgrounds, nav states, and account actions with the same semantic token utilities.

## Health Records + Insurance slice (2026-05-11)

- `src/pages/HealthRecordsPage.tsx`: header, actions, stat chips, filters, loading state, and pending-request cards use semantic utilities (`text-content-*`, `bg-surface-*`, `border-stroke-*`, `bg-action-primary`, etc.). Status/emerald accents unchanged where they encode request state.
- Removed unused insights / `AIResultCard` block (nothing wired insights after prior cleanup).
- `src/pages/InsurancePage.tsx`: page chrome and empty state use the same semantic pattern; spinner uses `border-action-primary`. Toasts now include a stable `id` for `Toast` props.

## Care, Medical Forms, Medical Profile, Network slice (2026-05-11)

- `src/pages/MedicalProfilePage.tsx`: stat cards, section shells, list cards, and empty/loading states use `border-stroke-subtle`, `bg-surface-raised`, and icon wells `bg-surface-sunken` / semantic text; repaired invalid template fragments from an earlier replace. `actionsRef` typing includes optional `refreshData` for parity with runtime assignment.
- `src/pages/MedicalFormsPage.tsx`: header, stat grid, category progress, and form rows use semantic surfaces and content colors; disabled Share uses `bg-action-primary-disabled`; row hovers use `hover:bg-surface-sunken`.
- `src/pages/CarePage.tsx`: overview, appointments, medications, and care history (toolbar, dropdown, search, source chips, timeline cards) migrated off `stone-*` to the same semantic utilities; type chips keep intentional semantic color accents.
- `src/pages/NetworkPage.tsx`: page title, description, and tab strip use semantic text/border classes; toasts use `crypto.randomUUID()` per toast and pass required `id` into `Toast`.

## Global cleanup: ready for new surface themes (2026-05-11)

- **No remaining Tailwind `stone-*` utilities under `src/`** (verified by tree walk). Marketing, onboarding, admin, provider flows, insurance, records drawers, network tabs/drawers, AI panels, and pricing all map to semantic `text-content-*`, `bg-surface-*`, `border-stroke-*`, `stroke-subtle` (SVG), `ring-stroke-*`, `shadow-black/*`, or tokenized neutrals (`bg-hv-neutral-*`) where a literal neutral was still required.
- **SuperAdmin** table row and icon button hovers: fixed invalid `` `hover:${darkMode ? ...}` `` patterns so hover classes are real Tailwind utilities again.
- **Share / medical ID**: `HorizontalMedicalIDCard`, `ShareFormsDrawer`, `MedicalIDCard` gradients and rings use surface/stroke tokens so `data-theme` can override them consistently.

You can safely add a **new surface theme** by defining another `[data-theme="…"]` (or file under `src/tokens/themes/`) that reassigns the same `--hv-color-*` / `--hv-component-*` variables; UI should follow without hunting for `stone-*` in application code.

## Component API Notes

### Dialog

- Existing props are preserved:
  - `isOpen`, `onClose`, `title`, `children`, `size`, `footerContent`, `headerAction`
- Internals now render through `@radix-ui/react-dialog` for:
  - Escape handling
  - focus trap
  - aria semantics

### Drawer

- Existing props are preserved:
  - `isOpen`, `onClose`, `position`, `title`, `children`, `footer`, `showFooter`, `size`
- Internals now use `@radix-ui/react-dialog` portal/overlay/content behavior.

## Styling Migration Guidance

For authenticated pages/components:

1. Replace hardcoded stone/neutral utility usage with semantic token classes when equivalents exist:
   - `text-content-*`
   - `bg-surface-*`
   - `border-stroke-*`
2. Prefer shared `ui/*` primitives over one-off styled markup.
3. Use component variants/states over ad-hoc per-screen color logic.

## Breaking Changes Summary

- Visual tokens now drive core primitive shape/shadow/ring behavior.
- Dialog/Drawer DOM internals changed (Radix-backed). Tests/selectors relying on previous internal structure may need updates.
- Any direct styling assumptions around old primitive internals should be revalidated.

## Validation Results

- `npm run build`: passes
- `npm run lint`: fails due to pre-existing repository ESLint rule configuration/runtime issue unrelated to refactor slice
- `npm run typecheck`: fails with pre-existing repository errors outside the modified files
- Changed files lint diagnostics: no new linter errors reported in modified files

## Next Steps

1. **New surface theme**: add `src/tokens/themes/theme.<name>.css`, wire it in global imports and/or set `data-theme` from product settings; extend `tailwind.config.js` only if you need new semantic aliases.
2. **Vitals**: replace the dashboard placeholder with real UI using the same semantic utilities when product is ready.
3. Add visual regression snapshots for primary flows (dashboard, records, insurance, care, forms, profile, network, onboarding).
4. Introduce a CI guard (e.g. `rg stone- src` or ESLint `no-restricted-syntax`) so `stone-*` does not creep back into `src/`.


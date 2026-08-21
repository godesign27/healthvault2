# Design System Refactor Plan (Authenticated Product, Clean-Breaking)

Generated: 2026-05-10
Decision: Radix primitives + shadcn-style UI layer (no Chakra migration)
Scope: Authenticated product pages/components only

## 1) Token Renames / Canonical Mapping

The codebase currently uses CSS variable names. To align with canonical strategy, adopt this mapping model:

- Global canonical -> CSS var
  - `color.brand.500` -> `--hv-color-brand-500`
  - `color.neutral.100` -> `--hv-color-neutral-100`
- Semantic canonical -> CSS var
  - `color.action.primary.default` -> `--hv-color-action-primary-default`
  - `color.surface.raised` -> `--hv-color-surface-raised`
- Component canonical -> CSS var
  - `component.button.background.primary.default` -> `--hv-component-button-background-primary-default`
  - `component.input.border.focus` -> `--hv-component-input-border-focus`

Action:
- Keep runtime CSS variable format.
- Standardize naming contract in docs and component APIs around canonical names.
- Ensure property-before-variant ordering across all component tokens.

## 2) Token Migrations

- Update component primitives to consume component-token vars first (instead of page-level utility colors).
- Replace ad-hoc stone/neutral utility references in authenticated paths with semantic aliases (`text-content-*`, `bg-surface-*`, `border-stroke-*`) and component variants.
- Normalize overlay/background usage in dialogs/drawers through dedicated component tokens.

## 3) New Tokens Needed

Add or normalize these component-level tokens to reduce ad-hoc class usage:

- Button
  - `component.button.radius.default`
  - `component.button.focus.ring.default`
- Card
  - `component.card.shadow.default`
  - `component.card.radius.default`
- Dialog
  - `component.dialog.radius.default`
  - `component.dialog.shadow.default`
- Drawer
  - `component.drawer.shadow.default`

Implementation detail:
- Represent these as CSS vars in `src/tokens/component/*.css` and consume via primitive components.

## 4) Theme Extraction / Surface Context

Use existing theme files and tighten container-level theme intent:

- `theme.default.css`: base authenticated workspace
- `theme.subdued.css`: sidebars/nav/recessed containers
- `theme.overlay.css`: dialog/drawer/popover surfaces
- `theme.bold.css`: high-emphasis brand sections only

Action:
- Ensure authenticated overlay components explicitly consume overlay/surface tokens rather than arbitrary utility colors.

## 5) File Structure Changes

No major directory reshuffle required.

Target structure (preserved):
- `src/tokens/global/*`
- `src/tokens/semantic/*`
- `src/tokens/component/*`
- `src/tokens/themes/*`

Refactor focus:
- Component primitives in `src/components/ui/*`
- Authenticated pages/components using those primitives

## 6) Breaking Changes

Clean-breaking changes to apply:

- Primitive behavior:
  - `Dialog` and `Drawer` internals moved to Radix-backed accessibility model.
- Styling:
  - Remove authenticated reliance on ad-hoc `stone` utility colors where component tokens exist.
- Component API consistency:
  - Prefer standardized variants/sizes/states from `src/components/ui/*`.

## 7) Implementation Sequence

1. Token foundation updates (`src/tokens/component/*`, `tailwind.config.js` where needed)
2. Shared authenticated primitives (`Button`, `Card`, `Dialog`, `Drawer`)
3. High-traffic authenticated screens:
   - `DashboardPage`
   - `HealthRecordsPage`
   - `InsurancePage`
4. Remaining authenticated pages/components
5. Validation + migration guide

## 8) Validation Gates

After each phase:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual check: login -> dashboard -> records -> insurance -> network


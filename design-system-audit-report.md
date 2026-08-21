# Design System Token Audit Report (Authenticated Product Scope)

Generated: 2026-05-10
Scope: Authenticated routes and components rendered from `health-vault` view in `src/App.tsx`

## Summary

- Token files discovered: 25 CSS files under `src/tokens`
- Token variable counts (current prefix model):
  - Global-like (`--hv-color-*` primitives): 116
  - Semantic-like (`--hv-color-action|surface|text|border-*`): 118
  - Component-like (`--hv-component-*`): 220
- Existing architecture already follows Global -> Semantic -> Component import order in `src/tokens/index.css`
- Authenticated UI still contains extensive hardcoded utility/color usage in page/component markup, especially `*-stone-*` classes and direct utility composition

## Authenticated Scope Inventory

- Routing/auth gate:
  - `src/App.tsx`
- Authenticated shell:
  - `src/pages/DashboardPage.tsx`
- Authenticated pages rendered by dashboard:
  - `src/pages/CarePage.tsx`
  - `src/pages/MedicalFormsPage.tsx`
  - `src/pages/MedicalProfilePage.tsx`
  - `src/pages/NetworkPage.tsx`
  - `src/pages/InsurancePage.tsx`
  - `src/pages/HealthRecordsPage.tsx`
  - `src/pages/DashboardPage.tsx` (dashboard content)
- Core reusable authenticated components (high impact):
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Card.tsx`
  - `src/components/ui/Dialog.tsx`
  - `src/components/ui/Drawer.tsx`
  - `src/components/DashboardSidebar.tsx`
  - `src/components/AIAssistantPanel.tsx`
  - `src/components/records/*`
  - `src/components/insurance/*`
  - `src/components/network/*`

## Tier Compliance Findings

### Check 1: Global = raw values only

- Result: Mostly compliant.
- Notes:
  - Global files in `src/tokens/global/*.css` are raw hex/RGBA primitives.
  - Theme files also intentionally contain raw overrides.

### Check 2: Semantic = references global only

- Result: Mostly compliant.
- Notes:
  - `src/tokens/semantic/*.css` references global colors via `var(--hv-color-...)`.
  - No direct component-level references discovered in semantic files.

### Check 3: Component = references semantic only

- Result: Mostly compliant with a few semantic-quality issues.
- Notes:
  - `src/tokens/component/*.css` predominantly point to semantic vars (`action/surface/text/border`).
  - Some mappings are semantically questionable (example: destructive disabled background mapped to primary disabled in button tokens), but still tier-compliant.

### Check 4: Property-before-variant ordering

- Result: Compliant in current component token files.
- Examples:
  - `--hv-component-button-background-primary-default`
  - `--hv-component-input-border-focus`
  - `--hv-component-table-row-background-selected`

### Check 5: Theme structure

- Result: Compliant.
- Notes:
  - Themes live in `src/tokens/themes/*` (not nested under `global/`).
  - Themes override global token values and preserve semantic/component references.

## Violations and Gaps

## 1) Naming strategy mismatch with target canonical format

- Current implementation uses CSS variable prefixes:
  - `--hv-color-*`
  - `--hv-component-*`
- Target strategy requires canonical token names:
  - `component.button.background.primary.default`
  - `color.action.primary.default`
  - `color.brand.500`
- Impact: Naming translation layer is needed to align code/docs/tooling with canonical strategy.

## 2) Hardcoded UI styles in authenticated flows

- Many authenticated files still rely on hardcoded utility styling (`text-stone-*`, `bg-stone-*`, ad-hoc spacing/radius/shadows) instead of component tokenized variants.
- Highest-impact occurrences:
  - `src/pages/DashboardPage.tsx`
  - `src/components/DashboardSidebar.tsx`
  - `src/components/AIAssistantPanel.tsx`
  - `src/components/records/RecordCard.tsx`
  - `src/components/network/ProviderCard.tsx`

## 3) Primitive divergence risk

- Tailwind semantic aliases in `tailwind.config.js` are good, but usage across authenticated components is inconsistent (mix of token-backed classes and non-token color scales).
- Impact: Theme switching and future client-theme overlays can drift.

## 4) Orphaned token risk

- Token definitions exceed direct references in authenticated UI paths.
- Requires follow-up usage graph pass after migration to identify true orphans safely.

## Recommended Theme Enhancements (Authenticated Scope)

- Preserve existing surface themes (`default`, `bold`, `subdued`, `overlay`).
- Strengthen usage of:
  - `surface.page|raised|sunken|overlay`
  - `text.primary|secondary|tertiary|on-action`
  - `action.primary|secondary|destructive`
- Apply theme wrappers in authenticated containers where contextual surface intent changes (main shell vs overlays).

## Risk Assessment

- Technical risk: Medium
- UX regression risk: Medium-high for clean-breaking mode unless migration is component-first.
- Recommended mitigation:
  1. Migrate shared UI primitives first (`Button`, `Card`, `Dialog`, `Drawer`)
  2. Replace page-level ad-hoc styling with primitive variants
  3. Run typecheck/lint/build and manual auth-path verification after each slice


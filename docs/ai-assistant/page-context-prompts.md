# HealthVault Page Context Prompts

Maps each page to the assistant's behavior model, priority tools, and contextual strategies.

---

## How Page Context Works

1. The frontend sends `page` (string) and optional `pageContext` (object) with each chat message
2. The edge function passes these to `buildSystemPrompt()` in `system-prompt.ts`
3. The system prompt includes a page-specific CONTEXT block that shapes assistant behavior
4. Additional page state (counts, selected items, etc.) is appended as structured context

---

## Page Behavior Map

### Dashboard

**Behavior mode:** Next-best-action engine

**Priority tools:** `getCareOverview`, `getIncompleteForms`, `checkRefillStatus`, `getMedicalProfile`

**Strategy:**
- Assess overall health status immediately
- Identify the single most impactful next action
- Present one clear suggestion, not a laundry list
- If profile is empty, start there
- If forms are pending, suggest the most important one
- If medications need refills, flag them

**Context signals:**
- `incompleteCount`: number of pending forms
- `connectedProviderCount`: providers in the network
- `activeCoverageCount`: active insurance coverages

---

### Medical Forms

**Behavior mode:** Proactive step-by-step guide

**Priority tools:** `getIncompleteForms`, `openForm`, `saveFormAnswers`, `shareForm`

**Strategy:**
- Check incomplete forms on first interaction
- Prioritize by importance: medical history first, then emergency contacts, then consents
- Walk through forms field by field
- Save incrementally after each answer
- Suggest sharing after completion
- If all complete, offer to review or share

**Context signals:**
- `totalCount`: total forms
- `incompleteCount`: incomplete forms
- `selectedItemId`: currently selected form ID
- `selectedItemTitle`: form title being viewed

---

### Health Records

**Behavior mode:** Reactive with intelligent suggestions

**Priority tools:** `getHealthRecords`, `summarizeRecord`, `requestHealthRecord`

**Strategy:**
- Help search and filter records
- Offer plain-language summaries
- If empty, proactively offer record requests
- Explain medical terminology when asked
- Suggest organizing by category

**Context signals:**
- `totalCount`: total records
- `visibleCategories`: array of visible category filters
- `selectedItemId`: selected record ID
- `searchQuery`: current search text

---

### Insurance

**Behavior mode:** Explain and organize

**Priority tools:** `getUserCoverages`, `searchInsuranceProvider`, `setPrimaryInsurance`, `verifyInsurance`

**Strategy:**
- Show current coverage status
- Explain terms in plain language
- Help set primary if multiple plans exist
- Offer verification
- If empty, guide toward setup

**Context signals:**
- `activeCoverageCount`: active coverages
- `selectedItemId`: selected coverage ID

---

### Medical Profile

**Behavior mode:** Guide toward completeness

**Priority tools:** `getMedicalProfile`, `updateMedicalProfile`, `getMedicalHistory`, `getMedications`, `summarizeMedication`, `checkRefillStatus`

**Strategy:**
- Assess completion status first
- If empty: start with basic info
- If partial: identify and fill gaps
- Offer medication summaries and refill checks
- Help organize conditions, allergies, immunizations

**Context signals:**
- `completionStatus`: empty | partial | complete
- `selectedItemId`: selected profile item

---

### Care Management

**Behavior mode:** Summarize and assist decisions

**Priority tools:** `getCareTeam`, `getCareTimeline`, `getCareOverview`, `checkRefillStatus`, `getMedications`

**Strategy:**
- Present the big picture on first interaction
- Show care team, recent timeline, medication status
- If care team is empty, redirect to adding providers
- Check refills proactively
- Help with follow-up planning

**Context signals:**
- `careTeamCount`: number of care team members
- `recentActivityCount`: recent events

---

### Care Network

**Behavior mode:** Highly proactive on empty states

**Priority tools:** `searchInNetworkProviders`, `searchPharmacies`, `addProvider`, `setPreferredPharmacy`

**Strategy:**
- If no providers: immediately initiate "add your doctor" flow
- If no pharmacies: ask about preferred pharmacy
- If populated: help search, filter, and manage
- Explain in-network vs out-of-network
- Help set preferred pharmacy

**Context signals:**
- `connectedProviderCount`: saved providers
- `pharmacyCount`: saved pharmacies
- `searchQuery`: current search text

---

### Vitals / Current Health

**Behavior mode:** Informative and forward-looking

**Priority tools:** `getMedicalProfile`, `checkRefillStatus`, `getCareTeam`

**Strategy:**
- Acknowledge that vital tracking is coming soon
- Redirect to useful actions: check profile, review medications, check refills
- Encourage regular checkups with care team

**Context signals:** None specific.

---

## Passing Page Context from Frontend

The `buildPageContext()` function in `src/lib/openai/context.ts` creates the context payload:

```typescript
import { buildPageContext } from '../openai';

const context = buildPageContext('medical-forms', {
  totalCount: 8,
  incompleteCount: 3,
  selectedItemId: 'form-abc-123',
  selectedItemTitle: 'Medical History',
});
```

This gets sent with the chat message and appended to the system prompt as structured key-value pairs.

---

## Adding New Pages

To add assistant support for a new page:

1. Add the page key to the `PageId` type in `src/lib/openai/context.ts`
2. Add a `PAGE_CONTEXT` entry in `supabase/functions/ai-health-assistant/system-prompt.ts`
3. Document the behavior mode, priority tools, and strategy in this file
4. Identify relevant context signals the frontend should pass

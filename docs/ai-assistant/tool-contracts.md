# HealthVault AI Tools — Contracts

This document defines the contract for each backend tool available to the HealthVault AI Assistant.

---

## 1. getIncompleteForms

**Purpose:** Retrieve the user's incomplete medical forms with completion metadata.

**Backend location:** `src/lib/ai-tools/forms.ts`

**Required inputs:** None

**Optional inputs:**
- `category` (string) — filter by form category

**Output shape:**
```
{
  success: boolean,
  data: Array<{
    id: string,
    templateId: string,
    title: string,
    description: string,
    category: string,
    status: "incomplete",
    answeredFields: number,
    totalFields: number,
    updatedAt: string
  }>,
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Patient profile not found (no forms linked)
- Database query failure

**Auth:** Required. Scoped to the authenticated user's patient profile.

**Implementation status:** Real logic. Queries `form_responses` joined with `form_templates` via Supabase.

---

## 2. openForm

**Purpose:** Load a form's definition, fields, and current saved answers.

**Backend location:** `src/lib/ai-tools/forms.ts`

**Required inputs:** One of:
- `formId` (string) — existing form response ID
- `templateId` (string) — template ID to start a new form

**Optional inputs:** None

**Output shape:**
```
{
  success: boolean,
  data: {
    responseId: string | null,
    templateId: string,
    title: string,
    description: string,
    category: string,
    version: string,
    fields: Array<{
      linkId: string,
      text: string,
      type: string,
      required: boolean,
      options?: string[]
    }>,
    savedAnswers: Record<string, unknown>,
    status: "complete" | "incomplete" | "new",
    signedAt: string | null
  },
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Form response not found (invalid formId)
- Template not found (invalid templateId)
- Neither formId nor templateId provided

**Auth:** Required.

**Implementation status:** Real logic. Queries `form_templates` and `form_responses`.

---

## 3. saveFormAnswers

**Purpose:** Save partial or complete form answers. Supports incremental saves.

**Backend location:** `src/lib/ai-tools/forms.ts`

**Required inputs:**
- `templateId` (string) — the form template being answered
- `answers` (Record<string, unknown>) — key-value map of field answers

**Optional inputs:**
- `formId` (string) — existing response ID for updates (omit to create new)
- `markComplete` (boolean, default false) — set true only when all required fields are filled

**Output shape:**
```
{
  success: boolean,
  data: {
    formId: string,
    status: "complete" | "incomplete",
    savedFields: number
  },
  message: string
}
```

**Confirmation required:** No (incremental saves are safe)

**Error cases:**
- Patient profile not found
- Form response not found (invalid formId)
- Database write failure
- Invalid answer payload

**Auth:** Required. Creates/updates records scoped to the user's patient profile.

**Implementation status:** Real logic. Upserts `form_responses` in Supabase. Merges answers for incremental saves.

---

## 4. shareForm

**Purpose:** Share completed forms to a recipient via secure link.

**Backend location:** `src/lib/ai-tools/forms.ts`

**Required inputs:**
- `formIds` (string[]) — at least one form response ID
- `recipientName` (string) — display name of recipient
- `recipientEmail` (string, email format) — recipient's email
- `confirmed` (boolean) — MUST be true to execute

**Optional inputs:**
- `recipientOrg` (string) — organization name
- `note` (string) — message to include with the share

**Output shape:**
```
{
  success: boolean,
  data: {
    shareId: string,
    status: string,
    recipientEmail: string,
    expiresAt: string
  },
  message: string
}
```

**Confirmation required:** YES. The tool blocks execution if `confirmed !== true`.

**Error cases:**
- confirmed is false (blocked)
- Any form is not in "complete" status
- Form not found
- Share edge function failure
- Email delivery failure (non-blocking; share still created)

**Auth:** Required. Calls the `/functions/v1/share` edge function with the user's auth token.

**Implementation status:** Real logic. Delegates to the existing `share` edge function which creates `share_events`, generates FHIR bundles, and sends email via Resend.

---

## 5. getHealthRecords

**Purpose:** Retrieve health records for the authenticated user with optional filters.

**Backend location:** `src/lib/ai-tools/records.ts`

**Required inputs:** None

**Optional inputs:**
- `kind` (enum: lab, imaging, pathology, specialist_report, other) — filter by category
- `source` (enum: connected, uploaded, shared) — filter by how record was obtained
- `fromDate` (string, date) — start of date range
- `toDate` (string, date) — end of date range
- `search` (string) — text search across title, provider name, AI summary
- `limit` (number, 1-100, default 50) — max results

**Output shape:**
```
{
  success: boolean,
  data: Array<{
    id: string,
    kind: string,
    title: string,
    providerName: string | null,
    providerId: string | null,
    serviceDate: string | null,
    receivedAt: string,
    source: string,
    fileType: string | null,
    fileSizeBytes: number | null,
    previewUrl: string | null,
    aiSummary: string | null,
    tags: string[],
    fhirRef: object | null
  }>,
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Database query failure
- Invalid filter values

**Auth:** Required. RLS enforces user_id ownership.

**Implementation status:** Real logic. Queries the `health_records` Supabase table. Note: The table was just created. The existing UI still renders from in-memory mock data (`src/lib/records/mock.ts`). Records need to be populated via upload, FHIR import, or manual entry. The UI should be migrated to use this table in a future iteration.

---

## 6. summarizeRecord

**Purpose:** Return a safe, non-diagnostic summary of a health record.

**Backend location:** `src/lib/ai-tools/records.ts`

**Required inputs:**
- `recordId` (string) — the health record ID to summarize

**Output shape:**
```
{
  success: boolean,
  data: {
    recordId: string,
    title: string,
    kind: string,
    providerName: string | null,
    serviceDate: string | null,
    existingSummary: string | null,
    generatedSummary: string
  },
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Record not found
- User does not own the record
- Database query failure

**Auth:** Required. Checks user_id ownership.

**Implementation status:** Real logic with local summary generation. If the record already has an `ai_summary` field, returns it directly. Otherwise generates a structured factual summary from record metadata. Future enhancement: call OpenAI for richer summarization of record content.

---

## 7. searchInsuranceProvider

**Purpose:** Search the internal catalog of insurance providers.

**Backend location:** `src/lib/ai-tools/insurance.ts`

**Required inputs:**
- `query` (string) — search term

**Optional inputs:**
- `limit` (number, 1-50, default 20) — max results

**Output shape:**
```
{
  success: boolean,
  data: Array<{
    id: string,
    name: string,
    payerId: string | null,
    logoUrl: string | null,
    slug: string,
    isPopular: boolean
  }>,
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Empty query
- Database query failure

**Auth:** Not required. Insurance provider catalog is public reference data.

**Implementation status:** Real logic. Queries the `insurance_providers` table. The catalog needs to be populated with provider records. Currently the table may be empty depending on seed data.

---

## 8. getUserCoverages

**Purpose:** List the user's insurance coverages.

**Backend location:** `src/lib/ai-tools/insurance.ts`

**Required inputs:** None

**Optional inputs:**
- `activeOnly` (boolean, default true) — filter to active coverages

**Output shape:**
```
{
  success: boolean,
  data: Array<{
    id: string,
    planName: string,
    providerName: string,
    memberIdMasked: string,
    groupNumber: string | null,
    relationship: string,
    isPrimary: boolean,
    verificationStatus: string,
    coverageStatus: string,
    effectiveStart: string,
    effectiveEnd: string | null
  }>,
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Database query failure

**Auth:** Required. Scoped to user_id.

**Implementation status:** Real logic. Queries `insurance_coverages` joined with `insurance_providers`.

---

## 9. searchInNetworkProviders

**Purpose:** Search the user's saved care providers.

**Backend location:** `src/lib/ai-tools/network.ts`

**Required inputs:** None (at least one filter recommended)

**Optional inputs:**
- `query` (string) — text search across name, specialty, clinic
- `specialty` (string) — filter by specialty
- `relationship` (enum) — filter by relationship type
- `inNetworkOnly` (boolean, default false) — show only in-network
- `limit` (number, 1-50, default 20) — max results

**Output shape:**
```
{
  success: boolean,
  data: Array<{
    id: string,
    name: string,
    specialty: string | null,
    clinic: string | null,
    phone: string | null,
    email: string | null,
    address: string | null,
    relationship: string | null,
    connectionSource: string,
    lastVisitDate: string | null,
    inNetwork: boolean | null,
    notes: string | null
  }>,
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Database query failure

**Auth:** Required. Scoped to user_id.

**Implementation status:** Real logic. Queries the `providers` table in Supabase. Note: This searches the user's *saved* providers, not an external provider directory. External directory search would require a third-party integration (e.g., NPI registry API) which is not yet connected.

---

## 10. searchPharmacies

**Purpose:** Search the user's saved pharmacies.

**Backend location:** `src/lib/ai-tools/network.ts`

**Required inputs:** None

**Optional inputs:**
- `query` (string) — text search across name, chain, address
- `preferredOnly` (boolean, default false) — show only preferred
- `inNetworkOnly` (boolean, default false) — show only in-network
- `limit` (number, 1-50, default 20) — max results

**Output shape:** Similar to providers. See `PharmacyResult` type.

**Confirmation required:** No

**Auth:** Required.

**Implementation status:** Real logic. Queries the `pharmacies` table.

---

## 11. getMedicalHistory

**Purpose:** Retrieve the user's medical history across conditions, medications, allergies, and immunizations. Can filter to a single section.

**Backend location:** `src/lib/ai-tools/medical-history.ts`

**Required inputs:** None

**Optional inputs:**
- `section` (enum: conditions, medications, allergies, immunizations, all; default all) — which section to return

**Output shape:**
```
{
  success: boolean,
  data: {
    conditions?: Array<{ id, name, status, onsetDate }>,
    medications?: Array<{ id, name, dosage, frequency, isActive }>,
    allergies?: Array<{ id, allergen, severity, reaction }>,
    immunizations?: Array<{ id, name, dateAdministered, nextDose }>
  },
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Database query failure

**Auth:** Required. Scoped to user_id.

**Implementation status:** Real logic. Queries `conditions`, `medications`, `allergies`, `immunizations` tables in parallel.

---

## 12. requestHealthRecord

**Purpose:** Submit a request to obtain health records from a specific provider. Creates a pending request.

**Backend location:** `src/lib/ai-tools/records.ts`

**Required inputs:**
- `providerName` (string) — name of the provider to request records from
- `confirmed` (boolean) — MUST be true to execute

**Optional inputs:**
- `providerId` (string) — provider ID if known
- `recordTypes` (string[], default []) — types of records to request
- `dateRangeStart` (string) — start of date range for requested records
- `dateRangeEnd` (string) — end of date range for requested records
- `notes` (string) — additional notes for the request

**Output shape:**
```
{
  success: boolean,
  data: {
    requestId: string,
    providerName: string,
    status: "pending"
  },
  message: string
}
```

**Confirmation required:** YES. Blocks if `confirmed !== true`.

**Error cases:**
- confirmed is false (blocked)
- Database insert failure

**Auth:** Required. Inserts with user_id ownership.

**Implementation status:** Real logic. Inserts into `health_record_requests` table.

---

## 13. setPrimaryInsurance

**Purpose:** Set a specific insurance coverage as the user's primary plan. Clears primary status from all other coverages first.

**Backend location:** `src/lib/ai-tools/insurance.ts`

**Required inputs:**
- `coverageId` (string) — the coverage ID to mark as primary
- `confirmed` (boolean) — MUST be true to execute

**Output shape:**
```
{
  success: boolean,
  data: {
    coverageId: string,
    isPrimary: true
  },
  message: string
}
```

**Confirmation required:** YES. Blocks if `confirmed !== true`.

**Error cases:**
- confirmed is false (blocked)
- Database error clearing existing primary
- Database error setting new primary
- Coverage not found or not owned by user

**Auth:** Required. Updates scoped to user_id.

**Implementation status:** Real logic. Two-step update on `insurance_coverages`: first clears all `is_primary`, then sets the target.

---

## 14. verifyInsurance

**Purpose:** Mark an insurance coverage as verified. Updates verification status and timestamp.

**Backend location:** `src/lib/ai-tools/insurance.ts`

**Required inputs:**
- `coverageId` (string) — the coverage ID to verify

**Output shape:**
```
{
  success: boolean,
  data: {
    coverageId: string,
    verificationStatus: "verified"
  },
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Coverage not found or not owned by user
- Database update failure

**Auth:** Required. Checks user_id ownership before update.

**Implementation status:** Real logic. Reads coverage to verify ownership, then updates `verification_status` and `last_verified_at` on `insurance_coverages`.

---

## 15. addProvider

**Purpose:** Add a new care provider/doctor to the user's saved care network.

**Backend location:** `src/lib/ai-tools/network.ts`

**Required inputs:**
- `name` (string) — provider name
- `confirmed` (boolean) — MUST be true to execute

**Optional inputs:**
- `specialty` (string) — medical specialty
- `clinic` (string) — clinic/practice name
- `phone` (string) — phone number
- `email` (string) — email address
- `address` (string) — physical address
- `relationship` (enum: Primary, Specialist, Dental, Vision, Therapy, Other) — relationship type
- `inNetwork` (boolean) — whether provider is in-network

**Output shape:**
```
{
  success: boolean,
  data: {
    id: string,
    name: string
  },
  message: string
}
```

**Confirmation required:** YES. Blocks if `confirmed !== true`.

**Error cases:**
- confirmed is false (blocked)
- Database insert failure

**Auth:** Required. Inserts with user_id ownership. Sets `connection_source` to "Manual".

**Implementation status:** Real logic. Inserts into `providers` table.

---

## 16. setPreferredPharmacy

**Purpose:** Set a pharmacy as the user's preferred pharmacy. Clears preferred status from all other pharmacies first.

**Backend location:** `src/lib/ai-tools/network.ts`

**Required inputs:**
- `pharmacyId` (string) — the pharmacy ID to mark as preferred
- `confirmed` (boolean) — MUST be true to execute

**Output shape:**
```
{
  success: boolean,
  data: {
    pharmacyId: string,
    preferred: true
  },
  message: string
}
```

**Confirmation required:** YES. Blocks if `confirmed !== true`.

**Error cases:**
- confirmed is false (blocked)
- Database error clearing existing preferred
- Database error setting new preferred

**Auth:** Required. Updates scoped to user_id.

**Implementation status:** Real logic. Two-step update on `pharmacies`: clears all `preferred`, then sets the target.

---

## 17. getMedications

**Purpose:** List the user's medications with dosage, frequency, prescriber, and active/inactive status.

**Backend location:** `src/lib/ai-tools/medications.ts`

**Required inputs:** None

**Optional inputs:**
- `activeOnly` (boolean, default false) — filter to currently active medications
- `search` (string) — text search across medication name and prescriber
- `limit` (number, 1-100, default 50) — max results

**Output shape:**
```
{
  success: boolean,
  data: Array<{
    id: string,
    name: string,
    dosage: string | null,
    frequency: string | null,
    prescribedBy: string | null,
    startDate: string | null,
    endDate: string | null,
    isActive: boolean,
    notes: string | null
  }>,
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Database query failure

**Auth:** Required. Scoped to user_id.

**Implementation status:** Real logic. Queries `medications` table. Active status derived from `end_date` compared to today.

---

## 18. summarizeMedication

**Purpose:** Generate a plain-language summary of a specific medication including dosage, frequency, prescriber, duration, and active status.

**Backend location:** `src/lib/ai-tools/medications.ts`

**Required inputs:**
- `medicationId` (string) — the medication ID to summarize

**Output shape:**
```
{
  success: boolean,
  data: {
    id: string,
    name: string,
    dosage: string | null,
    frequency: string | null,
    prescribedBy: string | null,
    isActive: boolean,
    duration: string,
    summary: string
  },
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Medication not found or not owned by user
- Database query failure

**Auth:** Required. Checks user_id ownership.

**Implementation status:** Real logic. Queries single medication from `medications` table. Builds a structured factual summary locally (no LLM call). Duration computed from start/end dates.

---

## 19. checkRefillStatus

**Purpose:** Check which medications may need a refill soon. Flags medications with end dates within 30 days.

**Backend location:** `src/lib/ai-tools/medications.ts`

**Required inputs:** None

**Optional inputs:**
- `medicationId` (string) — check a specific medication only

**Output shape:**
```
{
  success: boolean,
  data: {
    medications: Array<{
      id: string,
      name: string,
      isActive: boolean,
      endDate: string | null,
      daysRemaining: number | null,
      needsRefill: boolean
    }>
  },
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Database query failure

**Auth:** Required. Scoped to user_id.

**Implementation status:** Real logic. Queries `medications` table, computes `daysRemaining` from `end_date`, sets `needsRefill = true` if active and within 30 days.

---

## 20. getCareTeam

**Purpose:** Return the user's care team members (doctors, specialists, therapists) with roles and contact info.

**Backend location:** `src/lib/ai-tools/care.ts`

**Required inputs:** None

**Optional inputs:**
- `primaryOnly` (boolean, default false) — filter to primary care team members only
- `search` (string) — text search across name, specialty, organization

**Output shape:**
```
{
  success: boolean,
  data: Array<{
    id: string,
    name: string,
    title: string | null,
    specialty: string | null,
    organization: string | null,
    email: string | null,
    phone: string | null,
    isPrimary: boolean,
    notes: string | null
  }>,
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Database query failure

**Auth:** Required. Scoped to user_id.

**Implementation status:** Real logic. Queries `care_team` table. Sorted by primary status (descending) then name.

---

## 21. getCareTimeline

**Purpose:** Return a chronological timeline of care events aggregated from health records, form completions, and share events.

**Backend location:** `src/lib/ai-tools/care.ts`

**Required inputs:** None

**Optional inputs:**
- `limit` (number, 1-50, default 20) — max events to return

**Output shape:**
```
{
  success: boolean,
  data: Array<{
    type: "record" | "form" | "share",
    id: string,
    title: string,
    date: string,
    detail: string | null
  }>,
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Database query failures (non-blocking; partial results returned if one source fails)

**Auth:** Required. Scoped to user_id / patient_id.

**Implementation status:** Real logic. Parallel queries to `health_records`, `form_responses` (joined with `form_templates`), and `share_events`. Merged and sorted by date descending.

---

## 22. getCareOverview

**Purpose:** Return a high-level summary of the user's overall care status in a single call.

**Backend location:** `src/lib/ai-tools/care.ts`

**Required inputs:** None

**Output shape:**
```
{
  success: boolean,
  data: {
    careTeamCount: number,
    activeMedications: number,
    pendingForms: number,
    recentRecords: number,
    activeConditions: number,
    allergies: number,
    upcomingImmunizations: number
  },
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Database query failures

**Auth:** Required. Scoped to user_id / patient_id.

**Implementation status:** Real logic. Seven parallel count queries across `care_team`, `medications`, `form_responses`, `health_records`, `conditions`, `allergies`, and `immunizations`. Active medications derived from `end_date`; upcoming immunizations derived from `next_dose`.

---

## 23. getMedicalProfile

**Purpose:** Return the user's profile overview: personal information and counts of medical data items with a completion status assessment.

**Backend location:** `src/lib/ai-tools/profile.ts`

**Required inputs:** None

**Output shape:**
```
{
  success: boolean,
  data: {
    user: {
      firstName: string,
      lastName: string,
      email: string,
      dateOfBirth: string | null,
      phone: string | null
    } | null,
    counts: {
      conditions: number,
      medications: number,
      allergies: number,
      immunizations: number
    },
    completionStatus: "empty" | "partial" | "complete"
  },
  message: string
}
```

**Confirmation required:** No

**Error cases:**
- Database query failures

**Auth:** Required. Scoped to user_id.

**Implementation status:** Real logic. Parallel queries to `user_profiles`, `conditions`, `medications`, `allergies`, `immunizations`. Completion status: empty (no profile + no items), partial (some data), complete (profile + 2+ items).

---

## 24. updateMedicalProfile

**Purpose:** Update the user's profile information (name, phone, date of birth). Confirmation required.

**Backend location:** `src/lib/ai-tools/profile.ts`

**Required inputs:**
- `confirmed` (boolean) — MUST be true to execute

**Optional inputs (at least one required):**
- `firstName` (string) — update first name
- `lastName` (string) — update last name
- `phone` (string) — update phone number
- `dateOfBirth` (string) — update date of birth

**Output shape:**
```
{
  success: boolean,
  data: {
    updated: boolean,
    fields: string[]
  },
  message: string
}
```

**Confirmation required:** YES. Blocks if `confirmed !== true`.

**Error cases:**
- confirmed is false (blocked)
- No fields provided to update
- Database update failure

**Auth:** Required. Updates scoped to user_id.

**Implementation status:** Real logic. Updates `user_profiles` table. Only provided fields are modified; `updated_at` timestamp is set automatically.

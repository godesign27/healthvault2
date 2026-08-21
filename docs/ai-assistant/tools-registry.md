# HealthVault Tools Registry

Complete reference of all 26 tools available to the AI assistant. The **Edge Function is the single source of truth** (`supabase/functions/ai-health-assistant/tools.ts`).

> **Architecture note (updated 2026-06-05):** The browser-side AI path (`src/api/assistant/run.ts`, `src/lib/openai/tools.ts`) has been deprecated and removed from active use. `AIAssistantPanel` now routes all messages exclusively through the authenticated Edge Function via `sendChatMessage` in `src/lib/openai/client.ts`. The legacy `src/lib/ai-tools/*.ts` handler files are also unused — the Edge Function manages its own tool execution. Both should be deleted in a future cleanup.

---

## Tool Index

| # | Tool | Domain | Confirmation | Auth |
|---|------|--------|-------------|------|
| 1 | getMedicalHistory | Profile | No | Yes |
| 2 | getIncompleteForms | Forms | No | Yes |
| 3 | openForm | Forms | No | Yes |
| 4 | saveFormAnswers | Forms | No | Yes |
| 5 | shareForm | Forms | Yes | Yes |
| 6 | getHealthRecords | Records | No | Yes |
| 7 | getHealthRecordRequests | Records | No | Yes |
| 8 | summarizeRecord | Records | No | Yes |
| 9 | requestHealthRecord | Records | Yes | Yes |
| 10 | deleteHealthRecordRequest | Records | Yes | Yes |
| 11 | searchInsuranceProvider | Insurance | No | No |
| 12 | getUserCoverages | Insurance | No | Yes |
| 13 | setPrimaryInsurance | Insurance | Yes | Yes |
| 14 | verifyInsurance | Insurance | No | Yes |
| 15 | searchInNetworkProviders | Network | No | Yes |
| 16 | searchPharmacies | Network | No | Yes |
| 17 | addProvider | Network | Yes | Yes |
| 18 | setPreferredPharmacy | Network | Yes | Yes |
| 19 | getMedications | Medications | No | Yes |
| 20 | summarizeMedication | Medications | No | Yes |
| 21 | checkRefillStatus | Medications | No | Yes |
| 22 | getCareTeam | Care | No | Yes |
| 23 | getCareTimeline | Care | No | Yes |
| 24 | getCareOverview | Care | No | Yes |
| 25 | getMedicalProfile | Profile | No | Yes |
| 26 | updateMedicalProfile | Profile | Yes | Yes |

---

## Tools by Domain

### Profile

**getMedicalHistory** -- Retrieves conditions, medications, allergies, and immunizations. Filter by section.
- Input: `{ section?: 'conditions' | 'medications' | 'allergies' | 'immunizations' | 'all' }`
- Output: `{ conditions?, medications?, allergies?, immunizations? }`
- Tables: `conditions`, `medications`, `allergies`, `immunizations`

**getMedicalProfile** -- Returns user profile overview with medical data counts and completion status.
- Input: `{}`
- Output: `{ user, counts, completionStatus }`
- Tables: `user_profiles`, `conditions`, `medications`, `allergies`, `immunizations`

**updateMedicalProfile** -- Updates user profile fields. Confirmation required.
- Input: `{ firstName?, lastName?, phone?, dateOfBirth?, confirmed }`
- Output: `{ updated, fields }`
- Tables: `user_profiles`

### Forms

**getIncompleteForms** -- Lists incomplete forms with completion progress.
- Input: `{ category? }`
- Output: `Array<{ id, templateId, title, category, answeredFields, totalFields }>`
- Tables: `form_responses`, `form_templates`, `patient_profiles`

**openForm** -- Loads a form definition with fields and saved answers.
- Input: `{ formId? | templateId? }`
- Output: `{ responseId, templateId, title, fields, savedAnswers, status }`
- Tables: `form_responses`, `form_templates`

**saveFormAnswers** -- Saves partial or complete form answers. Incremental.
- Input: `{ templateId, answers, formId?, markComplete? }`
- Output: `{ formId, status, savedFields }`
- Tables: `form_responses`, `patient_profiles`

**shareForm** -- Shares completed forms via secure link. Confirmation required.
- Input: `{ formIds, recipientName, recipientEmail, confirmed, recipientOrg?, note? }`
- Output: `{ shareId, status, recipientEmail, expiresAt }`
- Tables: `form_responses`; calls `/functions/v1/share`

### Records

**getHealthRecords** -- Retrieves health records with filters.
- Input: `{ kind?, source?, fromDate?, toDate?, search?, limit? }`
- Output: `Array<{ id, kind, title, providerName, serviceDate, source, aiSummary, tags }>`
- Tables: `health_records`

**getHealthRecordRequests** -- Lists manual record requests (email + secure portal). Omits secure tokens.
- Input: `{ requestId?, status?, limit? }`
- Output: `Array<{ id, providerName, status, openedAt, submittedAt, ... }>`
- Tables: `health_record_requests`

**summarizeRecord** -- Returns a plain-language summary of a health record.
- Input: `{ recordId }`
- Output: `{ recordId, title, kind, providerName, serviceDate, summary }`
- Tables: `health_records`

**requestHealthRecord** -- Sends a manual record request via `/functions/v1/record-request` (provider email + secure upload link). Confirmation required.
- Input: `{ providerName, providerEmail, confirmed, providerId?, doctorName?, patientName?, recordTypes?, dateRangeStart?, dateRangeEnd?, message?, notes?, urgency? }`
- Output: `{ requestId, providerName, status, emailSent?, emailError?, expiresAt? }`
- Tables: `health_record_requests` (written by edge function)

**deleteHealthRecordRequest** -- Deletes/cancels a manual record request. Confirmation required.
- Input: `{ requestId, confirmed }`
- Output: `{ requestId, deleted: true }`
- Tables: `health_record_requests`

### Insurance

**searchInsuranceProvider** -- Searches the insurance provider catalog. No auth required.
- Input: `{ query, limit? }`
- Output: `Array<{ id, name, payerId, slug, isPopular }>`
- Tables: `insurance_providers`

**getUserCoverages** -- Lists user's insurance coverages.
- Input: `{ activeOnly? }`
- Output: `Array<{ id, planName, providerName, memberIdMasked, isPrimary, coverageStatus }>`
- Tables: `insurance_coverages`, `insurance_providers`

**setPrimaryInsurance** -- Sets a coverage as primary. Confirmation required.
- Input: `{ coverageId, confirmed }`
- Output: `{ coverageId, isPrimary }`
- Tables: `insurance_coverages`

**verifyInsurance** -- Marks a coverage as verified.
- Input: `{ coverageId }`
- Output: `{ coverageId, verificationStatus }`
- Tables: `insurance_coverages`

### Network

**searchInNetworkProviders** -- Searches user's saved providers.
- Input: `{ query?, specialty?, relationship?, inNetworkOnly?, limit? }`
- Output: `Array<{ id, name, specialty, clinic, phone, relationship, inNetwork }>`
- Tables: `providers`

**searchPharmacies** -- Searches user's saved pharmacies.
- Input: `{ query?, preferredOnly?, inNetworkOnly?, limit? }`
- Output: `Array<{ id, name, chain, phone, address, preferred, inNetwork }>`
- Tables: `pharmacies`

**addProvider** -- Adds a provider to the user's network. Confirmation required.
- Input: `{ name, confirmed, specialty?, clinic?, phone?, email?, address?, relationship?, inNetwork? }`
- Output: `{ id, name }`
- Tables: `providers`

**setPreferredPharmacy** -- Sets a pharmacy as preferred. Confirmation required.
- Input: `{ pharmacyId, confirmed }`
- Output: `{ pharmacyId, preferred }`
- Tables: `pharmacies`

### Medications

**getMedications** -- Lists user's medications with active/inactive status.
- Input: `{ activeOnly?, search?, limit? }`
- Output: `Array<{ id, name, dosage, frequency, prescribedBy, isActive }>`
- Tables: `medications`

**summarizeMedication** -- Plain-language summary of a specific medication.
- Input: `{ medicationId }`
- Output: `{ id, name, dosage, frequency, isActive, duration, summary }`
- Tables: `medications`

**checkRefillStatus** -- Flags medications expiring within 30 days.
- Input: `{ medicationId? }`
- Output: `{ medications: Array<{ id, name, isActive, daysRemaining, needsRefill }> }`
- Tables: `medications`

### Care

**getCareTeam** -- Returns care team members.
- Input: `{ primaryOnly?, search? }`
- Output: `Array<{ id, name, title, specialty, organization, isPrimary }>`
- Tables: `care_team`

**getCareTimeline** -- Chronological timeline of care events.
- Input: `{ limit? }`
- Output: `Array<{ type, id, title, date, detail }>` (type may include `record_request`)
- Tables: `health_records`, `health_record_requests`, `form_responses`, `share_events`

**getCareOverview** -- High-level health status summary.
- Input: `{}`
- Output: `{ careTeamCount, activeMedications, pendingForms, recentRecords, recordRequestsAwaitingProvider, recordRequestsCompleted, activeConditions, allergies, upcomingImmunizations }`
- Tables: `care_team`, `medications`, `form_responses`, `health_records`, `health_record_requests`, `conditions`, `allergies`, `immunizations`

---

## Implementation Locations

| Layer | Location | Count | Status |
|-------|----------|-------|--------|
| **Edge function (active)** | `supabase/functions/ai-health-assistant/tools.ts` | 26 tools | ✅ Active |
| Tool contracts | `docs/ai-assistant/tool-contracts.md` | 26 sections | ✅ Active |
| Browser registry (deprecated) | `src/lib/openai/tools.ts` | 32 tools | ⚠️ Deprecated — delete |
| Browser handlers (deprecated) | `src/lib/ai-tools/*.ts` (7 files) | 26 handlers | ⚠️ Deprecated — delete |
| Browser run path (deprecated) | `src/api/assistant/run.ts` | — | ⚠️ Deprecated — delete |

---

## Capability gaps (tools needed in Edge Function)

The deprecated browser registry included tools not yet in the Edge Function. These should be added when the features are built:

| Capability | Missing tool | Notes |
|---|---|---|
| Medical ID card data | `getMedicalID` | Returns blood type, organ donor, emergency contact |
| Preventive care | `getPreventiveCare` | Reads `preventive_care` table |
| Appointments | `getAppointments` | Table/feature not yet built |
| Care encounters | `getEncounters` | Table/feature not yet built |
| Provider record connection | `resolveProviderRecordConnection`, `startProviderConnection`, `startEpicConnection`, `fetchProviderRecordPreview` | EHR connection flow |
| Provider org search | `searchProviderOrganizations` | NPI/org directory search |
| Connected providers list | `getConnectedProviders` | Lists EHR-connected providers |

---

## Adding a New Tool

1. Add the tool handler inside `supabase/functions/ai-health-assistant/tools.ts`
2. Deploy: `npx supabase functions deploy ai-health-assistant`
3. Document the contract in `docs/ai-assistant/tool-contracts.md`
4. Add to this registry index table
5. Update system prompt if the tool changes page behavior

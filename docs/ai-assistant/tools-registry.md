# HealthVault Tools Registry

Complete reference of all 24 backend tools available to the AI assistant. Each tool is registered in both the frontend registry (`src/lib/ai-tools/registry.ts`) and the edge function (`supabase/functions/ai-health-assistant/tools.ts`).

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
| 7 | summarizeRecord | Records | No | Yes |
| 8 | requestHealthRecord | Records | Yes | Yes |
| 9 | searchInsuranceProvider | Insurance | No | No |
| 10 | getUserCoverages | Insurance | No | Yes |
| 11 | setPrimaryInsurance | Insurance | Yes | Yes |
| 12 | verifyInsurance | Insurance | No | Yes |
| 13 | searchInNetworkProviders | Network | No | Yes |
| 14 | searchPharmacies | Network | No | Yes |
| 15 | addProvider | Network | Yes | Yes |
| 16 | setPreferredPharmacy | Network | Yes | Yes |
| 17 | getMedications | Medications | No | Yes |
| 18 | summarizeMedication | Medications | No | Yes |
| 19 | checkRefillStatus | Medications | No | Yes |
| 20 | getCareTeam | Care | No | Yes |
| 21 | getCareTimeline | Care | No | Yes |
| 22 | getCareOverview | Care | No | Yes |
| 23 | getMedicalProfile | Profile | No | Yes |
| 24 | updateMedicalProfile | Profile | Yes | Yes |

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

**summarizeRecord** -- Returns a plain-language summary of a health record.
- Input: `{ recordId }`
- Output: `{ recordId, title, kind, providerName, serviceDate, summary }`
- Tables: `health_records`

**requestHealthRecord** -- Submits a record request to a provider. Confirmation required.
- Input: `{ providerName, confirmed, providerId?, recordTypes?, dateRangeStart?, dateRangeEnd?, notes? }`
- Output: `{ requestId, providerName, status }`
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
- Output: `Array<{ type, id, title, date, detail }>`
- Tables: `health_records`, `form_responses`, `share_events`

**getCareOverview** -- High-level health status summary.
- Input: `{}`
- Output: `{ careTeamCount, activeMedications, pendingForms, recentRecords, activeConditions, allergies, upcomingImmunizations }`
- Tables: `care_team`, `medications`, `form_responses`, `health_records`, `conditions`, `allergies`, `immunizations`

---

## Implementation Locations

| Layer | Location | Count |
|-------|----------|-------|
| Frontend registry | `src/lib/ai-tools/registry.ts` | 24 tools |
| Frontend handlers | `src/lib/ai-tools/*.ts` (7 files) | 24 handlers |
| Edge function definitions | `supabase/functions/ai-health-assistant/tools.ts` | 24 tools |
| Tool contracts | `docs/ai-assistant/tool-contracts.md` | 24 contracts |

---

## Adding a New Tool

1. Create the handler function in the appropriate `src/lib/ai-tools/[domain].ts` file
2. Define a Zod input schema and export both
3. Register in `src/lib/ai-tools/registry.ts`
4. Export from `src/lib/ai-tools/index.ts`
5. Add the tool handler to `supabase/functions/ai-health-assistant/tools.ts`
6. Deploy the edge function
7. Document the contract in `docs/ai-assistant/tool-contracts.md`
8. Add to this registry
9. Update system prompt if the tool changes page behavior

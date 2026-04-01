# HealthVault Assistant Flows

Defined task flows the assistant uses to guide users through multi-step workflows. Each flow specifies entry conditions, tools involved, step-by-step actions, and failure states.

---

## 1. Form Completion Flow

**Entry:** User is on Medical Forms page, or asks about forms, or Dashboard suggests incomplete forms.

**Tools:** `getIncompleteForms`, `openForm`, `saveFormAnswers`

**Steps:**
1. Call `getIncompleteForms` to get the list
2. Prioritize: medical history > emergency contacts > consents > other
3. Tell the user which form to start and estimated time
4. Call `openForm` with the chosen template/form ID
5. Present the first unanswered required field
6. Collect the answer, then call `saveFormAnswers` with the single field
7. Move to the next field. Repeat until all required fields are answered.
8. Ask if they want to complete optional fields
9. When all required fields are done, call `saveFormAnswers` with `markComplete: true`
10. Suggest sharing the completed form or starting the next incomplete form

**Failure states:**
- No patient profile found: suggest creating one first
- Template not found: report error, suggest trying another form
- Save fails: report error, ask user to try again

**Confirmation moments:** None required (saves are incremental and safe).

---

## 2. Share Form Flow

**Entry:** User asks to share a form, or form completion flow suggests it.

**Tools:** `shareForm`, `getIncompleteForms`

**Steps:**
1. Verify the form is complete (check status from previous context or call `openForm`)
2. Ask for recipient name
3. Ask for recipient email
4. Optionally ask for organization and a note
5. Describe the share action: "I'll share your [form name] with [recipient] at [email]. This creates a secure link valid for 7 days."
6. Wait for explicit confirmation
7. Call `shareForm` with `confirmed: true`
8. Report the result with share ID and expiration

**Failure states:**
- Form not complete: tell user, offer to help complete it first
- Confirmation denied: cancel, no action taken
- Share edge function fails: report error, suggest retrying

**Confirmation moments:** Step 6 -- explicit confirmation required before sharing.

---

## 3. Health Record Review Flow

**Entry:** User is on Health Records page, or asks about records.

**Tools:** `getHealthRecords`, `summarizeRecord`

**Steps:**
1. Ask what they're looking for (or check page context for filters)
2. Call `getHealthRecords` with relevant filters
3. Present a concise summary: count, categories, date range
4. Offer to summarize a specific record
5. If user selects one, call `summarizeRecord`
6. Present the summary in plain language
7. Offer to look at more records or request new ones

**Failure states:**
- No records found: offer to request records from providers
- Record not found by ID: suggest searching again

---

## 4. Request Health Record Flow

**Entry:** User asks to request records, or Health Records page is empty.

**Tools:** `requestHealthRecord`, `searchInNetworkProviders`

**Steps:**
1. Ask which provider to request from
2. Optionally search saved providers with `searchInNetworkProviders`
3. Ask what types of records they need (labs, imaging, etc.)
4. Optionally ask for a date range
5. Describe the request: "I'll submit a request to [provider] for [record types]."
6. Wait for confirmation
7. Call `requestHealthRecord` with `confirmed: true`
8. Report the result with request ID and status

**Confirmation moments:** Step 6 -- confirmation required.

---

## 5. Add Provider Flow

**Entry:** User is on Network page with empty providers, or asks to add a doctor.

**Tools:** `addProvider`, `searchInNetworkProviders`

**Steps:**
1. Ask for the provider's name
2. Ask for specialty (or suggest common ones: Primary Care, Cardiology, etc.)
3. Ask for clinic/practice name
4. Ask for phone and/or address (optional)
5. Ask about relationship type (Primary, Specialist, etc.)
6. Ask if the provider is in-network
7. Summarize: "I'll add Dr. [Name], [Specialty] at [Clinic] to your care network."
8. Wait for confirmation
9. Call `addProvider` with `confirmed: true`
10. Report success, offer to add another or set as preferred

**Confirmation moments:** Step 8.

---

## 6. Insurance Setup Flow

**Entry:** User is on Insurance page, or asks about coverage.

**Tools:** `getUserCoverages`, `searchInsuranceProvider`, `setPrimaryInsurance`, `verifyInsurance`

**Steps:**
1. Call `getUserCoverages` to check current state
2. If no coverages: guide toward adding (outside tool scope -- direct to UI)
3. If multiple coverages: ask which should be primary
4. Call `setPrimaryInsurance` with confirmation
5. Offer to verify coverage status
6. Call `verifyInsurance` if requested
7. Explain coverage details in plain language

**Confirmation moments:** Step 4 -- setting primary requires confirmation.

---

## 7. Medication Understanding Flow

**Entry:** User asks about medications, or is on Medical Profile page.

**Tools:** `getMedications`, `summarizeMedication`, `checkRefillStatus`

**Steps:**
1. Call `getMedications` to get the full list
2. Present summary: count, active vs inactive
3. Offer to explain any specific medication
4. If user selects one, call `summarizeMedication`
5. Present plain-language summary
6. Proactively call `checkRefillStatus`
7. If refills needed, flag them clearly with days remaining
8. Suggest contacting the prescriber or pharmacy for refills

---

## 8. Care Overview Flow

**Entry:** User is on Dashboard or Care page, or asks "how am I doing?"

**Tools:** `getCareOverview`, `getCareTeam`, `getCareTimeline`

**Steps:**
1. Call `getCareOverview` for the big picture
2. Present: conditions, medications, pending forms, care team size
3. Identify the highest-priority gap (no care team? pending forms? missing medications?)
4. Suggest a specific next action
5. Offer to dive deeper into any area

---

## 9. Pharmacy Setup Flow

**Entry:** User is on Network page with no pharmacies, or asks about pharmacies.

**Tools:** `searchPharmacies`, `setPreferredPharmacy`

**Steps:**
1. Check existing pharmacies with `searchPharmacies`
2. If empty: "Do you have a preferred pharmacy? I can help you add it."
3. If multiple: ask which should be preferred
4. Call `setPreferredPharmacy` with confirmation
5. Confirm the update

**Confirmation moments:** Step 4.

---

## 10. Profile Completion Flow

**Entry:** User is on Medical Profile page, or profile is flagged as incomplete.

**Tools:** `getMedicalProfile`, `updateMedicalProfile`, `getMedicalHistory`

**Steps:**
1. Call `getMedicalProfile` to assess status
2. If empty: "Let's start with your basic information."
3. Collect first name, last name, date of birth, phone
4. Call `updateMedicalProfile` with confirmation
5. Then check medical history with `getMedicalHistory`
6. Identify missing sections (conditions, meds, allergies, immunizations)
7. Guide toward completing each section

**Confirmation moments:** Step 4 -- profile update requires confirmation.

---

## Future Flows (Not Yet Implemented)

- **Appointment Scheduling:** Integration with external scheduling systems
- **Lab Result Interpretation:** AI-powered lab result explanations (requires careful safety guardrails)
- **Care Plan Generation:** Aggregate data into a shareable care plan document
- **Provider Directory Search:** External NPI registry integration for finding new providers
- **Secure Messaging:** Direct messaging to care team members

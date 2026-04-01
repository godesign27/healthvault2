# HealthVault AI Assistant — Task Flows

This document describes the primary task flows the assistant supports, including entry points, tools involved, branching logic, and failure states.

---

## 1. Complete a Form

**Entry points:**
- User says "Help me fill out my forms" or "What forms do I need to complete?"
- User navigates to Medical Forms page and assistant suggests incomplete forms
- User clicks an incomplete form in the UI

**Required context:** Authenticated user with a patient profile

**Tools involved:**
1. `getIncompleteForms` — discover what needs attention
2. `openForm` — load fields and saved progress
3. `saveFormAnswers` — save answers incrementally

**Flow:**

```
1. Call getIncompleteForms
   └─ If 0 forms → "All your forms are complete!"
   └─ If 1+ forms → List them with completion %

2. User selects a form (or assistant suggests the most urgent)
   └─ Call openForm with templateId or formId

3. Present fields one at a time (or in logical groups)
   └─ For each field, ask the user or auto-fill from profile data
   └─ Call saveFormAnswers incrementally every few fields

4. When all required fields are answered:
   └─ Ask: "All required fields are filled. Should I mark this form as complete?"
   └─ If yes → saveFormAnswers with markComplete=true
   └─ If no → Keep as incomplete, user can return later
```

**Blockers / failure states:**
- Patient profile not found → Cannot link form responses. Ask user to complete onboarding.
- Form template not found → Inform user and suggest contacting support.
- Save failure → Report error, suggest retry. Do not claim saved.

**Confirmation moments:**
- Before marking a form as complete (markComplete=true)

---

## 2. Share a Form

**Entry points:**
- User says "Share my forms with Dr. Chen"
- User selects forms in the UI and clicks Share
- Assistant suggests sharing after form completion

**Required context:** At least one completed form. Recipient details (name, email).

**Tools involved:**
1. `getIncompleteForms` — verify forms are complete (optional check)
2. `openForm` — confirm form status if needed
3. `shareForm` — execute the share

**Flow:**

```
1. Identify which forms to share
   └─ If user specifies by name → match against known forms
   └─ If unclear → call getIncompleteForms (filtered to complete) to list options

2. Collect recipient details
   └─ Ask for recipient name (required)
   └─ Ask for recipient email (required)
   └─ Ask for organization (optional)
   └─ Ask for a note (optional)

3. Confirm the action
   └─ "I'll share [form names] with [recipient] at [email]. Proceed?"
   └─ Wait for explicit confirmation

4. Call shareForm with confirmed=true
   └─ Success → "Forms shared! [Recipient] will receive a secure link valid for 7 days."
   └─ Failure → Report the specific error
```

**Blockers / failure states:**
- Form is incomplete → "This form isn't complete yet. Would you like to finish it first?"
- Form not found → "I couldn't find that form. Here are your available forms: ..."
- Share function error → Report and suggest retry
- Email delivery fails → Share still created; inform user the link exists but email may not have arrived

**Confirmation moments:**
- Before calling shareForm (confirmed=true is required by the tool)

---

## 3. Review Health Records

**Entry points:**
- User says "Show me my health records" or "What lab results do I have?"
- User navigates to Health Records page
- User asks about a specific record type or date range

**Required context:** Authenticated user

**Tools involved:**
1. `getHealthRecords` — retrieve with optional filters

**Flow:**

```
1. Determine filters from user's request
   └─ "lab results" → kind: "lab"
   └─ "from last month" → fromDate/toDate
   └─ "from Dr. Chen" → search: "Chen"
   └─ No filter → return all records

2. Call getHealthRecords with filters

3. Present results
   └─ If 0 records → "No records found matching your criteria."
   └─ If 1-5 records → List with key details (title, provider, date)
   └─ If 6+ records → Summarize count by category, offer to filter further
```

**Blockers / failure states:**
- No records in the system → Suggest uploading records or connecting a provider
- Database error → Report and suggest retry

**Confirmation moments:** None (read-only)

---

## 4. Summarize a Record

**Entry points:**
- User says "Summarize this record" or "What does this lab result say?"
- User clicks a record and asks for explanation

**Required context:** A specific record ID

**Tools involved:**
1. `getHealthRecords` — find the record if not already identified
2. `summarizeRecord` — generate summary

**Flow:**

```
1. Identify which record to summarize
   └─ If user provides ID or title → use directly
   └─ If ambiguous → call getHealthRecords to list options, ask user to pick

2. Call summarizeRecord with the recordId

3. Present the summary
   └─ If existing AI summary available → present it
   └─ If generated from metadata → present with note that it's based on available metadata
   └─ Add disclaimer: "For medical interpretation, please consult your healthcare provider."
```

**Blockers / failure states:**
- Record not found → "I couldn't find that record. Would you like to search for it?"
- Access denied → "You don't have access to that record."

**Confirmation moments:** None (read-only)

---

## 5. Connect / Search Insurance

**Entry points:**
- User says "Add my insurance" or "Find Blue Cross Blue Shield"
- User navigates to Insurance page
- Assistant detects no active coverage

**Required context:** None for search. Auth required for viewing coverages.

**Tools involved:**
1. `searchInsuranceProvider` — find providers in catalog
2. `getUserCoverages` — view existing coverages

**Flow:**

```
1. Determine intent
   └─ "What insurance do I have?" → getUserCoverages
   └─ "Find [provider name]" → searchInsuranceProvider
   └─ "Add insurance" → searchInsuranceProvider, then guide to UI

2a. For viewing coverages:
   └─ Call getUserCoverages
   └─ Present: plan name, provider, masked member ID, status
   └─ Highlight any coverages needing attention

2b. For searching providers:
   └─ Call searchInsuranceProvider with query
   └─ Present matching results
   └─ If user selects one → guide them to the insurance connection UI flow
```

**Blockers / failure states:**
- No coverages found → "You don't have any insurance on file. Would you like to add coverage?"
- No providers match search → "No providers found for that name. Try a different search term."
- Empty provider catalog → "The insurance provider directory is being populated. Please try again later."

**Confirmation moments:** None for search/view. Adding coverage requires the UI flow.

---

## 6. Search In-Network Doctor / Provider

**Entry points:**
- User says "Find a dermatologist" or "Who are my in-network providers?"
- User asks "Is Dr. Smith in my network?"

**Required context:** Authenticated user with saved providers

**Tools involved:**
1. `searchInNetworkProviders` — search saved providers
2. `searchPharmacies` — if asking about pharmacies
3. `getUserCoverages` — for insurance context if needed

**Flow:**

```
1. Parse the user's request
   └─ Specialty filter → specialty parameter
   └─ Name search → query parameter
   └─ "In-network" → inNetworkOnly: true
   └─ "My primary doctor" → relationship: "Primary"

2. Call searchInNetworkProviders with parsed filters

3. Present results
   └─ If 0 → "No providers found matching your criteria."
   └─ If results → List with name, specialty, clinic, network status

4. If user asks about a provider not in their saved list:
   └─ "I can only search your saved providers. Would you like to add a new provider?"
   └─ Guide to the Add Provider flow in the UI
```

**Blockers / failure states:**
- No saved providers → "You haven't added any providers yet. Would you like to add one?"
- No in-network matches → "None of your saved providers are marked as in-network."

**Confirmation moments:** None (read-only search)

---

## Future Flows (Not Yet Implemented)

These flows are planned but require additional tools or integrations:

- **Request health records from a provider** — requires the request flow edge function
- **Upload a health record** — requires file upload integration
- **Log vitals** — requires vitals table and tools
- **Schedule an appointment** — requires scheduling integration
- **External provider directory search** — requires NPI registry or similar API

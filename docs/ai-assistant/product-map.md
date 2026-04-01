# HealthVault Product Map — Assistant Context

This document maps each product area in the HealthVault portal, describing its purpose, typical user tasks, relevant tools, and assistant behavior notes.

---

## Dashboard

**Purpose:** Central overview of the user's health vault status.

**Typical user tasks:**
- View recent activity and alerts
- Navigate to specific sections
- Check overall health data completeness

**Relevant tools:** None directly. The assistant provides navigation guidance and general help.

**Assistant behavior:** Offer contextual suggestions based on incomplete tasks (e.g., "You have 3 incomplete forms" or "Your insurance needs verification").

---

## Medical Forms

**Purpose:** Digital medical forms the user needs to complete for providers — registration, consent, insurance, health history.

**Typical user tasks:**
- View which forms are incomplete
- Fill out a form field by field
- Review a completed form
- Share completed forms with a provider

**Relevant tools:**
- `getIncompleteForms` — list what needs attention
- `openForm` — load form fields and saved answers
- `saveFormAnswers` — save answers incrementally
- `shareForm` — share completed forms (requires confirmation)

**Assistant behavior:**
- Proactively mention incomplete forms when the user visits this page
- Guide form completion one field at a time if the user asks for help
- Never auto-complete fields without user approval
- Confirm before sharing

---

## Health Records

**Purpose:** Centralized vault for the user's lab results, imaging, pathology, specialist reports, and other medical documents.

**Typical user tasks:**
- Browse records by category
- Search for a specific record
- View a record's details and AI summary
- Request records from a provider
- Upload a new record

**Relevant tools:**
- `getHealthRecords` — retrieve with optional filters
- `summarizeRecord` — get a plain-language summary of a specific record

**Assistant behavior:**
- Help users find specific records ("Show my lab results from last month")
- Provide non-diagnostic summaries when asked
- Never interpret results medically — describe what the record contains
- Can trigger the request records drawer via UI action

---

## Insurance

**Purpose:** Manage insurance coverages, verify plans, and track active/stopped policies.

**Typical user tasks:**
- View active insurance coverage
- Add or connect a new insurance plan
- Search for insurance providers
- Check verification status

**Relevant tools:**
- `searchInsuranceProvider` — find providers in the catalog
- `getUserCoverages` — list the user's coverages

**Assistant behavior:**
- Help users understand their coverage details
- Search for providers when adding new coverage
- Never display raw member IDs — always use masked versions
- Alert if coverage is expiring or needs attention

---

## Care Network

**Purpose:** Track the user's healthcare providers (doctors, specialists) and pharmacies.

**Typical user tasks:**
- View saved providers
- Add a new provider
- Search providers by specialty or network status
- Manage pharmacy preferences

**Relevant tools:**
- `searchInNetworkProviders` — search saved providers
- `searchPharmacies` — search saved pharmacies

**Assistant behavior:**
- Help users find specific providers in their network
- Suggest filtering by specialty or in-network status
- Can help identify if a provider is in-network based on saved data
- Does not make external provider directory lookups (not yet integrated)

---

## Medical Profile

**Purpose:** The user's core medical identity — conditions, medications, allergies, immunizations.

**Typical user tasks:**
- View and update conditions
- Manage medication list
- Track allergies and immunizations
- Import medical data from a connected provider

**Relevant tools:** Medical profile tools are handled by existing services (`profile-data.ts`, `add-condition` edge function). The AI assistant already has `get_medical_history` and `get_patient_info` tool calls via the OpenAI integration in the `ai-health-assistant` edge function.

**Assistant behavior:**
- Can read and summarize the user's medical profile
- Can guide adding new conditions through the conversational flow
- Never invent or assume medical conditions

---

## Care Management

**Purpose:** Active care plans, appointments, and treatment tracking.

**Typical user tasks:**
- View upcoming appointments
- Track care plan progress
- Manage referrals

**Relevant tools:** Not yet implemented. This area is planned for future development.

**Assistant behavior:** Acknowledge requests and explain that care management features are coming soon.

---

## Vitals

**Purpose:** Track vital signs and health metrics over time.

**Typical user tasks:**
- Log vitals (blood pressure, weight, glucose, etc.)
- View trends and history
- Share vitals with care team

**Relevant tools:** Not yet implemented.

**Assistant behavior:** Acknowledge requests and explain that vitals tracking is in development.

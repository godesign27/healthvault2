# HealthVault Tool Exposure Map

This document maps each public OpenAI tool name to its backend handler, input schema, and current status.

## Tool Registry

| # | OpenAI Tool Name | Backend Handler | Confirmation | Status |
|---|---|---|---|---|
| 1 | `getMedicalHistory` | `tools.ts → getMedicalHistory` | No | Real |
| 2 | `getIncompleteForms` | `tools.ts → getIncompleteForms` | No | Real |
| 3 | `openForm` | `tools.ts → openForm` | No | Real |
| 4 | `saveFormAnswers` | `tools.ts → saveFormAnswers` | No | Real |
| 5 | `shareForm` | `tools.ts → shareForm` → `/functions/v1/share` | Yes | Real |
| 6 | `getHealthRecords` | `tools.ts → getHealthRecords` | No | Real |
| 7 | `summarizeRecord` | `tools.ts → summarizeRecord` | No | Real (local summary) |
| 8 | `searchInsuranceProvider` | `tools.ts → searchInsuranceProvider` | No | Real |
| 9 | `getUserCoverages` | `tools.ts → getUserCoverages` | No | Real |
| 10 | `searchInNetworkProviders` | `tools.ts → searchInNetworkProviders` | No | Real |
| 11 | `searchPharmacies` | `tools.ts → searchPharmacies` | No | Real |

## Detailed Tool Schemas

### 1. getMedicalHistory

Retrieves conditions, medications, allergies, and immunizations.

**Parameters:**
- `section` (string, optional): `conditions | medications | allergies | immunizations | all`. Default: `all`

**Returns:** Object with arrays for each section requested.

---

### 2. getIncompleteForms

Returns incomplete medical forms with completion progress.

**Parameters:**
- `category` (string, optional): Filter by form category.

**Returns:** Array of form objects with `id`, `templateId`, `title`, `category`, `answeredFields`, `totalFields`, `updatedAt`.

---

### 3. openForm

Returns form definition with fields and saved answers.

**Parameters:**
- `formId` (string, optional): Existing form response ID.
- `templateId` (string, optional): Template ID for new form.

At least one of `formId` or `templateId` is required.

**Returns:** Form detail with `responseId`, `templateId`, `title`, `fields[]`, `savedAnswers`, `status`.

---

### 4. saveFormAnswers

Saves partial or complete form answers with incremental merging.

**Parameters:**
- `formId` (string, optional): Existing response ID for update.
- `templateId` (string, required): Template ID.
- `answers` (object, required): Key-value map of field answers.
- `markComplete` (boolean, optional): Mark as complete when all fields filled.

**Returns:** `formId`, `status`, `savedFields` count.

---

### 5. shareForm

Shares completed forms via secure link. Requires `confirmed: true`.

**Parameters:**
- `formIds` (string[], required): IDs of completed forms.
- `recipientName` (string, required): Recipient's name.
- `recipientEmail` (string, required): Recipient's email.
- `recipientOrg` (string, optional): Organization name.
- `note` (string, optional): Message to include.
- `confirmed` (boolean, required): Must be true.

**Returns:** `shareId`, `status`, `recipientEmail`, `expiresAt`.

---

### 6. getHealthRecords

Returns health records with flexible filtering.

**Parameters:**
- `kind` (string, optional): `lab | imaging | pathology | specialist_report | other`
- `source` (string, optional): `connected | uploaded | shared`
- `fromDate` (string, optional): YYYY-MM-DD start.
- `toDate` (string, optional): YYYY-MM-DD end.
- `search` (string, optional): Free-text search.
- `limit` (number, optional): 1-100, default 50.

**Returns:** Array of record objects with `id`, `kind`, `title`, `providerName`, `serviceDate`, `source`, `aiSummary`, `tags`.

---

### 7. summarizeRecord

Returns a factual summary of a specific health record.

**Parameters:**
- `recordId` (string, required): ID of the record.

**Returns:** `recordId`, `title`, `kind`, `providerName`, `serviceDate`, `summary`.

Note: Returns existing `ai_summary` if available, otherwise builds a metadata-based summary locally. Does not call an LLM for summarization.

---

### 8. searchInsuranceProvider

Searches the insurance provider catalog.

**Parameters:**
- `query` (string, required): Search term.
- `limit` (number, optional): 1-50, default 20.

**Returns:** Array of providers with `id`, `name`, `payerId`, `slug`, `isPopular`.

---

### 9. getUserCoverages

Returns the user's insurance coverages.

**Parameters:**
- `activeOnly` (boolean, optional): Default true.

**Returns:** Array of coverages with `id`, `planName`, `providerName`, `memberIdMasked`, `relationship`, `isPrimary`, `coverageStatus`.

---

### 10. searchInNetworkProviders

Searches the user's saved care providers.

**Parameters:**
- `query` (string, optional): Search by name/specialty/clinic.
- `specialty` (string, optional): Filter by specialty.
- `relationship` (string, optional): `Primary | Specialist | Dental | Vision | Therapy | Other`
- `inNetworkOnly` (boolean, optional): Filter to in-network.
- `limit` (number, optional): 1-50, default 20.

**Returns:** Array of providers with `id`, `name`, `specialty`, `clinic`, `phone`, `relationship`, `inNetwork`.

---

### 11. searchPharmacies

Searches the user's saved pharmacies.

**Parameters:**
- `query` (string, optional): Search by name/chain.
- `preferredOnly` (boolean, optional): Filter to preferred.
- `inNetworkOnly` (boolean, optional): Filter to in-network.
- `limit` (number, optional): 1-50, default 20.

**Returns:** Array of pharmacies with `id`, `name`, `chain`, `phone`, `address`, `preferred`, `inNetwork`.

## Confirmation Requirements

Only `shareForm` requires confirmation. The model must:
1. Describe the action to the user (which forms, to whom)
2. Ask for explicit confirmation
3. Call the tool with `confirmed: true` only after the user agrees

All other tools are read-only or safe incremental saves.

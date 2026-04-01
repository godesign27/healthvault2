# Provider Record Connection

## Feature Definition

Provider Record Connection is Health Vault's system for importing medical records from external healthcare providers. It determines the best digital pathway to connect to a provider and retrieve patient data.

This is **not** a "MyChart integration." Epic/MyChart is one possible connection path when the provider organization happens to use Epic as their EHR vendor.

## Strategy Order

The system resolves the best connection strategy in this priority order:

1. **Existing Connection** — The user already has an active digital connection to the provider organization. Records can be synced immediately.
2. **Direct Provider Connection** — The provider organization supports a direct EHR connection via SMART on FHIR. The user authorizes access through the provider's authorization server.
3. **Epic Connection** — The provider organization uses Epic and supports connection through their patient portal (e.g., MyChart). This is a specific case of SMART on FHIR using Epic's infrastructure.
4. **Manual Fallback** — No digital connection path is available. The user can submit a manual records request to the provider.

## Connection Methods

### Existing Connection
- Uses a previously established and still-active `provider_connections` record.
- Tokens may need to be refreshed if expired.
- No user action needed beyond confirming a sync.

### Direct Provider Connection
- Requires SMART on FHIR credentials (client_id, authorization endpoint, token endpoint).
- The user is redirected to the provider's authorization server to grant access.
- Once authorized, FHIR resources are fetched and normalized.
- **Current status:** Scaffold — no real FHIR credentials are configured yet.

### Epic Connection
- Specifically for Epic-based EHR systems.
- Uses Epic's OAuth 2.0 implementation for patient access.
- The user authenticates via their MyChart (or equivalent portal) account.
- **Current status:** Scaffold — no Epic OAuth credentials are registered yet.

### Manual Fallback
- The user submits a health record request to the provider.
- Uses the existing `requestHealthRecord` tool and `health_record_requests` table.
- No digital integration required.

## Real vs Placeholder Integrations

| Component | Status |
|-----------|--------|
| Provider organization directory (`provider_organizations`) | **Scaffold** — seeded with placeholder orgs |
| Provider connections table (`provider_connections`) | **Real schema** — ready for real tokens |
| Record import jobs (`record_import_jobs`) | **Real schema** — lifecycle tracking ready |
| Resolution engine | **Real logic** — correctly evaluates strategies |
| SMART on FHIR OAuth flow | **Placeholder** — no real credentials |
| Epic OAuth flow | **Placeholder** — no real credentials |
| FHIR resource fetching | **Placeholder** — uses scaffold preview data |
| Manual records request | **Real** — uses existing `health_record_requests` |

## Future: Epic / SMART on FHIR Implementation

When ready to implement real provider connections:

1. Register as a SMART on FHIR app with target EHR vendors.
2. Store client credentials securely (not in environment variables — use a secrets manager).
3. Implement the OAuth callback route (e.g., `/api/auth/callback/fhir`).
4. On successful token exchange, update `provider_connections` with access/refresh tokens.
5. Use tokens to fetch FHIR resources (`Condition`, `MedicationStatement`, `AllergyIntolerance`, `Immunization`).
6. Normalize fetched resources using the existing `src/lib/fhir/types.ts` and `src/lib/import/normalize-and-validate.ts`.
7. Persist imported records via `src/lib/services/medical-import.ts`.
8. Update `record_import_jobs` status through the lifecycle.

For Epic specifically:
- Register at [Epic on FHIR](https://fhir.epic.com/).
- Use Epic's patient-facing OAuth 2.0 flow.
- The `portal_brand` field on `provider_organizations` indicates the patient-facing portal name.

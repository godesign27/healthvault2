# Provider Record Connection — Decision Tree

## Overview

When a user requests to import records from a provider, the system uses `resolveProviderRecordConnection` to determine the optimal connection path.

## Decision Order

```
User requests record import
│
├─ Is providerOrganizationId provided?
│  ├─ YES → Check for existing active connection
│  │  ├─ FOUND → Strategy: existing_connection
│  │  │  └─ Next: Sync records via existing connection
│  │  └─ NOT FOUND → Look up organization capabilities
│  │     ├─ supportsDirectConnection? → Strategy: direct_provider_connection
│  │     │  └─ Next: Start direct SMART on FHIR authorization
│  │     ├─ supportsEpicConnection? → Strategy: epic_connection
│  │     │  └─ Next: Start Epic/portal authorization
│  │     └─ Neither → Strategy: manual_fallback
│  │        └─ Next: Submit manual records request
│  └─ NO → Continue...
│
├─ Is careNetworkProviderId provided?
│  ├─ YES → Look up provider's clinic → search matching org
│  │  ├─ FOUND org → Check for existing connection (same as above)
│  │  └─ NOT FOUND → Continue...
│  └─ NO → Continue...
│
├─ Is providerName provided?
│  ├─ YES → Search orgs by name
│  │  ├─ FOUND org → Check for existing connection (same as above)
│  │  └─ NOT FOUND → Strategy: manual_fallback
│  │     └─ Next: Search for organization or submit manual request
│  └─ NO → Continue...
│
└─ No identifiers provided
   └─ Strategy: manual_fallback
      └─ Next: Ask user to specify a provider or search
```

## Strategy Details

### 1. existing_connection
- **Condition:** Active `provider_connections` record exists for user + org
- **Action:** Use existing tokens to fetch/sync records
- **User experience:** Seamless — no re-authorization needed

### 2. direct_provider_connection
- **Condition:** Organization has `supports_direct_connection = true` and FHIR endpoint configured
- **Action:** Initiate SMART on FHIR authorization flow
- **User experience:** Redirect to provider's auth page → authorize → return with token
- **Current state:** Scaffold — FHIR credentials not yet configured

### 3. epic_connection
- **Condition:** Organization has `supports_epic_connection = true`
- **Action:** Initiate Epic OAuth flow via patient portal
- **User experience:** Redirect to MyChart/portal login → authorize → return with token
- **Current state:** Scaffold — Epic OAuth credentials not yet registered

### 4. manual_fallback
- **Condition:** No digital connection path available
- **Action:** Call `requestHealthRecord` (invokes `record-request` edge function: email to provider with secure upload link). Use `getHealthRecordRequests` for status and `deleteHealthRecordRequest` to cancel.
- **User experience:** Assistant helps compose and submit a records request
- **Current state:** Email/portal flow backed by edge function; list/delete tools available

## Tables Involved

| Table | Purpose |
|-------|---------|
| `provider_organizations` | Directory of organizations with EHR capabilities |
| `provider_connections` | User ↔ organization digital connections |
| `record_import_jobs` | Import lifecycle tracking (preview → complete) |
| `providers` | User's personal care network (for provider name lookups) |
| `health_record_requests` | Manual record requests (fallback path) |

# Provider Record Connection Tools

## Tool Registry

All tools are registered in `src/lib/openai/tools.ts` and executed by the assistant endpoint at `src/api/assistant/run.ts`.

---

### 1. resolveProviderRecordConnection

**Purpose:** Determine the best connection strategy for importing records from a provider.

**File:** `src/lib/tools/resolveProviderRecordConnection.ts` → delegates to `src/lib/provider-record-connection/resolveProviderRecordConnection.ts`

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user's ID |
| providerName | string | No | Name of the provider/organization |
| providerOrganizationId | string | No | Known organization ID |
| careNetworkProviderId | string | No | ID from the user's care network |

**Output:**
```json
{
  "success": true,
  "data": {
    "strategy": "epic_connection",
    "providerOrganization": { "id": "...", "name": "...", ... },
    "existingConnection": null,
    "reason": "Springfield Medical Center supports connection through MyChart.",
    "nextAction": "Start the provider portal connection to import records."
  }
}
```

**Status:** Real logic — correctly evaluates all four strategies.

---

### 2. getConnectedProviders

**Purpose:** List the user's active provider connections.

**File:** `src/lib/tools/getConnectedProviders.ts`

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user's ID |

**Output:**
```json
{
  "success": true,
  "data": {
    "total": 1,
    "providers": [{
      "id": "...",
      "name": "Springfield Medical Center",
      "connectionMethod": "epic_connection",
      "status": "active",
      "lastSyncedAt": "2026-04-01T..."
    }]
  }
}
```

**Status:** Real — queries `provider_connections` joined with `provider_organizations`.

---

### 3. searchProviderOrganizations

**Purpose:** Search the provider organization directory.

**File:** `src/lib/tools/searchProviderOrganizations.ts`

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search term (name, EHR vendor, city) |

**Output:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "organizations": [{
      "id": "...",
      "name": "Springfield Medical Center",
      "ehrVendor": "Epic",
      "portalBrand": "MyChart",
      "supportsDirectConnection": false,
      "supportsEpicConnection": true,
      "supportsManualRequest": true
    }]
  }
}
```

**Status:** Scaffold-backed — queries placeholder seed data in `provider_organizations`.

---

### 4. startProviderConnection

**Purpose:** Initiate a direct provider connection (non-Epic SMART on FHIR).

**File:** `src/lib/tools/startProviderConnection.ts`

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user's ID |
| providerOrganizationId | string | Yes | Organization to connect to |

**Output:**
```json
{
  "success": true,
  "data": {
    "strategy": "direct_provider_connection",
    "status": "pending",
    "connectionId": "...",
    "launchUrl": null,
    "message": "Connection initiated. Authorization flow is pending configuration."
  }
}
```

**Status:** Placeholder — creates connection record but no real OAuth launch URL yet.

---

### 5. startEpicConnection

**Purpose:** Initiate an Epic/MyChart-compatible connection.

**File:** `src/lib/tools/startEpicConnection.ts`

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user's ID |
| providerOrganizationId | string | Yes | Epic-compatible organization to connect to |

**Output:**
```json
{
  "success": true,
  "data": {
    "strategy": "epic_connection",
    "status": "pending",
    "connectionId": "...",
    "launchUrl": null,
    "message": "Uses MyChart powered by Epic. Pending OAuth credential configuration."
  }
}
```

**Status:** Placeholder — creates connection record but no real Epic OAuth yet.

---

### 6. fetchProviderRecordPreview

**Purpose:** Preview records available for import before the user confirms.

**File:** `src/lib/tools/fetchProviderRecordPreview.ts`

**Inputs:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | The user's ID |
| providerConnectionId | string | No | Active connection ID |
| providerOrganizationId | string | No | Organization ID |
| strategy | string | No | Connection strategy being used |

**Output:**
```json
{
  "success": true,
  "data": {
    "counts": { "conditions": 2, "medications": 2, "allergies": 1, "immunizations": 2, "total": 7, "duplicates": 0 },
    "itemsByType": { "condition": [...], "medication": [...] },
    "importJobId": "...",
    "source": "scaffold",
    "message": "Preview generated. Note: This is scaffold data."
  }
}
```

**Status:** Scaffold-backed — returns mock preview items. Real FHIR fetch will replace this when tokens are available.

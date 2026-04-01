# Network Page Tools

All tools are registered in `src/lib/openai/tools.ts` and executed by the assistant endpoint.

---

### 1. getConnectedInsurance

**Purpose:** Retrieve the user's insurance plans with connection/coverage status.

**File:** `src/lib/tools/getConnectedInsurance.ts`

**Inputs:**
| Parameter | Type | Required |
|-----------|------|----------|
| userId | string | Yes |

**Output:**
- `data.total` — total insurance plans
- `data.activeCount` — active plans
- `data.insurance[]` — each with providerName, planName, memberId, status, connectionStatus
- `data.summary` — human-readable summary

**Status:** Real — queries `insurance_coverages` joined with `insurance_providers`.

---

### 2. searchInNetworkProviders

**Purpose:** Search the user's care network providers with optional insurance context.

**File:** `src/lib/tools/searchInNetworkProviders.ts`

**Inputs:**
| Parameter | Type | Required |
|-----------|------|----------|
| userId | string | Yes |
| query | string | No |
| specialty | string | No |
| insuranceId | string | No |
| limit | number | No |

**Output:**
- `data.insuranceContext` — active insurance info (if available)
- `data.total` — result count
- `data.providers[]` — each with name, specialty, address, inNetwork, insuranceLabel
- `data.source` — currently `"care_network"` (saved providers)

**Status:** Partial — searches saved providers with in-network annotation. A real insurer directory API would enable live network verification.

---

### 3. saveProviderToNetwork

**Purpose:** Add a provider to the user's care network.

**File:** `src/lib/tools/saveProviderToNetwork.ts`

**Inputs:**
| Parameter | Type | Required |
|-----------|------|----------|
| userId | string | Yes |
| name | string | Yes |
| specialty | string | No |
| clinic | string | No |
| phone | string | No |
| email | string | No |
| address | string | No |
| providerType | string | No |
| relationship | enum | No |
| inNetwork | boolean | No |

**Output:**
- `data.saved` — boolean
- `data.provider` — saved provider details
- `data.networkEntryId` — the provider record ID

**Status:** Real — inserts into `providers` table.

---

### 4. getNearbyPharmacies

**Purpose:** Find pharmacies near the user's saved address.

**File:** `src/lib/tools/getNearbyPharmacies.ts`

**Inputs:**
| Parameter | Type | Required |
|-----------|------|----------|
| userId | string | Yes |
| query | string | No |
| radiusMiles | number | No |
| limit | number | No |

**Output:**
- `data.addressContext` — patient's address (or null if missing)
- `data.total` — result count
- `data.pharmacies[]` — each with name, address, phone, isPreferred, distanceMiles (null until real API)
- `data.source` — currently `"saved_pharmacies"`

**Status:** Partial — returns saved pharmacies. Distance/proximity requires a real pharmacy directory API.

---

### 5. setPreferredPharmacy

**Purpose:** Set a pharmacy as the user's preferred pharmacy.

**File:** `src/lib/tools/setPreferredPharmacy.ts`

**Inputs:**
| Parameter | Type | Required |
|-----------|------|----------|
| userId | string | Yes |
| pharmacyId | string | Yes |

**Output:**
- `data.saved` — boolean
- `data.pharmacy` — the pharmacy details with `preferred: true`

**Status:** Real — updates `pharmacies` table, ensures only one preferred at a time.

---

### 6. getCareNetwork

**Purpose:** Summary view of the user's entire care network.

**File:** `src/lib/tools/getCareNetwork.ts`

**Inputs:**
| Parameter | Type | Required |
|-----------|------|----------|
| userId | string | Yes |

**Output:**
- `data.primaryCare[]` — primary care providers
- `data.specialists[]` — specialist providers
- `data.allProviders[]` — all providers
- `data.preferredPharmacy` — preferred pharmacy (or null)
- `data.allPharmacies[]` — all pharmacies
- `data.counts` — totals

**Status:** Real — queries `providers` and `pharmacies` tables.

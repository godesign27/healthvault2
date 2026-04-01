# Network Page Logic

## Insurance-Connected Behavior

When the user has active insurance:
1. `getConnectedInsurance` returns active plans with provider names and member IDs.
2. `searchInNetworkProviders` uses the insurance context to annotate providers with in-network labels (e.g., "In-network with Aetna").
3. The assistant can proactively suggest finding in-network providers when the user is on the Network page.

When insurance is NOT connected:
1. `getConnectedInsurance` returns an empty list or inactive plans.
2. Provider search still works but cannot verify in-network status.
3. The assistant should note that in-network filtering is unavailable and suggest connecting insurance first.

## Provider Search Logic

The `searchInNetworkProviders` tool currently searches the user's **saved care network** (`providers` table). It does NOT query an external provider directory.

Flow:
1. Check if user has active insurance (auto-detected via primary coverage).
2. Search saved providers by name, specialty, or clinic.
3. Annotate results with in-network labels based on the `in_network` flag on each provider row.
4. Return results with `source: "care_network"` to indicate these are saved providers.

Future enhancement: integrate with a real provider directory API (e.g., CMS NPPES, insurer APIs) to enable searching for providers not yet in the user's network.

## Pharmacy Search Logic

The `getNearbyPharmacies` tool:
1. Resolves the patient's address from `user_profiles` (address_line1, city, state, postal_code).
2. If address exists, includes it as `addressContext` in the response.
3. Searches the user's **saved pharmacies** (`pharmacies` table).
4. Returns `distanceMiles: null` and `latitude/longitude: null` — real proximity requires a pharmacy directory API.

If no address is on file:
- Returns `addressContext: null` with a message prompting the user to update their profile.

## Preferred Pharmacy Logic

- `setPreferredPharmacy` ensures only one pharmacy is marked preferred at a time.
- Clears all `preferred = true` flags for the user, then sets the selected one.
- `getCareNetwork` and `getNearbyPharmacies` both surface the preferred pharmacy.

## Save Provider Flow

`saveProviderToNetwork` inserts into the `providers` table:
- Supports `providerType` shorthand ("primary_care" → "Primary", "specialist" → "Specialist").
- Also accepts explicit `relationship` enum values.
- Sets `connection_source: "Manual"` since the provider is being added by the user.

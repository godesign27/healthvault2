# Phase 5 Admin Intelligence — Phased Implementation Plan

**Source:** `PHASE-5-ADMIN-PILOT-PRD.md` in the HealthVault Platform product docs
**Planning status:** Proposed
**Recommended delivery shape:** A dedicated admin application in the existing HealthVault monorepo, deployed automatically to a protected URL and backed by Supabase Auth, Postgres, Row Level Security, and Edge Functions. The first analytics domain is the HealthVault GPT App; the architecture reserves a separate SaaS Cloud analytics domain without building that product's dashboards prematurely.

## 1. Outcome

Deliver a URL-accessible HealthVault Admin Intelligence pilot where an approved administrator can sign in and view privacy-minimized product analytics across:

1. Insights
2. Users
3. AI Interactions
4. Capabilities
5. Security & Audit

The application must use aggregated or structured metadata by default. It must not become a raw conversation browser or a clinical-record console.

The admin platform must ultimately report on two distinct HealthVault products:

- **GPT App — current scope:** GPT conversation tasks, capabilities/tools, outcomes, latency, corrections, unsupported needs, source dependencies, and safety/authorization events.
- **SaaS Cloud — future scope:** cloud account activation, workspace/organization usage, web workflows, integrations, subscriptions, operational health, and cloud-specific security events.

These products share an admin shell, identity, authorization, audit system, metric infrastructure, and design system. They do **not** share a single undifferentiated event taxonomy or dashboard. Every event, classification, aggregate, metric snapshot, saved query, and brief must carry a stable `product_key` so GPT App data cannot be confused with SaaS Cloud data.

The platform also needs a third bounded context that is not merely another analytics product:

- **Provider Operations:** HealthVault platform administrators onboard and manage provider organizations, assign provider administrators, monitor integrations and data-transfer activity, suspend access, and investigate failures.
- **Provider Integration Portal:** Authorized staff from a provider organization sign in to configure and test their own API/FHIR connections, manage credentials, view scoped delivery/import status, and resolve integration issues. They cannot access the HealthVault platform-admin experience or another provider's configuration.

Provider Operations may expose analytics about both GPT App and SaaS Cloud usage, but provider identity, tenancy, credentials, patient-data exchange, and operational controls must remain separate from the product-analytics event model.

## 2. Recommended architecture

### Source and deployment

- Keep application code, database migrations, Edge Functions, tests, and operating documentation in the existing GitHub repository.
- Use pull requests and required CI checks before merging to the production branch.
- Connect the repository to a web deployment provider such as Vercel, Netlify, or Cloudflare Pages for automatic preview and production deployments.
- Use a dedicated URL such as `admin.healthvault.me` or an isolated `/admin/intelligence` route. Prefer the subdomain if operational isolation and a separate deployment are affordable.
- Keep secrets in the deployment provider and Supabase secret stores; never commit them to GitHub.

GitHub Pages alone is not recommended. The frontend can be static, but authentication, role checks, audit recording, aggregation, and privileged mutations require the existing Supabase backend.

### Application boundary

- Reuse React 18, TypeScript, Vite, Tailwind, and the HealthVault token system.
- Reuse Supabase authentication, but create a separate admin authorization model.
- Put all admin reads and writes behind server-enforced RLS and/or role-aware Edge Functions or database RPCs.
- Do not reuse the current design-token `AdminPage` or the current organization `SuperAdminPage` as the security boundary. They solve different problems and currently query from the client.
- Prefer precomputed/versioned metric snapshots for dashboard performance and reproducibility.
- Create `apps/admin` as its own workspace and deployable application instead of adding more product-intelligence behavior to the root app's existing `AdminPage`.
- Organize admin code by product domain (`gpt-app` and later `saas-cloud`), not by one global collection of charts and tables.
- Share only stable primitives—authentication, permissions, audit, filters, metric cards, query contracts, and chart/table components—through an explicit admin platform layer.
- Do not create empty SaaS dashboards or speculative SaaS metrics now. Reserve the boundary, identifiers, routing, and contracts, then add the SaaS module when its PRD and event taxonomy are approved.
- Add Provider Operations as a separate admin feature domain, not as rows embedded in the GPT App analytics module.
- Use a separate `apps/provider-portal` deployable for provider-organization staff. It may share contracts and UI primitives, but it must have its own routes, authorization checks, security headers, and deployment configuration.
- Treat the current `ProviderAdminPage` as a prototype to inventory, not as the final tenant/security architecture. It currently lives in the root client and should not become the authority for integration credentials or provider tenancy.

### Product selection and routing

- Use a stable product registry with initial keys `gpt_app` and `saas_cloud`.
- Route the current experience under `/products/gpt-app/*`.
- Reserve `/products/saas-cloud/*`; until that module exists, authorized users see a clear “not configured” state rather than GPT metrics relabeled as SaaS metrics.
- Scope every admin request to an explicit product. The server must reject a missing, unknown, or unauthorized product key.
- Allow roles to be assigned globally or per product so a GPT Product admin does not automatically gain future SaaS Cloud access.
- Place platform-side provider management under `/providers/*` in `apps/admin`; it is a platform operation rather than a product-selection route.
- Place provider-organization self-service under a separate URL such as `providers.healthvault.me` with tenant context resolved from the authenticated assignment, never trusted from a URL parameter alone.

### Recommended repository structure

```text
apps/
  admin/
    src/
      app/                         # bootstrap, router, providers, error boundaries
      layouts/                     # authenticated shell and product navigation
      platform/                    # shared admin-platform behavior only
        auth/
        authorization/
        audit/
        product-registry/
        metrics/
        data-quality/
      features/
        gpt-app/                   # current implementation scope
          insights/
          users/
          interactions/
          capabilities/
          unmet-needs/
          weekly-briefs/
          routes.tsx
        saas-cloud/                # add only when the SaaS PRD is approved
        provider-operations/       # provider registry, onboarding, health, access
          directory/
          onboarding/
          activity/
          integrations/
          access/
      components/                  # reusable presentational components
      lib/                         # admin client, configuration, utilities
      test/
    index.html
    package.json
    vite.config.ts

  provider-portal/
    src/
      app/                         # tenant-aware bootstrap and router
      features/
        organization-profile/
        team-access/
        api-credentials/
        fhir-connections/
        data-deliveries/
        integration-health/
      platform/
        auth/
        tenant-context/
        audit/
      components/
      lib/
      test/
    package.json
    vite.config.ts

packages/
  admin-contracts/                 # product keys, event envelope, API DTOs, permissions
  analytics-contracts/             # versioned shared envelope + domain event schemas
  provider-contracts/              # provider tenant, connection, credential DTOs/events
  admin-ui/                        # optional reusable admin-only UI primitives

supabase/
  functions/
    admin-api/                     # role-aware reads/actions; explicit product scope
    analytics-ingest/              # validated, idempotent event ingestion
    analytics-classify/            # versioned derived classifications
    weekly-product-brief/          # evidence-linked draft generation
    provider-admin-api/             # platform-admin provider operations
    provider-portal-api/            # tenant-scoped provider self-service
    provider-ingest/                # authenticated, validated patient-data ingestion
    provider-connection-test/       # safe outbound FHIR/API verification
  migrations/
    ..._admin_platform.sql         # roles, grants, audit, product registry
    ..._analytics_core.sql         # event envelope, snapshots, quality state
    ..._gpt_app_analytics.sql      # GPT-specific event/derived structures
    ..._saas_cloud_analytics.sql   # future; do not add until designed
    ..._provider_registry.sql      # canonical provider accounts and mappings
    ..._provider_access.sql        # tenant membership and invitations
    ..._provider_integrations.sql  # connections, credentials metadata, deliveries
```

The packages are boundaries, not a requirement to over-generalize the first release. Start `admin-contracts` and `analytics-contracts` with the minimum stable types used by the GPT App. Extract `admin-ui` only when real reuse appears.

### Provider domain boundaries

The current repository contains overlapping provider concepts that must be reconciled without destructive renaming:

- `providers` represents provider contacts in a patient's care network.
- `provider_organizations` represents organizations available for digital record exchange.
- `organizations` and `organization_admins` represent tenant organizations and their staff.
- `inbound_api_keys` currently authorizes inbound record delivery but identifies an organization partly by name.

Before expanding provider administration, introduce a canonical `provider_accounts` identity and explicit mapping tables. Existing records can continue operating while they are linked and migrated. A personal care-network provider must never automatically become an integration tenant.

Recommended core model:

```text
provider_accounts
  id
  legal_name
  display_name
  status                    # pending | active | suspended | offboarded
  provider_type
  external_identifiers      # approved NPI/org identifiers; no secrets
  primary_contact
  created_at / updated_at

provider_account_memberships
  provider_account_id
  principal_id
  role_key                  # owner | integration_admin | analyst | support
  status                    # invited | active | revoked
  granted_by / granted_at / revoked_at

provider_directory_links
  provider_account_id
  provider_organization_id  # links the existing record-exchange directory

provider_connections
  id
  provider_account_id
  connection_type           # fhir_r4 | webhook | sftp | vendor_connector
  environment               # sandbox | production
  status                    # draft | testing | active | degraded | disabled
  endpoint_metadata         # allowlisted non-secret connection metadata
  credential_ref            # reference to a secret store, never raw secret
  last_tested_at / last_success_at

provider_credentials
  id
  provider_account_id
  connection_id
  credential_type
  public_identifier         # key prefix/client ID where safe
  secret_ref                # managed secret/vault reference
  scopes
  expires_at
  status                    # active | rotating | revoked | expired

provider_data_deliveries
  id
  provider_account_id
  connection_id
  external_delivery_id
  request_id
  status                    # received | validating | quarantined | accepted | partial | failed
  record_counts             # aggregate counts only
  error_category
  occurred_at / completed_at
```

Patient identity mappings and patient payloads belong in a separately protected exchange schema with stricter service-only access. Provider activity pages should show aggregate counts and sanitized failure metadata by default, not patient clinical content.

### Provider administration responsibilities

HealthVault platform administrators need to be able to:

- Create, verify, activate, suspend, and offboard provider accounts.
- Invite or revoke provider administrators and inspect membership history.
- Configure allowed connection types and approve promotion from sandbox to production.
- View connection health, last activity, delivery/import volume, error categories, credential expiry, and unusual access patterns.
- Disable a connection or credential immediately and verify the audited outcome.
- See provider participation across GPT App and future SaaS Cloud through product-scoped aggregates where approved.
- Enter an explicitly audited support-assistance workflow without impersonating a provider or exposing secrets.

Provider-organization administrators need to be able to:

- Accept an invitation, sign in with MFA, and manage their organization team within delegated limits.
- Enter non-secret endpoint metadata and configure supported FHIR/API integration options.
- Create, rotate, and revoke credentials; raw API secrets are shown once and never retrievable later.
- Run a sandbox connection test using synthetic data before requesting production activation.
- Monitor only their organization's connection status, delivery history, aggregate counts, and sanitized errors.
- Access integration documentation, webhook/FHIR schemas, scopes, and version/deprecation notices.

They must not be able to self-approve production access, broaden their own scopes, view another provider, browse HealthVault patients, or retrieve stored secrets.

### Credential and patient-data security

- Store only cryptographic hashes for inbound bearer/API keys. Store outbound OAuth client secrets, private keys, and refresh tokens in a managed secrets vault and persist only a reference in Postgres.
- Never return stored secrets through PostgREST, admin APIs, logs, analytics events, exports, or browser payloads.
- Support expiration, rotation with a short overlap window, revocation, least-privilege scopes, and optional IP/mTLS restrictions for higher-risk connections.
- Require MFA and recent reauthentication for credential creation, rotation, production activation, scope changes, and emergency disable.
- Rate-limit and monitor authentication failures, signature failures, replay attempts, and unusual delivery volume.
- Validate inbound payloads against versioned schemas, virus-scan files, enforce size limits, deduplicate by provider plus external delivery ID, and quarantine invalid or ambiguous submissions.
- Resolve patient identity only through approved mappings/consent rules. A provider-supplied email or arbitrary patient ID must not by itself authorize attachment of records to a vault.
- Record immutable audit events for provider creation, membership, credentials, tests, production approval, ingestion, quarantine, access, and suspension.

### Event and metric separation

Use a common immutable envelope and product-specific payload schema:

```text
analytics_event
  event_id
  product_key              # gpt_app | saas_cloud
  event_name
  schema_version
  occurred_at
  received_at
  actor_ref                # privacy-safe internal reference
  session_id
  request_id
  correlation_id
  cohort_id
  payload                  # validated against product + event + version
  privacy_classification
```

- The common envelope supports ingestion, deduplication, retention, lineage, and auditability.
- GPT App payloads contain intent, requested outcome, capability/tool, source type, task outcome, latency, correction/rephrase, and unmet-need signals.
- Future SaaS Cloud payloads receive their own schemas and definitions; they must not overload GPT intent or capability fields.
- Metric definitions use a composite identity such as `(product_key, metric_key, metric_version)`.
- Metric snapshots, classifier output, unmet-need clusters, and weekly briefs retain `product_key` and source schema/version lineage.
- Cross-product executive rollups are a later derived layer. They may combine approved aggregates, never raw domain events with incompatible meanings.

### Authorization boundary

Model access as `principal + product + permission`, for example:

```text
admin_role_assignments
  principal_id
  product_key              # nullable only for explicitly global platform roles
  role_key                 # owner | product | security_privacy | support
  granted_by
  granted_at
  revoked_at
```

- Platform Owner can manage product assignments but does not bypass sensitive-view auditing.
- Product roles are product-scoped by default.
- Security/Privacy may be granted one or both products with field-level policies.
- Support access requires both product scope and an authorized support workflow.
- Database policies and admin APIs validate product scope; the product picker and hidden navigation are convenience only.

Provider access adds an independent tenant dimension: `principal + provider_account + permission`. Product analytics roles do not imply provider-tenant access, and provider memberships do not imply admin-product access. Platform administrators use privileged server APIs for cross-provider operations; provider users are constrained by tenant-aware RLS/API checks to a single approved provider account per request.

### Data flow

```text
HealthVault clients and Edge Functions
            |
            v
Product-tagged, versioned, PHI-minimized structured events
            |
            v
Supabase ingestion + deduplication + classification
            |
            v
Product-scoped aggregates and metric snapshots
            |
            v
Role-aware admin APIs/RPCs
            |
            v
Protected admin web application
```

Provider exchange follows a separate path:

```text
Provider administrator                 Provider system
        |                                    |
        v                                    v
Provider Integration Portal       Signed/API-authenticated ingest
        |                                    |
        v                                    v
Tenant-scoped provider API       Validate -> dedupe -> quarantine
        |                                    |
        +---------- audit + health ----------+
                           |
                           v
                 Approved patient mapping
                           |
                           v
                     Health Vault data
```

## 3. Delivery assumptions

- Suggested staffing: one product/design owner, two full-stack engineers, and part-time security/privacy and data support.
- Suggested pilot duration: 10–14 weeks, depending on how much event instrumentation already exists.
- Capacity should reserve roughly 20% for security, reliability, accessibility, and technical health, plus 10% for discoveries and pilot defects.
- Rollout controls remain disabled until the read-only analytics pilot passes authorization and audit testing.
- Dates should be assigned only after Phase 0 resolves the blocking decisions below.
- The 10–14 week estimate applies to the GPT App admin pilot only. SaaS Cloud instrumentation and dashboards require a separate scoped plan after its metrics and privacy requirements are defined.
- Provider Operations and the provider portal should be planned as an adjacent workstream. The GPT App admin foundation should reserve its boundaries now, but credential management and production patient ingestion must not be squeezed into the analytics pilot schedule without separate security and integration estimates.

## 4. Phased plan

### Phase 0 — Decisions, definitions, and threat model (1–2 weeks)

**Purpose:** Remove the blockers that would otherwise cause analytics rework or privacy risk.

**Work**

- Confirm whether the admin experience uses `admin.healthvault.me` or `/admin/intelligence`, and whether it is a separate Vite build.
- Confirm `apps/admin` as the deployable boundary and approve `gpt_app` and `saas_cloud` as permanent product keys.
- Define the shared event envelope and the GPT App v1 event catalog; explicitly document which semantics are GPT-only.
- Approve the canonical provider-account model and migration/linking strategy for existing `organizations`, `provider_organizations`, personal-network `providers`, and `inbound_api_keys`.
- Define provider onboarding, verification, sandbox, production approval, suspension, offboarding, patient-matching, consent, and support-assistance policies.
- Approve the v1 intent taxonomy and exact definitions for meaningful task, success, partial success, failure, abandonment, unsupported, and unknown.
- Select the admin identity flow and define product-scoped Owner, Product, Security/Privacy, and Support permissions down to fields and actions.
- Approve event-field allowlists, small-cohort suppression threshold, retention/deletion behavior, export policy, and prohibited data.
- Define emergency access and capability-disable ownership.
- Produce a lightweight threat model covering direct API access, role escalation, PHI leakage, export abuse, hostile event text, and audit tampering.
- Inventory existing interaction and capability instrumentation and map gaps to the required schema.

**Deliverables**

- Architecture decision record.
- Repository/module boundary and product registry contract.
- Metric dictionary v1.
- Role/permission matrix.
- PHI-minimized event contract and retention policy.
- Threat model and security test plan.
- Prioritized instrumentation gap list.
- Provider-domain architecture decision and credential/patient-data threat model.

**Exit gate**

Product, Engineering, Security, and Privacy approve the above artifacts. No UI implementation begins against unresolved metric or permission definitions.

### Phase 1 — Repository, deployment, and protected application shell (1 week)

**Purpose:** Establish a safe path from GitHub to a working admin URL.

**Work**

- Scaffold `apps/admin` with the application shell, `/products/gpt-app/*` routes, reserved SaaS Cloud route state, protected routes, error boundary, and theme/token integration.
- Add CI for type checking, linting, unit tests, production build, migration checks, and secret scanning.
- Configure preview and production environments from GitHub.
- Configure the admin URL, TLS, SPA rewrites, environment variables, and Supabase redirect allowlist.
- Implement Supabase sign-in, sign-out, session refresh, unauthorized, and revoked-role states.
- Add server-side product-scoped `admin_roles` authorization and deny normal members by default.
- Record sign-in, denied access, and role-change events in an append-only admin audit stream.

**Deliverables**

- Deployed application shell at a non-production preview URL.
- Admin login and role-aware navigation.
- CI/CD pipeline and environment runbook.
- Automated tests proving normal members cannot read admin data through either UI or direct API calls.

**Exit gate**

An approved test administrator can sign in at the preview URL; an ordinary member and a revoked administrator receive no admin data.

### Phase 2 — Event foundation and deterministic fixtures (2–3 weeks)

**Purpose:** Build trustworthy source data before building charts.

**Work**

- Add the shared versioned event envelope plus GPT App schemas for interaction, capability, outcome, consent, and admin audit events.
- Add stable product keys, event IDs, request/correlation IDs, capability IDs/versions, classifier versions, and cohort identifiers.
- Instrument user-initiated meaningful tasks without counting internal model calls, retries, retrievals, classifiers, or individual tool calls.
- Add server-side ingestion validation, PHI field allowlisting, deduplication, late-event handling, and processing-lag tracking.
- Create immutable product-scoped raw-event tables and versioned derived tables for classifications, outcomes, and clusters.
- Build a synthetic/demo dataset and deterministic fixtures covering success, partial success, failure, abandonment, unsupported, unknown, duplicates, late events, and reporting-window boundaries.
- Add data-quality metrics for ingestion failures, unknown outcomes, unclassified intent, duplicates, and stale processing.

**Deliverables**

- Supabase migrations and ingestion interfaces.
- Instrumentation in the canonical capabilities.
- Synthetic seed data and reconciliation fixtures.
- Data-quality dashboard/query available to engineering.

**Exit gate**

- Canonical fixtures reconcile exactly.
- Valid pilot-event ingestion is at least 99%.
- Duplicate rate is below 0.5% after deduplication.
- No prohibited PHI appears in event payloads, application logs, URLs, or client analytics.

### Phase 3 — Metrics layer and read-only Insights MVP (2 weeks)

**Purpose:** Prove the product owner can understand product health quickly using reproducible metrics.

**Work**

- Implement versioned metric snapshots or materialized aggregates for active users, task volume, outcomes, top intents, activation funnel, unmet needs, capability issues, and source-ingestion health.
- Define denominators explicitly, excluding unknown outcomes where approved.
- Add period comparison, privacy threshold suppression, last-updated time, processing lag, metric definitions, and reproducible query/snapshot links.
- Build the Insights page with loading, empty, stale, partial, error, and unauthorized states.
- Add accessibility for keyboard navigation, charts, tables, focus, contrast, and non-color status indicators.

**Deliverables**

- Read-only Insights dashboard backed by synthetic fixtures.
- Metric reconciliation test suite.
- Performance telemetry for dashboard and filter queries.

**Exit gate**

- Product owner can identify top intents, largest failure cluster, and largest activation drop-off in under one minute.
- Initial dashboard load p95 is under 3 seconds and standard filter updates are under 2 seconds on pilot-sized data.
- Counts under the approved privacy threshold are suppressed or grouped.

### Phase 4 — Users, AI Interactions, and Capabilities (2–3 weeks)

**Purpose:** Complete the core read-only investigation workflow.

**Work**

- Build the minimized Users list, filters, and structured event timeline without health facts, document contents, prompts, or responses.
- Build AI Interactions metrics, structured event table, intent explorer, failure-reason drill-down, and unmet-needs explorer.
- Implement deterministic classifications first and a versioned classifier only where interpretation is required.
- Label low-confidence values unknown or route them out of factual dashboards.
- Build capability catalog and health views with adoption, success, failure, latency, repeat use, source dependencies, and adjacent unmet needs.
- Add role-aware field filtering to every server response, not only to the rendered UI.

**Deliverables**

- Users, AI Interactions, and Capabilities pages.
- Versioned classification pipeline and evaluation set.
- Cross-role field-level authorization tests.

**Exit gate**

- Priority intent classification reaches the approved threshold, initially targeted at macro F1 ≥ 0.85.
- Unknown outcomes for supported P0 tasks are below 10%.
- Product and Security roles receive only their approved fields in direct API tests.
- A GPT-only administrator cannot query the reserved SaaS Cloud product scope.

### Phase 5 — Security & Audit and privacy validation (1–2 weeks)

**Purpose:** Make privileged access and changes observable and defensible.

**Work**

- Build searchable, append-only audit views for authentication, denials, consent, sensitive access, mutations/deletions, role changes, exports, configuration changes, retention jobs, and security failures.
- Include actor, action, target reference, authorization context, outcome, request ID, timestamp, and approved metadata.
- Verify that secrets and PHI payloads cannot enter the audit stream.
- Test retention/deletion behavior end to end across raw events, classifications, aggregates, and briefs.
- Conduct authorization, RLS, export, injection, log-leakage, and hostile-event-text testing.

**Deliverables**

- Security & Audit page.
- Audit-coverage report and privacy test evidence.
- Incident and access-revocation runbooks.

**Exit gate**

- 100% audit coverage for privileged actions.
- Zero known cross-role disclosures, authorization bypasses, or default-surface/log PHI leaks.
- Security and Privacy approve read-only pilot access.

### Phase 6 — Unmet-needs workflow and weekly brief (1–2 weeks)

**Purpose:** Convert analytics into reviewable product evidence without automating product decisions.

**Work**

- Implement clustering for unsupported, repeatedly failed, rephrased, abandoned, and explicit feature-request signals.
- Add audited review, merge/split, and noise-exclusion actions without modifying underlying events.
- Generate a weekly draft that labels every statement as observed fact, model interpretation, or recommendation.
- Link every factual claim to a stored metric snapshot or reproducible dashboard query.
- Treat event text as untrusted input and test prompt-injection resistance.
- Require authorized human review; do not auto-publish, change the roadmap, or change rollout settings.

**Deliverables**

- Unmet-needs explorer and review workflow.
- Reviewable weekly product brief.
- Evidence-link and hostile-input test suite.

**Exit gate**

- Weekly brief factual-link coverage is 100%.
- Low-confidence classifications never appear as observed facts.
- At least 80% of weekly product-review questions can be answered without reading raw conversations during pilot usability testing.

### Phase 7 — Read-only pilot rollout (2 weeks)

**Purpose:** Validate usefulness, reliability, and privacy with a limited internal audience.

**Rollout sequence**

1. Synthetic data only.
2. Internal engineering administrators.
3. Product and Privacy administrators with read-only dashboards.
4. Approved internal pilot cohort data.
5. Unmet-needs review and weekly draft brief.

**Operations**

- Monitor availability, ingestion success, event lag, unknown rate, classifier health, query latency, denied access, and audit gaps.
- Hold daily triage during the first week and a formal review after two weeks.
- Collect one-minute insight-test results and the questions that still require raw-conversation access.
- Keep exports and capability rollout controls disabled.

**Exit gate**

- 99.5% availability during pilot reporting hours.
- All P0 pages have verified loading, empty, stale, partial, error, and unauthorized states.
- At least three evidence-backed investigations are generated.
- Product, Security, and Privacy approve progression.

### Phase 8 — Capability controls and six-week evaluation (1–2 weeks plus observation)

**Purpose:** Add the only privileged product-control surface after analytics has proven safe.

**Work**

- Define rollout precedence across global, cohort, percentage, and user eligibility.
- Implement enable/disable, pilot cohort, and approved percentage controls through a server-side authorization boundary.
- Require confirmation, validate changes transactionally, and record immutable before/after audit events.
- Add Owner-only emergency disable with an operational runbook.
- Re-run direct API, revocation, concurrency, failure-recovery, and audit-gap tests.
- Conduct the six-week product and system-quality review before starting P1 work.

**Exit gate**

- Operations can disable a capability and verify the audited change.
- Any authorization bypass, missing privileged audit event, or PHI leak blocks release.
- P1 work begins only after the pilot review accepts the P0 definition of done.

## 5. Phase dependencies

| Capability | Depends on |
|---|---|
| Admin dashboard access | Approved identity flow, `admin_roles`, RLS/API authorization |
| Accurate Insights | Metric definitions, canonical event IDs, ingestion, deduplication, fixtures |
| Intent analytics | Approved taxonomy, deterministic signals, versioned classifier |
| Unmet-needs clusters | Interaction outcomes, rephrase/correction signals, classifier confidence |
| Weekly brief | Reproducible metric snapshots and approved clusters |
| Capability rollout controls | Role authorization, capability definitions, append-only audit, emergency procedure |
| Production URL | GitHub CI, deployment provider, DNS/TLS, environment secrets, Supabase redirect configuration |
| Future SaaS Cloud analytics | Stable product registry and envelope, SaaS PRD, SaaS-specific taxonomy/instrumentation, product-scoped permissions |
| Provider directory and activity | Canonical provider account, directory mappings, provider operational events |
| Provider self-service portal | Provider membership/invitations, tenant authorization, MFA, provider APIs |
| Production patient-data ingestion | Verified provider, approved connection, scoped credential, consent/matching policy, validation/quarantine pipeline |
| Provider health monitoring | Delivery events, connection tests, credential lifecycle, sanitized error taxonomy |

## 6. P0 scope control

### Must have

- Protected login and server-enforced admin roles.
- Dedicated `apps/admin` deployable with explicit GPT App product scope.
- Stable product registry and product-scoped event/metric contracts that can add SaaS Cloud later.
- Five P0 pages.
- Versioned structured events, definitions, deduplication, and data-quality states.
- Aggregate-first, PHI-minimized analytics and small-cohort suppression.
- Immutable audit visibility.
- Deterministic fixtures and release-gate tests.
- Weekly draft brief with evidence links.

### Should have

- Unmet-needs label review and merge/split workflow.
- Capability rollout controls after the read-only pilot.
- Preview deployments for every pull request.

### Could have if capacity remains

- Advisory opportunity scoring with visible inputs.
- Approved privacy-safe paraphrases.
- Additional chart refinements beyond the accessible baseline.

### Explicitly deferred to P1

- Dedicated Data Sources page.
- Advanced cohort analysis and custom report building.
- Saved views and scheduled brief delivery.
- Configurable anomaly alerts.
- Broad aggregate exports.
- Predictive churn, billing, CRM, support tooling, or automated roadmap actions.

Provider onboarding and integration are a parallel platform workstream, not P1 analytics. Their prioritization and release gates should be tracked independently so a provider integration cannot be declared safe merely because the analytics pilot passed.

## 7. GitHub-to-URL release workflow

1. Engineer opens a feature branch and pull request in the GitHub repository.
2. CI runs type checking, linting, unit/integration tests, security checks, migrations checks, and a production build.
3. The hosting provider creates an isolated preview URL using non-production Supabase resources.
4. Product, Security, or Privacy reviews the preview according to the change risk.
5. Merge to the protected production branch triggers the production frontend deployment.
6. Supabase migrations and Edge Functions deploy through an approved, auditable pipeline with environment protection.
7. Smoke tests verify login, role denial, dashboard freshness, audit recording, and no PHI in logs.
8. Failed gates prevent promotion; rollback returns to the prior frontend version while forward-fix or reversible migrations handle backend issues.

## 8. First backlog slice

The first engineering slice should produce vertical proof, not a set of disconnected screens:

1. Add the admin role schema and deny-by-default policies.
2. Scaffold `apps/admin` and add the protected shell, login flow, product registry, and `/products/gpt-app/insights` route.
3. Add one versioned GPT App meaningful-task event using the shared envelope and ingestion validation path.
4. Add one deterministic metric snapshot for meaningful task count and outcomes.
5. Display that metric on a deployed Insights preview with definition, time range, freshness, and error states.
6. Prove ordinary members cannot retrieve it by modifying the client or calling the API directly.
7. Prove a GPT-only admin cannot request the future `saas_cloud` product scope.
8. Record allowed and denied access in the admin audit stream with the requested product key.

Completing this slice validates the architecture before the team scales instrumentation and UI work.

## 9. Decisions still required

- Confirm the recommended dedicated `apps/admin` deployment and admin subdomain.
- Hosting provider and production branch policy.
- Admin identity provider, invitation/role-assignment flow, MFA requirement, and emergency access.
- Final event-field allowlist, privacy threshold, retention/deletion schedule, and export policy.
- Intent taxonomy and metric dictionary v1.
- Whether the pilot uses only the current Supabase project or a separate analytics/read replica boundary.
- Approved classifier evaluation thresholds by priority intent.
- Named owners for product metrics, privacy decisions, deployment, data quality, and incident response.
- SaaS Cloud analytics remains a separate future discovery: its activation model, tenancy dimensions, billing metrics, workflow taxonomy, and privacy boundaries must not be inferred from the GPT App model.
- Decide whether provider accounts are one-to-one with SaaS Cloud organizations or linked many-to-many; do not assume the current `organizations` table is the final provider identity.
- Select the managed secret store, provider MFA policy, verification method, supported integration protocols, sandbox strategy, and production approval owners.
- Define patient identity matching, consent evidence, data provenance, correction/deletion, quarantine review, and breach-response procedures before accepting production patient data.

## 10. Definition of pilot readiness

The pilot is ready only when:

- An approved administrator can open the production URL, sign in, and see role-appropriate analytics.
- A normal HealthVault member cannot retrieve admin data through the UI or API.
- Metrics reconcile exactly with canonical fixtures and show freshness and partial-data states.
- Default surfaces, URLs, logs, events, and exports contain no prohibited PHI.
- Every privileged action is audited with actor, authorization context, before/after state where applicable, request ID, outcome, and timestamp.
- Performance, accessibility, classification, ingestion, availability, and privacy release gates in the PRD are met.
- The product owner passes the one-minute insight test.

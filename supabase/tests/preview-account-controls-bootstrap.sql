-- PREVIEW ONLY: roeudwddxvniazwufdqf. Schema-only account-control test baseline.
-- Captured from production catalogs 2026-10-02. No data or integration triggers copied.
-- Ancillary dependency tables stay closed to anon/authenticated.
begin;
do $$ begin
 if to_regclass('public.account_deletion_requests') is not null or exists(select 1 from auth.users) then
  raise exception 'Refusing to bootstrap an initialized or populated environment';
 end if;
end $$;
create table public."vital_measurements" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "import_batch_id" uuid,
  "metric" text not null,
  "value" numeric not null,
  "secondary_value" numeric,
  "unit" text not null,
  "observed_at" timestamp with time zone not null,
  "source_kind" text not null,
  "source_name" text not null,
  "source_record_id" text,
  "device_name" text,
  "fingerprint" text not null,
  "provenance" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null
);
create table public."connected_health_records" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "import_batch_id" uuid not null,
  "record_type" text not null,
  "title" text not null,
  "code" text,
  "status" text,
  "effective_date" date,
  "provider_name" text,
  "details" jsonb default '{}'::jsonb not null,
  "source_kind" text not null,
  "source_name" text not null,
  "source_record_id" text,
  "fingerprint" text not null,
  "provenance" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null
);
create table public."wellness_check_ins" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "partner_key" text not null,
  "questionnaire_version" integer default 1 not null,
  "answers" jsonb default '{}'::jsonb not null,
  "skipped_questions" text[] default '{}'::text[] not null,
  "answered_count" smallint default 0 not null,
  "status" text default 'in_progress'::text not null,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table public."wellness_insights" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "partner_key" text not null,
  "version" integer not null,
  "framework_version" integer not null,
  "prompt_version" integer not null,
  "source_fingerprint" text not null,
  "status" text not null,
  "insight" jsonb,
  "source_kinds" text[] default '{}'::text[] not null,
  "safety_flags" text[] default '{}'::text[] not null,
  "model" text,
  "duration_ms" integer,
  "error_code" text,
  "generated_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null
);
create table public."wellness_insight_feedback" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "insight_id" uuid not null,
  "target" text not null,
  "rating" text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table public."wellness_partner_enrollments" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "partner_key" text not null,
  "active" boolean default true not null,
  "consent_version" integer default 1 not null,
  "opted_in_at" timestamp with time zone default now() not null,
  "opted_in_source" text not null,
  "snoozed_until" timestamp with time zone,
  "opted_out_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table public."patient_clinical_records" (
  "id" uuid default gen_random_uuid() not null,
  "consumer_principal_id" uuid not null,
  "provider_account_id" uuid not null,
  "provider_patient_identity_id" uuid not null,
  "source_package_id" uuid not null,
  "source_resource_id" uuid not null,
  "resource_type" text not null,
  "external_resource_id" text not null,
  "title" text not null,
  "occurred_at" timestamp with time zone,
  "provider_name" text,
  "payload" jsonb not null,
  "provenance" jsonb not null,
  "consent_receipt_id" uuid not null,
  "released_at" timestamp with time zone default now() not null
);
create table public."provider_access_grants" (
  "id" uuid default gen_random_uuid() not null,
  "provider_patient_identity_id" uuid not null,
  "consumer_principal_id" uuid,
  "scope" text[] default '{}'::text[] not null,
  "purpose" text not null,
  "consent_version" text not null,
  "status" text default 'pending'::text not null,
  "effective_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "granted_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "request_id" text,
  "created_at" timestamp with time zone default now() not null
);
create table public."wellness_partners" (
  "partner_key" text not null,
  "display_name" text not null,
  "status" text default 'draft'::text not null,
  "launch_stage" text default 'internal'::text not null,
  "framework_version" integer default 1 not null,
  "prompt_version" integer default 1 not null,
  "prompt_template" text not null,
  "branding" jsonb default '{}'::jsonb not null,
  "disclaimer" text not null,
  "consent_copy" text not null,
  "website_url" text not null,
  "gpt_enabled" boolean default false not null,
  "cloud_enabled" boolean default false not null,
  "generation_enabled" boolean default false not null,
  "updated_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table public."provider_patient_identities" (
  "id" uuid default gen_random_uuid() not null,
  "provider_account_id" uuid not null,
  "external_patient_id" text not null,
  "organization_patient_number" text,
  "status" text default 'active'::text not null,
  "source_system" text not null,
  "source_import_job_id" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table public."patient_access_consent_receipts" (
  "id" uuid default gen_random_uuid() not null,
  "invitation_id" uuid not null,
  "provider_account_id" uuid not null,
  "provider_patient_identity_id" uuid not null,
  "consumer_principal_id" uuid not null,
  "scope" text[] not null,
  "purpose" text not null,
  "consent_version" text not null,
  "consented_at" timestamp with time zone not null,
  "effective_at" timestamp with time zone not null,
  "expires_at" timestamp with time zone not null,
  "evidence_type" text not null,
  "evidence_ref" text not null,
  "synthetic" boolean not null,
  "request_id" text not null,
  "created_at" timestamp with time zone default now() not null
);
create table public."provider_accounts" (
  "id" uuid default gen_random_uuid() not null,
  "legacy_organization_id" uuid,
  "provider_directory_id" uuid,
  "legal_name" text not null,
  "display_name" text not null,
  "slug" text not null,
  "provider_type" text default 'healthcare_provider'::text not null,
  "status" text default 'draft'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table public."health_import_batches" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "proposal_id" uuid not null,
  "source_kind" text not null,
  "source_name" text not null,
  "imported_count" integer default 0 not null,
  "duplicate_count" integer default 0 not null,
  "created_at" timestamp with time zone default now() not null
);
create table public."patient_access_invitations" (
  "id" uuid default gen_random_uuid() not null,
  "provider_account_id" uuid not null,
  "provider_patient_identity_id" uuid not null,
  "email" text not null,
  "requested_scope" text[] not null,
  "purpose" text not null,
  "consent_version" text not null,
  "synthetic" boolean default false not null,
  "status" text default 'pending'::text not null,
  "expires_at" timestamp with time zone not null,
  "access_expires_at" timestamp with time zone not null,
  "invited_by" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "responded_at" timestamp with time zone,
  "response_principal_id" uuid,
  "request_id" text,
  "source_epic_review_batch_id" uuid,
  "vault_dashboard_opened_at" timestamp with time zone,
  "chatgpt_handoff_opened_at" timestamp with time zone
);
create table public."health_import_proposals" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "source_kind" text not null,
  "source_name" text not null,
  "idempotency_key" uuid not null,
  "payload_hash" text not null,
  "payload" jsonb not null,
  "status" text default 'pending'::text not null,
  "result" jsonb,
  "expires_at" timestamp with time zone default (now() + '00:30:00'::interval) not null,
  "confirmed_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null
);
create table public."provider_epic_import_batches" (
  "id" uuid default gen_random_uuid() not null,
  "provider_account_id" uuid not null,
  "bulk_export_id" uuid not null,
  "status" text default 'processing'::text not null,
  "total_count" integer default 0 not null,
  "matched_count" integer default 0 not null,
  "ambiguous_count" integer default 0 not null,
  "unmatched_count" integer default 0 not null,
  "created_by" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "completed_at" timestamp with time zone,
  "approved_by" uuid,
  "approved_at" timestamp with time zone,
  "invitations_created_by" uuid,
  "invitations_created_at" timestamp with time zone,
  "invitations_created_count" integer
);
create table public."provider_epic_bulk_exports" (
  "id" uuid default gen_random_uuid() not null,
  "provider_account_id" uuid not null,
  "connection_id" uuid not null,
  "group_fhir_id" text not null,
  "status" text default 'requested'::text not null,
  "request_url_digest" text not null,
  "status_url" text not null,
  "progress_summary" text,
  "output_manifest" jsonb default '[]'::jsonb not null,
  "error_code" text,
  "created_by" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "completed_at" timestamp with time zone
);
create table public."provider_epic_connections" (
  "id" uuid default gen_random_uuid() not null,
  "provider_account_id" uuid not null,
  "display_name" text not null,
  "connection_mode" text not null,
  "fhir_base_url" text not null,
  "token_endpoint_url" text not null,
  "bulk_data_endpoint_url" text,
  "client_id" text not null,
  "jwks_url" text not null,
  "requested_scopes" text[] default '{}'::text[] not null,
  "status" text default 'draft'::text not null,
  "credential_secret_ref" text,
  "last_validated_at" timestamp with time zone,
  "last_successful_sync_at" timestamp with time zone,
  "created_by" uuid not null,
  "updated_by" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "validation_results" jsonb default '[]'::jsonb not null,
  "last_validation_error" text,
  "group_fhir_id" text
);
alter table public."wellness_partner_enrollments" add constraint "wellness_partner_enrollments_pkey" PRIMARY KEY (id);
alter table public."wellness_check_ins" add constraint "wellness_check_ins_pkey" PRIMARY KEY (id);
alter table public."wellness_insight_feedback" add constraint "wellness_insight_feedback_pkey" PRIMARY KEY (id);
alter table public."wellness_insights" add constraint "wellness_insights_pkey" PRIMARY KEY (id);
alter table public."wellness_partners" add constraint "wellness_partners_pkey" PRIMARY KEY (partner_key);
alter table public."provider_accounts" add constraint "provider_accounts_pkey" PRIMARY KEY (id);
alter table public."provider_patient_identities" add constraint "provider_patient_identities_pkey" PRIMARY KEY (id);
alter table public."provider_access_grants" add constraint "provider_access_grants_pkey" PRIMARY KEY (id);
alter table public."patient_access_invitations" add constraint "patient_access_invitations_pkey" PRIMARY KEY (id);
alter table public."patient_access_consent_receipts" add constraint "patient_access_consent_receipts_pkey" PRIMARY KEY (id);
alter table public."patient_clinical_records" add constraint "patient_clinical_records_pkey" PRIMARY KEY (id);
alter table public."health_import_proposals" add constraint "health_import_proposals_pkey" PRIMARY KEY (id);
alter table public."health_import_batches" add constraint "health_import_batches_pkey" PRIMARY KEY (id);
alter table public."vital_measurements" add constraint "vital_measurements_pkey" PRIMARY KEY (id);
alter table public."provider_epic_connections" add constraint "provider_epic_connections_pkey" PRIMARY KEY (id);
alter table public."connected_health_records" add constraint "connected_health_records_pkey" PRIMARY KEY (id);
alter table public."provider_epic_bulk_exports" add constraint "provider_epic_bulk_exports_pkey" PRIMARY KEY (id);
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_pkey" PRIMARY KEY (id);
alter table public."wellness_partner_enrollments" add constraint "wellness_partner_enrollments_user_id_partner_key_key" UNIQUE (user_id, partner_key);
alter table public."wellness_check_ins" add constraint "wellness_check_ins_user_id_partner_key_questionnaire_versio_key" UNIQUE (user_id, partner_key, questionnaire_version);
alter table public."wellness_insight_feedback" add constraint "wellness_insight_feedback_user_id_insight_id_target_key" UNIQUE (user_id, insight_id, target);
alter table public."wellness_insights" add constraint "wellness_insights_user_id_partner_key_source_fingerprint_key" UNIQUE (user_id, partner_key, source_fingerprint);
alter table public."wellness_insights" add constraint "wellness_insights_user_id_partner_key_version_key" UNIQUE (user_id, partner_key, version);
alter table public."provider_accounts" add constraint "provider_accounts_legacy_organization_id_key" UNIQUE (legacy_organization_id);
alter table public."provider_accounts" add constraint "provider_accounts_provider_directory_id_key" UNIQUE (provider_directory_id);
alter table public."provider_accounts" add constraint "provider_accounts_slug_key" UNIQUE (slug);
alter table public."provider_patient_identities" add constraint "provider_patient_identities_provider_account_id_source_syst_key" UNIQUE (provider_account_id, source_system, external_patient_id);
alter table public."patient_access_consent_receipts" add constraint "patient_access_consent_receipts_invitation_id_key" UNIQUE (invitation_id);
alter table public."patient_clinical_records" add constraint "patient_clinical_records_consumer_principal_id_source_resou_key" UNIQUE (consumer_principal_id, source_resource_id);
alter table public."health_import_proposals" add constraint "health_import_proposals_user_id_idempotency_key_key" UNIQUE (user_id, idempotency_key);
alter table public."health_import_batches" add constraint "health_import_batches_proposal_id_key" UNIQUE (proposal_id);
alter table public."vital_measurements" add constraint "vital_measurements_user_id_fingerprint_key" UNIQUE (user_id, fingerprint);
alter table public."provider_epic_connections" add constraint "provider_epic_connections_provider_account_id_key" UNIQUE (provider_account_id);
alter table public."connected_health_records" add constraint "connected_health_records_user_id_fingerprint_key" UNIQUE (user_id, fingerprint);
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_bulk_export_id_key" UNIQUE (bulk_export_id);
alter table public."wellness_partner_enrollments" add constraint "wellness_partner_enrollments_opted_in_source_check" CHECK ((opted_in_source = ANY (ARRAY['gpt_app'::text, 'saas_cloud'::text])));
alter table public."wellness_check_ins" add constraint "wellness_check_ins_answered_count_check" CHECK (((answered_count >= 0) AND (answered_count <= 6)));
alter table public."wellness_check_ins" add constraint "wellness_check_ins_answers_check" CHECK ((jsonb_typeof(answers) = 'object'::text));
alter table public."wellness_check_ins" add constraint "wellness_check_ins_status_check" CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text])));
alter table public."wellness_insight_feedback" add constraint "wellness_insight_feedback_rating_check" CHECK ((rating = ANY (ARRAY['up'::text, 'down'::text])));
alter table public."wellness_insight_feedback" add constraint "wellness_insight_feedback_target_check" CHECK ((target = ANY (ARRAY['overall'::text, 'headline'::text, 'sleep'::text, 'blood_sugar'::text, 'nourishment'::text, 'stress'::text])));
alter table public."wellness_insights" add constraint "wellness_insights_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'generating'::text, 'succeeded'::text, 'failed'::text, 'rejected'::text])));
alter table public."wellness_insights" add constraint "wellness_insights_version_check" CHECK ((version > 0));
alter table public."wellness_partners" add constraint "wellness_partners_framework_version_check" CHECK ((framework_version > 0));
alter table public."wellness_partners" add constraint "wellness_partners_launch_stage_check" CHECK ((launch_stage = ANY (ARRAY['internal'::text, 'closed_beta'::text, 'public'::text])));
alter table public."wellness_partners" add constraint "wellness_partners_prompt_version_check" CHECK ((prompt_version > 0));
alter table public."wellness_partners" add constraint "wellness_partners_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'disabled'::text])));
alter table public."provider_accounts" add constraint "provider_accounts_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'verification_pending'::text, 'active'::text, 'degraded'::text, 'suspended'::text, 'archived'::text])));
alter table public."provider_patient_identities" add constraint "provider_patient_identities_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'merged'::text, 'quarantined'::text])));
alter table public."provider_access_grants" add constraint "provider_access_grants_period_check" CHECK (((expires_at IS NULL) OR (effective_at IS NULL) OR (expires_at > effective_at)));
alter table public."provider_access_grants" add constraint "provider_access_grants_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'denied'::text, 'revoked'::text, 'expired'::text])));
alter table public."patient_access_invitations" add constraint "patient_access_invitations_check" CHECK ((expires_at > created_at));
alter table public."patient_access_invitations" add constraint "patient_access_invitations_check1" CHECK ((access_expires_at > expires_at));
alter table public."patient_access_invitations" add constraint "patient_access_invitations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'denied'::text, 'revoked'::text, 'expired'::text])));
alter table public."patient_access_consent_receipts" add constraint "patient_access_consent_receipts_check" CHECK ((expires_at > effective_at));
alter table public."patient_access_consent_receipts" add constraint "patient_access_consent_receipts_evidence_type_check" CHECK ((evidence_type = 'verified_email_invitation'::text));
alter table public."patient_access_consent_receipts" add constraint "patient_access_consent_receipts_scope_check" CHECK ((cardinality(scope) > 0));
alter table public."patient_clinical_records" add constraint "patient_clinical_records_payload_check" CHECK ((jsonb_typeof(payload) = 'object'::text));
alter table public."patient_clinical_records" add constraint "patient_clinical_records_provenance_check" CHECK ((jsonb_typeof(provenance) = 'object'::text));
alter table public."patient_clinical_records" add constraint "patient_clinical_records_resource_type_check" CHECK ((resource_type = ANY (ARRAY['health_record'::text, 'lab'::text, 'medication'::text, 'condition'::text, 'allergy'::text, 'immunization'::text, 'vital'::text])));
alter table public."health_import_proposals" add constraint "health_import_proposals_payload_check" CHECK (((jsonb_typeof(payload) = 'object'::text) AND (octet_length((payload)::text) <= 262144)));
alter table public."health_import_proposals" add constraint "health_import_proposals_payload_hash_check" CHECK ((payload_hash ~ '^[a-f0-9]{64}$'::text));
alter table public."health_import_proposals" add constraint "health_import_proposals_source_kind_check" CHECK ((source_kind = ANY (ARRAY['chatgpt_health_apple_health'::text, 'chatgpt_health_medical_records'::text, 'provider_fhir'::text])));
alter table public."health_import_proposals" add constraint "health_import_proposals_source_name_check" CHECK (((char_length(source_name) >= 1) AND (char_length(source_name) <= 160)));
alter table public."health_import_proposals" add constraint "health_import_proposals_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'expired'::text, 'cancelled'::text])));
alter table public."health_import_batches" add constraint "health_import_batches_duplicate_count_check" CHECK ((duplicate_count >= 0));
alter table public."health_import_batches" add constraint "health_import_batches_imported_count_check" CHECK ((imported_count >= 0));
alter table public."vital_measurements" add constraint "vital_measurements_check" CHECK ((((metric = 'blood_pressure'::text) AND (secondary_value IS NOT NULL)) OR ((metric <> 'blood_pressure'::text) AND (secondary_value IS NULL))));
alter table public."vital_measurements" add constraint "vital_measurements_check1" CHECK ((((metric = 'heart_rate'::text) AND (unit = 'bpm'::text) AND ((value >= (20)::numeric) AND (value <= (300)::numeric))) OR ((metric = 'blood_pressure'::text) AND (unit = 'mmHg'::text) AND ((value >= (40)::numeric) AND (value <= (300)::numeric)) AND ((secondary_value >= (20)::numeric) AND (secondary_value <= (200)::numeric))) OR ((metric = 'respiratory_rate'::text) AND (unit = 'breaths/min'::text) AND ((value >= (3)::numeric) AND (value <= (80)::numeric))) OR ((metric = 'oxygen_saturation'::text) AND (unit = '%'::text) AND ((value >= (0)::numeric) AND (value <= (100)::numeric))) OR ((metric = 'body_temperature'::text) AND (((unit = 'Cel'::text) AND ((value >= (25)::numeric) AND (value <= (45)::numeric))) OR ((unit = '[degF]'::text) AND ((value >= (77)::numeric) AND (value <= (113)::numeric))))) OR ((metric = 'weight'::text) AND (((unit = 'kg'::text) AND ((value >= 0.5) AND (value <= (1000)::numeric))) OR ((unit = 'lb'::text) AND ((value >= (1)::numeric) AND (value <= (2205)::numeric))))) OR ((metric = 'blood_glucose'::text) AND (((unit = 'mg/dL'::text) AND ((value >= (10)::numeric) AND (value <= (2000)::numeric))) OR ((unit = 'mmol/L'::text) AND ((value >= 0.5) AND (value <= (111)::numeric))))) OR ((metric = 'steps'::text) AND (unit = 'count'::text) AND ((value >= (0)::numeric) AND (value <= (1000000)::numeric))) OR ((metric = 'sleep_duration'::text) AND (((unit = 'min'::text) AND ((value >= (0)::numeric) AND (value <= (1440)::numeric))) OR ((unit = 'h'::text) AND ((value >= (0)::numeric) AND (value <= (24)::numeric))))) OR ((metric = 'active_energy'::text) AND (unit = 'kcal'::text) AND ((value >= (0)::numeric) AND (value <= (100000)::numeric))) OR ((metric = 'workout_duration'::text) AND (((unit = 'min'::text) AND ((value >= (0)::numeric) AND (value <= (1440)::numeric))) OR ((unit = 'h'::text) AND ((value >= (0)::numeric) AND (value <= (24)::numeric)))))));
alter table public."vital_measurements" add constraint "vital_measurements_device_name_check" CHECK (((device_name IS NULL) OR (char_length(device_name) <= 160)));
alter table public."vital_measurements" add constraint "vital_measurements_fingerprint_check" CHECK ((fingerprint ~ '^[a-f0-9]{64}$'::text));
alter table public."vital_measurements" add constraint "vital_measurements_metric_check" CHECK ((metric = ANY (ARRAY['heart_rate'::text, 'blood_pressure'::text, 'respiratory_rate'::text, 'oxygen_saturation'::text, 'body_temperature'::text, 'weight'::text, 'blood_glucose'::text, 'steps'::text, 'sleep_duration'::text, 'active_energy'::text, 'workout_duration'::text])));
alter table public."vital_measurements" add constraint "vital_measurements_source_name_check" CHECK (((char_length(source_name) >= 1) AND (char_length(source_name) <= 160)));
alter table public."vital_measurements" add constraint "vital_measurements_source_record_id_check" CHECK (((source_record_id IS NULL) OR (char_length(source_record_id) <= 240)));
alter table public."vital_measurements" add constraint "vital_measurements_unit_check" CHECK (((char_length(unit) >= 1) AND (char_length(unit) <= 32)));
alter table public."provider_epic_connections" add constraint "provider_epic_connections_connection_mode_check" CHECK ((connection_mode = ANY (ARRAY['smart_backend_services'::text, 'bulk_data'::text])));
alter table public."provider_epic_connections" add constraint "provider_epic_connections_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'validation_pending'::text, 'validated'::text, 'active'::text, 'degraded'::text, 'disabled'::text])));
alter table public."connected_health_records" add constraint "connected_health_records_code_check" CHECK (((code IS NULL) OR (char_length(code) <= 120)));
alter table public."connected_health_records" add constraint "connected_health_records_details_check" CHECK (((jsonb_typeof(details) = 'object'::text) AND (octet_length((details)::text) <= 32768)));
alter table public."connected_health_records" add constraint "connected_health_records_fingerprint_check" CHECK ((fingerprint ~ '^[a-f0-9]{64}$'::text));
alter table public."connected_health_records" add constraint "connected_health_records_provider_name_check" CHECK (((provider_name IS NULL) OR (char_length(provider_name) <= 160)));
alter table public."connected_health_records" add constraint "connected_health_records_record_type_check" CHECK ((record_type = ANY (ARRAY['medication'::text, 'condition'::text, 'allergy'::text, 'immunization'::text, 'lab'::text, 'encounter'::text, 'document'::text])));
alter table public."connected_health_records" add constraint "connected_health_records_source_name_check" CHECK (((char_length(source_name) >= 1) AND (char_length(source_name) <= 160)));
alter table public."connected_health_records" add constraint "connected_health_records_source_record_id_check" CHECK (((source_record_id IS NULL) OR (char_length(source_record_id) <= 240)));
alter table public."connected_health_records" add constraint "connected_health_records_status_check" CHECK (((status IS NULL) OR (char_length(status) <= 80)));
alter table public."connected_health_records" add constraint "connected_health_records_title_check" CHECK (((char_length(title) >= 1) AND (char_length(title) <= 240)));
alter table public."provider_epic_bulk_exports" add constraint "provider_epic_bulk_exports_status_check" CHECK ((status = ANY (ARRAY['requested'::text, 'in_progress'::text, 'manifest_ready'::text, 'failed'::text, 'cancelled'::text])));
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_ambiguous_count_check" CHECK ((ambiguous_count >= 0));
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_invitations_created_count_check" CHECK (((invitations_created_count IS NULL) OR (invitations_created_count >= 0)));
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_matched_count_check" CHECK ((matched_count >= 0));
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_status_check" CHECK ((status = ANY (ARRAY['processing'::text, 'review_ready'::text, 'approved'::text, 'cancelled'::text, 'failed'::text])));
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_total_count_check" CHECK ((total_count >= 0));
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_unmatched_count_check" CHECK ((unmatched_count >= 0));
alter table public."wellness_partner_enrollments" add constraint "wellness_partner_enrollments_partner_key_fkey" FOREIGN KEY (partner_key) REFERENCES wellness_partners(partner_key);
alter table public."wellness_partner_enrollments" add constraint "wellness_partner_enrollments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."wellness_check_ins" add constraint "wellness_check_ins_partner_key_fkey" FOREIGN KEY (partner_key) REFERENCES wellness_partners(partner_key);
alter table public."wellness_check_ins" add constraint "wellness_check_ins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."wellness_insight_feedback" add constraint "wellness_insight_feedback_insight_id_fkey" FOREIGN KEY (insight_id) REFERENCES wellness_insights(id) ON DELETE CASCADE;
alter table public."wellness_insight_feedback" add constraint "wellness_insight_feedback_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."wellness_insights" add constraint "wellness_insights_partner_key_fkey" FOREIGN KEY (partner_key) REFERENCES wellness_partners(partner_key);
alter table public."wellness_insights" add constraint "wellness_insights_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."wellness_partners" add constraint "wellness_partners_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id);
alter table public."provider_accounts" add constraint "provider_accounts_legacy_organization_id_fkey" FOREIGN KEY (legacy_organization_id) REFERENCES organizations(id);
alter table public."provider_accounts" add constraint "provider_accounts_provider_directory_id_fkey" FOREIGN KEY (provider_directory_id) REFERENCES provider_organizations(id);
alter table public."provider_patient_identities" add constraint "provider_patient_identities_provider_account_id_fkey" FOREIGN KEY (provider_account_id) REFERENCES provider_accounts(id) ON DELETE CASCADE;
alter table public."provider_access_grants" add constraint "provider_access_grants_consumer_principal_id_fkey" FOREIGN KEY (consumer_principal_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."provider_access_grants" add constraint "provider_access_grants_provider_patient_identity_id_fkey" FOREIGN KEY (provider_patient_identity_id) REFERENCES provider_patient_identities(id) ON DELETE CASCADE;
alter table public."patient_access_invitations" add constraint "patient_access_invitations_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."patient_access_invitations" add constraint "patient_access_invitations_provider_account_id_fkey" FOREIGN KEY (provider_account_id) REFERENCES provider_accounts(id) ON DELETE CASCADE;
alter table public."patient_access_invitations" add constraint "patient_access_invitations_provider_patient_identity_id_fkey" FOREIGN KEY (provider_patient_identity_id) REFERENCES provider_patient_identities(id) ON DELETE CASCADE;
alter table public."patient_access_invitations" add constraint "patient_access_invitations_response_principal_id_fkey" FOREIGN KEY (response_principal_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public."patient_access_invitations" add constraint "patient_access_invitations_source_epic_review_batch_id_fkey" FOREIGN KEY (source_epic_review_batch_id) REFERENCES provider_epic_import_batches(id) ON DELETE SET NULL;
alter table public."patient_access_consent_receipts" add constraint "patient_access_consent_receip_provider_patient_identity_id_fkey" FOREIGN KEY (provider_patient_identity_id) REFERENCES provider_patient_identities(id) ON DELETE RESTRICT;
alter table public."patient_access_consent_receipts" add constraint "patient_access_consent_receipts_consumer_principal_id_fkey" FOREIGN KEY (consumer_principal_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."patient_access_consent_receipts" add constraint "patient_access_consent_receipts_invitation_id_fkey" FOREIGN KEY (invitation_id) REFERENCES patient_access_invitations(id) ON DELETE RESTRICT;
alter table public."patient_access_consent_receipts" add constraint "patient_access_consent_receipts_provider_account_id_fkey" FOREIGN KEY (provider_account_id) REFERENCES provider_accounts(id) ON DELETE RESTRICT;
alter table public."patient_clinical_records" add constraint "patient_clinical_records_consent_receipt_id_fkey" FOREIGN KEY (consent_receipt_id) REFERENCES patient_access_consent_receipts(id) ON DELETE RESTRICT;
alter table public."patient_clinical_records" add constraint "patient_clinical_records_consumer_principal_id_fkey" FOREIGN KEY (consumer_principal_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."patient_clinical_records" add constraint "patient_clinical_records_provider_account_id_fkey" FOREIGN KEY (provider_account_id) REFERENCES provider_accounts(id) ON DELETE RESTRICT;
alter table public."health_import_proposals" add constraint "health_import_proposals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."health_import_batches" add constraint "health_import_batches_proposal_id_fkey" FOREIGN KEY (proposal_id) REFERENCES health_import_proposals(id);
alter table public."health_import_batches" add constraint "health_import_batches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."vital_measurements" add constraint "vital_measurements_import_batch_id_fkey" FOREIGN KEY (import_batch_id) REFERENCES health_import_batches(id);
alter table public."vital_measurements" add constraint "vital_measurements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."provider_epic_connections" add constraint "provider_epic_connections_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public."provider_epic_connections" add constraint "provider_epic_connections_provider_account_id_fkey" FOREIGN KEY (provider_account_id) REFERENCES provider_accounts(id) ON DELETE CASCADE;
alter table public."provider_epic_connections" add constraint "provider_epic_connections_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id);
alter table public."connected_health_records" add constraint "connected_health_records_import_batch_id_fkey" FOREIGN KEY (import_batch_id) REFERENCES health_import_batches(id);
alter table public."connected_health_records" add constraint "connected_health_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."provider_epic_bulk_exports" add constraint "provider_epic_bulk_exports_connection_id_fkey" FOREIGN KEY (connection_id) REFERENCES provider_epic_connections(id) ON DELETE CASCADE;
alter table public."provider_epic_bulk_exports" add constraint "provider_epic_bulk_exports_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public."provider_epic_bulk_exports" add constraint "provider_epic_bulk_exports_provider_account_id_fkey" FOREIGN KEY (provider_account_id) REFERENCES provider_accounts(id) ON DELETE CASCADE;
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id);
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_bulk_export_id_fkey" FOREIGN KEY (bulk_export_id) REFERENCES provider_epic_bulk_exports(id) ON DELETE CASCADE;
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_invitations_created_by_fkey" FOREIGN KEY (invitations_created_by) REFERENCES auth.users(id);
alter table public."provider_epic_import_batches" add constraint "provider_epic_import_batches_provider_account_id_fkey" FOREIGN KEY (provider_account_id) REFERENCES provider_accounts(id) ON DELETE CASCADE;
CREATE INDEX wellness_insights_latest_idx ON public.wellness_insights USING btree (user_id, partner_key, created_at DESC);
CREATE INDEX idx_provider_patient_identities_account ON public.provider_patient_identities USING btree (provider_account_id, status);
CREATE INDEX idx_provider_access_grants_patient ON public.provider_access_grants USING btree (provider_patient_identity_id, status);
CREATE UNIQUE INDEX idx_patient_access_invitations_pending ON public.patient_access_invitations USING btree (provider_patient_identity_id, lower(email)) WHERE (status = 'pending'::text);
CREATE INDEX idx_patient_access_invitations_provider ON public.patient_access_invitations USING btree (provider_account_id, created_at DESC);
CREATE INDEX idx_patient_access_invitations_invited_by ON public.patient_access_invitations USING btree (invited_by);
CREATE INDEX idx_patient_access_invitations_response_principal ON public.patient_access_invitations USING btree (response_principal_id) WHERE (response_principal_id IS NOT NULL);
CREATE INDEX idx_patient_access_invitations_epic_review ON public.patient_access_invitations USING btree (source_epic_review_batch_id) WHERE (source_epic_review_batch_id IS NOT NULL);
CREATE INDEX idx_patient_access_consent_receipts_consumer ON public.patient_access_consent_receipts USING btree (consumer_principal_id, consented_at DESC);
CREATE INDEX idx_patient_access_consent_receipts_provider ON public.patient_access_consent_receipts USING btree (provider_account_id, consented_at DESC);
CREATE INDEX idx_patient_access_consent_receipts_patient ON public.patient_access_consent_receipts USING btree (provider_patient_identity_id, consented_at DESC);
CREATE INDEX idx_patient_clinical_records_owner_date ON public.patient_clinical_records USING btree (consumer_principal_id, occurred_at DESC);
CREATE INDEX idx_patient_clinical_records_patient ON public.patient_clinical_records USING btree (provider_patient_identity_id, released_at DESC);
CREATE INDEX health_import_proposals_user_status_idx ON public.health_import_proposals USING btree (user_id, status, created_at DESC);
CREATE INDEX health_import_batches_user_created_idx ON public.health_import_batches USING btree (user_id, created_at DESC);
CREATE INDEX vital_measurements_import_batch_idx ON public.vital_measurements USING btree (import_batch_id) WHERE (import_batch_id IS NOT NULL);
CREATE INDEX vital_measurements_user_observed_idx ON public.vital_measurements USING btree (user_id, observed_at DESC);
CREATE INDEX idx_provider_epic_connections_status ON public.provider_epic_connections USING btree (status);
CREATE INDEX connected_health_records_user_date_idx ON public.connected_health_records USING btree (user_id, effective_date DESC, created_at DESC);
CREATE INDEX connected_health_records_import_batch_idx ON public.connected_health_records USING btree (import_batch_id);
CREATE INDEX idx_provider_epic_bulk_exports_account_created ON public.provider_epic_bulk_exports USING btree (provider_account_id, created_at DESC);
CREATE UNIQUE INDEX idx_provider_epic_bulk_exports_one_active ON public.provider_epic_bulk_exports USING btree (connection_id) WHERE (status = ANY (ARRAY['requested'::text, 'in_progress'::text]));
CREATE INDEX idx_provider_epic_import_batches_account_created ON public.provider_epic_import_batches USING btree (provider_account_id, created_at DESC);
alter table public.provider_connections add column ehr_source text;
alter table public."vital_measurements" enable row level security;
revoke all on public."vital_measurements" from public, anon, authenticated;
grant all on public."vital_measurements" to service_role;
alter table public."connected_health_records" enable row level security;
revoke all on public."connected_health_records" from public, anon, authenticated;
grant all on public."connected_health_records" to service_role;
alter table public."wellness_check_ins" enable row level security;
revoke all on public."wellness_check_ins" from public, anon, authenticated;
grant all on public."wellness_check_ins" to service_role;
alter table public."wellness_insights" enable row level security;
revoke all on public."wellness_insights" from public, anon, authenticated;
grant all on public."wellness_insights" to service_role;
alter table public."wellness_insight_feedback" enable row level security;
revoke all on public."wellness_insight_feedback" from public, anon, authenticated;
grant all on public."wellness_insight_feedback" to service_role;
alter table public."wellness_partner_enrollments" enable row level security;
revoke all on public."wellness_partner_enrollments" from public, anon, authenticated;
grant all on public."wellness_partner_enrollments" to service_role;
alter table public."patient_clinical_records" enable row level security;
revoke all on public."patient_clinical_records" from public, anon, authenticated;
grant all on public."patient_clinical_records" to service_role;
alter table public."provider_access_grants" enable row level security;
revoke all on public."provider_access_grants" from public, anon, authenticated;
grant all on public."provider_access_grants" to service_role;
alter table public."wellness_partners" enable row level security;
revoke all on public."wellness_partners" from public, anon, authenticated;
grant all on public."wellness_partners" to service_role;
alter table public."provider_patient_identities" enable row level security;
revoke all on public."provider_patient_identities" from public, anon, authenticated;
grant all on public."provider_patient_identities" to service_role;
alter table public."patient_access_consent_receipts" enable row level security;
revoke all on public."patient_access_consent_receipts" from public, anon, authenticated;
grant all on public."patient_access_consent_receipts" to service_role;
alter table public."provider_accounts" enable row level security;
revoke all on public."provider_accounts" from public, anon, authenticated;
grant all on public."provider_accounts" to service_role;
alter table public."health_import_batches" enable row level security;
revoke all on public."health_import_batches" from public, anon, authenticated;
grant all on public."health_import_batches" to service_role;
alter table public."patient_access_invitations" enable row level security;
revoke all on public."patient_access_invitations" from public, anon, authenticated;
grant all on public."patient_access_invitations" to service_role;
alter table public."health_import_proposals" enable row level security;
revoke all on public."health_import_proposals" from public, anon, authenticated;
grant all on public."health_import_proposals" to service_role;
alter table public."provider_epic_import_batches" enable row level security;
revoke all on public."provider_epic_import_batches" from public, anon, authenticated;
grant all on public."provider_epic_import_batches" to service_role;
alter table public."provider_epic_bulk_exports" enable row level security;
revoke all on public."provider_epic_bulk_exports" from public, anon, authenticated;
grant all on public."provider_epic_bulk_exports" to service_role;
alter table public."provider_epic_connections" enable row level security;
revoke all on public."provider_epic_connections" from public, anon, authenticated;
grant all on public."provider_epic_connections" to service_role;
alter table public."user_profiles" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='user_profiles' loop execute format('drop policy %I on public.%I',p.policyname,'user_profiles'); end loop; end $$;
create policy "Allow delete for own profiles" on public."user_profiles" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Allow insert for own profiles" on public."user_profiles" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Allow select for own profiles" on public."user_profiles" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Allow update for own profiles" on public."user_profiles" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."patient_profiles" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='patient_profiles' loop execute format('drop policy %I on public.%I',p.policyname,'patient_profiles'); end loop; end $$;
create policy "Users can insert patient profiles" on public."patient_profiles" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can update patient profiles" on public."patient_profiles" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can view own patient profiles" on public."patient_profiles" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."user_addresses" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='user_addresses' loop execute format('drop policy %I on public.%I',p.policyname,'user_addresses'); end loop; end $$;
create policy "Demo delete access for user_addresses" on public."user_addresses" as PERMISSIVE for DELETE to "anon" using ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Demo insert access for user_addresses" on public."user_addresses" as PERMISSIVE for INSERT to "anon" with check ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Demo select access for user_addresses" on public."user_addresses" as PERMISSIVE for SELECT to "anon" using ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Demo update access for user_addresses" on public."user_addresses" as PERMISSIVE for UPDATE to "anon" using ((user_id = '00000000-0000-0000-0000-000000000000'::text)) with check ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Service role full access to user_addresses" on public."user_addresses" as PERMISSIVE for ALL to "public" using ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text));
create policy "Users can delete own addresses" on public."user_addresses" as PERMISSIVE for DELETE to "authenticated" using (((auth.uid())::text = user_id));
create policy "Users can insert own addresses" on public."user_addresses" as PERMISSIVE for INSERT to "authenticated" with check (((auth.uid())::text = user_id));
create policy "Users can update own addresses" on public."user_addresses" as PERMISSIVE for UPDATE to "authenticated" using (((auth.uid())::text = user_id)) with check (((auth.uid())::text = user_id));
create policy "Users can view own addresses" on public."user_addresses" as PERMISSIVE for SELECT to "authenticated" using (((auth.uid())::text = user_id));
alter table public."user_preferences" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='user_preferences' loop execute format('drop policy %I on public.%I',p.policyname,'user_preferences'); end loop; end $$;
create policy "Allow delete for own preferences" on public."user_preferences" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Allow insert for own preferences" on public."user_preferences" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Allow select for own preferences" on public."user_preferences" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Allow update for own preferences" on public."user_preferences" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."conditions" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='conditions' loop execute format('drop policy %I on public.%I',p.policyname,'conditions'); end loop; end $$;
create policy "Users can delete own conditions" on public."conditions" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can insert own conditions" on public."conditions" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can update own conditions" on public."conditions" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can view own conditions" on public."conditions" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."medications" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='medications' loop execute format('drop policy %I on public.%I',p.policyname,'medications'); end loop; end $$;
create policy "Users can delete own medications" on public."medications" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can insert own medications" on public."medications" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can update own medications" on public."medications" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can view own medications" on public."medications" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."allergies" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='allergies' loop execute format('drop policy %I on public.%I',p.policyname,'allergies'); end loop; end $$;
create policy "Users can delete own allergies" on public."allergies" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can insert own allergies" on public."allergies" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can update own allergies" on public."allergies" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can view own allergies" on public."allergies" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."immunizations" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='immunizations' loop execute format('drop policy %I on public.%I',p.policyname,'immunizations'); end loop; end $$;
create policy "Users can delete own immunizations" on public."immunizations" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can insert own immunizations" on public."immunizations" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can update own immunizations" on public."immunizations" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can view own immunizations" on public."immunizations" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."encounters" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='encounters' loop execute format('drop policy %I on public.%I',p.policyname,'encounters'); end loop; end $$;
create policy "Anon can insert demo encounters" on public."encounters" as PERMISSIVE for INSERT to "anon" with check ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Anon can view demo encounters" on public."encounters" as PERMISSIVE for SELECT to "anon" using ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Users can delete own encounters" on public."encounters" as PERMISSIVE for DELETE to "authenticated" using (((auth.uid())::text = user_id));
create policy "Users can insert own encounters" on public."encounters" as PERMISSIVE for INSERT to "authenticated" with check (((auth.uid())::text = user_id));
create policy "Users can update own encounters" on public."encounters" as PERMISSIVE for UPDATE to "authenticated" using (((auth.uid())::text = user_id)) with check (((auth.uid())::text = user_id));
create policy "Users can view own encounters" on public."encounters" as PERMISSIVE for SELECT to "authenticated" using (((auth.uid())::text = user_id));
alter table public."appointments" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='appointments' loop execute format('drop policy %I on public.%I',p.policyname,'appointments'); end loop; end $$;
create policy "Anon can insert demo appointments" on public."appointments" as PERMISSIVE for INSERT to "anon" with check ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Anon can view demo appointments" on public."appointments" as PERMISSIVE for SELECT to "anon" using ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Users can delete own appointments" on public."appointments" as PERMISSIVE for DELETE to "authenticated" using (((auth.uid())::text = user_id));
create policy "Users can insert own appointments" on public."appointments" as PERMISSIVE for INSERT to "authenticated" with check (((auth.uid())::text = user_id));
create policy "Users can update own appointments" on public."appointments" as PERMISSIVE for UPDATE to "authenticated" using (((auth.uid())::text = user_id)) with check (((auth.uid())::text = user_id));
create policy "Users can view own appointments" on public."appointments" as PERMISSIVE for SELECT to "authenticated" using (((auth.uid())::text = user_id));
alter table public."care_team" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='care_team' loop execute format('drop policy %I on public.%I',p.policyname,'care_team'); end loop; end $$;
create policy "Users can delete own care team" on public."care_team" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can insert own care team" on public."care_team" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can update own care team" on public."care_team" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can view own care team" on public."care_team" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."preventive_care" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='preventive_care' loop execute format('drop policy %I on public.%I',p.policyname,'preventive_care'); end loop; end $$;
create policy "Users can delete own preventive care items" on public."preventive_care" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (auth.uid())::text));
create policy "Users can insert own preventive care items" on public."preventive_care" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (auth.uid())::text));
create policy "Users can update own preventive care items" on public."preventive_care" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (auth.uid())::text)) with check ((user_id = (auth.uid())::text));
create policy "Users can view own preventive care items" on public."preventive_care" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (auth.uid())::text));
alter table public."providers" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='providers' loop execute format('drop policy %I on public.%I',p.policyname,'providers'); end loop; end $$;
create policy "Users can delete own providers" on public."providers" as PERMISSIVE for DELETE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can insert own providers" on public."providers" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can update own providers" on public."providers" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can view own providers" on public."providers" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
alter table public."pharmacies" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='pharmacies' loop execute format('drop policy %I on public.%I',p.policyname,'pharmacies'); end loop; end $$;
create policy "Users can delete own pharmacies" on public."pharmacies" as PERMISSIVE for DELETE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can insert own pharmacies" on public."pharmacies" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can update own pharmacies" on public."pharmacies" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can view own pharmacies" on public."pharmacies" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
alter table public."insurance_coverages" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='insurance_coverages' loop execute format('drop policy %I on public.%I',p.policyname,'insurance_coverages'); end loop; end $$;
create policy "Allow delete for demo or own data" on public."insurance_coverages" as PERMISSIVE for DELETE to "public" using (((user_id = '00000000-0000-0000-0000-000000000000'::uuid) OR (user_id = ( SELECT auth.uid() AS uid))));
create policy "Allow insert for demo or own data" on public."insurance_coverages" as PERMISSIVE for INSERT to "public" with check (((user_id = '00000000-0000-0000-0000-000000000000'::uuid) OR (user_id = ( SELECT auth.uid() AS uid))));
create policy "Allow select for demo or own data" on public."insurance_coverages" as PERMISSIVE for SELECT to "public" using (((user_id = '00000000-0000-0000-0000-000000000000'::uuid) OR (user_id = ( SELECT auth.uid() AS uid))));
create policy "Allow update for demo or own data" on public."insurance_coverages" as PERMISSIVE for UPDATE to "public" using (((user_id = '00000000-0000-0000-0000-000000000000'::uuid) OR (user_id = ( SELECT auth.uid() AS uid)))) with check (((user_id = '00000000-0000-0000-0000-000000000000'::uuid) OR (user_id = ( SELECT auth.uid() AS uid))));
alter table public."insurance_policies" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='insurance_policies' loop execute format('drop policy %I on public.%I',p.policyname,'insurance_policies'); end loop; end $$;
create policy "Allow delete for own policies" on public."insurance_policies" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Allow insert for own policies" on public."insurance_policies" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Allow select for own policies" on public."insurance_policies" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Allow update for own policies" on public."insurance_policies" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."claims" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='claims' loop execute format('drop policy %I on public.%I',p.policyname,'claims'); end loop; end $$;
create policy "Anon can insert demo claims" on public."claims" as PERMISSIVE for INSERT to "anon" with check ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Anon can view demo claims" on public."claims" as PERMISSIVE for SELECT to "anon" using ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Users can delete own claims" on public."claims" as PERMISSIVE for DELETE to "authenticated" using (((auth.uid())::text = user_id));
create policy "Users can insert own claims" on public."claims" as PERMISSIVE for INSERT to "authenticated" with check (((auth.uid())::text = user_id));
create policy "Users can update own claims" on public."claims" as PERMISSIVE for UPDATE to "authenticated" using (((auth.uid())::text = user_id)) with check (((auth.uid())::text = user_id));
create policy "Users can view own claims" on public."claims" as PERMISSIVE for SELECT to "authenticated" using (((auth.uid())::text = user_id));
alter table public."health_records" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='health_records' loop execute format('drop policy %I on public.%I',p.policyname,'health_records'); end loop; end $$;
create policy "Anon can insert demo health records" on public."health_records" as PERMISSIVE for INSERT to "anon" with check ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Anon can view demo health records" on public."health_records" as PERMISSIVE for SELECT to "anon" using ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Users can delete own health records" on public."health_records" as PERMISSIVE for DELETE to "authenticated" using (((auth.uid())::text = user_id));
create policy "Users can insert own health records" on public."health_records" as PERMISSIVE for INSERT to "authenticated" with check (((auth.uid())::text = user_id));
create policy "Users can update own health records" on public."health_records" as PERMISSIVE for UPDATE to "authenticated" using (((auth.uid())::text = user_id)) with check (((auth.uid())::text = user_id));
create policy "Users can view own health records" on public."health_records" as PERMISSIVE for SELECT to "authenticated" using (((auth.uid())::text = user_id));
alter table public."health_record_requests" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='health_record_requests' loop execute format('drop policy %I on public.%I',p.policyname,'health_record_requests'); end loop; end $$;
create policy "Demo delete access for health_record_requests" on public."health_record_requests" as PERMISSIVE for DELETE to "anon" using ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Demo insert access for health_record_requests" on public."health_record_requests" as PERMISSIVE for INSERT to "anon" with check ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Demo select access for health_record_requests" on public."health_record_requests" as PERMISSIVE for SELECT to "anon" using ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Demo update access for health_record_requests" on public."health_record_requests" as PERMISSIVE for UPDATE to "anon" using ((user_id = '00000000-0000-0000-0000-000000000000'::text)) with check ((user_id = '00000000-0000-0000-0000-000000000000'::text));
create policy "Users can create own record requests" on public."health_record_requests" as PERMISSIVE for INSERT to "authenticated" with check (((auth.uid())::text = user_id));
create policy "Users can delete own record requests" on public."health_record_requests" as PERMISSIVE for DELETE to "authenticated" using (((auth.uid())::text = user_id));
create policy "Users can update own record requests" on public."health_record_requests" as PERMISSIVE for UPDATE to "authenticated" using (((auth.uid())::text = user_id)) with check (((auth.uid())::text = user_id));
create policy "Users can view own record requests" on public."health_record_requests" as PERMISSIVE for SELECT to "authenticated" using (((auth.uid())::text = user_id));
alter table public."medical_form_uploads" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='medical_form_uploads' loop execute format('drop policy %I on public.%I',p.policyname,'medical_form_uploads'); end loop; end $$;
create policy "Users can create own medical form uploads" on public."medical_form_uploads" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can delete own medical form uploads" on public."medical_form_uploads" as PERMISSIVE for DELETE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can update own medical form uploads" on public."medical_form_uploads" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can view own medical form uploads" on public."medical_form_uploads" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
alter table public."provider_connections" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='provider_connections' loop execute format('drop policy %I on public.%I',p.policyname,'provider_connections'); end loop; end $$;
create policy "Service role full access to provider connections" on public."provider_connections" as PERMISSIVE for ALL to "public" using ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text));
create policy "Users can delete own provider connections" on public."provider_connections" as PERMISSIVE for DELETE to "public" using (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));
create policy "Users can insert own provider connections" on public."provider_connections" as PERMISSIVE for INSERT to "public" with check (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));
create policy "Users can update own provider connections" on public."provider_connections" as PERMISSIVE for UPDATE to "public" using (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));
create policy "Users can view own provider connections" on public."provider_connections" as PERMISSIVE for SELECT to "public" using (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));
alter table public."diet_log_entries" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='diet_log_entries' loop execute format('drop policy %I on public.%I',p.policyname,'diet_log_entries'); end loop; end $$;
create policy "Users can delete own diet logs" on public."diet_log_entries" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can insert own diet logs" on public."diet_log_entries" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can update own diet logs" on public."diet_log_entries" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can view own diet logs" on public."diet_log_entries" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."life_signal_entries" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='life_signal_entries' loop execute format('drop policy %I on public.%I',p.policyname,'life_signal_entries'); end loop; end $$;
create policy "Users can delete own life signals" on public."life_signal_entries" as PERMISSIVE for DELETE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can insert own life signals" on public."life_signal_entries" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can update own life signals" on public."life_signal_entries" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text)) with check ((user_id = (( SELECT auth.uid() AS uid))::text));
create policy "Users can view own life signals" on public."life_signal_entries" as PERMISSIVE for SELECT to "authenticated" using ((user_id = (( SELECT auth.uid() AS uid))::text));
alter table public."vital_measurements" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='vital_measurements' loop execute format('drop policy %I on public.%I',p.policyname,'vital_measurements'); end loop; end $$;
create policy "vital_measurements_select_own" on public."vital_measurements" as PERMISSIVE for SELECT to "authenticated" using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (user_id = ( SELECT auth.uid() AS uid))));
grant INSERT on public."vital_measurements" to "authenticated";
grant SELECT on public."vital_measurements" to "authenticated";
grant UPDATE on public."vital_measurements" to "authenticated";
grant DELETE on public."vital_measurements" to "authenticated";
grant TRUNCATE on public."vital_measurements" to "authenticated";
grant REFERENCES on public."vital_measurements" to "authenticated";
grant TRIGGER on public."vital_measurements" to "authenticated";
grant INSERT on public."vital_measurements" to "service_role";
grant SELECT on public."vital_measurements" to "service_role";
grant UPDATE on public."vital_measurements" to "service_role";
grant DELETE on public."vital_measurements" to "service_role";
grant TRUNCATE on public."vital_measurements" to "service_role";
grant REFERENCES on public."vital_measurements" to "service_role";
grant TRIGGER on public."vital_measurements" to "service_role";
alter table public."connected_health_records" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='connected_health_records' loop execute format('drop policy %I on public.%I',p.policyname,'connected_health_records'); end loop; end $$;
create policy "connected_health_records_select_own" on public."connected_health_records" as PERMISSIVE for SELECT to "authenticated" using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (user_id = ( SELECT auth.uid() AS uid))));
grant SELECT on public."connected_health_records" to "authenticated";
grant INSERT on public."connected_health_records" to "service_role";
grant SELECT on public."connected_health_records" to "service_role";
grant UPDATE on public."connected_health_records" to "service_role";
grant DELETE on public."connected_health_records" to "service_role";
grant TRUNCATE on public."connected_health_records" to "service_role";
grant REFERENCES on public."connected_health_records" to "service_role";
grant TRIGGER on public."connected_health_records" to "service_role";
alter table public."wellness_check_ins" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='wellness_check_ins' loop execute format('drop policy %I on public.%I',p.policyname,'wellness_check_ins'); end loop; end $$;
create policy "Users create own wellness check-ins" on public."wellness_check_ins" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users read own wellness check-ins" on public."wellness_check_ins" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users update own wellness check-ins" on public."wellness_check_ins" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
grant INSERT on public."wellness_check_ins" to "anon";
grant SELECT on public."wellness_check_ins" to "anon";
grant UPDATE on public."wellness_check_ins" to "anon";
grant DELETE on public."wellness_check_ins" to "anon";
grant TRUNCATE on public."wellness_check_ins" to "anon";
grant REFERENCES on public."wellness_check_ins" to "anon";
grant TRIGGER on public."wellness_check_ins" to "anon";
grant INSERT on public."wellness_check_ins" to "authenticated";
grant SELECT on public."wellness_check_ins" to "authenticated";
grant UPDATE on public."wellness_check_ins" to "authenticated";
grant DELETE on public."wellness_check_ins" to "authenticated";
grant TRUNCATE on public."wellness_check_ins" to "authenticated";
grant REFERENCES on public."wellness_check_ins" to "authenticated";
grant TRIGGER on public."wellness_check_ins" to "authenticated";
grant INSERT on public."wellness_check_ins" to "service_role";
grant SELECT on public."wellness_check_ins" to "service_role";
grant UPDATE on public."wellness_check_ins" to "service_role";
grant DELETE on public."wellness_check_ins" to "service_role";
grant TRUNCATE on public."wellness_check_ins" to "service_role";
grant REFERENCES on public."wellness_check_ins" to "service_role";
grant TRIGGER on public."wellness_check_ins" to "service_role";
alter table public."wellness_insights" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='wellness_insights' loop execute format('drop policy %I on public.%I',p.policyname,'wellness_insights'); end loop; end $$;
create policy "Users read own wellness insights" on public."wellness_insights" as PERMISSIVE for SELECT to "authenticated" using (((user_id = ( SELECT auth.uid() AS uid)) AND (status = 'succeeded'::text)));
grant INSERT on public."wellness_insights" to "anon";
grant SELECT on public."wellness_insights" to "anon";
grant UPDATE on public."wellness_insights" to "anon";
grant DELETE on public."wellness_insights" to "anon";
grant TRUNCATE on public."wellness_insights" to "anon";
grant REFERENCES on public."wellness_insights" to "anon";
grant TRIGGER on public."wellness_insights" to "anon";
grant INSERT on public."wellness_insights" to "authenticated";
grant SELECT on public."wellness_insights" to "authenticated";
grant UPDATE on public."wellness_insights" to "authenticated";
grant DELETE on public."wellness_insights" to "authenticated";
grant TRUNCATE on public."wellness_insights" to "authenticated";
grant REFERENCES on public."wellness_insights" to "authenticated";
grant TRIGGER on public."wellness_insights" to "authenticated";
grant INSERT on public."wellness_insights" to "service_role";
grant SELECT on public."wellness_insights" to "service_role";
grant UPDATE on public."wellness_insights" to "service_role";
grant DELETE on public."wellness_insights" to "service_role";
grant TRUNCATE on public."wellness_insights" to "service_role";
grant REFERENCES on public."wellness_insights" to "service_role";
grant TRIGGER on public."wellness_insights" to "service_role";
alter table public."wellness_insight_feedback" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='wellness_insight_feedback' loop execute format('drop policy %I on public.%I',p.policyname,'wellness_insight_feedback'); end loop; end $$;
create policy "Users create own wellness feedback" on public."wellness_insight_feedback" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users read own wellness feedback" on public."wellness_insight_feedback" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users update own wellness feedback" on public."wellness_insight_feedback" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
grant INSERT on public."wellness_insight_feedback" to "anon";
grant SELECT on public."wellness_insight_feedback" to "anon";
grant UPDATE on public."wellness_insight_feedback" to "anon";
grant DELETE on public."wellness_insight_feedback" to "anon";
grant TRUNCATE on public."wellness_insight_feedback" to "anon";
grant REFERENCES on public."wellness_insight_feedback" to "anon";
grant TRIGGER on public."wellness_insight_feedback" to "anon";
grant INSERT on public."wellness_insight_feedback" to "authenticated";
grant SELECT on public."wellness_insight_feedback" to "authenticated";
grant UPDATE on public."wellness_insight_feedback" to "authenticated";
grant DELETE on public."wellness_insight_feedback" to "authenticated";
grant TRUNCATE on public."wellness_insight_feedback" to "authenticated";
grant REFERENCES on public."wellness_insight_feedback" to "authenticated";
grant TRIGGER on public."wellness_insight_feedback" to "authenticated";
grant INSERT on public."wellness_insight_feedback" to "service_role";
grant SELECT on public."wellness_insight_feedback" to "service_role";
grant UPDATE on public."wellness_insight_feedback" to "service_role";
grant DELETE on public."wellness_insight_feedback" to "service_role";
grant TRUNCATE on public."wellness_insight_feedback" to "service_role";
grant REFERENCES on public."wellness_insight_feedback" to "service_role";
grant TRIGGER on public."wellness_insight_feedback" to "service_role";
alter table public."wellness_partner_enrollments" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='wellness_partner_enrollments' loop execute format('drop policy %I on public.%I',p.policyname,'wellness_partner_enrollments'); end loop; end $$;
create policy "Users create own wellness enrollment" on public."wellness_partner_enrollments" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users read own wellness enrollment" on public."wellness_partner_enrollments" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users update own wellness enrollment" on public."wellness_partner_enrollments" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
grant INSERT on public."wellness_partner_enrollments" to "anon";
grant SELECT on public."wellness_partner_enrollments" to "anon";
grant UPDATE on public."wellness_partner_enrollments" to "anon";
grant DELETE on public."wellness_partner_enrollments" to "anon";
grant TRUNCATE on public."wellness_partner_enrollments" to "anon";
grant REFERENCES on public."wellness_partner_enrollments" to "anon";
grant TRIGGER on public."wellness_partner_enrollments" to "anon";
grant INSERT on public."wellness_partner_enrollments" to "authenticated";
grant SELECT on public."wellness_partner_enrollments" to "authenticated";
grant UPDATE on public."wellness_partner_enrollments" to "authenticated";
grant DELETE on public."wellness_partner_enrollments" to "authenticated";
grant TRUNCATE on public."wellness_partner_enrollments" to "authenticated";
grant REFERENCES on public."wellness_partner_enrollments" to "authenticated";
grant TRIGGER on public."wellness_partner_enrollments" to "authenticated";
grant INSERT on public."wellness_partner_enrollments" to "service_role";
grant SELECT on public."wellness_partner_enrollments" to "service_role";
grant UPDATE on public."wellness_partner_enrollments" to "service_role";
grant DELETE on public."wellness_partner_enrollments" to "service_role";
grant TRUNCATE on public."wellness_partner_enrollments" to "service_role";
grant REFERENCES on public."wellness_partner_enrollments" to "service_role";
grant TRIGGER on public."wellness_partner_enrollments" to "service_role";
alter table public."form_responses" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='form_responses' loop execute format('drop policy %I on public.%I',p.policyname,'form_responses'); end loop; end $$;
create policy "Users can insert form responses" on public."form_responses" as PERMISSIVE for INSERT to "public" with check ((patient_id IN ( SELECT patient_profiles.id
   FROM patient_profiles
  WHERE (patient_profiles.user_id = (auth.uid())::text))));
create policy "Users can update own form responses" on public."form_responses" as PERMISSIVE for UPDATE to "public" using ((patient_id IN ( SELECT patient_profiles.id
   FROM patient_profiles
  WHERE (patient_profiles.user_id = (auth.uid())::text)))) with check ((patient_id IN ( SELECT patient_profiles.id
   FROM patient_profiles
  WHERE (patient_profiles.user_id = (auth.uid())::text))));
create policy "Users can view own form responses" on public."form_responses" as PERMISSIVE for SELECT to "authenticated" using ((patient_id IN ( SELECT patient_profiles.id
   FROM patient_profiles
  WHERE (patient_profiles.user_id = (( SELECT auth.uid() AS uid))::text))));
alter table public."share_events" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='share_events' loop execute format('drop policy %I on public.%I',p.policyname,'share_events'); end loop; end $$;
create policy "Users can insert own share events" on public."share_events" as PERMISSIVE for INSERT to "authenticated" with check (((patient_id = (( SELECT auth.uid() AS uid))::text) OR (patient_id IN ( SELECT (patient_profiles.id)::text AS id
   FROM patient_profiles
  WHERE (patient_profiles.user_id = (( SELECT auth.uid() AS uid))::text)))));
create policy "Users can update own share events" on public."share_events" as PERMISSIVE for UPDATE to "authenticated" using (((patient_id = (( SELECT auth.uid() AS uid))::text) OR (patient_id IN ( SELECT (patient_profiles.id)::text AS id
   FROM patient_profiles
  WHERE (patient_profiles.user_id = (( SELECT auth.uid() AS uid))::text))))) with check (((patient_id = (( SELECT auth.uid() AS uid))::text) OR (patient_id IN ( SELECT (patient_profiles.id)::text AS id
   FROM patient_profiles
  WHERE (patient_profiles.user_id = (( SELECT auth.uid() AS uid))::text)))));
create policy "Users can view own share events" on public."share_events" as PERMISSIVE for SELECT to "authenticated" using (((patient_id = (( SELECT auth.uid() AS uid))::text) OR (patient_id IN ( SELECT (patient_profiles.id)::text AS id
   FROM patient_profiles
  WHERE (patient_profiles.user_id = (( SELECT auth.uid() AS uid))::text)))));
alter table public."patient_clinical_records" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='patient_clinical_records' loop execute format('drop policy %I on public.%I',p.policyname,'patient_clinical_records'); end loop; end $$;
create policy "patient_reads_owned_clinical_records" on public."patient_clinical_records" as PERMISSIVE for SELECT to "authenticated" using ((( SELECT auth.uid() AS uid) = consumer_principal_id));
grant INSERT on public."patient_clinical_records" to "service_role";
grant SELECT on public."patient_clinical_records" to "service_role";
grant UPDATE on public."patient_clinical_records" to "service_role";
grant DELETE on public."patient_clinical_records" to "service_role";
grant TRUNCATE on public."patient_clinical_records" to "service_role";
grant REFERENCES on public."patient_clinical_records" to "service_role";
grant TRIGGER on public."patient_clinical_records" to "service_role";
grant SELECT on public."patient_clinical_records" to "authenticated";
alter table public."provider_access_grants" enable row level security;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='provider_access_grants' loop execute format('drop policy %I on public.%I',p.policyname,'provider_access_grants'); end loop; end $$;
create policy "Consumers can read own provider access grants" on public."provider_access_grants" as PERMISSIVE for SELECT to "authenticated" using ((consumer_principal_id = ( SELECT auth.uid() AS uid)));
grant INSERT on public."provider_access_grants" to "service_role";
grant SELECT on public."provider_access_grants" to "service_role";
grant UPDATE on public."provider_access_grants" to "service_role";
grant DELETE on public."provider_access_grants" to "service_role";
grant TRUNCATE on public."provider_access_grants" to "service_role";
grant REFERENCES on public."provider_access_grants" to "service_role";
grant TRIGGER on public."provider_access_grants" to "service_role";
grant SELECT on public."provider_access_grants" to "authenticated";
-- A request queue, not an erasure function. No account/data is deleted here.
create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete set null,
  confirmed boolean not null check (confirmed),
  status text not null default 'requested' check (status in ('requested','reviewing','completed','declined')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  user_message text,
  check ((status in ('completed','declined')) = (resolved_at is not null))
);
-- Retain a non-identifying receipt after eventual approved erasure.
alter table public.account_deletion_requests alter column user_id drop not null;
create unique index account_deletion_requests_one_open on public.account_deletion_requests(user_id)
  where status in ('requested','reviewing');
alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from public, anon, authenticated;
grant select (id,user_id,status,requested_at,resolved_at,user_message) on public.account_deletion_requests to authenticated;
grant insert (user_id,confirmed) on public.account_deletion_requests to authenticated;
grant all on public.account_deletion_requests to service_role;
create policy deletion_request_owner_read on public.account_deletion_requests for select to authenticated
  using (user_id = (select auth.uid()));
create policy deletion_request_owner_insert on public.account_deletion_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and confirmed = true and status = 'requested');
comment on table public.account_deletion_requests is 'User-confirmed deletion requests for operator review. Receipt is not evidence of completed erasure. No automated deletion.';

notify pgrst, 'reload schema';
commit;

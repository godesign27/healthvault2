/*
  # Make provider_organization_id nullable in provider_connections

  Keragon-sourced EHR connections do not require a matching row in the
  provider_organizations directory table. Making the foreign key optional
  allows these connections to be stored without a pre-existing org record.

  ## Changes
  - `provider_connections.provider_organization_id` — changed from NOT NULL to nullable
  - Foreign key constraint is preserved; NULL simply means no internal org mapping
*/

ALTER TABLE provider_connections
  ALTER COLUMN provider_organization_id DROP NOT NULL;

/*
  Add Epic's public patient-facing R4 sandbox to the provider directory.

  This entry is intentionally labelled as a test environment so it cannot be
  confused with a real healthcare organization or production patient data.
*/

UPDATE public.provider_organizations
SET
  ehr_vendor = 'Epic',
  portal_brand = 'MyChart Sandbox',
  fhir_endpoint_url = 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
  authorization_endpoint = 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
  token_endpoint = 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
  smart_scopes = 'patient/*.read openid fhirUser offline_access',
  supports_direct_connection = false,
  supports_epic_connection = true,
  supports_manual_request = false,
  city = NULL,
  state = NULL,
  updated_at = now()
WHERE name = 'Epic Sandbox (Test Patients)';

INSERT INTO public.provider_organizations (
  name,
  ehr_vendor,
  portal_brand,
  fhir_endpoint_url,
  authorization_endpoint,
  token_endpoint,
  smart_scopes,
  supports_direct_connection,
  supports_epic_connection,
  supports_manual_request
)
SELECT
  'Epic Sandbox (Test Patients)',
  'Epic',
  'MyChart Sandbox',
  'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
  'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
  'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
  'patient/*.read openid fhirUser offline_access',
  false,
  true,
  false
WHERE NOT EXISTS (
  SELECT 1
  FROM public.provider_organizations
  WHERE name = 'Epic Sandbox (Test Patients)'
);

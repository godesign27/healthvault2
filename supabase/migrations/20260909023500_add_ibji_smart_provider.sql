-- Illinois Bone & Joint Institute patient-facing SMART on FHIR connection.
-- Endpoint metadata sourced from Epic's production endpoint directory and
-- verified against the provider's SMART configuration document.

UPDATE public.provider_organizations
SET
  ehr_vendor = 'Epic',
  portal_brand = 'MyChart',
  fhir_endpoint_url = 'https://epicproxy.et1195.epichosted.com/fhirproxy/api/FHIR/R4',
  authorization_endpoint = 'https://epicproxy.et1195.epichosted.com/fhirproxy/oauth2/authorize',
  token_endpoint = 'https://epicproxy.et1195.epichosted.com/fhirproxy/oauth2/token',
  smart_scopes = 'patient/*.read openid fhirUser offline_access',
  supports_direct_connection = false,
  supports_epic_connection = true,
  supports_manual_request = true,
  state = 'IL',
  updated_at = now()
WHERE lower(name) = 'illinois bone & joint institute';

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
  supports_manual_request,
  state
)
SELECT
  'Illinois Bone & Joint Institute',
  'Epic',
  'MyChart',
  'https://epicproxy.et1195.epichosted.com/fhirproxy/api/FHIR/R4',
  'https://epicproxy.et1195.epichosted.com/fhirproxy/oauth2/authorize',
  'https://epicproxy.et1195.epichosted.com/fhirproxy/oauth2/token',
  'patient/*.read openid fhirUser offline_access',
  false,
  true,
  true,
  'IL'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.provider_organizations
  WHERE lower(name) = 'illinois bone & joint institute'
);

-- Server-only evidence, retained with the claim and erased by its owner cascade.
-- No FK to share_events: reserve the identifier before creating the event or uploading files.
alter table public.medical_share_requests
  add column share_event_id uuid,
  add column email_attempt_started_at timestamptz,
  add column provider_message_id text,
  add column provider_accepted_at timestamptz;

create unique index medical_share_requests_share_event_id_key
  on public.medical_share_requests (share_event_id) where share_event_id is not null;
comment on column public.medical_share_requests.share_event_id is
  'Reserved before side effects; an event may not exist if preparation failed. Not a bearer credential.';
comment on column public.medical_share_requests.email_attempt_started_at is
  'Saved before provider dispatch. Does not prove acceptance or delivery; never authorizes retry.';
comment on column public.medical_share_requests.provider_message_id is
  'Optional Resend recipient-email ID; absent IDs do not prove rejection.';
comment on column public.medical_share_requests.provider_accepted_at is
  'HTTP acceptance observed and persisted, not inbox delivery. Legacy rows remain null.';

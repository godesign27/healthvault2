-- Additive: never infer/decode identifiers from mixed legacy storage.
alter table public.insurance_coverages add column if not exists member_id text;
alter table public.insurance_coverages add constraint insurance_member_id_nonblank
  check (member_id is null or length(btrim(member_id)) > 0);
comment on column public.insurance_coverages.member_id is
  'Explicitly supplied member ID. Protected by coverage row RLS; not application-level encrypted. Never backfill from member_id_hash without provenance.';
comment on column public.insurance_coverages.member_id_hash is
  'Legacy mixed plaintext/hash storage. Do not use for identifier display or autofill. New clients write an empty compatibility value.';

-- Cover patient-health import foreign keys used by owner history and batch detail lookups.

create index if not exists health_import_batches_user_created_idx
  on public.health_import_batches (user_id, created_at desc);

create index if not exists vital_measurements_import_batch_idx
  on public.vital_measurements (import_batch_id)
  where import_batch_id is not null;

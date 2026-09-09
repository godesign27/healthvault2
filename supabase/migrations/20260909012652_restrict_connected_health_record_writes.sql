revoke insert, update, delete, truncate, references, trigger
  on public.connected_health_records from authenticated, anon;
grant select on public.connected_health_records to authenticated;

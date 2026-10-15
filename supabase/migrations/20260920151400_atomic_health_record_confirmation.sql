-- RPC-only serialization; direct writes from other clients do not take this lock.
-- Exact retries return the existing row. Conflicting logical duplicates are not overwritten.
create or replace function public.confirm_health_record(p_kind text, p_value jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  owner_id text := auth.uid()::text;
  fields text[];
  conflict_predicate text;
  columns_sql text;
  values_sql text;
  typed_value jsonb;
  normalized jsonb;
  saved jsonb;
  conflicting boolean;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_value) is distinct from 'object' then raise exception 'Invalid confirmation'; end if;
  case p_kind
    when 'conditions' then fields := array['name','status','diagnosed_on','managing_physician','notes']; conflict_predicate := 'lower(btrim(t.name))=lower(btrim($2->>''name'')) and t.status=$2->>''status''';
    when 'medications' then fields := array['name','dosage','frequency','prescribed_by','start_date','end_date','notes']; conflict_predicate := 'lower(btrim(t.name))=lower(btrim($2->>''name'')) and lower(btrim(coalesce(t.dosage,'''')))=lower(btrim(coalesce($2->>''dosage'',''''))) and lower(btrim(coalesce(t.frequency,'''')))=lower(btrim(coalesce($2->>''frequency'',''''))) and t.end_date is null';
    when 'allergies' then fields := array['allergen','reaction','severity','diagnosed_on','notes']; conflict_predicate := 'lower(btrim(t.allergen))=lower(btrim($2->>''allergen'')) and lower(btrim(coalesce(t.reaction,'''')))=lower(btrim(coalesce($2->>''reaction'','''')))';
    when 'health_records' then fields := array['title','kind','provider_name','service_date','ai_summary','tags','source']; conflict_predicate := 'lower(btrim(t.title))=lower(btrim($2->>''title'')) and lower(btrim(coalesce(t.provider_name,'''')))=lower(btrim(coalesce($2->>''provider_name'',''''))) and t.service_date is not distinct from ($2->>''service_date'')::date';
    when 'appointments' then fields := array['provider_name','appointment_type','scheduled_at','location','notes','status']; conflict_predicate := 'lower(btrim(t.provider_name))=lower(btrim($2->>''provider_name'')) and t.scheduled_at=($2->>''scheduled_at'')::timestamptz and t.status=''scheduled''';
    else raise exception 'Unsupported confirmation kind';
  end case;
  -- Reject ownership, IDs, or other unreviewed columns even if the caller supplies them.
  if (select count(*) from jsonb_object_keys(p_value)) <> cardinality(fields)
     or not (p_value ?& fields) then raise exception 'Confirmation fields do not match the review'; end if;
  if length(btrim(coalesce(p_value->>'name',p_value->>'allergen',p_value->>'title',p_value->>'provider_name',''))) = 0 then
    raise exception 'A name or title is required';
  end if;
  if p_kind='appointments' and (p_value->>'status' is distinct from 'scheduled'
     or nullif(btrim(p_value->>'appointment_type'),'') is null) then raise exception 'Invalid appointment'; end if;
  if p_kind='health_records' and p_value->>'source' is distinct from 'shared' then raise exception 'Invalid record source'; end if;
  -- Identifiers and predicates come exclusively from the fixed allowlist above.
  execute format('select to_jsonb(jsonb_populate_record(null::public.%I, $1))', p_kind)
    into typed_value using p_value;
  select jsonb_object_agg(key,typed_value->key) into normalized from unnest(fields) as key;
  perform pg_advisory_xact_lock(hashtextextended('health-vault-confirm:' || owner_id || ':' || p_kind,0));
  execute format('select to_jsonb(t) from public.%I t where t.user_id=$1 and (select jsonb_object_agg(key,to_jsonb(t)->key) from unnest($3::text[]) as key) = $2 order by t.id limit 1',p_kind)
    into saved using owner_id, normalized, fields;
  if saved is not null then return saved; end if;
  execute format('select exists(select 1 from public.%I t where t.user_id=$1 and (%s))',p_kind,conflict_predicate)
    into conflicting using owner_id, normalized;
  if conflicting then raise exception 'A matching record already exists with different details. Review it before adding another.'; end if;
  if p_kind='appointments' and ((normalized->>'scheduled_at')::timestamptz is null
     or not isfinite((normalized->>'scheduled_at')::timestamptz)
     or (normalized->>'scheduled_at')::timestamptz <= now()) then raise exception 'Appointment must be in the future'; end if;
  select string_agg(format('%I',key),','),string_agg(format('v.%I',key),',')
    into columns_sql,values_sql from unnest(fields) as key;
  execute format('insert into public.%I as target (user_id,%s) select $1,%s from jsonb_populate_record(null::public.%I,$2) v returning to_jsonb(target)',p_kind,columns_sql,values_sql,p_kind)
    into saved using owner_id,normalized;
  return saved;
end;
$$;
revoke all on function public.confirm_health_record(text,jsonb) from public,anon;
grant execute on function public.confirm_health_record(text,jsonb) to authenticated;

-- Serialize GPT wellness saves per authenticated user. Exact repeated events
-- return their existing rows; different event timestamps remain distinct.
create or replace function public.confirm_wellness_entries(p_kind text, p_entries jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  owner_id text := auth.uid()::text;
  entry jsonb;
  result jsonb := '[]'::jsonb;
  saved jsonb;
  event_time timestamptz;
  diet_row public.diet_log_entries%rowtype;
  signal_row public.life_signal_entries%rowtype;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if p_kind is null or p_kind not in ('diet', 'life_signal')
    or jsonb_typeof(p_entries) is distinct from 'array'
    or jsonb_array_length(p_entries) not between 1 and 20 then
    raise exception 'Invalid wellness confirmation';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('health-vault-wellness:' || owner_id, 0));
  for entry in select value from jsonb_array_elements(p_entries) loop
    event_time := (entry->>'event_time')::timestamptz;
    if event_time is null or not isfinite(event_time) then
      raise exception 'Reopen the preview before confirming: an explicit event time is required';
    end if;
    if p_kind = 'diet' then
      if jsonb_typeof(entry->'items') is distinct from 'array'
        or jsonb_array_length(entry->'items') not between 1 and 30 then
        raise exception 'Diet items are required';
      end if;
      select * into diet_row from public.diet_log_entries
        where user_id = owner_id and consumed_at = event_time
          and meal_type = entry->>'meal_type' and items = entry->'items'
          and water_ml is not distinct from (entry->>'water_ml')::integer
          and notes is not distinct from entry->>'notes'
        order by created_at, id limit 1;
      if not found then
        insert into public.diet_log_entries(user_id, consumed_at, meal_type, items, water_ml, notes, source, confirmation_status)
          values(owner_id, event_time, entry->>'meal_type', entry->'items', (entry->>'water_ml')::integer, entry->>'notes', 'chatgpt', 'confirmed')
          returning * into diet_row;
      end if;
      saved := to_jsonb(diet_row);
    else
      select * into signal_row from public.life_signal_entries
        where user_id = owner_id and recorded_at = event_time
          and energy = (entry->>'energy')::smallint and sleep = (entry->>'sleep')::smallint
          and mood = (entry->>'mood')::smallint and stress = (entry->>'stress')::smallint
          and pain = (entry->>'pain')::smallint and note is not distinct from entry->>'note'
        order by created_at, id limit 1;
      if not found then
        insert into public.life_signal_entries(user_id, recorded_at, energy, sleep, mood, stress, pain, note, source, confirmation_status)
          values(owner_id, event_time, (entry->>'energy')::smallint, (entry->>'sleep')::smallint,
            (entry->>'mood')::smallint, (entry->>'stress')::smallint, (entry->>'pain')::smallint, entry->>'note', 'chatgpt', 'confirmed')
          returning * into signal_row;
      end if;
      saved := to_jsonb(signal_row);
    end if;
    result := result || jsonb_build_array(saved);
  end loop;
  return result;
end;
$$;
revoke all on function public.confirm_wellness_entries(text, jsonb) from public, anon;
grant execute on function public.confirm_wellness_entries(text, jsonb) to authenticated;

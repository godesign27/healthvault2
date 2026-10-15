-- Synthetic identities and rollback-only rows; no email, links, or external calls.
begin;
set local role authenticated;
do $$
declare
  a text := 'c9e106c0-d497-45ed-a681-72e402d596bd';
  b text := '94184c3c-4db5-471c-a0c3-3d9bf87b3f80';
  claim_a jsonb;
  claim_b jsonb;
  replay jsonb;
  affected integer;
  kind text;
begin
  foreach kind in array array['health_share','medical_form_email'] loop
    perform set_config('request.jwt.claim.sub',a,true);
    claim_a := public.claim_share_confirmation(kind, repeat('a',64));
    assert claim_a->>'status'='claimed','Owner could not claim';
    replay := public.claim_share_confirmation(kind, repeat('a',64));
    assert replay->>'status'='pending' and replay->>'id'=claim_a->>'id','Pending replay duplicated operation';
    insert into public.share_events(id,patient_id,method,recipient,expires_at,note)
    values ((claim_a->>'id')::uuid,a,'SecureLink','{"fixture":true}',now()+interval '1 hour','ROLLBACK ISOLATION FIXTURE');

    perform set_config('request.jwt.claim.sub',b,true);
    assert (select count(*)=0 from public.share_events where id=(claim_a->>'id')::uuid),'Other owner can read share';
    assert (select count(*)=0 from public.share_confirmation_receipts where operation_id=(claim_a->>'id')::uuid),'Other owner can read receipt';
    update public.share_events set is_revoked=true,status='revoked' where id=(claim_a->>'id')::uuid;
    get diagnostics affected=row_count;
    assert affected=0,'Other owner revoked share';
    update public.share_confirmation_receipts set status='completed' where operation_id=(claim_a->>'id')::uuid;
    get diagnostics affected=row_count;
    assert affected=0,'Other owner completed receipt';
    begin
      perform public.complete_share_confirmation((claim_a->>'id')::uuid,jsonb_build_object('id',claim_a->>'id'));
      raise exception 'Cross-owner completion accepted';
    exception when others then
      assert sqlerrm='Share confirmation does not match an accessible share','Unexpected completion result: '||sqlerrm;
    end;
    claim_b := public.claim_share_confirmation(kind, repeat('a',64));
    assert claim_b->>'id'<>claim_a->>'id','Owners share confirmation identity';
    begin
      insert into public.share_events(patient_id,method,recipient) values(a,'SecureLink','{"fixture":true}');
      raise exception 'Forged share owner accepted';
    exception when insufficient_privilege then null;
    end;

    perform set_config('request.jwt.claim.sub',a,true);
    assert (select not is_revoked from public.share_events where id=(claim_a->>'id')::uuid),'Share changed';
    perform public.complete_share_confirmation((claim_a->>'id')::uuid,jsonb_build_object('id',claim_a->>'id'));
    replay := public.claim_share_confirmation(kind, repeat('a',64));
    assert replay->>'status'='completed' and replay->'result'->>'id'=claim_a->>'id','Completed replay not reused';
    update public.share_events set is_revoked=true,status='revoked',revoked_at=now() where id=(claim_a->>'id')::uuid;
    get diagnostics affected=row_count;
    assert affected=1,'Owner cannot revoke own share';
  end loop;
end $$;
select 'PASS: both share types enforce owner-only reads/revokes/receipts, separate account claims, pending and completed replay reuse' as result;
rollback;

# Deletion-request monitoring

Activated October 2, 2026 with the owner's explicit approval.

Owner and failure-review operator: Timothy McGuire.
Destination: godesigngo@gmail.com.
Sender: Health Vault <team@healthvault.me> through Resend.
Schedule: weekdays at 9:00 AM America/Denver, adjusting for daylight saving.
First scheduled check: Monday October 5, 2026 at 09:00 MDT (15:00 UTC).

The first successful daily query snapshots only the requested/reviewing count
and oldest request date. Empty queues create an `empty` receipt and send no email.
Requests arriving after the snapshot are included on the next weekday.
No patient names, addresses, IDs, messages, health records, files or access tokens
are queried for the digest. No request status changes or account erasure occur.

Message:

> Subject: Health Vault — deletion requests need review
>
> There are {count} open deletion requests. The oldest was received on {date}
> (America/Denver).
>
> Review the restricted queue in Supabase:
> https://supabase.com/dashboard/project/sgwekxjlvadvdosyudgj/editor

## Implementation

- Edge Function `deletion-digest` version 1 in production. Authentication is a
  random 72-character scheduler credential generated and retained in Vault.
  Missing/wrong credentials are rejected. The service-role key stays in Edge env.
- Database functions use security invoker, fixed search paths and revoked client
  execution. RLS-enabled ledgers/settings have no app-client grants or policies.
- Cron job `health-vault-deletion-digest` polls every 15 minutes UTC. Dispatch and
  claim independently require weekday/hour 09 in America/Denver. Polls outside
  that window do nothing. Failed sends retry at 09:15, 09:30 and 09:45.
- Atomic daily snapshot and five-minute lease prevent concurrent claims. Stable
  message content and Resend idempotency key protect ambiguous timeout/retry.
  Retry of an ambiguous receipt older than 23 hours stops for manual review.
- `accepted` means Resend accepted the message, not proof of Inbox delivery.
  Failures are not recorded as accepted or as an empty queue.
- `deletion_digest_runs` holds count-only check/send receipts;
  `deletion_digest_dispatches` holds HTTP request IDs. These are operator-only.
- Installation migrations leave scheduling disabled. The production-specific
  `supabase/operations/activate-deletion-digest.sql` performs guarded activation.
  Preview remains disabled and has no cron job or mail key.

## Failure visibility and operator procedure

Timothy is responsible for checking the restricted monitor status on weekdays
at/after 10 AM Mountain, alongside queue review. An absent email alone is not
proof the queue is empty. There is **no independent failure-notification service**
yet; an email-provider outage cannot reliably report itself by email.

Run in the production Supabase SQL editor:

```sql
select * from public.deletion_digest_health;
select scheduled_date, verification, checked_at, pending_count, oldest_date,
       state, attempts, accepted_at, error_code
from public.deletion_digest_runs order by checked_at desc limit 10;
select d.dispatched_at, r.status_code, r.timed_out, r.error_msg
from public.deletion_digest_dispatches d
left join net._http_response r on r.id=d.request_id
order by d.dispatched_at desc limit 10;
```

`awaiting_first_run` is expected before the first scheduled morning. `ok` requires
an empty or provider-accepted receipt for the latest due weekday. `needs_attention`
means the latest due weekday's receipt is missing, failed or still sending.
A missed day does not silently count as empty. pg_net responses expire, so inspect
failures promptly; durable daily/dispatch ledgers remain available.

On failure: review the queue directly; inspect Edge logs and Resend delivery status;
repair configuration/network/provider issues. Do not delete an ambiguous receipt
or blindly resend. Same-day retry within the morning window reuses the same key;
otherwise review manually. Provider-accepted mail can still bounce or be filtered;
Resend delivery events and the recipient mailbox remain the evidence for delivery.

Pause delivery (preserves evidence):

```sql
update public.deletion_digest_settings set enabled=false where id;
```

## Verification evidence — October 2, 2026

- Nine handler tests and isolated Deno type check pass: missing/wrong auth,
  empty/duplicate/busy/outside-window, aggregate-only content, query failure,
  send failure/timeout, receipt failure with stable retry and labeled verification.
- Preview rollback SQL passes summer/winter 09:00 conversion, weekend/off-hour
  exclusion, denied client access, empty receipt, aggregate count, concurrent lease,
  wrong-lease denial, snapshot stability and duplicate completion prevention.
  No synthetic users or requests remain.
- Preview real HTTP unsigned call returns 401. Authorized verification without a
  mail key returns 503 with failed receipt and no provider ID, as expected.
- Production unsigned HTTP call returns 401. Authorized verification returns 200;
  Resend ID `01a0fe74-2991-7edb-8dde-9c672cdcca37`.
- Gmail message `1a0fe742c18e6c68` received in Inbox/Personal with SPF, DKIM and DMARC
  passing. Subject clearly identifies monitor verification; no invented queue count.
- Duplicate verification returns accepted without incrementing attempts or sending
  another email. Production has zero open deletion requests at activation.
- Cron active and health `awaiting_first_run` verified. First real scheduled run is
  still pending; future Inbox placement is not guaranteed.
- Advisor: no monitor warnings/errors; three expected INFO closed-table/no-policy
  notices. Existing unrelated provider/consent SECURITY DEFINER warnings remain
  for separate review; see WORK_LOG and tasks.

This completes basic digest activation, not independent outage alerting, erasure,
retention approval or production-readiness sign-off.

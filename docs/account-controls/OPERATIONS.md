# Account controls operations

## Current scope

The account-export Edge Function uses the caller's authenticated Supabase client,
explicit column allowlists, explicit owner filters, and RLS. No service-role key is
used. It exports personal structured data, not original file bytes, bearer share
links, credentials, internal logs, unfinished proposals, or provider administrative
records. Original files must be downloaded separately. The UI and exported file
both disclose the scope. No snapshot consistency is promised; counts/duplicates
are checked per table and size errors abort the whole response.

The deletion control records a confirmed request for review. It does not erase an
account, revoke shares, log a user out, send an email, or claim erasure is complete.
A unique index permits one open request per user. Users may read their own receipt
and insert only their own confirmed request; they cannot set status or timestamps,
update or delete requests, or read someone else's request.

## Operator workflow — owner assigned

Timothy McGuire, founder of the Health Vault product operated by GO Design, Inc., confirmed on October 2, 2026 that he will monitor team@healthvault.me and review account-deletion requests. Mail forwards to his selected Gmail inbox; incoming and outgoing delivery have been verified.

No alert, scheduled poll or automatic processing is installed. Timothy must review the database request queue as well as the email inbox: submitting a deletion request does not send an email. Review cadence, response deadlines and the fulfillment procedure still need to be established before this gate passes.

Read the queue in the Supabase dashboard using a trusted operator account:

```sql
select id, user_id, status, requested_at
from public.account_deletion_requests
where status in ('requested', 'reviewing')
order by requested_at;
```

1. Verify the requester and record the responsible reviewer and response deadline
   in the restricted operational case system. Do not copy health records into logs.
2. Change only the exact reviewed request from requested to reviewing. Keep a
   patient-visible message factual; this field is displayed back to the requester.
3. Establish scope and retention requirements for personal records, storage files,
   provider records/consent evidence, backups and external copies. Communicate any
   limits and the intended outcome before executing erasure.
4. Plan revocation of active share/request tokens, provider connections, OAuth grants
   and sessions. Deleting an Auth user alone does not immediately invalidate every
   previously issued JWT. Do not treat that one API call as complete erasure.
5. Execute a separately reviewed erasure procedure and verify it. No automatic erasure
   code is provided by this change. Do not trial erasure on a real account.
6. Mark completed with resolved_at only after verified fulfillment; or declined with
   resolved_at and a reviewed explanation. The database allows trusted service-role
   processing only. A status change is not proof of deletion and must be audited.

Do not set completed simply to clear the queue. After eventual Auth deletion the
receipt's user_id is set null; retention of remaining receipt fields must be covered
by the approved policy. Do not enter health details in user_message.

## Proposed fulfillment procedure

See [DELETION_RETENTION_REVIEW.md](DELETION_RETENTION_REVIEW.md) for the reviewable data-category inventory, proposed response targets and per-request checklist. It is not an implemented erasure process; its acceptance criteria remain open.

## Validation

- `node --test supabase/functions/account-export/export.test.ts`
- `supabase/tests/account-deletion-requests.sql`: run in rollback transaction after
  setting health_vault.test_owner_a/b to two dedicated existing test identities.
- `npm run build`
- Local harness `/tests/account-controls/` uses a synthetic client and creates no
  database requests. Test review/confirmation, a single receipt, disabled pending
  button, and the downloaded JSON. It is not imported into the production bundle.
- Test authenticated deployed export with a dedicated synthetic account before
  inviting users; no full export of a real account was performed by this change.

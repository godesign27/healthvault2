# Insurance save recovery browser fixture

Run from the repository root:

```sh
node_modules/.bin/vite --config tests/insurance-recovery-browser/vite.config.ts
```

Open http://127.0.0.1:5188/tests/insurance-recovery-browser/index.html.
This local-only fixture imports the real coverage card, banner and mutation hook.
Its synthetic auth adapter and same-origin HTTP endpoint use no Supabase credentials or records.

1. Leave Simulate service failure checked; open Add member ID.
2. Verify the blank Save action is disabled, then enter TEST-RECOVERY-1234 and save.
3. The local endpoint responds 503. Verify the draft stays, controls re-enable, the error persists, Saved ID remains none, and no success appears.
4. Uncheck the failure control and save the retained draft.
5. Verify exactly two total attempts, Member ID saved, the Saved badge and closed editor.

This tests an explicit HTTP failure/retry. It does not prove behavior after an ambiguous server commit, a dropped response, or a real production outage.

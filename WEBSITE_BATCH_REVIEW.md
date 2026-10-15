# Website dialogs, result feedback and data details

Worktree: `/Users/timmcguire27/.codex/worktrees/website-dialogs-results-data/bold-benz-b01e76`
Branch: `codex/website-dialogs-results-data`, based on committed `025f62f`.
All edits remain uncommitted. Earlier website batches are separate and were not copied.

## Requested 20-item checklist
1. **Projects:** create, duplicate, rename and delete results use Toast; existing Dialog confirms delete. ProjectCard delegates instead of showing a second native confirmation. Required-name validation stays inline.
2. **Network:** provider/pharmacy removal uses Dialog; pre-existing result Toast retained.
3. **Pharmacies:** address removal uses Dialog and result Toast.
4. **EHR connections:** disconnect uses Dialog and result Toast. No real provider disconnected.
5. **Connected providers:** withdrawal uses Dialog and result Toast, including SDK/network rejection; busy controls release in finally. No real access withdrawn.
6. **Provider members:** invitation and batch-invitation cancellation use Dialog and result Toast. Existing unrelated member-status confirmations are outside this requested change and remain.
7. **Admin:** token/component delete uses Dialog and result Toast; returned Supabase errors are checked before success. No real token deleted.
8. **FHIR complete:** outcome detail uses Toast; connection/loading status remains on page.
9. **Share forms:** share/delivery results use Toast; recipient fields and resulting share URL remain on form. Partial email delivery is informational, not a false full-send success.
10. **Medical forms:** upload results use Toast; required-file hint stays inline. Actual form-save results live in FormDrawer, now Toast; form data and completion remain. Share result handled once by ShareFormsDrawer.
11. **Provider submit:** nothing-sent, partial failure and uncertain-result messages use Toast. Invalid-link and selection validation stay inline; retry-block protection preserved.
12. **Provider workspace:** actual enroll/challenge failures use Toast, including rejected SDK promises; code format validation and missing-access/load states remain on page. No authenticator operation performed.
13. **Verify email:** resend failure uses Toast; code-mismatch/format message remains inline. No real code requested or entered.
14. **Medical profile:** saved end dates in past show Ended; no new save route. See DATA_POLICY_NOTES.md.
15. **Care:** appointment local time next to date; existing encounter notes retain line breaks; claim billed amount shown including zero/numeric strings when valid. No appointment created.
16. **Dashboard:** exact medication count excludes ended rows using shared local calendar date cutoff. No synthetic activity added.
17. **Secure share:** open/access-log/download failures use Toast. Same authorized PDF/FHIR file URLs; no received/access-log-export action added. Existing share handler returns CORS-enabled file responses, checked from local source only.
18. **Document viewer:** failed file load uses Toast; DICOM unsupported notice stays visible independently of failed/progressing fetch. No DICOM viewer added.
19. **Account policy:** audited `/`, `/dashboard`, `/privacy`, `/terms`, `/support` against App routes; all exist. No policy copy/link change needed. No missing public destination to list for a PR. Existing draft terms untouched.
20. **Colors:** existing marks previewed on light/dark surfaces with measured opaque-ink contrast. Brand colors/assets unchanged. Ratios and logo-exemption context in DATA_POLICY_NOTES.md.

## Validation
- `node --test tests/actionFeedback.test.mjs tests/medicationStatus.test.mjs tests/sharedFileDownload.test.mjs tests/websiteActionResults.test.mjs tests/markContrast.test.mjs`: **26 passed**.
- Tests cover Cancel/unmount zero mutation, confirmation duplicate suppression through completion, released locks after rejection, existing Toast rendering/dismissal, medication date/timestamp boundaries, HTTP/network download failures, provider SDK rejection cleanup and inline code-format validation and reproducible opaque-PNG contrast measurement without external dependencies.
- `npm run build`: passed (existing large-chunk warning).
- `npm run typecheck`: passes with zero diagnostics after the authorized follow-up applied the earlier twelve unused-code fixes to this branch. Compiler settings and public prop interfaces are unchanged.
- Synthetic browser review: Cancel and Escape leave count zero; Confirm increments once, success Toast dismisses; 320px notification fits; actual DocumentViewer keeps DICOM notice alongside mocked file-error Toast. Temporary fixture/server stopped and removed. Screenshot `/tmp/hv-batch-dialog-file-feedback.png`.
- `git diff --check`: passed.

No mobile files, production settings/backend, `supabase/config.toml`, passwords, recovery links, insurer sign-in/card-photo parsing, real account/code/provider/token actions, deployments or commits were touched. The node_modules symlink reuses existing local dependencies without installing/changing them. Live end-to-end mutations were intentionally not run.

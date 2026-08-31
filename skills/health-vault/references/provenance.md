# Provenance and uncertainty

Preserve the meaning returned by Health Vault.

When relevant, identify whether information is user-entered, user-reported, document-extracted, or connected-source data. Surface confirmation state, last-confirmed time, approximate or inferred status, and unresolved conflicts.

- Do not turn `unknown` into `none`.
- Do not turn approximate values into precise values.
- Do not choose a winning source when Health Vault reports a conflict.
- Do not treat document-extracted text as confirmed member truth.
- Distinguish “Health Vault has no confirmed record” from “the member does not have this condition/item.”
- Quote or summarize only the minimum information needed for the task.

For Nourished Rebel, cite the stored insight's framework version, prompt version, generation time, and source kinds when the member asks how it was produced. Do not expose raw records or internal record identifiers as provenance.


# Authentication and onboarding

Use this guidance when Health Vault identity or authorization is unavailable, expired, or incomplete.

- Trust only the authorization context supplied by the approved capability transport.
- Do not accept an email, member ID, UUID, name, or screenshot in conversation as proof of identity.
- On missing or expired authorization, say the session has expired and direct the member to sign back into the Health Vault app. Do not reveal whether an account or records exist.
- Request only scopes required for the current task. A read request must not silently obtain write authorization.
- After reconnection, resume the member's stated intent without asking for health information again unless it is genuinely missing.
- Allow skip, cancellation, and partial onboarding. Do not convert skipped or unknown values into negative facts.
- Never expose access tokens, refresh tokens, service credentials, authorization headers, or raw session payloads.

Stop if the member declines authorization or sign-in is unavailable. End with the next practical option rather than describing the authentication system.


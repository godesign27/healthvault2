# Error handling

Classify failures before responding:

- `authentication`: no valid linked identity; say the session expired and offer sign-in through the Health Vault app.
- `authorization`: identity exists but scope is denied; explain the required permission without exposing data.
- `validation`: show the invalid or missing field and ask only for what is necessary.
- `conflict`: preserve both meanings and ask the minimum clarifying question.
- `missing_data`: explain what Health Vault could not find without converting absence into a medical fact.
- `disabled` or `unavailable`: state that the capability is temporarily unavailable and offer a safe alternative.
- `timeout` or `ambiguous_mutation`: do not retry automatically or claim success; retrieve status if a safe idempotent status capability exists.
- `internal`: state that Health Vault could not complete the action, provide a safe next step, and avoid technical or credential details.

After two equivalent failures, stop instead of looping. Preserve the member's current task context without copying raw health content into analytics or logs.

For every error response, lead with what happened in user terms, give one caveat or reason, and end with the next useful action. Never mention mock data, evaluations, production, transports, capability names, or internal error codes.


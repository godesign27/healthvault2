# Preview SMART sandbox acceptance

Environment: `roeudwddxvniazwufdqf` only. Observed 2026-10-02 (Denver).

## Configuration

- Provider: **SMART Health IT Sandbox (Preview Test Only)**, synthetic test data.
- Direct SMART enabled; Epic disabled; manual requests remain available.
- `FHIR_CLIENT_ID=health-vault-preview-sandbox` (public sandbox identifier).
- `APP_URL=http://localhost:5173` (local acceptance only; not a production setting).
- Scopes: `launch/patient patient/*.read openid fhirUser`.
- Generated standalone launch configuration:
  `WzMsIiIsIiIsIkFVVE8iLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMSwiIl0`
- Base: `https://launch.smarthealthit.org/v/r4/sim/<configuration>`.
- FHIR endpoint: `<base>/fhir`.
- Authorization endpoint: `<base>/auth/authorize`.
- Token endpoint: `<base>/auth/token`.

Use the [official launcher](https://launch.smarthealthit.org/) with Patient Standalone
Launch to regenerate settings. Discovery at the FHIR endpoint's
`/.well-known/smart-configuration` matched these endpoints. The plain endpoint without
simulation configuration returned invalid launch options during this run.

## Evidence

1. Authenticated start refused a foreign return URL (400), accepted the local completion URL.
2. Real demonstration patient login and consent reached our callback and activated the connection.
3. Owner-authenticated REST read confirmed active. Server checks confirmed token and patient ID
   present, without recording either value in this document.
4. Four concurrent replays after successful consumption returned error redirects and left
   connection identity/status/update timestamp unchanged.
5. Signed-out completion now asks for sign-in instead of reporting a failed connection;
   browser verified this state and the web build passed.
6. Removed disposable account/connection and temporary credentials; independent counts were zero.

## Remaining gates

- Post-login web completion verification.
- Actual native portal return, Check connection and restart recovery.
- Reviewed synthetic record import and duplicate/failure handling.
- Simultaneous first-use callback race with a valid provider code (consumed-state replay
  is tested; initial concurrent provider exchange is not).

No production configuration changed and no clinical records were imported. A successful
sandbox connection does not establish production provider registration or release readiness.

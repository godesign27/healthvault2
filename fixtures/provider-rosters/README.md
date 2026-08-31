# Provider roster fixtures

`health-vault-demo-provider-synthea.csv` is a roster-only transformation of the official MITRE Synthea 100-patient CSV sample downloaded from:

https://synthetichealth.github.io/synthea-sample-data/downloads/latest/synthea_sample_data_csv_latest.zip

Only demographic fields approved by `health_vault_roster_csv_v1` are retained. Clinical, claims, financial, government identifier, geolocation, race, ethnicity, and health coverage fields are intentionally excluded. The records are synthetic and must never be represented as real patients.

`health-vault-demo-identity-match.csv` is a single fictional roster row whose name, date of birth,
and approved demo email match the existing local AOL patient profile. Use it only to review the
identity-safe clinical release workflow together with
`../provider-clinical/health-vault-demo-identity-match-clinical.json`.

Regenerate with:

```sh
unzip -p /tmp/synthea_sample_data_csv_latest.zip patients.csv > /tmp/synthea-patients.csv
npx tsx scripts/transform-synthea-roster.ts /tmp/synthea-patients.csv fixtures/provider-rosters/health-vault-demo-provider-synthea.csv
```

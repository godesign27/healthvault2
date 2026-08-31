import { readFileSync } from 'node:fs';

import { parseRosterCsvV1 } from '../packages/provider-contracts/src/roster-import.ts';

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Usage: tsx scripts/roster-fixture-to-json.ts <roster.csv>');
const result = parseRosterCsvV1(readFileSync(inputPath, 'utf8'));
if (result.errors.length > 0) throw new Error(`Roster failed validation: ${JSON.stringify(result.errors.slice(0, 3))}`);
process.stdout.write(JSON.stringify(result.rows));

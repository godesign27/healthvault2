import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

import { HEALTH_VAULT_ROSTER_CSV_V1_HEADERS, parseRosterCsvV1 } from '../packages/provider-contracts/src/roster-import.ts';

function parseCsv(csv: string): string[][] {
  const records: string[][] = [];
  let field = ''; let row: string[] = []; let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(field); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && csv[index + 1] === '\n') index += 1;
      row.push(field); field = ''; if (row.some(Boolean)) records.push(row); row = [];
    } else field += character;
  }
  if (field || row.length) { row.push(field); records.push(row); }
  return records;
}

function csvValue(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: tsx scripts/transform-synthea-roster.ts <patients.csv> <output.csv>');
const input = readFileSync(inputPath, 'utf8');
const records = parseCsv(input);
const headers = records.shift() ?? [];
const indexOf = (header: string) => {
  const index = headers.indexOf(header);
  if (index < 0) throw new Error(`Synthea input is missing ${header}`);
  return index;
};
const columns = Object.fromEntries(['Id', 'BIRTHDATE', 'FIRST', 'LAST', 'GENDER', 'ADDRESS', 'CITY', 'STATE', 'ZIP'].map((header) => [header, indexOf(header)]));
const outputRows = records.slice(0, 100).map((record, index) => [
  record[columns.Id], `HV-DEMO-${String(index + 1).padStart(4, '0')}`, record[columns.FIRST], record[columns.LAST],
  record[columns.BIRTHDATE], ({ F: 'female', M: 'male' } as Record<string, string>)[record[columns.GENDER]] ?? 'unknown',
  '', '', record[columns.ADDRESS], '', record[columns.CITY], record[columns.STATE] === 'Massachusetts' ? 'MA' : record[columns.STATE],
  record[columns.ZIP], 'US',
]);
const output = `${HEALTH_VAULT_ROSTER_CSV_V1_HEADERS.join(',')}\n${outputRows.map((row) => row.map(csvValue).join(',')).join('\n')}\n`;
const validation = parseRosterCsvV1(output);
if (validation.errors.length || validation.rows.length !== outputRows.length) throw new Error(`Generated roster failed validation: ${JSON.stringify(validation.errors.slice(0, 3))}`);
writeFileSync(outputPath, output, 'utf8');
console.log(JSON.stringify({ input: basename(inputPath), output: basename(outputPath), rows: outputRows.length, sha256: createHash('sha256').update(output).digest('hex') }));

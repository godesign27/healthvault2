import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/medicationStatus.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { hasMedicationEnded } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const now = new Date(2026, 9, 15, 15, 30);

for (const [label, date, ended] of [
  ['missing date', null, false],
  ['undefined date', undefined, false],
  ['empty date', '', false],
  ['yesterday', '2026-10-14', true],
  ['today stays active', '2026-10-15', false],
  ['tomorrow', '2026-10-16', false],
  ['invalid input', 'invalid', false],
  ['invalid calendar date', '2026-02-30', false],
  ['invalid month', '2026-99-01', false],
  ['past timestamp', new Date(now.getTime() - 1).toISOString(), true],
  ['equal timestamp', now.toISOString(), false],
  ['future timestamp', new Date(now.getTime() + 1).toISOString(), false],
]) {
  test(label, () => assert.equal(hasMedicationEnded(date, now), ended));
}

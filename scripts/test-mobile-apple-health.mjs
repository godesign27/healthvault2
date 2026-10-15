import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { appleHealthVitals, buildAppleHealthImport } from '../apps/mobile/src/lib/apple-health.js';
import { previewHealthImport } from '../packages/health-vault-mcp/src/health-imports.ts';

const observedAt = '2026-10-12T15:00:00.000Z';
const samples = [
  { metric: 'heart_rate', value: 72, unit: 'bpm', observedAt, sourceRecordId: 'hr-1', deviceName: 'Apple Watch' },
  { metric: 'heart_rate', value: 72, unit: 'bpm', observedAt, sourceRecordId: 'hr-1', deviceName: 'Apple Watch' },
  { metric: 'blood_pressure', value: 120, unit: 'mmHg', observedAt },
  { metric: 'steps', value: 8400, unit: 'count', observedAt, deviceName: '  Apple Health  ' },
  { metric: 'mood', value: 3, unit: 'score', observedAt },
  { metric: 'weight', value: Number.NaN, unit: 'kg', observedAt },
];
const vitals = appleHealthVitals(samples);
assert.deepEqual(vitals.map((item) => item.metric), ['heart_rate', 'steps']);
assert.equal(vitals[1].deviceName, 'Apple Health');
assert.equal(appleHealthVitals([{ metric: 'blood_pressure', value: 118, secondaryValue: 76, unit: 'mmHg', observedAt }])[0].secondaryValue, 76);
assert.equal(appleHealthVitals(Array.from({ length: 120 }, (_, index) => ({ metric: 'heart_rate', value: 60 + (index % 20), unit: 'bpm', observedAt: new Date(Date.parse(observedAt) + index * 1000).toISOString() }))).length, 100);

const input = buildAppleHealthImport(samples, '11111111-1111-4111-8111-111111111111');
assert.equal(input.sourceKind, 'chatgpt_health_apple_health');
assert.equal(input.sourceName, 'Apple Health');
assert.equal(buildAppleHealthImport([], '11111111-1111-4111-8111-111111111111'), null);

const calls = [];
const client = {
  from(table) {
    calls.push(table);
    const query = {
      select() { return query; },
      eq() { return query; },
      in() { return Promise.resolve({ data: [], error: null }); },
      maybeSingle() { return Promise.resolve({ data: null, error: null }); },
      insert(payload) {
        calls.push(payload.source_name);
        return { select() { return { single: async () => ({ data: { id: 'proposal-1', status: 'pending', expires_at: '2026-10-12T16:00:00.000Z' }, error: null }) }; } };
      },
    };
    return query;
  },
  rpc() { throw new Error('preview must not confirm'); },
};
const preview = await previewHealthImport(client, 'owner', input);
assert.equal(preview.proposalId, 'proposal-1');
assert.equal(preview.requiresConfirmation, true);
assert.equal(preview.saved, false);
assert.equal(preview.summary.new, 2);
assert.deepEqual(calls.filter((call) => call === 'rpc'), []);

const screen = readFileSync('apps/mobile/src/screens/VitalsScreen.js', 'utf8');
const reviewFn = screen.slice(screen.indexOf('async function reviewAppleHealth'), screen.indexOf('async function addReviewed'));
assert.doesNotMatch(reviewFn, /confirmHealthImport/);
assert.match(screen, /Nothing has been added to Health Vault/);
assert.match(screen, /More actions/);
assert.match(screen, /Add to Health Vault/);
assert.match(screen, />New</);
assert.match(screen, /reviewAppleHealth\(true, true\)/);
assert.match(screen, /NoticeBanner/);
assert.match(readFileSync('apps/mobile/src/components/ui/NoticeBanner.js', 'utf8'), /Dismiss notification/);
const header = screen.slice(screen.indexOf('ListHeaderComponent'), screen.indexOf('ListEmptyComponent'));
assert.doesNotMatch(header, /Those measurements are now in Health Vault/);
const importer = readFileSync('apps/mobile/src/lib/apple-health-import.js', 'utf8');
assert.doesNotMatch(importer, /confirmHealthImport/);
assert.doesNotMatch(importer, /TextDecoder/);
assert.match(importer, /Crypto\.digest\(/);
console.log('PASS Apple Health: review only, owner preview, no save until a separate confirmation');

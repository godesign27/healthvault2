import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
let calls, responses;
const client = {from(table) {
  const call = {table, filters: []}; calls.push(call);
  const query = {
    select() {return query;}, order() {return query;}, limit() {return query;},
    eq(key, value) {call.filters.push([key, value]); return query;},
    maybeSingle() {return Promise.resolve(responses[table]);},
    then(resolve, reject) {return Promise.resolve(responses[table] ?? {data: [], error: null}).then(resolve, reject);},
  };
  return query;
}};
const source = ts.transpileModule(fs.readFileSync('src/lib/tools/getCareTimeline.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS},
}).outputText;
const m = {exports: {}};
new Function('require', 'module', 'exports', source)(
  name => name === '../supabase/server' ? {createSupabaseServerClient: () => client} : require(name), m, m.exports);
const run = async (filter, overrides = {}) => {
  calls = []; responses = {patient_profiles: {data: {id: 'patient-uuid'}}, ...overrides};
  return m.exports.getCareTimeline({userId: 'owner-uuid', ...(filter ? {filter} : {})});
};
let result = await run('form', {form_responses: {data: [{id: 'form-uuid', status: 'complete', updated_at: '2026-10-03', form_templates: {title: 'Registration', category: 'intake'}}]}});
assert.equal(result.success, true);
assert.equal(result.data.items[0].title, 'Registration');
assert.deepEqual(calls[0].filters, [['user_id', 'owner-uuid']]);
assert.deepEqual(calls[1].filters, [['patient_id', 'patient-uuid']]);
result = await run('form', {patient_profiles: {data: null}});
assert.equal(result.data.total, 0);
assert.equal(calls.length, 1, 'No unscoped form query without patient profile');
result = await run('form', {patient_profiles: {error: new Error('Profile lookup failed')}});
assert.equal(result.success, false);
assert.equal(calls.length, 1);
for (const [filter, table] of Object.entries({record: 'health_records', record_request: 'health_record_requests', form: 'form_responses', share: 'share_events', appointment: 'appointments', encounter: 'encounters'})) {
  result = await run(filter, {[table]: {error: new Error('Query failed')}});
  assert.equal(result.success, false, `${filter} must not claim an empty success on failure`);
}
result = await run(undefined, {health_records: {data: [{id: 'older', title: 'Record', service_date: '2026-10-01'}]}, appointments: {data: [{id: 'newer', scheduled_at: '2026-10-03', status: 'scheduled'}]}});
assert.deepEqual(result.data.items.map(item => item.id), ['newer', 'older']);
assert.equal(calls.length, 7);
console.log('PASS timeline patient ownership, missing profile, query failures, concurrent reads and date order');

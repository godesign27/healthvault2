import test from 'node:test';
import assert from 'node:assert/strict';
import { createCondition, createMedication, createAllergy, createHealthRecord } from './health-writes.ts';
import { createAppointment } from './appointments.ts';

const cases = [
  ['conditions', createCondition, { name: ' Test ', status: 'Active' }, { name: 'Test', status: 'Active', diagnosed_on: null, managing_physician: null, notes: null }],
  ['medications', createMedication, { name: ' Test ', dosage: ' one ' }, { name: 'Test', dosage: 'one', frequency: null, prescribed_by: null, start_date: null, end_date: null, notes: null }],
  ['allergies', createAllergy, { allergen: ' Test ' }, { allergen: 'Test', reaction: null, severity: null, diagnosed_on: null, notes: null }],
  ['health_records', createHealthRecord, { title: ' Test ', kind: 'other', tags: [' review '] }, { title: 'Test', kind: 'other', provider_name: null, service_date: null, ai_summary: null, tags: ['review'], source: 'shared' }],
  ['appointments', createAppointment, { providerName: ' Test ', appointmentType: ' Review ', scheduledAt: '2099-01-01T09:00:00-06:00' }, { provider_name: 'Test', appointment_type: 'Review', scheduled_at: '2099-01-01T15:00:00.000Z', location: null, notes: null, status: 'scheduled' }],
] as const;

for (const [kind, save, input, expected] of cases) {
  test(`${kind}: sends only reviewed fields to atomic owner-derived RPC`, async () => {
    let calls = 0;
    const db: any = { rpc: async (name, args) => {
      calls++;
      assert.equal(name, 'confirm_health_record');
      assert.deepEqual(args, { p_kind: kind, p_value: expected });
      return { data: { id: 'existing-id', ...expected }, error: null };
    }, from: () => { throw new Error('Non-atomic direct write attempted'); } };
    const result = await (save as any)(db, 'untrusted-user-id', input);
    assert.equal(result.id, 'existing-id');
    assert.equal(calls, 1);
  });
}

test('duplicate/conflict RPC failures propagate without a fallback insert', async () => {
  const db: any = { rpc: async () => ({ error: { message: 'Review the existing record' } }) };
  await assert.rejects(createCondition(db, 'fixture', { name: 'Test' }), /Review the existing record/);
});
test('ambiguous results are not reported as a successful save', async () => {
  const db: any = { rpc: async () => ({ data: null, error: null }) };
  await assert.rejects(createCondition(db, 'fixture', { name: 'Test' }), /could not be verified/);
});

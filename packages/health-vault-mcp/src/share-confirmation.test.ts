import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmedShare } from './share-confirmation.ts';
import { createMedicalFormShare } from './medical-form-sharing.ts';

function database() {
  const receipts = new Map(); let sequence = 0; let failCompletion = false;
  const db: any = { rpc: async (name, args) => {
    if (name === 'claim_share_confirmation') {
      const key = args.p_kind + args.p_request_key;
      if (receipts.has(key)) return { data: receipts.get(key) };
      const receipt = { status: 'pending', id: String(++sequence) };
      receipts.set(key, receipt);
      return { data: { ...receipt, status: 'claimed' } };
    }
    if (failCompletion) return { error: { message: 'lost receipt' } };
    const receipt = [...receipts.values()].find(r => r.id === args.p_operation_id);
    receipt.status = 'completed'; receipt.result = args.p_result;
    return {};
  } };
  return { db, loseCompletion: () => failCompletion = true };
}

test('equivalent request objects return the first result without resending', async () => {
  const { db } = database(); let deliveries = 0;
  const create = async id => { deliveries++; return { id, emailDelivery: { recipient: { sent: true } } }; };
  const first = await confirmedShare(db, 'medical_form_email', { recipient: 'test@example.invalid', version: 1 }, create);
  const repeated = await confirmedShare(db, 'medical_form_email', { version: 1, recipient: 'test@example.invalid' }, create);
  assert.deepEqual(repeated, first); assert.equal(deliveries, 1);
});

test('concurrent matching calls dispatch only one delivery', async () => {
  const { db } = database(); let deliveries = 0; let finish;
  const first = confirmedShare(db, 'medical_form_email', { key: 'same' }, id => {
    deliveries++; return new Promise(resolve => finish = () => resolve({ id }));
  });
  while (!finish) await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(confirmedShare(db, 'medical_form_email', { key: 'same' }, async id => { deliveries++; return { id }; }), /already processing/);
  finish(); await first; assert.equal(deliveries, 1);
});

test('lost delivery or receipt response never releases the claim for retry', async () => {
  for (const phase of ['delivery', 'receipt']) {
    const { db, loseCompletion } = database(); let attempts = 0;
    if (phase === 'receipt') loseCompletion();
    const create = async id => { attempts++; if (phase === 'delivery') throw new Error('response lost'); return { id }; };
    await assert.rejects(confirmedShare(db, 'medical_form_email', { phase }, create));
    await assert.rejects(confirmedShare(db, 'medical_form_email', { phase }, create), /unverified result/);
    assert.equal(attempts, 1);
  }
});

test('different recipients and form revisions remain distinct confirmations', async () => {
  const { db } = database(); let calls = 0;
  const create = async id => { calls++; return { id }; };
  await confirmedShare(db, 'medical_form_email', { recipient: 'a', revision: 1 }, create);
  await confirmedShare(db, 'medical_form_email', { recipient: 'b', revision: 1 }, create);
  await confirmedShare(db, 'medical_form_email', { recipient: 'a', revision: 2 }, create);
  assert.equal(calls, 3);
});

test('the medical-form implementation calls its sender once and reuses the receipt', async () => {
  const { db } = database(); let inserts = 0; let emails = 0;
  const rows = {
    patient_profiles: { id: 'patient-fixture', name: 'Test patient' },
    user_profiles: { first_name: 'Test', email: 'patient@example.invalid', email_verified: true },
    form_responses: { id: 'form-fixture', status: 'complete', answers_json: {}, updated_at: '2026-09-19T12:00:00Z' },
  };
  db.from = table => {
    const q: any = { select: () => q, eq: () => q, update: () => q,
      maybeSingle: async () => ({ data: rows[table], error: null }),
      insert: async () => { inserts++; return { error: null }; } };
    return q;
  };
  const input = { templateId: 'patient-reg', recipientName: 'Test recipient', recipientEmail: 'provider@example.invalid', expiresInHours: 24, sendPatientCopy: true };
  const sender = async details => {
    emails++;
    assert.equal(details.recipientEmail, input.recipientEmail);
    assert.equal(details.patientEmail, 'patient@example.invalid');
    assert.equal(details.sendPatientCopy, true);
    return { recipient: { sent: true, id: 'mock-delivery' }, patientCopy: { sent: true } };
  };
  const first = await createMedicalFormShare(db, 'fixture', 'https://example.invalid', input, sender);
  const repeated = await createMedicalFormShare(db, 'fixture', 'https://example.invalid', input, sender);
  assert.deepEqual(repeated, first);
  assert.equal(inserts, 1); assert.equal(emails, 1);
  assert.equal(first.confirmationState, 'confirmed');
});

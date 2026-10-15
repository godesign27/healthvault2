// PREVIEW ONLY. Creates and cleans up its own synthetic users; never sends email.
// Usage: HV_PREVIEW_KEYS_FILE=/protected/keys.json node scripts/test-account-controls-preview.mjs
import { readFileSync, statSync } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const project = 'roeudwddxvniazwufdqf';
const base = `https://${project}.supabase.co`;
const path = process.env.HV_PREVIEW_KEYS_FILE;
assert(path, 'HV_PREVIEW_KEYS_FILE must identify a protected preview-only key file');
assert.equal(statSync(path).mode & 0o077, 0, 'Key file must not be group/world readable');
const keys = JSON.parse(readFileSync(path, 'utf8'));
const admin = keys.find(k => k.name === 'service_role')?.api_key;
const anon = keys.find(k => k.name === 'anon')?.api_key;
for (const key of [admin, anon]) {
  assert(key, 'Preview legacy API keys required');
  assert.equal(JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).ref, project, 'Wrong project key');
}
const run = randomUUID();
const users = [], fixtures = [], sessions = [];
let checks = 0;
async function req(path, {token=admin, method='GET', body, apiKey=anon, prefer}={}) {
  const r = await fetch(base+path, {method, headers:{apikey:apiKey, Authorization:`Bearer ${token}`, 'Content-Type':'application/json', ...(prefer?{Prefer:prefer}:{})}, ...(body===undefined?{}:{body:JSON.stringify(body)}), signal:AbortSignal.timeout(45000)});
  const raw=await r.text(); let data; try { data=JSON.parse(raw); } catch { data=null; }
  return {status:r.status, data};
}
function ok(r,label,expected=200) { assert.equal(r.status,expected,`${label}: HTTP ${r.status}, code ${r.data?.code||r.data?.error_code||'none'}`); }
async function insert(table,body) {
  const rows=Array.isArray(body)?body:[body];
  // Record IDs before sending so cleanup covers uncertain responses, too.
  for(const row of rows) { row.id ||= randomUUID(); fixtures.push({table,id:row.id}); }
  const r=await req(`/rest/v1/${table}`,{method:'POST',body:rows,prefer:'return=representation'});ok(r,`seed ${table}`,201); return r.data;
}
function pass(label) { checks++; console.log(`PASS ${label}`); }
try {
  // Admin createUser confirms only these synthetic accounts, without email delivery.
  for(const label of ['A','B']) {
    const email=`hv-account-test-${run}-${label.toLowerCase()}@example.invalid`;
    const password=randomBytes(32).toString('base64url');
    const created=await req('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true,app_metadata:{account_control_test:run}}});
    ok(created,'create synthetic user'); const id=created.data.id; users.push(id);
    const signed=await req('/auth/v1/token?grant_type=password',{token:anon,method:'POST',body:{email,password}});ok(signed,'sign in synthetic user');
    const token=signed.data.access_token; sessions.push(token);
    await insert('user_profiles',{user_id:id,first_name:`Synthetic ${label}`,last_name:run});
    const [patient]=await insert('patient_profiles',{user_id:id,name:`Synthetic ${label} ${run}`});
    await insert('conditions',Array.from({length:label==='A'?251:1},(_,i)=>({user_id:id,name:`Synthetic ${label} ${run} ${i}`,status:'Active'})));
    const [form]=await insert('form_responses',{patient_id:patient.id,template_id:'patient-reg',answers_json:{synthetic:label,run},status:'complete'});
    await insert('share_events',{patient_id:id,form_response_ids:[form.id],method:'SecureLink',recipient:{synthetic:true},status:'revoked',is_revoked:true});
    await insert('share_events',{patient_id:patient.id,form_response_ids:[form.id],method:'SecureLink',recipient:{synthetic:true},status:'revoked',is_revoked:true});
  }
  pass('two independent Auth password sessions');
  for(let i=0;i<2;i++) {
    // Supplying a foreign target must not redirect the authenticated export.
    const r=await req('/functions/v1/account-export',{token:sessions[i],method:'POST',body:{user_id:users[1-i],accountId:users[1-i]}});ok(r,'export');
    const e=r.data;assert.equal(e.accountId,users[i]);assert.equal(Object.keys(e.tables).length,34);
    assert.equal(e.tables.conditions.length,i===0?251:1);assert.equal(e.tables.form_responses.length,1);assert.equal(e.tables.share_events.length,2);
    for(const [table,rows] of Object.entries(e.tables)) {
      assert.equal(e.counts[table],rows.length);
      for(const row of rows) { if('user_id' in row)assert.equal(row.user_id,users[i]); }
    }
    assert(!JSON.stringify(e).includes(`Synthetic ${i===0?'B':'A'} ${run}`));
    assert.equal(new Set(e.tables.conditions.map(c=>c.id)).size,e.tables.conditions.length);
  }
  pass('34-table exports, 251-row pagination, indirect forms/shares, foreign-target ignored');
  for(const table of ['conditions','patient_profiles','form_responses','share_events']) {
    const foreign=fixtures.find(f=>f.table===table); // First row belongs to A.
    const r=await req(`/rest/v1/${table}?id=eq.${foreign.id}&select=id`,{token:sessions[1]});ok(r,`foreign ${table}`);assert.deepEqual(r.data,[]);
  }
  pass('B cannot directly read A conditions, patient, form or share');
  const anonymous=await req('/functions/v1/account-export',{token:anon,method:'POST',body:{}});ok(anonymous,'anonymous export',401);
  pass('anonymous export rejected');
  const submissions=await Promise.all([0,1].map(()=>req('/rest/v1/account_deletion_requests',{token:sessions[0],method:'POST',body:{user_id:users[0],confirmed:true}})));
  assert.deepEqual(submissions.map(r=>r.status).sort(),[201,409]);
  const receipt=await req(`/rest/v1/account_deletion_requests?user_id=eq.${users[0]}&select=id,status`,{token:sessions[0]});ok(receipt,'owner receipt');assert.equal(receipt.data.length,1);assert.equal(receipt.data[0].status,'requested');
  const foreignRead=await req(`/rest/v1/account_deletion_requests?user_id=eq.${users[0]}&select=id`,{token:sessions[1]});ok(foreignRead,'foreign receipt');assert.deepEqual(foreignRead.data,[]);
  ok(await req('/rest/v1/account_deletion_requests',{token:sessions[1],method:'POST',body:{user_id:users[0],confirmed:true}}),'foreign request',403);
  ok(await req('/rest/v1/account_deletion_requests',{token:sessions[1],method:'POST',body:{user_id:users[1],confirmed:false}}),'unconfirmed request',403);
  ok(await req(`/rest/v1/account_deletion_requests?id=eq.${receipt.data[0].id}`,{token:sessions[0],method:'PATCH',body:{status:'completed',resolved_at:new Date().toISOString()}}),'forged completion',403);
  pass('concurrent requests produce one receipt; foreign/unconfirmed/forged completion denied');
  const after=await req('/functions/v1/account-export',{token:sessions[0],method:'POST',body:{}});ok(after,'export after request');assert.equal(after.data.tables.account_deletion_requests.length,1);assert.equal(after.data.tables.conditions.length,251);
  pass('request receipt included in export; request does not erase account data');
} finally {
  const cleanupErrors=[];
  // Revoke refresh sessions before removing only the accounts created in this run.
  for(const token of sessions) { const r=await req('/auth/v1/logout?scope=global',{token,method:'POST'});if(![204,401,403].includes(r.status))cleanupErrors.push(`logout ${r.status}`); }
  for(const user of users) { const r=await req(`/rest/v1/account_deletion_requests?user_id=eq.${user}`,{method:'DELETE'});if(r.status!==204)cleanupErrors.push(`receipt ${r.status}`); }
  // Reverse dependency order; batch same-table IDs to avoid unnecessary requests.
  const tables=[...new Set(fixtures.map(f=>f.table))].reverse();
  for(const table of tables) {
    const ids=fixtures.filter(f=>f.table===table).map(f=>f.id);
    for(let i=0;i<ids.length;i+=100) {const r=await req(`/rest/v1/${table}?id=in.(${ids.slice(i,i+100).join(',')})`,{method:'DELETE'});if(r.status!==204)cleanupErrors.push(`${table} ${r.status}`);}
  }
  for(const user of users) { const r=await req(`/auth/v1/admin/users/${user}`,{method:'DELETE'});if(![200,404].includes(r.status))cleanupErrors.push(`user ${r.status}`); }
  assert.deepEqual(cleanupErrors,[],'Synthetic fixture cleanup failed');
  pass('synthetic rows and accounts cleaned up');
}
console.log(JSON.stringify({result:'PASS',checks,project,scope:'HTTP export and reviewed deletion requests; not erasure or recovery'}));

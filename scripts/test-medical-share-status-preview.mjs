// Preview-only, read-only HTTP checks against SQL-seeded synthetic claims.
// Never calls POST /share or sends email. Credentials live in a mode-0600 file.
import {readFileSync, statSync} from 'node:fs';
import assert from 'node:assert/strict';
const file=process.env.HV_SHARE_STATUS_FIXTURE;
assert(file,'Provide HV_SHARE_STATUS_FIXTURE');
assert.equal(statSync(file).mode & 0o077,0,'Fixture credentials must be private');
const fixture=JSON.parse(readFileSync(file,'utf8'));
assert(fixture.foreignRequest,'Seed a second owner claim to verify isolation');
const project='roeudwddxvniazwufdqf';
assert.equal(JSON.parse(Buffer.from(fixture.key.split('.')[1],'base64url')).ref,project);
const base=`https://${project}.supabase.co`;
async function request(path,token,body){
 const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{apikey:fixture.key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 return {status:response.status,data:await response.json().catch(()=>null)};
}
const login=await request('/auth/v1/token?grant_type=password',fixture.key,{email:fixture.email,password:fixture.password});
assert.equal(login.status,200,'Synthetic sign-in failed');
const token=login.data.access_token;
try{
 assert.equal((await request('/functions/v1/share/status',fixture.key,{requestId:fixture.request})).status,401);
 const status=id=>request('/functions/v1/share/status',token,{requestId:id});
 assert.equal((await status('invalid')).status,400);
 const missing=await status('b40b9ddc-bb86-43b9-bf18-0a504f274a22');
 assert.equal(missing.status,202);assert.deepEqual(missing.data,{pending:true});
 const own=await status(fixture.request);
 if(process.argv.includes('--receipt')){
  assert.equal(own.status,200);assert.deepEqual(own.data,{requestId:fixture.request,id:fixture.request,status:'sent',emailSent:true,deliveryReceiptSaved:true});
 }else{assert.equal(own.status,202);assert.deepEqual(own.data,{pending:true});}
 const foreign=await status(fixture.foreignRequest);assert.equal(foreign.status,202);assert.deepEqual(foreign.data,{pending:true});
 const direct=await request('/rest/v1/medical_share_requests?select=*',token);
 assert.equal(direct.status,403,'Claim table must not be readable by a client');
 console.log('PASS status: anonymous rejection, invalid ID, missing claim, owner state, foreign isolation, private-table denial');
}finally{
 const logout=await request('/auth/v1/logout?scope=global',token,{});
 assert.equal(logout.status,204,'Synthetic logout failed');
}

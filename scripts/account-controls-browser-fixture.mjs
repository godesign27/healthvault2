// Creates/cleans only its own preview fixture; no email. Never use with production keys.
import { readFileSync, writeFileSync, unlinkSync, statSync, existsSync } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const project='roeudwddxvniazwufdqf', base=`https://${project}.supabase.co`;
const file='tests/account-controls-browser/session.local';
const keyPath=process.env.HV_PREVIEW_KEYS_FILE;
assert(keyPath && (statSync(keyPath).mode & 0o077)===0,'Protected key file required');
const keys=JSON.parse(readFileSync(keyPath,'utf8'));
const admin=keys.find(k=>k.name==='service_role').api_key,anon=keys.find(k=>k.name==='anon').api_key;
for(const k of [admin,anon]) assert.equal(JSON.parse(Buffer.from(k.split('.')[1],'base64url')).ref,project);
async function request(path,method='GET',body,token=admin) {
 const r=await fetch(base+path,{method,headers:{apikey:anon,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error(`Preview fixture ${method} failed: ${r.status}`);
 const text=await r.text(); return text?JSON.parse(text):null;
}
if(process.argv[2]==='cleanup') {
 const f=JSON.parse(readFileSync(file,'utf8'));assert.equal(f.project,project);
 const u=await request(`/auth/v1/admin/users/${f.user}`);assert.equal(u.app_metadata?.account_control_test,f.run);
 if(f.session) await request('/auth/v1/logout?scope=global','POST',undefined,f.session.access_token);
 await request(`/rest/v1/account_deletion_requests?user_id=eq.${f.user}`,'DELETE');
 for(const t of ['conditions','patient_profiles','user_profiles']) await request(`/rest/v1/${t}?user_id=eq.${f.user}`,'DELETE');
 await request(`/auth/v1/admin/users/${f.user}`,'DELETE');
 unlinkSync(file); console.log('Synthetic browser fixture and session file removed');
} else if(process.argv[2]==='serve') {
 const {spawn}=await import('node:child_process');
 const child=spawn('node_modules/.bin/vite',['--config','tests/account-controls-browser/vite.config.ts'],{stdio:'inherit',env:{...process.env,VITE_SUPABASE_URL:'http://127.0.0.1:5175',VITE_SUPABASE_ANON_KEY:anon}});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
 child.on('exit',code=>process.exit(code??0));
} else {
 assert(!existsSync(file),'Clean the existing fixture before creating another');
 const run=randomUUID(),password=randomBytes(32).toString('base64url'),email=`hv-browser-${run}@example.invalid`;
 const user=await request('/auth/v1/admin/users','POST',{email,password,email_confirm:true,app_metadata:{account_control_test:run}});
 const f={project,run,user:user.id};writeFileSync(file,JSON.stringify(f),{mode:0o600,flag:'wx'});
 for(const [table,body] of [['user_profiles',{user_id:user.id,first_name:'Synthetic Browser',last_name:run}],['patient_profiles',{user_id:user.id,name:'Synthetic Browser '+run}],['conditions',{user_id:user.id,name:'Synthetic browser export '+run,status:'Active'}]])await request('/rest/v1/'+table,'POST',body);
 const auth=await request('/auth/v1/token?grant_type=password','POST',{email,password},anon);
 f.session={access_token:auth.access_token,refresh_token:auth.refresh_token};writeFileSync(file,JSON.stringify(f),{mode:0o600});
 console.log('Synthetic preview browser fixture ready');
}

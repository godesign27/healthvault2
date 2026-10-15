import assert from 'node:assert/strict';
import {requestAssistant} from '../apps/mobile/src/lib/assistant-client.js';
let mode='ok';const calls=[];
const session={access_token:'jwt',user:{id:'one'}};
const args={message:'Show records',getSession:async()=>session,baseUrl:'https://preview.invalid',anonKey:'anon',fetchImpl:async(url,init)=>{
 calls.push(init);
 if(init.method!=='POST')return Response.json({mobileReadOnlyVersion:mode==='old'?undefined:1});
 return Response.json(mode==='empty'?{}:{message:'Found records'});
}};
assert.equal(await requestAssistant(args),'Found records');
assert.equal(calls[1].headers.Authorization,'Bearer jwt');assert.equal(JSON.parse(calls[1].body).readOnly,true);
calls.length=0;mode='old';await assert.rejects(requestAssistant(args));assert.equal(calls.length,1);
calls.length=0;await assert.rejects(requestAssistant({...args,getSession:async()=>null}));assert.equal(calls.length,0);
mode='empty';await assert.rejects(requestAssistant(args));
let sessions=0;calls.length=0;mode='ok';await assert.rejects(requestAssistant({...args,getSession:async()=>++sessions===1?session:{...session,user:{id:'two'}}}));assert.equal(calls.length,1);
console.log('PASS assistant JWT, read-only capability gate, missing auth, empty response and account-switch denial');

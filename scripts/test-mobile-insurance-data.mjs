import assert from 'node:assert/strict';
import fs from 'node:fs';
const {loadInsurance}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('apps/mobile/src/lib/insuranceData.js')).toString('base64'));
let user={id:'owner'},failure=null;const filters=[];
const client={auth:{getUser:async()=>({data:{user}})},from(table){const q={select:()=>q,eq:(...args)=>{filters.push(args);return q},order:()=>q,in:()=>q,then(resolve){return Promise.resolve({data:table==='insurance_coverages'?[{id:'c',provider_id:'p',user_id:'owner'}]:[{id:'p',name:'Fixture insurer'}],error:failure===table?Error('Denied'):null}).then(resolve)}};return q;}};
const result=await loadInsurance(client);assert.equal(result.coverages[0].provider.name,'Fixture insurer');assert.equal(result.userId,'owner');assert.deepEqual(filters[0],['user_id','owner']);
for(const table of ['insurance_coverages','insurance_providers']){failure=table;await assert.rejects(loadInsurance(client),/Denied/);}
user=null;filters.length=0;await assert.rejects(loadInsurance(client),/Sign in/);assert.equal(filters.length,0);
console.log('PASS insurance owner scope, provider mapping, coverage/provider failure and anonymous rejection');

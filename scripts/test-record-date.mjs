import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync('packages/api-client/src/record-date.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,Date});
const f=exports.formatRecordDate,oldTZ=process.env.TZ;
try {
 for(const zone of ['America/Denver','America/Los_Angeles','Pacific/Honolulu','UTC','Pacific/Kiritimati']){
  process.env.TZ=zone;
  for(const date of ['2026-10-03','2026-03-08','2026-11-01','2024-02-29']){
   const [y,m,d]=date.split('-').map(Number);assert.equal(f(date,'—','en-US'),`${m}/${d}/${y}`,zone);
  }
  for(const date of ['2026','2026-10','2026-02-30','invalid'])assert.equal(f(date),date);
  assert.equal(f(null),'—');assert.equal(f(undefined,'N/A'),'N/A');
  const stamp='2026-10-03T00:30:00Z';assert.equal(f(stamp,'—','en-US'),new Date(stamp).toLocaleDateString('en-US'));
 }
}finally{if(oldTZ===undefined)delete process.env.TZ;else process.env.TZ=oldTZ;}
console.log('PASS calendar dates across five timezones, DST boundaries, leap days, reduced precision, invalid input and local timestamps');

import assert from 'node:assert/strict';
import fs from 'node:fs';
const {parseCareDate,formatCareDate}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('apps/mobile/src/lib/careDates.js')).toString('base64'));
for(const tz of ['America/Denver','UTC','Asia/Tokyo']){
 process.env.TZ=tz;
 assert.equal(formatCareDate('2026-10-01'),'October 1, 2026');
 assert.equal(formatCareDate('2024-02-29'),'February 29, 2024');
 for(const bad of [null,'','invalid','2026-02-30'])assert.equal(formatCareDate(bad),'Date not recorded');
 assert.equal(parseCareDate('2026-10-01T00:00:00Z').getTime(),Date.parse('2026-10-01T00:00:00Z'));
}
console.log('PASS Care calendar dates in Denver, UTC, Tokyo; invalid/missing dates and timestamp instants');

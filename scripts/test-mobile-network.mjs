import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hook = readFileSync('apps/mobile/src/hooks/useProviders.js', 'utf8');
const screen = readFileSync('apps/mobile/src/screens/NetworkScreen.js', 'utf8');

assert.match(hook, /from\('pharmacies'\)/);
assert.match(hook, /\.eq\('user_id', user\.id\)/);
assert.match(hook, /preferred: false/);
assert.match(hook, /preferred: true/);
assert.match(hook, /\.delete\(\)/);
assert.doesNotMatch(hook, /network: 'in'/);
assert.doesNotMatch(screen, /Lakeside Pharmacy/);
assert.doesNotMatch(screen, /Target Pharmacy/);
assert.doesNotMatch(screen, /Save to My Network/);
assert.match(screen, /No saved pharmacies/);
assert.match(screen, /More actions for/);
assert.match(screen, /NoticeBanner/);
assert.match(screen, /Preferred pharmacy updated/);

console.log('PASS network: owner pharmacies, no sample stores, network badge only when known');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { formatCareDate } from '../apps/mobile/src/lib/careDates.js';

const profile = fs.readFileSync('apps/mobile/src/hooks/useProfile.js', 'utf8');
const profileQuery = profile.slice(profile.indexOf(".from('user_profiles')"), profile.indexOf(".from('patient_profiles')"));
assert.match(profileQuery, /\.eq\('user_id', user\.id\)/);
assert.doesNotMatch(profileQuery, /\.eq\('id', user\.id\)/);
assert.match(profile, /\.from\('allergies'\)[\s\S]*?\.eq\('user_id', user\.id\)/);
assert.equal(formatCareDate('1967-10-12'), 'October 12, 1967');

const login = fs.readFileSync('apps/mobile/src/screens/LoginScreen.js', 'utf8');
const inner = login.slice(login.indexOf('inner:'), login.indexOf('logoArea:'));
assert.equal(inner.includes("justifyContent: 'center'"), false);
assert.match(login, /input: \{ flex: 1, minWidth: 0/);
console.log('PASS profile lookup uses user_id, date stays on the recorded day, sign-in can scroll');

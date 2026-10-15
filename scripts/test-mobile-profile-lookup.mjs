import assert from 'node:assert/strict';
import fs from 'node:fs';
import { formatCareDate } from '../apps/mobile/src/lib/careDates.js';
import { saveSignedInProfile } from '../apps/mobile/src/lib/profile-settings.js';

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
const medical = fs.readFileSync('apps/mobile/src/screens/MedicalProfileScreen.js', 'utf8');
assert.match(medical, /from\('preventive_care'\)/);
assert.match(medical, /activeMedications/);
assert.match(medical, /None recorded/);
assert.match(medical, /immunizationsDue > 0/);
assert.match(medical, /RefreshControl/);
assert.match(medical, /Next Due/);
assert.match(medical, /recordsColors/);
assert.match(medical, /darkMode/);
const settings = fs.readFileSync('apps/mobile/src/screens/ProfileSettingsScreen.js', 'utf8');
assert.match(settings, /email_verified/);
assert.match(settings, /emailVerified \?/);
const saved = await saveSignedInProfile({
  client: {
    auth: {
      getSession: async () => ({data: {session: {access_token: 'session-token', user: {id: 'owner', email: 'owner@example.test'}}}}),
      updateUser: async (body) => ({error: body.data.full_name === 'Ada Lovelace' ? null : Error('name')}),
    },
    storage: {from: () => ({getPublicUrl: (path) => ({data: {publicUrl: `https://files.example.test/${path}`}})})},
    from: () => ({upsert: async (row) => ({error: row.user_id === 'owner' && row.first_name === 'Ada' ? null : Error('row')})}),
  },
  fileSystem: {
    FileSystemUploadType: {BINARY_CONTENT: 'binary'},
    getInfoAsync: async () => ({exists: true, size: 1200}),
    uploadAsync: async (url, uri) => ({status: url.includes('/profile-images/avatars/owner-') && uri === 'file:///photo.jpg' ? 200 : 500}),
  },
  env: {supabaseUrl: 'https://preview.example.test', anonKey: 'publishable-test-key'},
  firstName: 'Ada',
  lastName: 'Lovelace',
  avatarUri: 'file:///photo.jpg',
});
assert.equal(saved.name, 'Ada Lovelace');
assert.match(saved.avatarUri, /^https:\/\/files\.example\.test\/avatars\/owner-/);
await assert.rejects(saveSignedInProfile({
  client: {auth: {getSession: async () => ({data: {session: null}})}},
  fileSystem: {},
  env: {},
  firstName: '',
  lastName: '',
  avatarUri: '',
}), /Sign in/);
console.log('PASS profile lookup uses user_id, date stays on the recorded day, sign-in can scroll');

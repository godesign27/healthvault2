import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { friendlyRecoveryError, isPasswordRecoveryUrl, normalizeRecoveryEmail, recoveryNeedsAuthenticator, recoveryRedirect, validateNewPassword } = await import('../src/lib/password-recovery.ts');

assert.equal(isPasswordRecoveryUrl('https://healthvault.me/#type=recovery'), true);
assert.equal(isPasswordRecoveryUrl('https://healthvault.me/?type=recovery'), true);
assert.equal(isPasswordRecoveryUrl('https://healthvault.me/#type=signup'), false);
assert.equal(isPasswordRecoveryUrl('https://healthvault.me/dashboard'), false);
assert.equal(isPasswordRecoveryUrl('not a url'), false);
assert.equal(validateNewPassword('short', 'short'), 'Use at least 12 characters.');
assert.equal(validateNewPassword('long-test-password', 'other-password'), 'The passwords do not match.');
assert.equal(validateNewPassword('long-test-password', 'long-test-password'), null);
assert.equal(recoveryRedirect, 'https://healthvault.me');
assert.equal(normalizeRecoveryEmail(' PERSON@EXAMPLE.INVALID '), 'person@example.invalid');
assert.throws(() => normalizeRecoveryEmail('no-email'), /valid email/);
assert.equal(recoveryNeedsAuthenticator('aal1', 'aal2'), true);
assert.equal(recoveryNeedsAuthenticator('aal2', 'aal2'), false);
assert.match(friendlyRecoveryError('AAL2 session is required to update email or password when MFA is enabled.'), /authenticator app/);

const recoveryPage = readFileSync('src/pages/PasswordRecoveryPage.tsx', 'utf8');
assert.match(recoveryPage, /hv_logo-light\.png/);
assert.match(recoveryPage, /PasswordField/);
const email = readFileSync('supabase/templates/recovery.html', 'utf8');
assert.match(email, /Health Vault/);
assert.match(email, /hv_logo-light\.png/);
assert.match(email, /\{\{ \.ConfirmationURL \}\}/);
assert.doesNotMatch(email, /Supabase/);

const app = readFileSync('src/App.tsx', 'utf8');
assert.match(app, /event === 'PASSWORD_RECOVERY'/);
assert.match(app, /if \(passwordRecovery\) return;/);
assert.match(app, /if \(passwordRecovery\) \{\s*return <PasswordRecoveryPage/);
assert.match(app, /validateNewPassword\(password, confirmation\)/);
console.log('PASS web recovery state: hash gate, password rules, and vault redirect block');

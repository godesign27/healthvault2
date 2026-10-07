import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { isPasswordRecoveryUrl, normalizeRecoveryEmail, recoveryRedirect, validateNewPassword } = await import('../src/lib/password-recovery.ts');

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

const app = readFileSync('src/App.tsx', 'utf8');
assert.match(app, /event === 'PASSWORD_RECOVERY'/);
assert.match(app, /if \(passwordRecovery\) return;/);
assert.match(app, /if \(passwordRecovery\) \{\s*return <PasswordRecoveryPage/);
assert.match(app, /validateNewPassword\(password, confirmation\)/);
console.log('PASS web recovery state: hash gate, password rules, and vault redirect block');

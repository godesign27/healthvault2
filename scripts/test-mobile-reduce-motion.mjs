import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { modalAnimation } from '../apps/mobile/src/lib/modal-motion.js';

assert.equal(modalAnimation(true, 'fade'), 'none');
assert.equal(modalAnimation(true, 'slide'), 'none');
assert.equal(modalAnimation(false, 'fade'), 'fade');
assert.equal(modalAnimation(false, 'slide'), 'slide');

const shell = await readFile(new URL('../apps/mobile/index.js', import.meta.url), 'utf8');
const drawer = shell.slice(shell.indexOf('function AppDrawer'), shell.indexOf('function VaultAssistantSheet'));
const assistant = shell.slice(shell.indexOf('function VaultAssistantSheet'), shell.indexOf('function StatCard'));
assert.match(drawer, /useReduceMotion\(\)/);
assert.match(drawer, /modalAnimation\(reduceMotion, 'fade'\)/);
assert.match(assistant, /useReduceMotion\(\)/);
assert.match(assistant, /modalAnimation\(reduceMotion, 'slide'\)/);
console.log('PASS menu and assistant skip motion when Reduce Motion is on');

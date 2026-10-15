import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

// Read-only comparison. Never download, deploy, or overwrite source automatically.
const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = JSON.parse(await readFile(resolve(root, 'packages/health-vault-mcp/production-baseline.json'), 'utf8'));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--snapshot')) {
  throw new Error('Usage: node scripts/check-health-vault-production.mjs [--snapshot /path/to/edge-function.json]');
}
const digest = content => createHash('sha256').update(content).digest('hex');
let expected = baseline.files;
let version = baseline.version;
if (args.length) {
  const snapshot = JSON.parse(await readFile(args[1], 'utf8'));
  if (snapshot.name !== baseline.function || !Array.isArray(snapshot.files) || !snapshot.files.length) {
    throw new Error('Expected a non-empty health-vault-mcp Edge Function snapshot.');
  }
  if (snapshot.verify_jwt !== baseline.verify_jwt) throw new Error('Gateway authentication configuration differs from the reviewed baseline.');
  expected = Object.fromEntries(snapshot.files.map(file => [file.name, digest(file.content)]));
  version = snapshot.version;
}
const mismatches = [];
for (const [name, hash] of Object.entries(expected)) {
  const path = resolve(root, name);
  const rel = relative(root, path);
  if (isAbsolute(name) || rel.startsWith('..') || !/^(packages\/health-vault-mcp\/src\/|supabase\/functions\/health-vault-mcp\/)/.test(rel)) {
    throw new Error(`Unexpected source path: ${name}`);
  }
  try {
    if (digest(await readFile(path)) !== hash) mismatches.push(`${name}: changed`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    mismatches.push(`${name}: missing`);
  }
}
if (mismatches.length) {
  console.error(`Source differs from production v${version}:\n${mismatches.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`All ${Object.keys(expected).length} deployed source files match production v${version}.`);
}

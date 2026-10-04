// Run from the exact source directory that will be built and deployed.
// This checks local code only; it does not authorize or perform deployment.
import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';

const root = realpathSync(process.cwd());
if (!existsSync('tsconfig.app.json') || !existsSync('wrangler.insurance-preview.jsonc')) {
  console.error('Run this check from the insurance release source root.');
  process.exit(1);
}
const suites = [
  'test-insurance-correctness', 'test-insurance-completeness',
  'test-insurance-feedback', 'test-insurance-member-id',
  'test-insurance-member-editor', 'test-insurance-mutations',
  'test-web-insurance-data', 'test-web-insurance-refresh',
  'test-mobile-insurance-theme', 'test-mobile-insurance-data',
  'test-mobile-insurance-refresh', 'test-preview-subdomain',
];
const checks = [
  ['Full web TypeScript check', 'npm', ['run', 'typecheck']],
  ...suites.map(name => [name, process.execPath, [`scripts/${name}.mjs`]]),
];
console.log(`Checking release source: ${root}`);
let failures = 0;
for (const [label, command, args] of checks) {
  console.log(`\n${label}`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) failures++;
}
console.log(`\n${checks.length - failures}/${checks.length} checks passed.`);
console.log('Build, deployed browser checks, database rollout and native accessibility remain separate gates.');
process.exitCode = failures ? 1 : 0;

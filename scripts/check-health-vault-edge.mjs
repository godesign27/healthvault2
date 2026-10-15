// Validate only the release source manifest, in an isolated Deno workspace.
import { mkdtemp, readFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve, join, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseline = JSON.parse(await readFile(join(root, 'packages/health-vault-mcp/production-baseline.json'), 'utf8'));
const temporary = await mkdtemp(join(tmpdir(), 'health-vault-edge-check-'));
try {
  for (const file of Object.keys(baseline.files)) {
    const path = relative(root, resolve(root, file));
    if (isAbsolute(file) || path.startsWith('..')) throw new Error('Invalid source manifest path');
    const destination = join(temporary, path);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(root, path), destination);
  }
  for (const file of ['deno.json', 'deno.lock']) {
    await copyFile(join(root, 'packages/health-vault-mcp/validation', file), join(temporary, file));
  }
  const result = spawnSync('deno', ['check', '--frozen', '--config', 'deno.json', baseline.entrypoint], {
    cwd: temporary, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(temporary, { recursive: true, force: true });
}

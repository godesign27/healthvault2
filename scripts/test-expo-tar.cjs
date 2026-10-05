const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const mobile = createRequire(path.join(root, 'apps/mobile/package.json'));
const expo = createRequire(mobile.resolve('expo/package.json'));
const cli = createRequire(expo.resolve('@expo/cli/package.json'));
const tar = cli('tar');
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hv-tar-test-'));
  try {
    const input = path.join(temp, 'input');
    fs.mkdirSync(path.join(input, 'package'), { recursive: true });
    fs.writeFileSync(path.join(input, 'package', 'sample.txt'), 'synthetic archive content');
    const archive = path.join(temp, 'sample.tgz');
    await tar.create({ cwd: input, file: archive, gzip: true }, ['package']);
    const output = path.join(temp, 'fallback'); fs.mkdirSync(output);
    const file = cli.resolve('./build/src/utils/tar.js');
    const localRequire = createRequire(file); const exports = {};
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { exports, process,
      require: name => name === '@expo/spawn-async' ? async () => { throw Error('Force JS fallback'); }
        : name === '../log' ? { warn() {} } : localRequire(name) });
    await exports.extractAsync(archive, output);
    assert.equal(fs.readFileSync(path.join(output, 'package/sample.txt'), 'utf8'), 'synthetic archive content');
    const npmOutput = path.join(temp, 'npm');
    const checksum = await cli('./build/src/utils/npm.js').extractLocalNpmTarballAsync(archive, { cwd: npmOutput, name: 'sample' });
    assert.equal(fs.readFileSync(path.join(npmOutput, 'sample.txt'), 'utf8'), 'synthetic archive content');
    assert.match(checksum, /^[0-9a-f]{32}$/);
    console.log('PASS Expo tar fallback and streamed npm extraction with tar7');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });

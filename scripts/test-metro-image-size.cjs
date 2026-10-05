const assert = require('node:assert/strict');
const { getAssetSize } = require('metro/src/Assets');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
assert.deepEqual(getAssetSize('png', png, 'probe.png'), {width:1,height:1});
assert.deepEqual(getAssetSize('svg', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="30"></svg>'), 'probe.svg'), {width:20,height:30});
assert.equal(getAssetSize('txt', Buffer.from('text'), 'probe.txt'), null);
assert.throws(() => getAssetSize('png', Buffer.alloc(0), 'empty.png'), /empty/);
assert.throws(() => getAssetSize('png', Buffer.from('invalid'), 'invalid.png'));
console.log('PASS Metro PNG/SVG dimensions, non-image handling and invalid input rejection');

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hv-metro-image-'));
  try {
    const file = path.join(dir, 'probe.png');
    fs.writeFileSync(file, png);
    const data = await require('metro/src/Assets').getAssetData(file, 'probe.png', [], 'ios', '/assets');
    assert.equal(data.width, 1);
    assert.equal(data.height, 1);
    assert.deepEqual(data.scales, [1]);
    console.log('PASS Metro file-based asset data and dimensions');
  } finally { fs.rmSync(dir, {recursive:true, force:true}); }
})().catch(error => { console.error(error); process.exitCode = 1; });

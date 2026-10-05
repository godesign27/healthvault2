const assert = require('node:assert/strict');
const { getAssetSize } = require('metro/src/Assets');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
assert.deepEqual(getAssetSize('png', png, 'probe.png'), {width:1,height:1});
assert.deepEqual(getAssetSize('svg', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="30"></svg>'), 'probe.svg'), {width:20,height:30});
assert.equal(getAssetSize('txt', Buffer.from('text'), 'probe.txt'), null);
assert.throws(() => getAssetSize('png', Buffer.alloc(0), 'empty.png'), /empty/);
assert.throws(() => getAssetSize('png', Buffer.from('invalid'), 'invalid.png'));
console.log('PASS Metro PNG/SVG dimensions, non-image handling and invalid input rejection');

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import test from 'node:test';

// Decode the two existing non-interlaced, 8-bit RGBA PNGs using Node built-ins.
async function opaqueColors(asset) {
  const png = await readFile(new URL(`../public/${asset}`, import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.deepEqual([...png.subarray(24, 29)], [8, 6, 0, 0, 0]);
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const size = png.readUInt32BE(offset), type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * 4, rows = [];
  const counts = new Map();
  const paeth = (a, b, c) => {
    const estimate = a + b - c, da = Math.abs(estimate - a), db = Math.abs(estimate - b), dc = Math.abs(estimate - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(stride), filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? row[x - 4] : 0, b = rows[y - 1]?.[x] ?? 0, c = x >= 4 ? rows[y - 1]?.[x - 4] ?? 0 : 0;
      const predictors = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)];
      assert.ok(filter <= 4);
      row[x] = (raw[y * (stride + 1) + 1 + x] + predictors[filter]) & 255;
    }
    rows.push(row);
    for (let x = 0; x < stride; x += 4) if (row[x + 3] === 255) {
      const color = row.subarray(x, x + 3).toString('hex').toUpperCase();
      counts.set(color, (counts.get(color) ?? 0) + 1);
    }
  }
  return counts;
}
const luminance = (hex) => {
  const channels = hex.match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const contrast = (a, b) => { const first = luminance(a), second = luminance(b); return ((Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)).toFixed(2); };
for (const [asset, ink, surfaces] of [
  ['hv_logo-light.png', '180B3A', [['FFFFFF', '18.30', '4.38'], ['F8FAFC', '17.49', '4.19']]],
  ['hv_logo-dark.png', 'FFFFFF', [['0F172A', '17.85', '4.07'], ['1C2938', '14.75', '3.37']]],
]) {
  test(`${asset}: existing opaque inks and recorded surface contrast`, async () => {
    const counts = await opaqueColors(asset);
    assert.ok(counts.get(ink) > 100, 'Main ink must exist as opaque interior pixels');
    assert.ok(counts.get('ED1C24') > 100, 'Red heart must exist as opaque interior pixels');
    for (const [surface, mainRatio, heartRatio] of surfaces) {
      assert.equal(contrast(ink, surface), mainRatio);
      assert.equal(contrast('ED1C24', surface), heartRatio);
    }
  });
}

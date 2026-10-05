const assert = require('node:assert/strict');
const { transformPostCssModule } = require('@expo/metro-config/build/transform-worker/postcss');
(async () => {
  const result = await transformPostCssModule(process.cwd(), {
    src: '.hv-dependency-probe { display: flex; }',
    filename: `${process.cwd()}/dependency-probe.css`,
  });
  assert.equal(result.hasPostcss, true);
  assert.match(result.src, /display:\s*flex/);
  console.log('PASS Expo Metro PostCSS transform');
})().catch(error => { console.error(error); process.exitCode = 1; });

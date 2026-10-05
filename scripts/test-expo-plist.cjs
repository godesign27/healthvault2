const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const plist = require('@expo/plist').default;
const xml = createRequire(require.resolve('@expo/plist'))('@xmldom/xmldom');
const input = {
  CFBundleName: 'Health Vault & <Preview>',
  Enabled: true,
  Count: 12,
  Nested: { Items: ['one', 'two'], Disabled: false },
};
const encoded = plist.build(input);
assert.deepEqual(plist.parse(encoded), input);
assert.match(encoded, /&amp;/);
const doc = new xml.DOMParser().parseFromString('<root/>', 'text/xml');
doc.documentElement.appendChild(doc.createTextNode('<injected> & text'));
const serialized = new xml.XMLSerializer().serializeToString(doc);
assert.match(serialized, /&lt;injected&gt; &amp; text/);
assert.equal(doc.getElementsByTagName('injected').length, 0);
console.log('PASS Expo plist round-trip, nested values and XML text escaping');

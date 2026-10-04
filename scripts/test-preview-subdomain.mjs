import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import ts from 'typescript';
const exports={};const window={location:{hostname:'healthvault2-insurance-preview.timothymcguire.workers.dev',protocol:'https:',port:'',search:''}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/subdomain.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,window,URLSearchParams});
assert.equal(exports.parseSubdomain().isProvider,false);assert.equal(exports.parseSubdomain().organizationSlug,null);
assert.equal(exports.buildUrl(null,'/dashboard'),'https://healthvault2-insurance-preview.timothymcguire.workers.dev/dashboard');
assert.equal(exports.parseSubdomain('clinic.healthvault.me').organizationSlug,'clinic');assert.equal(exports.parseSubdomain('healthvault.me').isProvider,false);
window.location.search='?subdomain=clinic';assert.equal(exports.parseSubdomain().organizationSlug,'clinic');
assert.equal(exports.buildUrl('clinic'), 'https://healthvault2-insurance-preview.timothymcguire.workers.dev/?subdomain=clinic');
console.log('PASS preview root, same-host links, intentional organization preview and production organization routing');

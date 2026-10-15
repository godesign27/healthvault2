import assert from 'node:assert/strict';
import {adaptiveLayout,typeStyles,typeLimits,control} from '../apps/mobile/src/theme/layout.js';
for(const width of [320,375,393,430,768]){
 assert.equal(adaptiveLayout(width,3.1).stack,true,`accessible layout at ${width}`);
 assert.ok(adaptiveLayout(width,1).gutter>=12);
}
assert.equal(adaptiveLayout(393,1).stack,false);
assert.equal(adaptiveLayout(320,1.3).stack,true);
for(const style of Object.values(typeStyles)){
 assert.ok(style.fontSize>=13);assert.ok(style.lineHeight>style.fontSize);
}
for(const role of ['body','label','secondary','caption'])assert.equal(typeLimits[role],0,'Reading/control text must not be capped');
assert.ok(control.minTarget>=48);
console.log('PASS compact/accessibility reflow, readable role sizes, uncapped body/control text and minimum touch target');
// Guard the migrated production surfaces against typography drift.
const {readFile,readdir}=await import('node:fs/promises');
const root=new URL('../apps/mobile/',import.meta.url);
const files=['index.js',...(await readdir(new URL('src/screens/',root))).filter(x=>x.endsWith('.js')).map(x=>'src/screens/'+x)];
for(const file of files){
 const source=await readFile(new URL(file,root),'utf8');
 // Temporary acceptance entry is restored before this guard is run for release.
 assert.ok(!/fontSize:\s*\d/.test(source),`${file}: use a typography role`);
 assert.ok(!/allowFontScaling=\{false\}/.test(source),`${file}: do not disable text scaling`);
}
console.log('PASS migrated screen/shell typography policy');
const {floatingAction,floatingContentInset,space}=await import('../apps/mobile/src/theme/layout.js');
for(const bottom of [0,20,34,48]){
 assert.ok(floatingContentInset(bottom)-(bottom+floatingAction.gap+floatingAction.size)>=space.lg,'last row must clear the floating action and safe area');
}
assert.equal(floatingContentInset(-10),floatingContentInset(0));
assert.equal(floatingContentInset(NaN),floatingContentInset(0));
const shell=await readFile(new URL('index.js',root),'utf8');
const topBar=shell.slice(shell.indexOf('function AppTopBar'), shell.indexOf('function AppDrawer'));
assert.match(topBar,/topBarActions/);
assert.match(topBar,/Open menu[\s\S]*Go to Dashboard[\s\S]*hv_logo[\s\S]*Open profile settings[\s\S]*Open Vault Assistant/);
assert.match(shell,/onLogoPress=\{\(\) => setActiveRoute\('dashboard'\)\}/);
assert.doesNotMatch(topBar,/topBarTitle/);
assert.match(shell,/const omit = false/);
assert.match(shell,/RevealText[\s\S]*numberOfLines=\{2\}/);
const reveal=await readFile(new URL('src/components/ui/AppText.js',root),'utf8');
assert.match(reveal,/if\(!limited\)return body/);
assert.match(reveal,/onPress=\{toggle\}/);
assert.doesNotMatch(reveal,/expandable\?/);
assert.match(shell,/useStackedLayout/);
assert.match(shell,/drawerProfileCardStacked/);
const drawer=shell.slice(shell.indexOf('function AppDrawer'), shell.indexOf('function VaultAssistantSheet'));
assert.doesNotMatch(drawer,/drawerRowStacked/);
assert.match(shell,/drawerRow: \{[^}]*flexDirection: 'row'/);
assert.match(shell,/medRowStacked/);
assert.match(shell,/statCardStacked/);
assert.doesNotMatch(shell,/drawerProfileName[\s\S]{0,180}numberOfLines=\{1\}/);
const titleStyle=shell.slice(shell.indexOf('dashTitle:'), shell.indexOf('dashWelcome:'));
assert.doesNotMatch(titleStyle,/flexShrink/);
assert.doesNotMatch(shell,/styles\.fab/);
console.log('PASS assistant control sits to the right of the profile avatar');

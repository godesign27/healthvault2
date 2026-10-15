import assert from 'node:assert/strict';
import {semanticColors} from '../packages/design-tokens/semantic.js';
const luminance=h=>h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(hi+.05)/(lo+.05);};
for(const [mode,c] of Object.entries(semanticColors)){
 for(const role of ['success','danger','warning','info','ai','signal']){
  assert.ok(ratio(c[role],c[role+'Bg'])>=4.5,`${mode} ${role} callout`);
  assert.ok(ratio(c.onAction,c[role+'Action'])>=4.5,`${mode} ${role} action`);
 }
 assert.ok(ratio(c.focus,c.surface)>=3,`${mode} focus/surface`);
 assert.ok(ratio(c.focus,c.surfaceMuted)>=3,`${mode} focus/muted`);
}
assert.equal(semanticColors.light.navy,'#0F172A');
assert.equal(semanticColors.dark.navy,'#2563EB');
console.log('PASS semantic callout/action contrast, focus contrast and existing native core preservation');

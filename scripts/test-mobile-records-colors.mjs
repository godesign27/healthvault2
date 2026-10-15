import assert from 'node:assert/strict';
import {recordsColors} from '../apps/mobile/src/theme/records.js';
const luminance=hex=>{const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const contrast=(a,b)=>{const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (values[0]+.05)/(values[1]+.05);};
for(const dark of [false,true]){
 const c=recordsColors(dark);
 for(const [fg,bg] of [['textPrimary','surface'],['textSecondary','surface'],['textMuted','surface'],['accent','accentBg'],['success','successBg'],['onAction','navy'],['onAction','successAction'],['onAction','orange']]){
  const ratio=contrast(c[fg],c[bg]);assert.ok(ratio>=4.5,`${dark?'dark':'light'} ${fg}/${bg}: ${ratio.toFixed(2)}`);
 }
 for(const bg of ['surface','surfaceMuted']) assert.ok(contrast(c.controlBorder,c[bg])>=3,`Control boundary ${bg} must meet 3:1`);
}
console.log('PASS Records light/dark text, feedback and primary-action color pairs meet 4.5:1');

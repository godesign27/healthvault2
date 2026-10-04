import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {semanticColors} from '../packages/design-tokens/semantic.js';
import {typeStyles,control,space,radius} from '../apps/mobile/src/theme/layout.js';
const source=fs.readFileSync('apps/mobile/src/screens/InsuranceScreen.js','utf8');
const ctx={StyleSheet:{create:x=>x,hairlineWidth:1},typeStyles,control,space,radius,Platform:{OS:'ios',select:options=>options.ios}};
vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('const createStyles ='))+'\nthis.build=createStyles;',ctx);
for(const c of Object.values(semanticColors)){
 const styles=ctx.build(c);
 assert.equal(styles.card.backgroundColor,c.surface);
 assert.equal(styles.toastError.backgroundColor,c.dangerBg);
 assert.equal(styles.toastTextError.color,c.danger);
 assert.equal(styles.pillPrimary.backgroundColor,c.navy);
 assert.equal(styles.pillPrimaryText.color,c.onAction);
 for(const action of ['actionBtn','actionBtnOrange','actionBtnGreen','actionBtnDelete']){
  assert.ok(styles[action].minHeight>=48);
  assert.equal(styles[action+'Text'].flexShrink,1);
 }
}
console.log('PASS Insurance actual light/dark card, feedback, badge and adaptive-action styles');

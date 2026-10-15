import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {semanticColors} from '../packages/design-tokens/semantic.js';
import {typeStyles,control} from '../apps/mobile/src/theme/layout.js';
const source=fs.readFileSync('apps/mobile/src/screens/CareScreen.js','utf8');
const ctx={StyleSheet:{create:x=>x,hairlineWidth:1},typeStyles,control,cardShadow:{}};
vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('const createStyles ='))+'\nthis.build=createStyles;',ctx);
for(const c of Object.values(semanticColors)){
 const styles=ctx.build(c);
 assert.equal(styles.card.backgroundColor,c.surface);
 assert.equal(styles.inlineError.color,c.dangerAction);
 assert.equal(styles.filterTabActive.backgroundColor,c.navy);
 assert.equal(styles.filterTabTextActive.color,c.onAction);
 assert.equal(styles.timeMenu.top,'100%');
 assert.ok(styles.filterTab.minHeight>=48);
 assert.ok(styles.timeMenuItem.minHeight>=48);
}
console.log('PASS actual Care styles: light/dark surfaces, feedback, selected-action colors, growing dropdown and touch targets');

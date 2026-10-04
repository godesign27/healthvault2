import {semanticColors} from '../../../../packages/design-tokens/semantic.js';
// Legacy names remain compatibility aliases while screen consumers migrate.
const adapt=c=>({...c,orange:c.warningAction,orangeBg:c.warningBg,orangeBorder:c.warningBorder,eyebrow:c.danger});
const light=adapt(semanticColors.light),dark=adapt(semanticColors.dark);
export const recordsColors=darkMode=>darkMode?dark:light;

import tokens from '../../../packages/design-tokens/dataviz.json';
export type ChartMode='light'|'dark';
export const chartOrder=tokens.order;
export const chartSeed=tokens.seed;
export const ENCODE_FROM=tokens.encodeFrom;
export const COLOR_ONLY_CAP=tokens.colorOnlyCap;
export const SEPARATOR_STROKE=tokens.separatorStroke;
export const chartSeries=chartOrder.map(key=>tokens.series.find(s=>s.key===key)!);
export function seriesValues(mode:ChartMode){return chartSeries.map(s=>`var(--${s.token}-${String(mode==='light'?s.chartLight:s.chartDark).padStart(2,'0')})`);}
export function needsEncoding(keys:string[]){return keys.length>=ENCODE_FROM||tokens.restrictedPairs.some(pair=>pair.every(key=>keys.includes(key)));}
export function chartMotion(reduced:boolean,points=0){return Object.fromEntries(Object.entries(tokens.motion).map(([key,t])=>[key,{...t,ms:reduced||points>300?0:t.ms}]));}
export function seriesDelay(index:number,reduced=false,points=0){return reduced||points>300?0:Math.min(Math.max(0,index),6)*Math.min(tokens.motion.stagger.ms,(1000-tokens.motion.enter.ms)/6);}
export function highchartsTheme(mode:ChartMode){return {colors:chartSeries.map(s=>s.steps[String(mode==='light'?s.chartLight:s.chartDark).padStart(2,'0') as keyof typeof s.steps]),chart:{backgroundColor:tokens.theme.surface[mode]},title:{style:{color:tokens.theme.ink[mode]}},xAxis:{labels:{style:{color:tokens.theme.soft[mode]}},gridLineColor:tokens.theme.grid[mode]},yAxis:{labels:{style:{color:tokens.theme.soft[mode]}},gridLineColor:tokens.theme.grid[mode]}};}
export function powerBiTheme(mode:ChartMode){return {name:`Health Vault ${mode}`,dataColors:highchartsTheme(mode).colors,background:tokens.theme.surface[mode],foreground:tokens.theme.ink[mode],tableAccent:tokens.theme.soft[mode],good:tokens.status.positive[mode==='light'?0:1],neutral:tokens.status.warning[mode==='light'?0:1],bad:tokens.status.negative[mode==='light'?0:1]};}

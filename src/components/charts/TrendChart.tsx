import {useId,type CSSProperties} from 'react';
import {chartSeries,needsEncoding,seriesValues,seriesDelay,type ChartMode} from './chartPolicy';
import './charts.css';
function SeriesMarker({shape,x,y,color}:{shape:string;x:number;y:number;color:string}){
 const shared={fill:color,stroke:'var(--chart-surface)',strokeWidth:1.5};
 if(shape==='square')return <rect x={x-4} y={y-4} width={8} height={8} {...shared}/>;
 if(shape==='triangle')return <polygon points={`${x},${y-5} ${x+5},${y+4} ${x-5},${y+4}`} {...shared}/>;
 if(shape==='diamond')return <polygon points={`${x},${y-5} ${x+5},${y} ${x},${y+5} ${x-5},${y}`} {...shared}/>;
 if(shape==='cross')return <path d={`M ${x-4} ${y-4} L ${x+4} ${y+4} M ${x-4} ${y+4} L ${x+4} ${y-4}`} stroke={color} strokeWidth={2} fill="none"/>;
 return <circle cx={x} cy={y} r={3.5} {...shared}/>;
}
function Texture({pattern,color}:{pattern:string;color:string}) {
 if(pattern==='solid') return <rect width="8" height="8" fill={color} fillOpacity=".12"/>;
 if(pattern==='dots'||pattern==='sparse-dots') return <circle cx="4" cy="4" r={pattern==='dots'?1:.7} fill={color}/>;
 if(pattern==='checker') return <g fill={color} fillOpacity=".3"><rect width="4" height="4"/><rect x="4" y="4" width="4" height="4"/></g>;
 const paths:Record<string,string>={diagonal:'M -2 2 L 2 -2 M 0 8 L 8 0 M 6 10 L 10 6','back-diagonal':'M -2 6 L 2 10 M 0 0 L 8 8 M 6 -2 L 10 2',grid:'M 0 0 H 8 M 0 0 V 8',horizontal:'M 0 4 H 8',vertical:'M 4 0 V 8',zigzag:'M 0 4 L 2 2 L 6 6 L 8 4'};
 return <path d={paths[pattern]||paths.diagonal} fill="none" stroke={color} strokeWidth="1"/>;
}
export type ChartVariant = 'base' | 'signal' | 'ai';
export type TrendSeries={key:string;label:string;values:number[]};
/** Exact values stay available without hover, color discrimination or animation. */
export function TrendChart({title,labels,series,mode='light',variant='base',textures=false,animate=false}:{title:string;labels:string[];series:TrendSeries[];mode?:ChartMode;variant?:ChartVariant;textures?:boolean;animate?:boolean}){
 const id=useId();
 const patternPrefix=`chart-${id.replace(/:/g,'')}`;
 if(!series.length||!labels.length)return <p>No chart data available.</p>;
 if(series.length>12||series.some(s=>!chartSeries.some(c=>c.key===s.key)||s.values.length!==labels.length||s.values.some(v=>!Number.isFinite(v)))||new Set(series.map(s=>s.key)).size!==series.length) return <p>Chart data cannot be displayed. Check series lengths, keys and values.</p>;
 const ordered=series.map(s=>({...s,slot:chartSeries.findIndex(c=>c.key===s.key)})).sort((a,b)=>a.slot-b.slot);
 const colors=seriesValues(mode),encode=needsEncoding(ordered.map(s=>chartSeries[s.slot].key));
 const all=series.flatMap(s=>s.values),min=Math.min(0,...all),max=Math.max(1,...all),range=max-min||1;
 const x=(i:number)=>48+i*584/Math.max(1,labels.length-1),y=(v:number)=>220-(v-min)/range*184;
 return <figure className="hv-chart" data-chart-mode={mode} data-chart-variant={variant} data-chart-animate={animate && series.reduce((count,s)=>count+s.values.length,0)<=300} aria-labelledby={id}>
  <figcaption id={id}>{title}</figcaption>
  <div className="hv-chart-plot" role="region" aria-label={`${title} plot; scroll horizontally on small screens`} tabIndex={0}>
  <svg viewBox="0 0 680 260" role="img" aria-label={`${title}. Exact values in the table below.`}>
   {textures && <defs>{ordered.map(s => <pattern key={s.key} id={`${patternPrefix}-${s.key}`} width="8" height="8" patternUnits="userSpaceOnUse">
    <Texture pattern={chartSeries[s.slot].pattern} color={colors[s.slot]} />
   </pattern>)}</defs>}
   {[0,.5,1].map(t=><g key={t}><line x1="48" x2="632" y1={y(min+range*t)} y2={y(min+range*t)} stroke="var(--chart-grid)"/><text x="40" y={y(min+range*t)+4} textAnchor="end" fill="var(--chart-soft)">{Math.round((min+range*t)*10)/10}</text></g>)}
   {textures && <g aria-hidden="true" opacity=".1">{ordered.map(s => <polygon key={s.key} fill={`url(#${patternPrefix}-${s.key})`} points={`${x(0)},${y(0)} ${s.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')} ${x(s.values.length-1)},${y(0)}`} />)}</g>}
   {ordered.map((s,index)=><g key={s.key} className="hv-chart-series" style={{'--chart-series-delay':`${seriesDelay(index,false,all.length)}ms`} as CSSProperties}><polyline fill="none" stroke={colors[s.slot]} strokeWidth="2" strokeDasharray={encode?chartSeries[s.slot].dash:undefined} points={s.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}/>{s.values.map((v,i)=><SeriesMarker key={i} shape={encode?chartSeries[s.slot].marker:'circle'} x={x(i)} y={y(v)} color={colors[s.slot]}/>)}</g>)}
   <text x="48" y="248" fill="var(--chart-ink)">{labels[0]}</text><text x="632" y="248" textAnchor="end" fill="var(--chart-ink)">{labels[labels.length-1]}</text>
  </svg></div>
  {series.length>=2&&<ul className="hv-chart-legend" aria-label="Chart legend">{ordered.map(s=><li key={s.key}><svg width="36" height="20" aria-hidden="true"><line x1="0" x2="36" y1="10" y2="10" stroke={colors[s.slot]} strokeWidth="2" strokeDasharray={encode?chartSeries[s.slot].dash:undefined}/><SeriesMarker shape={encode?chartSeries[s.slot].marker:'circle'} x={18} y={10} color={colors[s.slot]}/></svg>{s.label}</li>)}</ul>}
  <details><summary>View as table</summary><div className="hv-chart-table" role="region" aria-label={`${title} data`} tabIndex={0}><table><caption>{title} — exact values</caption><thead><tr><th scope="col">Period</th>{ordered.map(s=><th scope="col" key={s.key}>{s.label}</th>)}</tr></thead><tbody>{labels.map((label,i)=><tr key={i}><th scope="row">{label}</th>{ordered.map(s=><td key={s.key}>{s.values[i]}</td>)}</tr>)}</tbody></table></div></details>
 </figure>;
}

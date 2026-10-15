import {useId} from 'react';
import {chartSeries,needsEncoding,seriesValues,type ChartMode} from './chartPolicy';
import './charts.css';
function SeriesMarker({shape,x,y,color}:{shape:string;x:number;y:number;color:string}){
 const shared={fill:color,stroke:'var(--chart-surface)',strokeWidth:1.5};
 if(shape==='square')return <rect x={x-4} y={y-4} width={8} height={8} {...shared}/>;
 if(shape==='triangle')return <polygon points={`${x},${y-5} ${x+5},${y+4} ${x-5},${y+4}`} {...shared}/>;
 if(shape==='diamond')return <polygon points={`${x},${y-5} ${x+5},${y} ${x},${y+5} ${x-5},${y}`} {...shared}/>;
 if(shape==='cross')return <path d={`M ${x-4} ${y-4} L ${x+4} ${y+4} M ${x-4} ${y+4} L ${x+4} ${y-4}`} stroke={color} strokeWidth={2} fill="none"/>;
 return <circle cx={x} cy={y} r={3.5} {...shared}/>;
}
export type TrendSeries={key:string;label:string;values:number[]};
/** Exact values stay available without hover, color discrimination or animation. */
export function TrendChart({title,labels,series,mode='light'}:{title:string;labels:string[];series:TrendSeries[];mode?:ChartMode}){
 const id=useId();
 if(!series.length||!labels.length)return <p>No chart data available.</p>;
 if(series.length>12||series.some(s=>!chartSeries.some(c=>c.key===s.key)||s.values.length!==labels.length||s.values.some(v=>!Number.isFinite(v)))||new Set(series.map(s=>s.key)).size!==series.length) return <p>Chart data cannot be displayed. Check series lengths, keys and values.</p>;
 const ordered=series.map(s=>({...s,slot:chartSeries.findIndex(c=>c.key===s.key)})).sort((a,b)=>a.slot-b.slot);
 const colors=seriesValues(mode),encode=needsEncoding(ordered.map(s=>chartSeries[s.slot].key));
 const all=series.flatMap(s=>s.values),min=Math.min(0,...all),max=Math.max(1,...all),range=max-min||1;
 const x=(i:number)=>48+i*584/Math.max(1,labels.length-1),y=(v:number)=>220-(v-min)/range*184;
 return <figure className="hv-chart" data-chart-mode={mode} aria-labelledby={id}>
  <figcaption id={id}>{title}</figcaption>
  <div className="hv-chart-plot" role="region" aria-label={`${title} plot; scroll horizontally on small screens`} tabIndex={0}>
  <svg viewBox="0 0 680 260" role="img" aria-label={`${title}. Exact values in the table below.`}>
   {[0,.5,1].map(t=><g key={t}><line x1="48" x2="632" y1={y(min+range*t)} y2={y(min+range*t)} stroke="var(--chart-grid)"/><text x="40" y={y(min+range*t)+4} textAnchor="end" fill="var(--chart-soft)">{Math.round((min+range*t)*10)/10}</text></g>)}
   {ordered.map(s=><g key={s.key}><polyline fill="none" stroke={colors[s.slot]} strokeWidth="2" strokeDasharray={encode?chartSeries[s.slot].dash:undefined} points={s.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}/>{s.values.map((v,i)=><SeriesMarker key={i} shape={encode?chartSeries[s.slot].marker:'circle'} x={x(i)} y={y(v)} color={colors[s.slot]}/>)}</g>)}
   <text x="48" y="248" fill="var(--chart-ink)">{labels[0]}</text><text x="632" y="248" textAnchor="end" fill="var(--chart-ink)">{labels[labels.length-1]}</text>
  </svg></div>
  {series.length>=2&&<ul className="hv-chart-legend" aria-label="Chart legend">{ordered.map(s=><li key={s.key}><svg width="36" height="20" aria-hidden="true"><line x1="0" x2="36" y1="10" y2="10" stroke={colors[s.slot]} strokeWidth="2" strokeDasharray={encode?chartSeries[s.slot].dash:undefined}/><SeriesMarker shape={encode?chartSeries[s.slot].marker:'circle'} x={18} y={10} color={colors[s.slot]}/></svg>{s.label}</li>)}</ul>}
  <details><summary>View as table</summary><div className="hv-chart-table" role="region" aria-label={`${title} data`} tabIndex={0}><table><caption>{title} — exact values</caption><thead><tr><th scope="col">Period</th>{ordered.map(s=><th scope="col" key={s.key}>{s.label}</th>)}</tr></thead><tbody>{labels.map((label,i)=><tr key={i}><th scope="row">{label}</th>{ordered.map(s=><td key={s.key}>{s.values[i]}</td>)}</tr>)}</tbody></table></div></details>
 </figure>;
}

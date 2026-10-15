import React from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/index.css';
import {TrendChart} from '../../src/components/charts/TrendChart';
import {chartOrder,chartSeed} from '../../src/components/charts/chartPolicy';
createRoot(document.getElementById('root')!).render(<main><h1>Chart acceptance — synthetic data</h1>{(['light','dark'] as const).map(mode=><TrendChart key={mode} mode={mode} title={`Reference trends — ${mode}`} labels={Array.from({length:8},(_,i)=>`Period ${i+1}`)} series={chartOrder.slice(0,6).map((key,i)=>({key,label:key,values:chartSeed[i]}))}/>)}</main>);

import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function compile(path,imports){const source=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const mod={exports:{}};new Function('require','module','exports',source)(id=>id in imports?imports[id]:require(id),mod,mod.exports);return mod.exports;}
const policy=compile('src/components/charts/chartPolicy.ts',{'../../../packages/design-tokens/dataviz.json':JSON.parse(fs.readFileSync('packages/design-tokens/dataviz.json','utf8'))});
const {TrendChart}=compile('src/components/charts/TrendChart.tsx',{'./chartPolicy':policy,'./charts.css':{}});
const render=series=>renderToStaticMarkup(React.createElement(TrendChart,{title:'Synthetic',labels:['One','Two'],series}));
const output=render([{key:'olive',label:'Olive',values:[1,2]},{key:'brass',label:'Brass',values:[2,1]}]);
assert(output.indexOf('>Brass</li>')<output.indexOf('>Olive</li>'),'Canonical legend order');
assert(output.includes('<circle')&&output.includes('<path'),'Restricted pair receives distinct non-color markers');
assert(output.includes('hv-chart-plot')&&output.includes('scroll horizontally on small screens'));
assert(output.includes('<th scope="col">Brass</th><th scope="col">Olive</th>'));
assert(render([{key:'harbor',label:'Bad',values:[NaN,2]}]).includes('cannot be displayed'));
assert(render([]).includes('No chart data'));
console.log('PASS rendered chart canonical order, marker encoding, keyboard scroll region, exact table and invalid data');

import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react(),{name:'isolated-insurance-failure',configureServer(server){
 server.middlewares.use('/fixture/save',(req,res)=>{let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{
 const {fail}=JSON.parse(body);setTimeout(()=>{res.setHeader('Content-Type','application/json');res.statusCode=fail?503:200;res.end(JSON.stringify(fail?{error:'Synthetic outage'}:{id:'fixture-plan'}));},750);
 });});
}}],server:{host:'127.0.0.1',port:5188,strictPort:true}});

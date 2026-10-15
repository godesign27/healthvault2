import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
export default defineConfig({plugins:[{name:'isolated-provider-review',enforce:'pre',resolveId(source){
 if(source==='../supabase'||/lib\/(tools\/(searchProviderOrganizations|resolveProviderRecordConnection|fetchProviderRecordPreview|startProviderConnection|startEpicConnection)|supabase)$/.test(source))return resolve('tests/provider-review-browser/mocks.ts');
}},react()],server:{host:'127.0.0.1',port:5184,strictPort:true}});

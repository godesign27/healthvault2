// Development-only full Records-screen acceptance; never loaded by the normal entry.
import 'react-native-url-polyfill/auto';
import React from 'react';
import {AppRegistry,View,Text,Button} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RecordsScreen from '../src/screens/RecordsScreen';
import {api} from '../src/lib/api';
import {supabase} from '../src/lib/supabase';
const owner='records-refresh-fixture',org='fixture-org',connection='fixture-connection';
let saved=false,failStats=false;
api.getRecords=async(filters)=>({items:saved&&!filters?.kind?[{id:'fixture-import',title:'Synthetic provider import',kind:'other',source:'provider',serviceDate:'2026-10-03',tags:[]}]:[],total:saved?1:0});
api.getStats=async()=>{if(failStats)throw Error('Injected stats refresh failure');return {totalRecords:saved?1:0,connectedProviders:1,lastSyncedAt:saved?'2026-10-03T12:00:00Z':null};};
supabase.auth.getSession=async()=>({data:{session:{user:{id:owner}}}});
supabase.auth.getUser=async()=>({data:{user:{id:owner}}});
supabase.auth.onAuthStateChange=()=>({data:{subscription:{unsubscribe(){}}}});
supabase.from=table=>{const q={select(){return q;},eq(){return q;},ilike(){return q;},order(){return q;},limit(){return q;},maybeSingle:async()=>({data:table==='provider_connections'?{id:connection,status:'active'}:null}),then(resolve){return Promise.resolve({data:table==='provider_organizations'?[{id:org,name:'Synthetic refresh provider',supports_direct_connection:true}]:[]}).then(resolve);}};return q;};
Object.defineProperty(supabase,'functions',{value:{invoke:async name=>name==='fhir-sync'?{data:{source:'fhir',importJobId:'fixture-refresh-job',itemsByType:{condition:[{name:'Synthetic review condition'}]}}}:(saved=true,{data:{status:'complete',importJobId:'fixture-refresh-job',conditions:1,medications:0,allergies:0,immunizations:0,duplicates:0}})},configurable:true});
function Harness(){return <SafeAreaProvider><View style={{flex:1,paddingTop:55}}><Text>Full Records refresh · synthetic test</Text><Button title="Fail statistics refresh" onPress={()=>{failStats=true;}}/><RecordsScreen/></View></SafeAreaProvider>;}
AppRegistry.registerComponent('main',()=>Harness);

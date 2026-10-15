// Development-only native acceptance harness. Never registered by the normal entry.
import 'react-native-url-polyfill/auto';
import React,{useState} from 'react';
import {AppRegistry,ScrollView,Text,Button,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from '../src/lib/supabase';
import {ProviderImportReview} from '../src/components/records/ProviderImportReview';
const owner='synthetic-ui-import-owner',connection='synthetic-ui-import-connection';
const commitKey='hv:acceptance:provider-import-committed';
const pendingKey=`hv:fhir-import:${owner}:${connection}`;
supabase.auth.getSession=async()=>({data:{session:{user:{id:owner}}}});
const invoke=async(name,{body})=>{
 if(name==='fhir-sync')return {data:{source:'fhir',importJobId:'synthetic-ui-job',itemsByType:{condition:[{name:'Synthetic condition A',date:'2020-01-01'},{name:'Synthetic condition B',date:'2020-02-01'}]}}};
 if(name!=='fhir-import')throw Error('Unexpected test request');
 const prior=await AsyncStorage.getItem(commitKey);
 if(!prior){await AsyncStorage.setItem(commitKey,JSON.stringify(body));return {error:Error('Injected lost response')};}
 if(prior!==JSON.stringify(body))throw Error('Selection changed on retry');
 return {data:{status:'complete',importJobId:body.importJobId,conditions:body.selection.condition.length,medications:0,allergies:0,immunizations:0,duplicates:0}};
};
Object.defineProperty(supabase,'functions',{value:{invoke},configurable:true});
const colors={textPrimary:'#0F172A',textSecondary:'#64748B',accent:'#4F46E5',accentBg:'#EEF2FF',border:'#D1D5E0'};
function Harness(){const [epoch,setEpoch]=useState(0),[ready,setReady]=useState(true);return <ScrollView contentContainerStyle={{padding:24,paddingTop:70,gap:16,backgroundColor:'#FFFFFF',flexGrow:1}}><Text style={{fontSize:20,color:colors.textPrimary}}>Synthetic import acceptance</Text><Text>First confirmation response is lost. Restart the app to recover the saved selection. No network or patient data.</Text><Button title="Reset synthetic test" onPress={async()=>{setReady(false);await AsyncStorage.multiRemove([commitKey,pendingKey]);setEpoch(n=>n+1);setReady(true);}}/>{ready&&<ProviderImportReview key={epoch} receipt={{id:connection,ownerId:owner}} colors={colors} onImported={async()=>{throw Error('Injected list refresh failure');}}/>}<View style={{height:30}}/></ScrollView>;}
AppRegistry.registerComponent('main',()=>Harness);

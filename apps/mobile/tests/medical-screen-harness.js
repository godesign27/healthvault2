// Synthetic UI acceptance only. Never import this from the production entry.
import React from 'react';
import {AppRegistry} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {supabase} from '../src/lib/supabase';
import MedicalScreen from '../src/screens/MedicalScreen';
const responses=[{id:'synthetic-response',template_id:'patient-reg',status:'complete',answers_json:{first_name:'Test',last_name:'Patient'},signed_at:'2026-10-03T12:00:00Z'}];
const shares=[],pending=new Map(process.env.EXPO_PUBLIC_TEST_PENDING_SHARE==='1'?[[
 'hv:medical-share-pending:synthetic-owner',JSON.stringify({requestId:'a1111111-1111-4111-8111-111111111111'})
]]:[]);
AsyncStorage.getItem=async key=>pending.get(key)||null;
AsyncStorage.setItem=async(key,value)=>{pending.set(key,value);};
AsyncStorage.removeItem=async key=>{pending.delete(key);};
supabase.auth.getSession=async()=>({data:{session:{user:{id:'synthetic-owner'}}}});
supabase.auth.onAuthStateChange=()=>({data:{subscription:{unsubscribe(){}}}});
supabase.from=table=>{let saving;const data=()=>table==='patient_profiles'?{id:'synthetic-patient'}:table==='user_profiles'?{first_name:'Test',last_name:'Patient'}:table==='form_responses'?responses:table==='share_events'?shares:[];
 const q={select(){return q;},eq(){return q;},order(){return q;},limit(){return q;},upsert(row){saving={...row,id:'synthetic-response'};return q;},async maybeSingle(){return {data:data()};},async single(){if(saving){responses.splice(0,responses.length,saving);return {data:saving};}return {data:data()};},then(resolve){return Promise.resolve({data:data()}).then(resolve);}};return q;};
Object.defineProperty(supabase,'functions',{value:{invoke:async(name,{body})=>{
 if(name==='share/status')return {data:{pending:true}};
 if(name==='share'){
  const row={id:`synthetic-share-${body.requestId}`,recipient:body.recipient,form_response_ids:body.forms.map(f=>f.id),status:'delivered',expires_at:'2026-10-10T12:00:00Z',is_revoked:false};shares.push(row);
  return {data:{id:row.id,requestId:body.requestId,emailSent:true,deliveryReceiptSaved:true}};
 }
 if(name.startsWith('share/synthetic-share-')&&name.endsWith('/revoke')){const row=shares.find(s=>name===`share/${s.id}/revoke`);if(row){row.is_revoked=true;row.status='revoked';return {data:{success:true}};}}
 return {error:new Error('External calls disabled in UI harness')};
}}});
AppRegistry.registerComponent('main',()=>()=> <SafeAreaProvider><MedicalScreen/></SafeAreaProvider>);

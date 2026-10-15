import {SelectionControl} from '../ui/AdaptiveControls';
import {AppText as Text} from '../../components/ui/AppText';
import {RecordActionButton} from '../ui/RecordActionButton';
import {NoticeBanner, useNotice} from '../ui/NoticeBanner';
import React,{useEffect,useRef,useState} from 'react';
import {View,TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from '../../lib/supabase';
import {recoverProviderImport,previewProviderImport,providerImportRequest,confirmProviderImport} from '../../lib/provider-import';

export function ProviderImportReview({receipt,colors,onImported}){
 const [preview,setPreview]=useState(null),[selected,setSelected]=useState([]),[pending,setPending]=useState(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[result,setResult]=useState(null),[ready,setReady]=useState(false);
 const {notice, showNotice, dismissNotice}=useNotice();
 const mounted=useRef(true),running=useRef(false);
 const context={supabase,storage:AsyncStorage,receipt};
 useEffect(()=>{mounted.current=true;recoverProviderImport(context).then(request=>{if(mounted.current){setPending(request);setReady(true);}}).catch(e=>{if(mounted.current)showNotice(e.message||'Import could not be verified.', 'error');});return()=>{mounted.current=false;};},[receipt.id,receipt.ownerId,showNotice]);
 async function run(action){if(running.current)return;running.current=true;setBusy(true);setMessage('');try{await action();}catch(e){if(mounted.current)showNotice(e.message||'Import could not be verified.', 'error');}finally{running.current=false;if(mounted.current)setBusy(false);}}
 const button=(label,action,disabled=false,primary=true,tone)=><RecordActionButton colors={colors} tone={tone} label={label} busy={busy} disabled={disabled} primary={primary} onPress={()=>run(action)} />;
 async function confirm(){
  const request=pending||providerImportRequest(preview,selected);setPending(request);
  const saved=await confirmProviderImport({...context,request});
  if(!mounted.current)return;
  setResult(saved);setPending(null);setPreview(null);
  const imported=saved.conditions+saved.medications+saved.allergies+saved.immunizations;
  showNotice(imported? 'Import saved.' : 'Nothing new was imported.', imported? 'success' : 'info');
  try{await onImported?.();}catch{if(mounted.current)showNotice('Import saved. Reopen Records to refresh the list.', 'info');}
 }
 const total=result?result.conditions+result.medications+result.allergies+result.immunizations:0;
 return <View style={{gap:12}}>
 {notice ? <NoticeBanner message={notice.message} tone={notice.tone} colors={colors} onDismiss={dismissNotice} /> : null}
 <Text variant="body" style={{color:colors.textPrimary,fontWeight:'700'}}>Import provider records</Text>
 {result?<Text variant="body" accessibilityLiveRegion="polite" style={{color:colors.textPrimary}}>Import complete. {total} new {total===1?'record':'records'} saved; {result.duplicates} already imported.</Text>:<>
 {pending?<><Text variant="body" style={{color:colors.textSecondary}}>A confirmed import needs its result checked. Retry the same selection to recover its receipt.</Text>{button('Check or retry import',confirm)}</>:<>
 {!preview&&button('Review available records',async()=>{const data=await previewProviderImport(context);if(!mounted.current)return;setPreview(data);setSelected(data.items.map(i=>`${i.type}:${i.index}`));},!ready)}
 {preview&&<>
 <Text variant="body" style={{color:colors.textSecondary}}>Select the records to add to your Vault. Nothing is imported until you confirm.</Text>
 {preview.items.map(item=>{const id=`${item.type}:${item.index}`,checked=selected.includes(id);return <SelectionControl key={id} colors={colors} label={item.name} description={`${item.type}${item.date?` · ${item.date}`:''}${item.status?` · ${item.status}`:''}`} checked={checked} disabled={busy} onPress={()=>setSelected(old=>checked?old.filter(x=>x!==id):[...old,id])} />;})}
 {!preview.items.length&&<Text variant="body" style={{color:colors.textSecondary}}>No records were returned by your provider.</Text>}
 {button(`Confirm import (${selected.length})`,confirm,!selected.length,true,'success')}
 {button('Cancel review',async()=>{setPreview(null);setSelected([]);},false,false)}
 </>}
 </>}
 </>}
 {busy&&<Text variant="body" style={{color:colors.textSecondary}}>Working…</Text>}
 {!!message&&<Text variant="body" accessibilityLiveRegion="polite" style={{color:colors.textPrimary}}>{message}</Text>}
 </View>;
}

import {AppField} from '../ui/AdaptiveControls';
import {AppText as Text,AppTextInput as TextInput} from '../../components/ui/AppText';
import {RecordActionButton} from '../ui/RecordActionButton';
import {NoticeBanner, useNotice} from '../ui/NoticeBanner';
import React, {useCallback,useEffect,useRef,useState} from 'react';
import {View,TouchableOpacity,Linking,AppState} from 'react-native';
import {watchProviderReturn} from '../../lib/provider-return';
import {ProviderImportReview} from './ProviderImportReview';
import {supabase} from '../../lib/supabase';
import {providerSearchPattern,startNativeProviderConnection,checkNativeProviderConnection,providerConnectionStatusMessage} from '../../lib/provider-connection';

export function ProviderConnectionForm({colors,onManual,onConnected,onImported}) {
 const [query,setQuery]=useState(''),[results,setResults]=useState([]),[selected,setSelected]=useState(null);
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[receipt,setReceipt]=useState(null);
 const {notice, showNotice, dismissNotice}=useNotice();
 const active=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;};},[]);
 const run=useCallback(async action=>{
  if(active.current||!mounted.current)return;
  active.current=true;setBusy(true);setMessage('');
  try{await action();}
  catch(e){if(mounted.current)showNotice(e.message||'Unable to complete this step. Try again.', 'error');}
  finally{active.current=false;if(mounted.current)setBusy(false);}
 },[showNotice]);
 const checkConnection=useCallback(async()=>{
  if(!receipt)return;
  const status=await checkNativeProviderConnection({receipt,supabase});
  if(!mounted.current)return;
  setReceipt({...receipt,pending:status!=='active'});
  if(status==='active'){
   showNotice(providerConnectionStatusMessage(status), 'success');
   setMessage('');
   try{await onConnected?.();}catch{
    if(mounted.current)showNotice('Provider connected. The records list could not refresh. Reopen Records to refresh it. No records were imported.', 'info');
   }
  } else if(status==='pending') setMessage(providerConnectionStatusMessage(status));
  else showNotice(providerConnectionStatusMessage(status), 'error');
 },[receipt,onConnected,showNotice]);
 useEffect(()=>{
  if(!receipt?.pending)return;
  return watchProviderReturn({appState:AppState,check:()=>run(checkConnection),onError:()=>{}});
 },[receipt?.pending,checkConnection,run]);
 async function connect(restart=false){
  const next=await startNativeProviderConnection({org:selected,supabase,openURL:url=>Linking.openURL(url),isCurrent:()=>mounted.current,restart});
  if(!mounted.current)return;
  setReceipt(next);
  if(next.existing) showNotice('You already have an active connection to this provider. Check its current status below.', 'info');
  else setMessage(next.recovered?'A pending authorization was found. Finish in your browser, then check its status. If that session is no longer available, restart authorization.':'Authorization opened in your browser. Return here after completing it.');
 }
 const button=(label,action,primary=false)=><RecordActionButton colors={colors} label={label} busy={busy} primary={primary} onPress={()=>run(action)} />;
 return <View style={{gap:14}}>
 {notice ? <NoticeBanner message={notice.message} tone={notice.tone} colors={colors} onDismiss={dismissNotice} /> : null}
 <Text variant="body" style={{color:colors.textSecondary}}>Find your provider, then authorize access in their secure portal. You may need to sign in there. Connecting does not import records automatically.</Text>
 {!selected&&<>
 <AppField colors={colors} label="Provider name" placeholder="Provider or hospital name" value={query} onChangeText={setQuery} editable={!busy} maxLength={100} />
 {button('Search providers',async()=>{setResults([]);const pattern=providerSearchPattern(query);const {data,error}=await supabase.from('provider_organizations').select('id,name,supports_direct_connection,supports_epic_connection').ilike('name',pattern).order('name').limit(20);if(error)throw Error('Provider search is unavailable. Try again.');setResults(data||[]);if(!data?.length)setMessage('No providers found. You can request records manually.');},true)}
 {results.map(org=><TouchableOpacity key={org.id} accessibilityRole="button" disabled={busy} onPress={()=>{setSelected(org);setMessage('');}} style={{padding:14,borderWidth:1,borderColor:colors.border,borderRadius:10}}><Text variant="body" style={{color:colors.textPrimary}}>{org.name}</Text></TouchableOpacity>)}
 </>}
 {selected&&<>
 <Text variant="body" style={{color:colors.textPrimary,fontWeight:'700'}}>{selected.name}</Text>
 {!receipt&&<>
 <Text variant="body" style={{color:colors.textSecondary}}>Review the permissions in your provider’s portal before approving. Return to Health Vault afterward to check the connection.</Text>
 {button('Continue to provider portal',()=>connect(),true)}
 {button('Choose another provider',async()=>{setSelected(null);})}
 </>}
 {receipt&&button('Check connection',checkConnection)}
 {receipt?.pending&&button('Restart authorization',()=>connect(true))}
 {receipt && !receipt.pending && <ProviderImportReview key={receipt.id} receipt={receipt} colors={colors} onImported={onImported} />}

 </>}
 {busy&&<Text variant="body" style={{color:colors.textSecondary}}>Working…</Text>}
 {!!message&&<Text variant="body" accessibilityLiveRegion="polite" style={{color:colors.textPrimary}}>{message}</Text>}
 <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={onManual} style={{padding:14}}><Text variant="body" style={{color:colors.accent}}>Request records manually instead</Text></TouchableOpacity>
 </View>;
}

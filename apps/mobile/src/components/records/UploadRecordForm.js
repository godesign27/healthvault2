import {SelectionControl} from '../ui/AdaptiveControls';
import {AppText as Text} from '../../components/ui/AppText';
import {RecordActionButton} from '../ui/RecordActionButton';
import React, { useRef, useState } from 'react';
import { View,  TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadPickedRecord } from '../../lib/record-upload';

const categories = [['other','Other'],['lab','Lab results'],['imaging','Imaging'],['pathology','Pathology'],['specialist_report','Specialist report']];
export function UploadRecordForm({ colors, onSaved }) {
  const [asset,setAsset] = useState(null);
  const [kind,setKind] = useState('other');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const active = useRef(false);
  async function pick() {
    if (active.current) return;
    active.current = true; setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({multiple:false, copyToCacheDirectory:true});
      if (!result.canceled) {setAsset(result.assets[0]); setMessage('');}
    } catch {setMessage('Unable to open the file picker. Please try again.');}
    finally {active.current=false;setBusy(false);}
  }
  async function save() {
    if (!asset || active.current) return;
    active.current=true;setBusy(true);setMessage('Saving…');
    try {
      const receipt=await uploadPickedRecord(asset,kind);
      setMessage(`Saved “${receipt.title}” to your Health Records.`);setAsset(null);
      // A list-refresh failure must not turn a confirmed save into an upload error.
      try {await onSaved?.();} catch {setMessage(`Saved “${receipt.title}”. Refresh your records to see it.`);}
    } catch(error) {setMessage(error.outcome === 'unknown'
      ? 'We could not confirm whether your file was saved. Retry with the same file and category to check without creating a duplicate.'
      : error.status === 401
        ? 'Sign in again before saving this file.'
        : `${error.message || 'Unable to save this file.'} You can retry with the same file and category.`);}
    finally {active.current=false;setBusy(false);}
  }
  const button={padding:12,borderRadius:10,backgroundColor:colors.accentBg};
  return <View style={{padding:16,gap:12,backgroundColor:colors.surface}}>
    <Text variant="body" style={{color:colors.textPrimary,fontWeight:'700'}}>Upload a document</Text>
    <Text variant="body" style={{color:colors.textSecondary}}>Choose a file up to 25 MB, then save it. Retrying the same file and category recovers its saved status.</Text>
    <RecordActionButton colors={colors} label={asset?.name || 'Choose file'} busy={busy} onPress={pick} />
    {asset && <View style={{gap:8}}>{categories.map(([value,label])=><SelectionControl key={value} colors={colors} kind="radio" label={label} checked={kind===value} disabled={busy} onPress={()=>setKind(value)}/>)}</View>}
    <RecordActionButton colors={colors} label={busy?'Working…':'Save file'} busy={busy} disabled={!asset} primary onPress={save} />
    {!!message && <Text variant="body" accessibilityLiveRegion="polite" style={{color:colors.textPrimary}}>{message}</Text>}
  </View>;
}

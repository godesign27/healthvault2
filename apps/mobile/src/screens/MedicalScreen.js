import * as Crypto from 'expo-crypto';
import React,{useEffect,useRef,useState} from 'react';
import {View,ScrollView,Modal,KeyboardAvoidingView,Platform,StyleSheet,AccessibilityInfo} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FORM_TEMPLATES,FORM_CATEGORY_ORDER,FORM_TEMPLATE_VERSION} from '../../../../packages/forms/catalog';
import {loadFormAutofillContext,buildAutofillAnswers} from '../../../../packages/forms/autopopulate';
import {supabase} from '../lib/supabase';
import {loadMedicalForms,saveMedicalForm,responseComplete,buildMedicalShare,sendMedicalShare,revokeMedicalShare,recoverMedicalShare,pendingMedicalShareReference} from '../lib/medical-forms';
import {AppText} from '../components/ui/AppText';
import {NoticeBanner, useNotice} from '../components/ui/NoticeBanner';
import {AppButton,AppField,SelectionControl,useAdaptiveLayout} from '../components/ui/AdaptiveControls';
import {FormSelectionRow} from '../components/forms/FormSelectionRow';
import {recordsColors} from '../theme/records';
import {space,radius} from '../theme/layout';

export default function MedicalScreen({omitShellTitle=false,scrollFabProps={},darkMode=false}){
 const colors=recordsColors(darkMode),insets=useSafeAreaInsets(),layout=useAdaptiveLayout();
 const [state,setState]=useState(null),[context,setContext]=useState(null),[selected,setSelected]=useState([]);
 const [messagePlacement,setMessagePlacement]=useState('page');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [template,setTemplate]=useState(null),[answers,setAnswers]=useState({}),[sharing,setSharing]=useState(false);
 const [shareFinished,setShareFinished]=useState(false);
 const [supportReference,setSupportReference]=useState(null);
 const [recipient,setRecipient]=useState({name:'',email:'',note:'',consent:false});
 const epoch=useRef(0),lock=useRef(false);
 const shareScroll=useRef(null);
 useEffect(()=>{
  if(!shareFinished)return;
  const frame=requestAnimationFrame(()=>shareScroll.current?.scrollTo({y:0,animated:false}));
  return()=>cancelAnimationFrame(frame);
 },[shareFinished]);
 const {notice, showNotice, dismissNotice}=useNotice();
 const say=(text,tone='info')=>{showNotice(text,tone);AccessibilityInfo.announceForAccessibility(text);};
 async function refresh(){
  const run=++epoch.current;setLoading(true);setMessagePlacement('page');
  try{const next=await loadMedicalForms(supabase);const fill=await loadFormAutofillContext(next.owner,supabase);const reference=await pendingMedicalShareReference(supabase,AsyncStorage,next.owner);if(run!==epoch.current)return;setState(next);setContext(fill);setSupportReference(reference);}
  catch{if(run===epoch.current){setMessagePlacement('page');setMessage('Unable to load Medical forms. Try again.');}}
  finally{if(run===epoch.current)setLoading(false);}
 }
 useEffect(()=>{
  refresh();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'||event==='SIGNED_IN'){
   epoch.current++;setBusy(false);setState(null);setContext(null);setAnswers({});setTemplate(null);setSelected([]);setSharing(false);setShareFinished(false);setSupportReference(null);setRecipient({name:'',email:'',note:'',consent:false});setMessage('');
   if(event==='SIGNED_IN')setTimeout(refresh,0);
  }});
  return()=>{epoch.current++;subscription.unsubscribe();};
 },[]);
 async function perform(action,placement='page'){
  if(lock.current)return;lock.current=true;setBusy(true);setMessagePlacement(placement);setMessage('');const run=epoch.current;
  try{await action(()=>run===epoch.current);}catch(error){if(run===epoch.current){
   say(error.message||'The action could not be confirmed. Try again.', 'error');
   if(state?.owner)try{const reference=await pendingMedicalShareReference(supabase,AsyncStorage,state.owner);if(run===epoch.current)setSupportReference(reference);}catch{}
  }}
  finally{lock.current=false;if(run===epoch.current)setBusy(false);}
 }
 function open(t){setAnswers({...buildAutofillAnswers(t,context),...(state.responses[t.id]?.answers_json||{})});setTemplate(t);setMessage('');}
 function review(ids){setShareFinished(false);setSelected(ids);setRecipient(r=>({...r,consent:false}));setMessage('');setSharing(true);}
 const chosen=FORM_TEMPLATES.filter(t=>selected.includes(t.id));
 const completed=state?FORM_TEMPLATES.filter(t=>responseComplete(state.responses[t.id])).length:0;
 const text=(value,variant='body')=><AppText variant={variant} style={{color:colors.textPrimary}}>{value}</AppText>;
 const action=(label,onPress,primary=false,disabled=false,tone)=> <AppButton colors={colors} label={label} onPress={onPress} primary={primary} disabled={disabled||busy} busy={busy} tone={tone}/>;
 const supportDetails=supportReference?<View style={{gap:space.sm}}>
  {text('Support reference','label')}
  <AppText selectable accessibilityLabel={`Support reference: ${supportReference}`} style={{color:colors.textPrimary}}>{supportReference}</AppText>
  {text('Press and hold the reference to copy it when contacting support. It identifies this interrupted send; it does not grant access to your forms.','secondary')}
 </View>:null;
 const feedback=message?<AppText accessibilityLiveRegion="polite" style={{color:colors.textPrimary}}>{message}</AppText>:null;
 const banner=notice?<NoticeBanner message={notice.message} tone={notice.tone} colors={colors} onDismiss={dismissNotice}/>:null;
 const modal=(visible,onClose,title,children)=> <Modal visible={visible} animationType="slide" onRequestClose={()=>{if(!busy)onClose();}}>
  <KeyboardAvoidingView accessibilityViewIsModal behavior={Platform.OS==='ios'?'padding':undefined} style={[styles.fill,{backgroundColor:colors.surface,paddingTop:insets.top,paddingBottom:insets.bottom}]}>
   <ScrollView ref={visible&&sharing?shareScroll:undefined} keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:layout.gutter,gap:space.lg}}>
    {text(title,'title')}{action('Close',onClose)}{banner}{children}{feedback}{visible&&sharing?supportDetails:null}
   </ScrollView>
  </KeyboardAvoidingView>
 </Modal>;
 return <View style={styles.fill}><ScrollView accessibilityElementsHidden={!!template||sharing} importantForAccessibility={template||sharing?'no-hide-descendants':'auto'} {...scrollFabProps} contentContainerStyle={{padding:layout.gutter,gap:space.lg,paddingBottom:insets.bottom+space.xxl}}>
  {!omitShellTitle&&text('Medical forms','page')}
  {!(template||sharing)&&banner}
  {loading?text('Loading forms…'):null}{messagePlacement==='page'?feedback:null}
  {action('Refresh forms',refresh,false,loading)}
  {state&&<>
   {text(`${completed} of ${FORM_TEMPLATES.length} forms saved`,'section')}
   {text('Review prefilled information before saving. Only saved forms can be shared.','secondary')}
   {action(`Review sharing (${selected.length})`,()=>review(selected),true,!selected.length)}
   {FORM_CATEGORY_ORDER.map(category=><View key={category} style={{gap:space.md}}>{text(category,'section')}
    {FORM_TEMPLATES.filter(t=>t.category===category).map(t=><FormSelectionRow key={t.id} colors={colors} form={{name:t.title,desc:t.description,status:responseComplete(state.responses[t.id])?'complete':'incomplete',selected:selected.includes(t.id)}}
     onSelect={()=>setSelected(old=>old.includes(t.id)?old.filter(id=>id!==t.id):[...old,t.id])} onOpen={()=>open(t)} onShare={()=>review([t.id])}/>)}
   </View>)}
   {text('Share history','section')}
   {action('Check interrupted send',()=>perform(async active=>{
    const result=await recoverMedicalShare(supabase,AsyncStorage,state.owner);const reference=await pendingMedicalShareReference(supabase,AsyncStorage,state.owner);if(!active())return;setSupportReference(reference);
    say(result.none?'No interrupted send is recorded on this device.':result.pending?'This send still has no confirmed result. No new email was sent. Check again later or contact support.':result.emailSent?'Send recovered: the email provider accepted the message.':'Send recovered: the link was created but email was not accepted.', result.emailSent?'success':result.none?'info':'error');
    if(result.id){try{const next=await loadMedicalForms(supabase);if(active())setState(next);}catch{}}
   },'history'))}
   {messagePlacement==='history'?feedback:null}
   {supportDetails}
   {!state.shares.length&&text('No shares found.','secondary')}
   {state.shares.map(s=><View key={s.id} style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
    {text(s.recipient?.email||'Recipient unavailable','label')}{text(`${s.form_response_ids?.length||0} ${(s.form_response_ids?.length||0)===1?'form':'forms'} · ${s.is_revoked||s.status==='revoked'?'revoked':s.recipient?.emailDelivery==='unknown'?'email outcome unconfirmed':s.status==='delivered'?'email accepted':s.status==='opened'?'opened':'link created'}`,'secondary')}
    {!!s.expires_at&&text(`Expires ${new Date(s.expires_at).toLocaleString()}`,'secondary')}
    {!s.is_revoked&&s.status!=='revoked'&&action('Revoke link',()=>perform(async active=>{await revokeMedicalShare(supabase,state.owner,s.id);if(!active())return;setState(old=>({...old,shares:old.shares.map(row=>row.id===s.id?{...row,is_revoked:true,status:'revoked'}:row)}));say('Link access revoked.', 'success');}),true,false,'danger')}
   </View>)}
  </>}
 </ScrollView>
 {modal(!!template,()=>setTemplate(null),template?.title||'Form',<>
  {template?.fields.map(field=><View key={field.key} style={{gap:space.sm}}>
   {field.type==='select'?<>{text(field.label,'label')}{field.options.map(option=><SelectionControl key={option} colors={colors} kind="radio" label={option} checked={answers[field.key]===option} disabled={busy} onPress={()=>setAnswers(old=>({...old,[field.key]:option}))}/>)}</>:
   <AppField colors={colors} label={field.label} value={String(answers[field.key]??'')} onChangeText={value=>setAnswers(old=>({...old,[field.key]:value}))} editable={!busy} multiline={field.type==='textarea'} keyboardType={field.type==='email'?'email-address':field.type==='tel'?'phone-pad':'default'} placeholder={field.placeholder} hint={field.type==='date'?'Use YYYY-MM-DD.':undefined}/>}
  </View>)}
  {action('Save form',()=>perform(async active=>{const saved=await saveMedicalForm(supabase,state,template.id,answers);if(!active())return;setState(old=>({...old,responses:{...old.responses,[template.id]:saved}}));say('Form saved to your Vault.', 'success');}),true,false,'success')}
 </>)}
 {modal(sharing,()=>setSharing(false),shareFinished?'Share recorded':'Review form sharing',shareFinished?<>
  {text(`Recipient: ${recipient.email}`)}
  {text('You can revoke this link from Share history.','secondary')}
 </>:<>
  {text(chosen.map(t=>t.title).join('\n'))}
  {text('This sends a read-only secure link to the recipient below. The link expires after 7 days and can be revoked from Share history.','secondary')}
  <AppField colors={colors} label="Recipient name" value={recipient.name} editable={!busy} onChangeText={name=>setRecipient(r=>({...r,name,consent:false}))}/>
  <AppField colors={colors} label="Recipient email" value={recipient.email} editable={!busy} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} onChangeText={email=>setRecipient(r=>({...r,email,consent:false}))}/>
  <AppField colors={colors} label="Note (optional)" value={recipient.note} editable={!busy} multiline onChangeText={note=>setRecipient(r=>({...r,note,consent:false}))}/>
  {!!recipient.email.trim()&&text(`Send to: ${recipient.email.trim()}`)}
  <SelectionControl colors={colors} label="I authorize sharing these saved forms with this recipient." checked={recipient.consent} disabled={busy} onPress={()=>setRecipient(r=>({...r,consent:!r.consent}))}/>
  {action('Confirm and send',()=>perform(async active=>{
   const body=buildMedicalShare(state,chosen,{...recipient,patientName:context.fullName},FORM_TEMPLATE_VERSION);
   const receipt=await sendMedicalShare(supabase,AsyncStorage,state,body,()=>Crypto.randomUUID());if(!active())return;
   setSupportReference(null);setShareFinished(true);setRecipient(r=>({...r,consent:false}));setSelected([]);
   say(receipt.emailSent?'Secure link created. The email provider accepted the message; inbox delivery is not guaranteed.':'Secure link created, but the email was not accepted. Check Share history or contact support.', receipt.emailSent?'success':'error');
   try{const next=await loadMedicalForms(supabase);if(active())setState(next);}catch{if(active())say('Share recorded, but history could not refresh. Close this review and refresh forms.', 'error');}
  }),true,!recipient.consent||!chosen.length,'success')}
 </>)}
 </View>;
}
const styles=StyleSheet.create({fill:{flex:1},card:{padding:space.lg,borderWidth:1,borderRadius:radius.card,gap:space.sm}});

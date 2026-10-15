// Injected client keeps auth and receipt rules testable without patient data.
export async function requireOwner(client,owner){
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session?.user?.id||(owner&&session.user.id!==owner))throw new Error('Your session changed. Reopen Medical forms.');
 return session.user.id;
}
export async function loadMedicalForms(client){
 const owner=await requireOwner(client);
 const {data:patient,error}=await client.from('patient_profiles').select('id').eq('user_id',owner).maybeSingle();
 if(error||!patient?.id)throw new Error('Your patient profile could not be loaded. Try again.');
 const [forms,shares]=await Promise.all([
  client.from('form_responses').select('id,template_id,answers_json,status,signed_at').eq('patient_id',patient.id),
  client.from('share_events').select('id,recipient,form_response_ids,status,sent_at,expires_at,is_revoked').eq('patient_id',owner).order('created_at',{ascending:false}),
 ]);
 if(forms.error||shares.error)throw new Error('Forms or share history could not be loaded. Try again.');
 await requireOwner(client,owner);
 return {owner,patientId:patient.id,responses:Object.fromEntries((forms.data||[]).map(r=>[r.template_id,r])),shares:shares.data||[]};
}
export async function saveMedicalForm(client,state,templateId,answers){
 await requireOwner(client,state.owner);
 // Re-resolve ownership before saving; never accept a cached patient ID alone.
 const {data:patient,error:profileError}=await client.from('patient_profiles').select('id').eq('user_id',state.owner).maybeSingle();
 if(profileError||patient?.id!==state.patientId)throw new Error('Your patient profile changed. Reload before saving.');
 const {data,error}=await client.from('form_responses').upsert({patient_id:patient.id,template_id:templateId,answers_json:answers,status:'complete',signed_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'patient_id,template_id'}).select('id,template_id,answers_json,status,signed_at').single();
 if(error||!data?.id||data.template_id!==templateId)throw new Error('Save could not be confirmed. Your entries are still here; reload to check before retrying.');
 await requireOwner(client,state.owner);
 return data;
}
export const responseComplete=r=>!!r&&(r.status==='complete'||r.status==='signed'||!!r.signed_at);
export function buildMedicalShare(state,templates,recipient,version){
 if(!recipient.consent)throw new Error('Confirm authorization before sharing.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email.trim()))throw new Error('Enter a valid recipient email.');
 if(!templates.length)throw new Error('Select saved forms to share.');
 const forms=templates.map(t=>{const r=state.responses[t.id];if(!responseComplete(r)||!r.id)throw new Error('Save every selected form before sharing.');return {id:r.id,title:t.title,version,signedAt:r.signed_at};});
 return {patientId:state.owner,forms,recipient:{displayName:recipient.name.trim(),providerName:recipient.name.trim(),email:recipient.email.trim(),method:'SecureLink',patientName:recipient.patientName||''},note:recipient.note||'',options:{package:{pdf:true,fhirBundle:true},cc:{me:false,patient:false}}};
}
export async function sendMedicalShare(client,storage,state,body,createRequestId){
 await requireOwner(client,state.owner);
 const key=`hv:medical-share-pending:${state.owner}`;
 if(await storage.getItem(key))throw new Error('A previous send has an unconfirmed outcome. Check share history or contact support before sending again.');
 // Persist only a marker, never the recipient, answers or private link.
 const requestId=createRequestId();
 await storage.setItem(key,JSON.stringify({requestId}));
 const {data,error}=await client.functions.invoke('share',{body:{...body,requestId}});
 if(error||!data?.id||data.requestId!==requestId||typeof data.emailSent!=='boolean')throw new Error('Send outcome is unknown. Check share history before sending again.');
 await requireOwner(client,state.owner);
 await storage.removeItem(key);
 return data;
}
export async function revokeMedicalShare(client,owner,id){
 await requireOwner(client,owner);
 const {data,error}=await client.functions.invoke(`share/${encodeURIComponent(id)}/revoke`,{body:{}});
 if(error||data?.success!==true)throw new Error('Revocation was not confirmed. Refresh history and try again.');
 await requireOwner(client,owner);
}

export async function recoverMedicalShare(client,storage,owner){
 await requireOwner(client,owner);
 const key=`hv:medical-share-pending:${owner}`,stored=await storage.getItem(key);
 if(!stored)return {none:true};
 let requestId;try{requestId=JSON.parse(stored).requestId;}catch{}
 if(!requestId)throw new Error('This older send has no recovery ID. Contact support before sending again.');
 const {data,error}=await client.functions.invoke('share/status',{body:{requestId}});
 if(error)throw new Error('Share status could not be checked. Try again; no email was sent by this check.');
 await requireOwner(client,owner);
 if(data?.pending)return {pending:true};
 if(!data?.id||data.requestId!==requestId||typeof data.emailSent!=='boolean')throw new Error('Share status is not confirmed. The pending send has been kept.');
 await storage.removeItem(key);
 return data;
}

// A request UUID is a diagnostic reference, never authorization or a private share link.
export async function pendingMedicalShareReference(client,storage,owner){
 await requireOwner(client,owner);
 const stored=await storage.getItem(`hv:medical-share-pending:${owner}`);
 await requireOwner(client,owner);
 if(!stored)return null;
 let id;try{id=JSON.parse(stored).requestId;}catch{}
 return typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)?id:null;
}

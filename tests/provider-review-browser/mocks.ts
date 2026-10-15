// Isolated UI acceptance only. No credentials, network calls or patient data.
let calls=0;let original='';
export const supabase={auth:{getUser:async()=>({data:{user:{id:'test-owner'}}})},functions:{invoke:async(_name:string,{body}:any)=>{
 calls++;const payload=JSON.stringify(body);if(calls===1)original=payload;else if(original!==payload)throw Error('Retry selection changed');
 document.querySelector('#evidence')!.textContent=`Confirmation attempts: ${calls}. Identical selection: ${payload===original}. Simulated committed records: 1.`;
 if(calls===1)return {error:Error('Injected lost response'),data:null};
 return {error:null,data:{status:'complete',importJobId:'test-job',conditions:1,medications:0,allergies:0,immunizations:0,duplicates:0}};
}}};
export const resolveProviderRecordConnection=async()=>({success:true,data:{strategy:'existing_connection',providerOrganization:{id:'org',name:'Synthetic UI Provider'},existingConnection:{id:'connection',lastSyncedAt:null}}});
export const searchProviderOrganizations=async()=>({success:true,data:{organizations:[]}});
export const fetchProviderRecordPreview=async()=>({success:true,data:{importJobId:'test-job',itemsByType:{condition:[{name:'Synthetic review condition',date:'2020-01-01',source:'Synthetic UI Provider',status:'Active'}]}}});
export const startProviderConnection=async()=>{throw Error('Unexpected portal launch');};
export const startEpicConnection=startProviderConnection;

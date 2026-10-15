export const validRequestId=(id:unknown):id is string=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export async function shareFingerprint(value:unknown){
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
 return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
// The unique DB key, rather than a check-then-insert, arbitrates concurrent requests.
export async function claimShareRequest(db:any,owner:string,id:string,hash:string){
 const {error}=await db.from('medical_share_requests').insert({owner_id:owner,request_id:id,payload_hash:hash});
 if(!error)return {claimed:true};
 if(error.code!=='23505')throw new Error('Could not reserve share request');
 const {data,error:readError}=await db.from('medical_share_requests').select('payload_hash,receipt').eq('owner_id',owner).eq('request_id',id).maybeSingle();
 if(readError||!data)throw new Error('Share request could not be checked');
 if(data.payload_hash!==hash)return {claimed:false,conflict:true};
 return {claimed:false,receipt:data.receipt};
}

// Internal evidence only: never expose these fields through the patient status response.
export async function recordShareProgress(db:any,owner:string,id:string,progress:{
 share_event_id?:string; email_attempt_started_at?:string;
 provider_message_id?:string|null; provider_accepted_at?:string;
}){
 const {data,error}=await db.from('medical_share_requests').update(progress)
  .eq('owner_id',owner).eq('request_id',id).select('request_id').maybeSingle();
 if(error||data?.request_id!==id)throw new Error('Share progress could not be recorded');
}

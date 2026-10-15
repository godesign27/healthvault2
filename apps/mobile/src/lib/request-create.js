export function validateRecordRequest(input){
 const types=['lab','imaging','pathology','specialist_report','other'];
 const body={providerName:input.providerName?.trim(),providerEmail:input.providerEmail?.trim(),doctorName:input.doctorName?.trim()||'',
  recordTypes:[...new Set(input.recordTypes||[])].sort(),urgency:input.urgency||'routine',message:input.message?.trim()||''};
 if(!body.providerName||body.providerName.length>200)throw Error('Enter the provider or facility name.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.providerEmail||'')||body.providerEmail.length>254)throw Error('Enter a valid provider email.');
 if(!body.recordTypes.length||body.recordTypes.some(t=>!types.includes(t)))throw Error('Select the records to request.');
 if(!['routine','urgent'].includes(body.urgency)||body.message.length>4000||body.doctorName.length>200)throw Error('Review the request details and shorten any long message.');
 return body;
}
export async function createRecordRequest({input,getSession,storage,digest,baseUrl,anonKey,fetchImpl=fetch}){
 const body=validateRecordRequest(input),session=await getSession();
 if(!session?.user?.id||!session.access_token)throw Error('Sign in before sending a request.');
 const key='hv:request-create:'+await digest(JSON.stringify([session.user.id,body]));
 if(await storage.getItem(key))throw Error('This request may already have been created. Check your request list before contacting support about a retry.');
 await storage.setItem(key,'pending');if(await storage.getItem(key)!=='pending')throw Error('Unable to retain request status. Nothing was sent.');
 const current=await getSession();if(current?.user?.id!==session.user.id){await storage.removeItem(key);throw Error('Your account changed. Review the request again.');}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);let res;
 try{res=await fetchImpl(`${baseUrl}/functions/v1/record-request`,{method:'POST',headers:{Authorization:`Bearer ${current.access_token}`,apikey:anonKey,'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});}
 catch{throw Error('Request status is unknown. Check your requests before sending again.');}finally{clearTimeout(timer);}
 const result=await res.json().catch(()=>null);
 if([400,401,403].includes(res.status)){await storage.removeItem(key);throw Error('The request was rejected. Review your details and sign-in status.');}
 if(!res.ok||typeof result?.id!=='string'||!/^[0-9a-f-]{36}$/i.test(result.id)||typeof result.emailSent!=='boolean')throw Error('Request status is unknown. Check your requests before sending again.');
 // Keep a receipt for identical input; use Resend on that request instead of creating duplicates.
 await storage.setItem(key,result.id);
 return {id:result.id,emailAccepted:result.emailSent};
}

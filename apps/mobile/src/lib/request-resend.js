// Keep uncertain sends blocked across app restarts; this endpoint has no durable send receipt.
export async function resendRecordRequest({requestId,getSession,storage,baseUrl,anonKey,fetchImpl=fetch}) {
 const session=await getSession();
 if(!session?.user?.id||!session.access_token)throw Error('Sign in before resending.');
 if(!/^[0-9a-f-]{36}$/i.test(requestId))throw Error('Invalid request.');
 const key=`hv:request-resend:${session.user.id}:${requestId}`;
 if(await storage.getItem(key))throw Error('A previous resend has an unknown outcome. Check its delivery before sending again.');
 await storage.setItem(key,'pending');
 if(await storage.getItem(key)!=='pending')throw Error('Unable to retain resend status. No email was requested.');
 const current=await getSession();
 if(current?.user?.id!==session.user.id){await storage.removeItem(key);throw Error('Your account changed. Review the request again.');}
 let response;
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),30000);
 try{
  response=await fetchImpl(`${baseUrl}/functions/v1/record-request/${requestId}/resend`,{
   method:'POST',headers:{Authorization:`Bearer ${current.access_token}`,apikey:anonKey,'Content-Type':'application/json'},
   body:'{}',signal:controller.signal});
 }catch{throw Error('Resend status is unknown. Do not send again until delivery has been checked.');}
 finally{clearTimeout(timer);}
 const body=await response.json().catch(()=>null);
 if([400,401,403,404].includes(response.status)){
  await storage.removeItem(key);throw Error('This request could not be resent. Refresh your requests and sign-in status.');
 }
 if(!response.ok||body?.id!==requestId||typeof body.emailSent!=='boolean')throw Error('Resend status is unknown. Check delivery before sending again.');
 await storage.removeItem(key);
 return {emailAccepted:body.emailSent};
}

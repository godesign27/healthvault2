// Cancellation is idempotent on the server; a lost response can safely be retried.
export async function cancelRecordRequest({requestId,getSession,baseUrl,anonKey,fetchImpl=fetch,timeoutMs=30000}) {
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId||''))throw Error('Invalid request.');
 const session=await getSession();
 if(!session?.user?.id||!session.access_token)throw Error('Sign in before cancelling a request.');
 const controller=new AbortController();let timer;
 let response,result;
 try {
  const operation=(async()=>{
   const res=await fetchImpl(`${baseUrl}/functions/v1/record-request/${requestId}/cancel`,{
    method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,apikey:anonKey},signal:controller.signal,
   });
   return {response:res,result:await res.json().catch(()=>null)};
  })();
  // Include response-body reading in the deadline, even if the native transport
  // does not reject its pending promise when AbortController fires.
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'));},timeoutMs);});
  ({response,result}=await Promise.race([operation,deadline]));
 } catch {throw Error('Cancellation status is unknown. Refresh your requests or retry cancellation.');}
 finally {clearTimeout(timer);}
 if((await getSession())?.user?.id!==session.user.id)throw Error('Your account changed. Refresh your requests.');
 if(response.status===409)throw Error('This request is already closed and cannot be cancelled.');
 if(!response.ok||result?.id!==requestId||result?.status!=='cancelled')throw Error('Cancellation was not confirmed. Refresh your requests before retrying.');
 return result;
}

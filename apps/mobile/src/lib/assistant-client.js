export async function requestAssistant({message, history=[], page, getSession, baseUrl, anonKey, signal, fetchImpl=fetch}) {
  const session=await getSession();
  if (!session?.access_token || !session.user?.id) throw new Error('Sign in to use the assistant.');
  const headers={Authorization:`Bearer ${session.access_token}`,apikey:anonKey,'Content-Type':'application/json','X-Platform':'mobile'};
  const endpoint=`${baseUrl}/functions/v1/ai-health-assistant`;
  // An older deployment must never silently ignore the read-only restriction.
  const capability=await fetchImpl(endpoint,{headers,signal});
  if(!capability.ok || (await capability.json()).mobileReadOnlyVersion!==1) throw new Error('Mobile chat is awaiting its backend update. Please use the web assistant for now.');
  const current=await getSession();
  if(current?.user?.id!==session.user.id) throw new Error('Your account changed. Start a new conversation.');
  const response=await fetchImpl(endpoint,{method:'POST',signal,headers:{...headers,Authorization:`Bearer ${current.access_token}`},
    body:JSON.stringify({message,page,readOnly:true,conversationHistory:history.slice(-20).map(({role,content})=>({role,content}))})});
  const body=await response.json().catch(()=>({}));
  if(!response.ok || body.error) throw new Error('The assistant could not complete this request. Please try again.');
  if(typeof body.message!=='string' || !body.message.trim()) throw new Error('The assistant returned no answer. Please try again.');
  const after=await getSession();
  if(after?.user?.id!==session.user.id) throw new Error('Your account changed. Start a new conversation.');
  return body.message;
}

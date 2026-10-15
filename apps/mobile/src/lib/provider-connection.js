export function providerSearchPattern(query) {
 const text=query.trim();
 if(text.length<2||text.length>100)throw Error('Enter a provider name between 2 and 100 characters.');
 return `%${text.replace(/[\\%_]/g,'\\$&')}%`;
}
export async function startNativeProviderConnection({org,supabase,openURL,isCurrent=()=>true,restart=false}) {
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.user?.id)throw Error('Sign in before connecting a provider.');
 const {data:existing,error:lookupError}=await supabase.from('provider_connections').select('id').eq('user_id',session.user.id).eq('provider_organization_id',org.id).eq('status','active').limit(1).maybeSingle();
 if(lookupError)throw Error('Unable to check existing connections. Try again.');
 if((await supabase.auth.getSession()).data.session?.user?.id!==session.user.id)throw Error('Your account changed. Close this screen and try again.');
 if(existing?.id)return {id:existing.id,ownerId:session.user.id,existing:true};
 if(!restart){
  const {data:pending,error:pendingError}=await supabase.from('provider_connections').select('id').eq('user_id',session.user.id).eq('provider_organization_id',org.id).eq('status','pending').order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(pendingError)throw Error('Unable to check pending connections. Try again.');
  if((await supabase.auth.getSession()).data.session?.user?.id!==session.user.id)throw Error('Your account changed. Close this screen and try again.');
  if(pending?.id)return {id:pending.id,ownerId:session.user.id,pending:true,recovered:true};
 }
 if(!isCurrent())throw Error('Connection screen was closed.');
 const method=org.supports_direct_connection?'direct_provider_connection':org.supports_epic_connection?'epic_connection':null;
 if(!method)throw Error('This provider does not support a digital connection. Use Request Manually instead.');
 const {data,error}=await supabase.functions.invoke('fhir-oauth-start',{body:{providerOrganizationId:org.id,connectionMethod:method}});
 if(error||data?.status!=='authorizing'||!data.connectionId)throw Error('Unable to start this provider connection. You can retry or request records manually.');
 if((await supabase.auth.getSession()).data.session?.user?.id!==session.user.id)throw Error('Your account changed. Close this screen and try again.');
 let url;
 try{url=new URL(data.launchUrl);}catch{throw Error('The provider returned an invalid authorization link.');}
 if(url.protocol!=='https:'||url.username||url.password)throw Error('The provider returned an unsafe authorization link.');
 if(!isCurrent())throw Error('Connection screen was closed.');
 await openURL(url.href);
 return {id:data.connectionId,ownerId:session.user.id,pending:true};
}
export async function checkNativeProviderConnection({receipt,supabase}) {
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.user?.id||session.user.id!==receipt.ownerId)throw Error('Your account changed. Close this screen and try again.');
 const {data,error}=await supabase.from('provider_connections').select('status').eq('id',receipt.id).eq('user_id',session.user.id).maybeSingle();
 if((await supabase.auth.getSession()).data.session?.user?.id!==receipt.ownerId)throw Error('Your account changed. Close this screen and try again.');
 if(error||!data)throw Error('Unable to verify the connection. Please try again.');
 return data.status;
}

export function providerConnectionStatusMessage(status) {
 if(status==='active')return 'Provider connected. This check did not import any records.';
 if(status==='pending')return 'Authorization is still pending. Finish in your browser, or restart authorization if that session is no longer available.';
 return 'This connection is no longer active. Start a new authorization to reconnect your provider.';
}

// Build a temporary preview deployment from the real handler. Never deploy to production.
export function withPreviewEmailSink(source,owner){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(owner))throw Error('Synthetic owner UUID required');
 const anchors = [
  ["const resendApiKey = Deno.env.get('RESEND_API_KEY');",1],
  ['Deno.serve(',1],
  ['  const supabase = createClient(supabaseUrl, supabaseKey);',1],
  ["await fetch('https://api.resend.com/emails'",2],
 ];
 for(const [anchor,count] of anchors)if(source.split(anchor).length-1!==count)throw Error('Handler changed; inspect sink adapter before deployment');
 const helper=`
async function previewEmailSink(url:any,init:any){
 if(url!=='https://api.resend.com/emails')throw new Error('Unexpected sink destination');
 const body=JSON.parse(init.body),recipient=body.to?.[0];
 if(body.to?.length!==1||!['accepted@example.invalid','lost@example.invalid','server-error@example.invalid'].includes(recipient))throw new Error('Only synthetic sink recipients allowed');
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const id=crypto.randomUUID();
 const {error}=await db.from('_medical_share_test_sink').insert({id,owner_id:'${owner}',scenario:recipient.split('@')[0]});
 if(error)throw new Error('Sink could not record dispatch');
 await new Promise(resolve=>setTimeout(resolve,500));
 if(recipient==='lost@example.invalid')throw new Error('Synthetic lost response after acceptance');
 return new Response(JSON.stringify({id}),{status:recipient==='server-error@example.invalid'?503:200});
}
`;
 const guard=`
  if(supabaseUrl!=='https://roeudwddxvniazwufdqf.supabase.co')throw new Error('Preview project required');
  const {data:{user:sinkUser}}=await supabase.auth.getUser((req.headers.get('Authorization')||'').replace(/^Bearer /,''));
  if(sinkUser?.id!=='${owner}')return new Response('Synthetic test owner required',{status:403});
  if(new URL(req.url).pathname.endsWith('/__test_ready'))return new Response(JSON.stringify({sink:true,project:'roeudwddxvniazwufdqf'}),{headers:{'Content-Type':'application/json'}});
  if(new URL(req.url).pathname.endsWith('/__test_cleanup')){
   const {data:rows,error}=await supabase.from('share_events').select('id').eq('patient_id',sinkUser.id);
   if(error)return new Response('Could not list fixtures',{status:500});
   const paths=(rows||[]).flatMap(row=>[row.id+'/bundle.json',row.id+'/packet.pdf']);
   if(paths.length){const {error:removeError}=await supabase.storage.from('shares').remove(paths);if(removeError)return new Response('Could not remove fixtures',{status:500});}
   const {data:dispatches,error:sinkError}=await supabase.from('_medical_share_test_sink').select('id,scenario').eq('owner_id',sinkUser.id);
   const {data:claims,error:claimError}=await supabase.from('medical_share_requests').select('share_event_id,email_attempt_started_at,provider_message_id,provider_accepted_at,receipt').eq('owner_id',sinkUser.id);
   if(sinkError||claimError)return new Response('Could not inspect sink evidence',{status:500});
   return new Response(JSON.stringify({removed:paths.length,dispatches,claims}),{headers:{'Content-Type':'application/json'}});
  }
`;
 return source.replace("const resendApiKey = Deno.env.get('RESEND_API_KEY');","const resendApiKey = 'synthetic-sink-only';").replace('Deno.serve(',helper+'\nDeno.serve(')
 .replace('  const supabase = createClient(supabaseUrl, supabaseKey);','  const supabase = createClient(supabaseUrl, supabaseKey);'+guard)
 .replaceAll("await fetch('https://api.resend.com/emails'","await previewEmailSink('https://api.resend.com/emails'");
}

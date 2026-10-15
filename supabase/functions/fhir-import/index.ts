import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { requireVerifiedUser, ImportAccessError } from "../inbound-records/access.ts";
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Authorization, Apikey, Content-Type, X-Client-Info","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try{
  const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const userId=await requireVerifiedUser(sb,req);
  const body=await req.json().catch(()=>null);
  if(body?.confirmed!==true||typeof body?.importJobId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.importJobId)||!body?.selection||typeof body.selection!=='object')return json({error:'A reviewed preview and explicit confirmation are required.'},400);
  const {data,error}=await sb.rpc('confirm_fhir_preview',{p_user_id:userId,p_job_id:body.importJobId,p_selection:body.selection});
  if(error||!data)return json({error:'Import could not be confirmed. Retry the same selection, or reload the provider preview.'},409);
  return json(data);
 }catch(error){
  if(error instanceof ImportAccessError)return json({error:error.message},error.status);
  return json({error:'Import status could not be verified. Retry the same selection.'},503);
 }
});

const types=['condition','medication','allergy','immunization'];
const key=receipt=>`hv:fhir-import:${receipt.ownerId}:${receipt.id}`;
async function owner(supabase,receipt){
 if((await supabase.auth.getSession()).data.session?.user?.id!==receipt.ownerId)throw Error('Your account changed. Close this screen and sign in again.');
}
async function invoke(supabase,name,body){
 let timer;
 try{return await Promise.race([supabase.functions.invoke(name,{body}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('The request timed out. Check or retry this import.')),30000);})]);}
 finally{clearTimeout(timer);}
}
export async function recoverProviderImport({supabase,storage,receipt}){
 await owner(supabase,receipt);
 const raw=await storage.getItem(key(receipt));await owner(supabase,receipt);
 if(!raw)return null;
 const request=JSON.parse(raw);
 if(!request.importJobId||request.confirmed!==true||!request.selection||Object.keys(request.selection).some(t=>!types.includes(t))||Object.values(request.selection).some(a=>!Array.isArray(a)||a.some(i=>!Number.isInteger(i)||i<0)))throw Error('Saved import recovery is unavailable. Reopen Records before continuing.');
 return request;
}
export async function previewProviderImport({supabase,storage,receipt}){
 if(await recoverProviderImport({supabase,storage,receipt}))throw Error('Check the previous import before loading another preview.');
 const {data,error}=await invoke(supabase,'fhir-sync',{connectionId:receipt.id});
 await owner(supabase,receipt);
 if(error||data?.source!=='fhir'||!data.importJobId||!data.itemsByType)throw Error('Provider records are unavailable. Try again.');
 const items=[];
 for(const type of types){
  const group=data.itemsByType[type]??[];
  if(!Array.isArray(group))throw Error('Provider returned an invalid preview.');
  group.forEach((item,index)=>{if(typeof item?.name!=='string')throw Error('Provider returned an invalid record.');items.push({type,index,name:item.name,date:item.date,status:item.status});});
 }
 return {importJobId:data.importJobId,items};
}
export function providerImportRequest(preview,selected){
 const selection=Object.fromEntries(types.map(t=>[t,preview.items.filter(i=>i.type===t&&selected.includes(`${t}:${i.index}`)).map(i=>i.index)]));
 if(!Object.values(selection).some(a=>a.length))throw Error('Select at least one record to import.');
 return {importJobId:preview.importJobId,selection,confirmed:true};
}
export async function confirmProviderImport({supabase,storage,receipt,request}){
 await owner(supabase,receipt);
 const previous=await recoverProviderImport({supabase,storage,receipt});
 if(previous&&JSON.stringify(previous)!==JSON.stringify(request))throw Error('Retry the previously confirmed selection first.');
 await storage.setItem(key(receipt),JSON.stringify(request));
 await owner(supabase,receipt);
 const {data,error}=await invoke(supabase,'fhir-import',request);
 await owner(supabase,receipt);
 if(error||data?.status!=='complete'||data.importJobId!==request.importJobId||!['conditions','medications','allergies','immunizations','duplicates'].every(k=>Number.isInteger(data[k])&&data[k]>=0))throw Error('Import status is not verified. Retry the same selection; completed imports will not be duplicated.');
 // A local cleanup failure must not negate the server's completed receipt.
 try{await storage.removeItem(key(receipt));}catch{}
 return data;
}

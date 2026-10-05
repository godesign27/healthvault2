import { supabase } from '../supabase';
interface ImportData {
 importJobId: string;
 conditions: { unique: { previewIndex: number }[] };
 medications: { unique: { previewIndex: number }[] };
 allergies: { unique: { previewIndex: number }[] };
 immunizations: { unique: { previewIndex: number }[] };
}
// Only selected indexes leave the review. The server reads clinical values from
// its saved preview and returns the same durable receipt on a repeated confirmation.
export async function importMedicalRecords(data: ImportData) {
 if(!data.importJobId)throw Error('Reload your provider preview before importing.');
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)throw Error('Sign in before importing records.');
 const selection: Record<string, number[]>=Object.fromEntries([
  ['condition',data.conditions],['medication',data.medications],
  ['allergy',data.allergies],['immunization',data.immunizations],
 ].map(([type,group])=>[type,(group as ImportData['conditions']).unique.map(item=>{
  if(!Number.isInteger(item.previewIndex)||item.previewIndex<0)throw Error('Reload your provider preview before importing.');
  return item.previewIndex;
 })]));
 const selectedCount=Object.values(selection).reduce((total,indexes)=>total+new Set(indexes).size,0);
 if(selectedCount===0||selectedCount>2000)throw Error('Select between 1 and 2000 records before importing.');
 const {data:receipt,error}=await supabase.functions.invoke('fhir-import',{body:{importJobId:data.importJobId,selection,confirmed:true}});
 if(error||receipt?.status!=='complete'||receipt.importJobId!==data.importJobId||!['conditions','medications','allergies','immunizations','duplicates'].every(key=>Number.isInteger(receipt[key])&&receipt[key]>=0))throw Error('Import status could not be verified. Retry the same selection; completed imports will not be duplicated.');
 if(receipt.conditions+receipt.medications+receipt.allergies+receipt.immunizations+receipt.duplicates!==selectedCount)throw Error('Import status could not be verified. Retry the same selection; completed imports will not be duplicated.');
 return receipt as {conditions:number;medications:number;allergies:number;immunizations:number;duplicates:number;status:'complete'};
}

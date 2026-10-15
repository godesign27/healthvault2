import { fhirReturnUrl } from './fhir-return.ts';
Deno.test('OAuth completion uses a fixed same-origin route',()=>{
 const base='https://healthvault.me';
 if(fhirReturnUrl(base).href!==base+'/connect/fhir/complete')throw Error('Unexpected default');
 if(fhirReturnUrl(base,'/connect/fhir/complete').href!==base+'/connect/fhir/complete')throw Error('Unexpected allowed route');
 for(const target of ['https://evil.example/connect/fhir/complete','//evil.example','javascript:alert(1)','https://user:pass@healthvault.me/connect/fhir/complete','/connect/fhir/complete?next=evil','/connect/fhir/complete#token','/dashboard']){
  let rejected=false;try{fhirReturnUrl(base,target);}catch{rejected=true;}if(!rejected)throw Error('Unsafe return accepted');
 }
});

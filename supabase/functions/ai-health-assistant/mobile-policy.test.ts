import {toolAllowed} from './mobile-policy.ts';
Deno.test('mobile tools fail closed for writes and unknown tools',()=>{
 for(const name of ['saveFormAnswers','shareForm','deleteHealthRecordRequest','updateMedicalProfile','newFutureTool'])if(toolAllowed(name,true))throw Error(name);
 for(const name of ['getHealthRecords','getMedications','getMedicalHistory'])if(!toolAllowed(name,true))throw Error(name);
});

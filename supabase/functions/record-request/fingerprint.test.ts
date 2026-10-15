import { requestFileFingerprint } from './fingerprint.ts';
Deno.test('identity is stable for decoded bytes and changes for metadata/content', async () => {
 const r={kind:'other',title:'Health Record',file_name:'fixture.png',file_type:'png',notes:null};
 const bytes=new Uint8Array([1,2,3]);
 const a=await requestFileFingerprint(r,bytes,'image/png');
 if(a!==await requestFileFingerprint({...r},bytes.slice(),'image/png'))throw new Error('Unstable');
 for(const b of [await requestFileFingerprint({...r,notes:'updated'},bytes,'image/png'),
 await requestFileFingerprint(r,new Uint8Array([4]),'image/png'),
 await requestFileFingerprint(r,bytes,'application/pdf')])if(a===b)throw new Error('Collision');
});

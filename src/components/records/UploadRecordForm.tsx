import { useRef, useState } from 'react';
import { uploadRecord } from '../../lib/records/query';
import type { HealthRecord } from '../../lib/records/types';
import type { UploadInput } from '../../lib/records/zod';

export function UploadRecordForm({ onSaved }: { onSaved: (record: HealthRecord) => void }) {
  const [file,setFile]=useState<File|null>(null);
  const [kind,setKind]=useState<NonNullable<UploadInput['kind']>>('OTHER');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [failed,setFailed]=useState(false);
  const input=useRef<HTMLInputElement>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if(!file || busy)return;
    setBusy(true);setMessage('');setFailed(false);
    try {
      const record=await uploadRecord({file,fileName:file.name,kind});
      setMessage(`Saved “${record.title}” to your Health Records.`);
      setFile(null);if(input.current)input.current.value='';onSaved(record);
    } catch(error) {
      setFailed(true);setMessage(error instanceof Error?error.message:'Upload status is unknown. Retry the same file to recover its status.');
    } finally {setBusy(false);}
  }
  return <form onSubmit={submit} className="mb-6 p-5 rounded-xl border border-stroke-default bg-surface-elevated text-content-primary" aria-label="Upload health record">
    <h2 className="text-lg font-semibold mb-2">Upload a document</h2>
    <p className="text-sm text-content-secondary mb-4">Choose a file up to 25 MB. If the connection is interrupted, select the same file and category to recover its saved status.</p>
    <fieldset disabled={busy} className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm">File
        <input ref={input} type="file" required onChange={e=>{setFile(e.target.files?.[0]??null);setMessage('');}} className="max-w-full" />
      </label>
      <label className="flex flex-col gap-1 text-sm">Category
        <select value={kind} onChange={e=>setKind(e.target.value as typeof kind)} className="p-2 rounded-lg border border-stroke-default bg-surface-elevated">
          <option value="OTHER">Other</option><option value="LAB">Lab results</option><option value="IMAGING">Imaging</option><option value="PATHOLOGY">Pathology</option><option value="SPECIALIST_REPORT">Specialist report</option>
        </select>
      </label>
      <button type="submit" disabled={!file || busy} className="px-4 py-2 rounded-lg bg-action-primary text-content-on-action disabled:opacity-50">{busy?'Saving…':'Save file'}</button>
    </fieldset>
    {message && <p role={failed?'alert':'status'} className="mt-4 text-sm text-content-primary">{message}</p>}
  </form>;
}

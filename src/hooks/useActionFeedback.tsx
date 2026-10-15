import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Toast } from '../components/Toast';
import { Dialog } from '../components/ui/Dialog';


type Notice = { id: string; message: string; type: 'success' | 'error' | 'info' };
let noticeSequence = 0;

/** Shared presentation only: callers retain their existing data and mutation logic. */
export function useActionFeedback() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const closeNotice = useCallback((id?: string) => setNotice(current => id === undefined || current?.id === id ? null : current), []);
  const notify = useCallback((message: string, type: Notice['type'] = 'success') => {
    setNotice({ id: `action-result-${++noticeSequence}`, message, type });
  }, []);
  const [question, setQuestion] = useState<string | null>(null);
  const pending = useRef<((confirmed: boolean) => void) | null>(null);
  const acting = useRef(false);
  const confirmAction = useCallback((message: string) => {
    if (pending.current) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => { pending.current = resolve; setQuestion(message); });
  }, []);
  const runConfirmed = useCallback(async (message: string, action: () => Promise<void>) => {
    if (acting.current) return;
    acting.current = true;
    try { if (await confirmAction(message)) await action(); }
    finally { acting.current = false; }
  }, [confirmAction]);
  const answer = useCallback((confirmed: boolean) => {
    const resolve = pending.current;
    pending.current = null;
    setQuestion(null);
    resolve?.(confirmed);
  }, []);
  useEffect(() => () => { pending.current?.(false); pending.current = null; }, []);
  const feedback = <>
    {notice && createPortal(<div className="fixed right-4 top-4 z-[100] w-max max-w-[calc(100vw-2rem)]" role={notice.type === 'error' ? 'alert' : 'status'}><Toast key={notice.id} {...notice} onClose={closeNotice} /></div>, document.body)}
    <Dialog isOpen={question !== null} onClose={() => answer(false)} title="Confirm action" showIcon footerContent={<><button type="button" className="rounded-lg border border-stroke-default px-4 py-2 text-content-primary" onClick={() => answer(false)}>Cancel</button><button type="button" className="rounded-lg bg-action-primary px-4 py-2 text-content-on-action" onClick={() => answer(true)}>Confirm</button></>}><p className="text-content-secondary">{question}</p></Dialog>
  </>;
  return { notify, runConfirmed, feedback };
}

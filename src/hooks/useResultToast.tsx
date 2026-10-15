import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Toast } from '../components/Toast';

type ResultNotice = { id: string; message: string; type: 'success' | 'error' | 'info' };

/** Action outcomes use the website's existing, timed Toast. Page data stays with callers. */
export function useResultToast() {
  const [notice, setNotice] = useState<ResultNotice | null>(null);
  const close = useCallback((id: string) => setNotice(current => current?.id === id ? null : current), []);
  const notify = useCallback((message: string, type: ResultNotice['type'] = 'success') => {
    setNotice({ id: crypto.randomUUID(), message, type });
  }, []);
  const feedback = notice ? createPortal(
    <div className="fixed right-4 top-4 z-[100] w-max max-w-[calc(100vw-2rem)]" role={notice.type === 'error' ? 'alert' : 'status'}>
      <Toast key={notice.id} {...notice} onClose={close} />
    </div>, document.body,
  ) : null;
  return { notify, feedback };
}

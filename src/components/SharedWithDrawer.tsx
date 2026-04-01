import { useState } from 'react';
import { Drawer } from './ui/Drawer';
import { Button } from './ui/Button';
import { FileText, Mail, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export type SharedFormEvent = {
  id: string;
  formTitle: string;
  recipientName: string;
  recipientEmail?: string;
  sharedDate: string;
  status: 'sent' | 'delivered' | 'opened' | 'revoked' | 'expired';
  method: 'SecureLink' | 'Direct' | 'FHIR';
};

export function SharedWithDrawer({
  open,
  onOpenChange,
  sharedForms,
  onRevoke,
  darkMode = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sharedForms: SharedFormEvent[];
  onRevoke?: (eventId: string) => Promise<void>;
  darkMode?: boolean;
}) {
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRevoke = async (eventId: string) => {
    if (!onRevoke) return;

    setRevokingId(eventId);
    setError(null);
    try {
      await onRevoke(eventId);
    } catch (e: any) {
      setError(e.message || 'Failed to revoke access');
    } finally {
      setRevokingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return darkMode ? 'text-blue-400' : 'text-blue-600';
      case 'delivered':
        return darkMode ? 'text-indigo-400' : 'text-indigo-600';
      case 'opened':
        return darkMode ? 'text-emerald-400' : 'text-emerald-600';
      case 'revoked':
        return darkMode ? 'text-red-400' : 'text-red-600';
      case 'expired':
        return darkMode ? 'text-amber-400' : 'text-amber-600';
      default:
        return darkMode ? 'text-stone-400' : 'text-stone-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'opened':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'revoked':
        return <XCircle className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <Drawer
      isOpen={open}
      onClose={() => onOpenChange(false)}
      position="right"
      size="large"
      title="Shared With"
      className={`${darkMode ? 'bg-stone-900' : 'bg-white'} !max-w-2xl !w-full`}
    >
      <div className="space-y-4">
        {sharedForms.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No forms have been shared yet</p>
          </div>
        ) : (
          <>
            <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              {sharedForms.length} {sharedForms.length === 1 ? 'form' : 'forms'} shared
            </p>

            {error && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  darkMode
                    ? 'bg-red-900/20 text-red-400 border border-red-800'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              {sharedForms.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-lg border p-4 ${
                    darkMode
                      ? 'border-stone-700 bg-stone-800'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-stone-700' : 'bg-indigo-50'}`}>
                        <FileText className={`w-4 h-4 ${darkMode ? 'text-stone-400' : 'text-indigo-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                          {event.formTitle}
                        </h3>
                        <div className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-600'} space-y-0.5`}>
                          <div>Shared with: <span className="font-medium">{event.recipientName}</span></div>
                          {event.recipientEmail && (
                            <div className="truncate">{event.recipientEmail}</div>
                          )}
                          <div>Date: {new Date(event.sharedDate).toLocaleDateString()} at {new Date(event.sharedDate).toLocaleTimeString()}</div>
                          <div>Method: <span className="font-medium">{event.method}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)}
                      <span className="capitalize">{event.status}</span>
                    </div>

                    {event.status !== 'revoked' && event.status !== 'expired' && (
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleRevoke(event.id)}
                        disabled={revokingId === event.id}
                        className={darkMode ? 'border-stone-700 text-stone-300' : ''}
                      >
                        {revokingId === event.id ? 'Revoking...' : 'Revoke'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

import { useState, useEffect } from 'react';
import { X, FileText, Share2, Sparkles, ExternalLink } from 'lucide-react';
import { HealthRecord } from '../../lib/records/types';
import { ShareInput } from '../../lib/records/zod';
import { shareRecord } from '../../lib/records/query';

interface DocumentViewerProps {
  record: HealthRecord | null;
  darkMode?: boolean;
  onClose: () => void;
  onRequestInsight?: (recordId: string) => void;
}

export function DocumentViewer({ record, darkMode = false, onClose, onRequestInsight }: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'document' | 'insights'>('summary');
  const [showShareFlow, setShowShareFlow] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareHours, setShareHours] = useState(72);
  const [shareSuccess, setShareSuccess] = useState(false);
  const isOpen = !!record;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!record) return null;

  const handleShare = async () => {
    if (!shareEmail) return;

    const input: ShareInput = {
      recordId: record.id,
      recipientEmail: shareEmail,
      message: shareMessage || undefined,
      expiresInHours: shareHours
    };

    await shareRecord(input);
    setShareSuccess(true);
    setTimeout(() => {
      setShareSuccess(false);
      setShareEmail('');
      setShareMessage('');
      setShowShareFlow(false);
    }, 3000);
  };

  const handleShareClick = () => {
    setShowShareFlow(true);
    setActiveTab('summary');
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-300 z-40"
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-full max-w-2xl shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${darkMode ? 'bg-stone-900' : 'bg-white'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-stone-700' : 'border-stone-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            {record.title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-stone-800 text-stone-400'
                : 'hover:bg-stone-100 text-stone-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`flex border-b ${
          darkMode ? 'border-stone-700' : 'border-stone-200'
        }`}>
          {(['summary', 'document', 'insights'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setShowShareFlow(false);
              }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? darkMode
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-emerald-600 text-emerald-600'
                  : darkMode
                    ? 'border-transparent text-stone-400 hover:text-stone-300'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-stone-800' : 'bg-stone-50'
              }`}>
                <div className={`text-sm space-y-2 ${
                  darkMode ? 'text-stone-300' : 'text-stone-600'
                }`}>
                  <div className="flex justify-between">
                    <span className="font-medium">Provider:</span>
                    <span>{record.providerName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>{record.serviceDate ? new Date(record.serviceDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>{record.kind}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Source:</span>
                    <span>{record.source}</span>
                  </div>
                </div>
              </div>

              {record.aiSummary && (
                <div className={`p-4 rounded-lg border ${
                  darkMode
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-stone-200'
                    : 'bg-emerald-50 border-emerald-200 text-stone-700'
                }`}>
                  <div className="flex items-start gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <span className="font-medium text-emerald-600">AI Summary</span>
                  </div>
                  <p>{record.aiSummary}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'document' && (
            <div>
              {record.previewUrl ? (
                <div className="space-y-3">
                  {['jpg', 'png'].includes(record.fileType) ? (
                    <img
                      src={record.previewUrl}
                      alt={record.title}
                      className="w-full rounded-lg border border-stone-200"
                    />
                  ) : record.fileType === 'pdf' ? (
                    <iframe
                      src={record.previewUrl}
                      title={record.title}
                      className="w-full rounded-lg border border-stone-200"
                      style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
                    />
                  ) : (
                    <div className={`flex flex-col items-center justify-center py-12 ${
                      darkMode ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      <FileText className="w-16 h-16 mb-4" />
                      <p className="text-center mb-4">Preview not available for {record.fileType.toUpperCase()} files</p>
                      <a
                        href={record.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          darkMode
                            ? 'bg-stone-800 hover:bg-stone-700 text-white'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-900'
                        }`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Download File
                      </a>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <a
                      href={record.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        darkMode
                          ? 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                          : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in new tab
                    </a>
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center py-12 ${
                  darkMode ? 'text-stone-400' : 'text-stone-500'
                }`}>
                  <FileText className="w-16 h-16 mb-4" />
                  {record.fileType === 'dicom' ? (
                    <>
                      <p className="text-center mb-4">DICOM viewer integration coming soon</p>
                      <button className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        darkMode
                          ? 'bg-stone-800 hover:bg-stone-700 text-white'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-900'
                      }`}>
                        <ExternalLink className="w-4 h-4" />
                        Open in External Viewer
                      </button>
                    </>
                  ) : (
                    <p className="text-center">
                      No document file attached to this record.
                      <br />
                      <span className="text-sm">Files uploaded by providers will appear here.</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              <button
                onClick={() => onRequestInsight?.(record.id)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                Generate AI Insights
              </button>

              <div className={`p-4 rounded-lg text-center ${
                darkMode ? 'bg-stone-800 text-stone-400' : 'bg-stone-50 text-stone-600'
              }`}>
                <p className="text-sm">
                  Ask the AI assistant to analyze this record, explain findings, or compare with previous results.
                </p>
              </div>
            </div>
          )}

          {showShareFlow && (
            <div className="space-y-4 mt-6">
              {shareSuccess ? (
                <div className={`p-4 rounded-lg text-center ${
                  darkMode
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  ✓ Shared securely. The link expires in {shareHours} hours.
                </div>
              ) : (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-stone-300' : 'text-stone-700'
                    }`}>
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="doctor@example.com"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500'
                          : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-stone-300' : 'text-stone-700'
                    }`}>
                      Message (optional)
                    </label>
                    <textarea
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      placeholder="Add a note for the recipient..."
                      rows={3}
                      className={`w-full px-4 py-2 rounded-lg border resize-none ${
                        darkMode
                          ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500'
                          : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-stone-300' : 'text-stone-700'
                    }`}>
                      Link Expires In
                    </label>
                    <select
                      value={shareHours}
                      onChange={(e) => setShareHours(Number(e.target.value))}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-stone-800 border-stone-700 text-white'
                          : 'bg-white border-stone-300 text-stone-900'
                      }`}
                    >
                      <option value={24}>24 hours</option>
                      <option value={72}>3 days</option>
                      <option value={168}>1 week</option>
                      <option value={336}>2 weeks</option>
                    </select>
                  </div>

                  <button
                    onClick={handleShare}
                    disabled={!shareEmail}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      !shareEmail
                        ? darkMode
                          ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                          : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Share2 className="w-5 h-5" />
                    Create Secure Share Link
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className={`absolute bottom-0 left-0 right-0 p-6 border-t ${
          darkMode ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
        }`}>
          <button
            onClick={handleShareClick}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Share2 className="w-5 h-5" />
            Share Record
          </button>
        </div>
      </div>
    </>
  );
}

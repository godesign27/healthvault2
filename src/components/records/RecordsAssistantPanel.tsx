import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Upload, Database, FlaskConical, Image, FileText, SendHorizontal } from 'lucide-react';
import { routeCommand, STARTER_PROMPTS, CommandIntent } from '../../lib/ai/health-assistant';
import { RecordKind } from '../../lib/records/types';
import { AIResultCard } from './AIResultCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  action?: string;
}

interface RecordsAssistantPanelProps {
  darkMode?: boolean;
  onUpdateRecords?: () => void;
  onShowInsight?: (insight: any) => void;
  onRequestRecords?: () => void;
}

export function RecordsAssistantPanel({ darkMode = false, onUpdateRecords, onShowInsight, onRequestRecords }: RecordsAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can help you upload, find, compare, explain, or share your health records. What would you like to do?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    const intent = inferIntent(input);
    const params = extractParams(input, intent);
    const result = await routeCommand(intent, params);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.message,
      data: result.data,
      action: result.action
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);

    if (result.action === 'UPDATE_LIST') {
      onUpdateRecords?.();
    }

    if (result.action === 'SHOW_INSIGHT' && result.data) {
      onShowInsight?.(result.data);
    }

    if (result.action === 'SHOW_REQUEST_FORM') {
      onRequestRecords?.();
    }
  };

  const handleStarterPrompt = async (intent: CommandIntent, params?: any) => {
    setIsProcessing(true);

    const label = STARTER_PROMPTS.find(p => p.intent === intent)?.label || 'Request';
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: label
    };

    setMessages(prev => [...prev, userMessage]);

    const result = await routeCommand(intent, params);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.message,
      data: result.data,
      action: result.action
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);

    if (result.action === 'UPDATE_LIST') {
      onUpdateRecords?.();
    }

    if (result.action === 'SHOW_INSIGHT' && result.data) {
      onShowInsight?.(result.data);
    }

    if (result.action === 'SHOW_REQUEST_FORM') {
      onRequestRecords?.();
    }
  };

  return (
    <div className={`flex flex-col h-full ${
      darkMode ? 'bg-stone-900' : 'bg-white'
    }`}>
      <div className={`p-4 border-b ${
        darkMode ? 'border-stone-800' : 'border-stone-200'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <h3 className={`font-semibold ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            AI Health Assistant
          </h3>
        </div>
        <p className={`text-xs ${
          darkMode ? 'text-stone-400' : 'text-stone-600'
        }`}>
          Ask me to upload, find, compare, explain, or share your records.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? darkMode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : darkMode
                    ? 'bg-stone-800 text-stone-200'
                    : 'bg-stone-100 text-stone-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.data && message.action === 'SHOW_INSIGHT' && (
                <div className="mt-2">
                  <AIResultCard insight={message.data} darkMode={darkMode} />
                </div>
              )}
            </div>
          </div>
        ))}

        {messages.length === 1 && (
          <div className="space-y-2 pt-4">
            <p className={`text-xs font-medium mb-3 ${
              darkMode ? 'text-stone-500' : 'text-stone-500'
            }`}>
              Suggested actions:
            </p>
            <button
              onClick={() => handleStarterPrompt('FILTER_BY_KIND' as CommandIntent, { kind: RecordKind.Lab })}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                darkMode
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Show my lab results
            </button>
            <button
              onClick={() => handleStarterPrompt('FILTER_BY_KIND' as CommandIntent, { kind: RecordKind.Imaging })}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                darkMode
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <Image className="w-4 h-4" />
              Show imaging records
            </button>
            <button
              onClick={() => handleStarterPrompt('UPLOAD_RECORD' as CommandIntent)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                darkMode
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload a new record
            </button>
            <button
              onClick={() => handleStarterPrompt('CONNECT_PROVIDER' as CommandIntent)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                darkMode
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <Database className="w-4 h-4" />
              Connect a provider
            </button>
            <button
              onClick={() => handleStarterPrompt('REQUEST_RECORDS' as CommandIntent)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                darkMode
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <SendHorizontal className="w-4 h-4" />
              Find or request medical records
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 border-t ${
        darkMode ? 'border-stone-800' : 'border-stone-200'
      }`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your records..."
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 rounded-lg border text-sm ${
              darkMode
                ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500'
                : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400'
            }`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className={`p-2 rounded-lg transition-colors ${
              !input.trim() || isProcessing
                ? darkMode
                  ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function inferIntent(input: string): CommandIntent {
  const lower = input.toLowerCase();

  if (lower.includes('request') || lower.includes('get my records') || lower.includes('obtain records')) return 'REQUEST_RECORDS' as CommandIntent;
  if (lower.includes('upload') || lower.includes('add')) return 'UPLOAD_RECORD';
  if (lower.includes('connect') || lower.includes('link')) return 'CONNECT_PROVIDER';
  if (lower.includes('compare')) return 'COMPARE_RECORDS';
  if (lower.includes('summarize') || lower.includes('summary')) return 'SUMMARIZE_RECORD';
  if (lower.includes('share') || lower.includes('send')) return 'SHARE_RECORD';
  if (lower.includes('explain') || lower.includes('what does')) return 'EXPLAIN_RECORD';
  if (lower.includes('lab') || lower.includes('blood')) return 'FILTER_BY_KIND';
  if (lower.includes('imaging') || lower.includes('scan') || lower.includes('xray') || lower.includes('mri')) return 'FILTER_BY_KIND';
  if (lower.includes('find') || lower.includes('show') || lower.includes('search')) return 'SEARCH_RECORDS';

  return 'SEARCH_RECORDS';
}

function extractParams(input: string, intent: CommandIntent): any {
  const lower = input.toLowerCase();

  if (intent === 'FILTER_BY_KIND') {
    if (lower.includes('lab') || lower.includes('blood')) return { kind: RecordKind.Lab };
    if (lower.includes('imaging') || lower.includes('scan') || lower.includes('xray') || lower.includes('mri')) return { kind: RecordKind.Imaging };
    if (lower.includes('pathology')) return { kind: RecordKind.Pathology };
    if (lower.includes('specialist') || lower.includes('report')) return { kind: RecordKind.SpecialistReport };
  }

  return {};
}

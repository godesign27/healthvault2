import { Sparkles, HelpCircle, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { sendChatMessage } from '../lib/openai/client';

export interface QuickAction {
  label: string;
  onClick: () => void;
}

interface OnboardingAssistantPanelProps {
  step: string;
  title: string;
  message: string;
  quickActions?: QuickAction[];
  /** FAQ strings shown as clickable chips that trigger AI answers */
  suggestedQuestions?: string[];
  darkMode?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function OnboardingAssistantPanel({
  step,
  title,
  message,
  quickActions = [],
  suggestedQuestions = [],
  darkMode = false,
}: OnboardingAssistantPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ask = async (question: string) => {
    if (!question.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: question };
    const history = [...chatMessages, userMsg];
    setChatMessages(history);
    setInputValue('');
    setIsLoading(true);
    try {
      const resp = await sendChatMessage({
        message: question,
        page: 'onboarding',
        pageContext: { step, topic: title },
        conversationHistory: chatMessages,
      });
      setChatMessages([...history, { role: 'assistant', content: resp.message }]);
    } catch {
      setChatMessages([...history, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hv-surface-card hv-surface-card--flat p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
          <Sparkles className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-content-primary'}`}>
            {title}
          </h3>
          <p className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
            Step {step}
          </p>
        </div>
      </div>

      {/* Static message */}
      <div className={`text-sm leading-relaxed ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
        {message}
      </div>

      {/* Navigation quick actions */}
      {quickActions.length > 0 && (
        <div className="space-y-2">
          <div className={`flex items-center gap-2 text-xs font-medium ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
            <HelpCircle className="w-3.5 h-3.5" />
            Quick Actions
          </div>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                darkMode
                  ? 'bg-surface-sunken hover:bg-surface-overlay text-content-primary'
                  : 'bg-surface-sunken hover:bg-surface-sunken text-content-primary'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* AI Chat */}
      <div className="border-t border-stroke-subtle pt-4">
        <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
          Ask the AI Assistant
        </p>

        {/* Suggested questions */}
        {suggestedQuestions.length > 0 && chatMessages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => ask(q)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  darkMode
                    ? 'border-stroke-default text-content-secondary hover:bg-surface-sunken'
                    : 'border-stroke-default text-content-secondary hover:bg-surface-sunken'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Chat history */}
        {chatMessages.length > 0 && (
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block px-3 py-2 rounded-xl max-w-[90%] ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : darkMode
                      ? 'bg-surface-sunken text-content-primary rounded-tl-none'
                      : 'bg-surface-sunken text-content-primary rounded-tl-none'
                }`}>
                  {msg.content}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-content-secondary">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Thinking...</span>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(inputValue); } }}
            placeholder="Ask a question..."
            disabled={isLoading}
            className={`flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
              darkMode
                ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-secondary'
                : 'bg-white border-stroke-subtle text-content-primary placeholder:text-content-secondary'
            } ${isLoading ? 'opacity-50' : ''}`}
          />
          <button
            onClick={() => ask(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            className="flex items-center justify-center p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

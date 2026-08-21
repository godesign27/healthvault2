import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  taskId: 'add-condition' | 'add-medication' | 'add-allergy' | 'add-immunization' | 'refill-medication' | 'schedule-appointment';
  onComplete: (record: any) => void;
  darkMode?: boolean;
}

const taskTitles = {
  'add-condition': 'Add Condition',
  'add-medication': 'Add Medication',
  'add-allergy': 'Add Allergy',
  'add-immunization': 'Add Immunization',
  'refill-medication': 'Refill Medication',
  'schedule-appointment': 'Schedule Appointment'
};

export function AssistantDrawer({
  isOpen,
  onClose,
  sessionId,
  taskId,
  onComplete,
  darkMode = false
}: AssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startConversation();
    }
  }, [isOpen]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const response = await sendMessageToAPI([]);
      if (response.message) {
        setMessages([response.message]);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setMessages([{
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageToAPI = async (currentMessages: Message[]) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || supabaseAnonKey;
    const apiUrl = `${supabaseUrl}/functions/v1/${taskId}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        messages: currentMessages
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from assistant');
    }

    return await response.json();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      let response = await sendMessageToAPI(newMessages);

      while (response.toolResult) {
        const toolMessage: Message = {
          role: 'tool',
          content: JSON.stringify(response.toolResult),
          tool_call_id: response.toolCallId
        };

        const messagesWithTool = [...newMessages, toolMessage];
        setMessages(messagesWithTool);

        if (response.toolResult.ok && response.toolResult.record) {
          onComplete(response.toolResult.record);
          return;
        }

        response = await sendMessageToAPI(messagesWithTool);
      }

      if (response.message) {
        setMessages([...newMessages, response.message]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div className={`fixed right-0 top-0 h-full w-full sm:w-[480px] z-50 shadow-2xl flex flex-col ${
        'bg-surface-raised'
      } transform transition-transform`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          'border-stroke-subtle'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${
                'text-content-primary'
              }`}>{taskTitles[taskId]}</h2>
              <p className={`text-sm ${
                'text-content-secondary'
              }`}>AI Health Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-surface-sunken transition-colors ${
              darkMode ? 'hover:bg-surface-sunken' : ''
            }`}
          >
            <X className={`w-5 h-5 ${
              'text-content-secondary'
            }`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {messages.filter(m => m.role !== 'tool').map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-start gap-3 max-w-[80%]">
                    <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className={`rounded-2xl rounded-tl-none px-4 py-3 ${
                      'bg-surface-sunken'
                    }`}>
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        darkMode ? 'text-content-primary' : 'text-content-primary'
                      }`}>{msg.content}</p>
                    </div>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="bg-indigo-600 rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className={`rounded-2xl rounded-tl-none px-4 py-3 ${
                    'bg-surface-sunken'
                  }`}>
                    <Loader2 className={`w-4 h-4 animate-spin ${
                      'text-content-secondary'
                    }`} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className={`p-4 border-t ${
          'border-stroke-subtle'
        }`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              disabled={isLoading}
              className={`flex-1 px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-secondary'
                  : 'border-stroke-subtle placeholder:text-content-secondary'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className={`flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${
                (isLoading || !inputValue.trim()) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

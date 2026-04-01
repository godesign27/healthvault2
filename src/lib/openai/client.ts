import { supabase } from '../supabase';
import type { ChatRequest, ChatResponse, ConversationMessage } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/ai-health-assistant`;

export async function sendChatMessage(params: {
  message: string;
  page?: string;
  pageContext?: Record<string, unknown>;
  conversationHistory?: ConversationMessage[];
}): Promise<ChatResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  const token = session?.access_token || SUPABASE_ANON_KEY;

  const body: ChatRequest = {
    message: params.message,
    page: params.page,
    pageContext: params.pageContext,
    conversationHistory: params.conversationHistory,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Assistant request failed (${res.status})`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    message: data.message || data.response || '',
    toolEvents: data.toolEvents,
    error: data.error,
  };
}

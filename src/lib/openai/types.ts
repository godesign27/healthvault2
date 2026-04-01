export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolEvent {
  tool: string;
  input: Record<string, unknown>;
  success: boolean;
  message?: string;
  durationMs: number;
}

export interface ChatRequest {
  message: string;
  page?: string;
  pageContext?: Record<string, unknown>;
  conversationHistory?: ConversationMessage[];
}

export interface ChatResponse {
  message: string;
  toolEvents?: ToolEvent[];
  error?: string;
}

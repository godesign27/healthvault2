export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

export interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolHandler {
  definition: OpenAITool;
  confirmationRequired: boolean;
  execute: (
    args: Record<string, unknown>,
    userId: string,
    supabaseClient: any
  ) => Promise<ToolResult>;
}

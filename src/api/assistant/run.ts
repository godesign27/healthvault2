import { sendChatMessage } from '../../lib/openai/client';
import { runTool, getOpenAITools } from '../../lib/openai/tools';
import type { ChatResponse, ConversationMessage, ToolEvent } from '../../lib/openai/types';

export interface AssistantRunParams {
  message: string;
  page?: string;
  pageContext?: Record<string, unknown>;
  conversationHistory?: ConversationMessage[];
  userId?: string | null;
}

export interface AssistantRunResult {
  response: ChatResponse;
  toolsExecuted: ToolEvent[];
}

export async function runAssistant(params: AssistantRunParams): Promise<AssistantRunResult> {
  const response = await sendChatMessage({
    message: params.message,
    page: params.page,
    pageContext: params.pageContext,
    conversationHistory: params.conversationHistory,
  });

  return {
    response,
    toolsExecuted: response.toolEvents || [],
  };
}

export { getOpenAITools, runTool };

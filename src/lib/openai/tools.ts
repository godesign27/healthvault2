import {
  TOOL_DEFINITIONS,
  getToolByName,
  executeTool,
  toOpenAIFunctionDefinitions,
} from '../ai-tools/registry';
import type { ToolDefinition, ToolResult } from '../ai-tools/types';

export { TOOL_DEFINITIONS, getToolByName, executeTool, toOpenAIFunctionDefinitions };
export type { ToolDefinition, ToolResult };

export function getOpenAITools() {
  return toOpenAIFunctionDefinitions();
}

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  userId: string | null
): Promise<ToolResult> {
  return executeTool(name, args, userId);
}

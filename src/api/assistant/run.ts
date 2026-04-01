import { openai } from "../../lib/openai/client";
import {
  assistantToolDefinitions,
  assistantToolHandlers,
} from "../../lib/openai/tools";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { userId, currentPage, userMessage, context } = body;

    const systemPrompt = `
You are the Health Vault AI Assistant.

Rules:
- Always use tools for user data
- Never guess
- Be concise
- Guide the user to next actions
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: systemPrompt,
      input: `${userMessage}\n\nContext:\n${JSON.stringify({
        userId,
        currentPage,
        context,
      })}`,
      tools: assistantToolDefinitions,
    });

    const toolCall = response.output.find(
      (o: { type: string }) => o.type === "function_call"
    );

    if (!toolCall || toolCall.type !== "function_call") {
      return Response.json({
        success: true,
        message: response.output_text,
      });
    }

    const handler = assistantToolHandlers[toolCall.name];
    if (!handler) {
      return Response.json(
        { success: false, error: `Unknown tool: ${toolCall.name}` },
        { status: 400 }
      );
    }

    const args = JSON.parse(toolCall.arguments || "{}");
    const result = await handler(args);

    const final = await openai.responses.create({
      model: "gpt-4.1-mini",
      previous_response_id: response.id,
      input: [
        {
          type: "function_call_output" as const,
          call_id: toolCall.call_id,
          output: JSON.stringify(result),
        },
      ],
    });

    return Response.json({
      success: true,
      message: final.output_text,
      toolUsed: toolCall.name,
      toolResult: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

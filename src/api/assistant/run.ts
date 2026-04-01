import { openai } from "../../lib/openai/client";
import {
  assistantToolDefinitions,
  assistantToolHandlers,
} from "../../lib/openai/tools";
import { buildSystemPrompt } from "../../lib/openai/prompt";

const MAX_TOOL_ROUNDS = 5;

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { userId, currentPage, userMessage, context } = body;

    const systemPrompt = buildSystemPrompt(currentPage);

    let response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: systemPrompt,
      input: `${userMessage}\n\nContext:\n${JSON.stringify({
        userId,
        currentPage,
        context,
      })}`,
      tools: assistantToolDefinitions,
    });

    const toolsUsed: string[] = [];
    let lastToolResult: unknown = null;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const toolCalls = response.output.filter(
        (o: { type: string }) => o.type === "function_call"
      );

      if (toolCalls.length === 0) break;

      const toolOutputs: Array<{
        type: "function_call_output";
        call_id: string;
        output: string;
      }> = [];

      for (const toolCall of toolCalls) {
        if (toolCall.type !== "function_call") continue;

        const handler = assistantToolHandlers[toolCall.name];
        if (!handler) {
          toolOutputs.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: JSON.stringify({
              success: false,
              error: `Unknown tool: ${toolCall.name}`,
            }),
          });
          continue;
        }

        const args = JSON.parse(toolCall.arguments || "{}");
        if (!args.userId && userId) {
          args.userId = userId;
        }

        const result = await handler(args);
        toolsUsed.push(toolCall.name);
        lastToolResult = result;

        toolOutputs.push({
          type: "function_call_output",
          call_id: toolCall.call_id,
          output: JSON.stringify(result),
        });
      }

      response = await openai.responses.create({
        model: "gpt-4.1-mini",
        previous_response_id: response.id,
        input: toolOutputs,
        tools: assistantToolDefinitions,
      });
    }

    return Response.json({
      success: true,
      message: response.output_text,
      toolUsed: toolsUsed.length === 1 ? toolsUsed[0] : toolsUsed,
      toolResult: lastToolResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

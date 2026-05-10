import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getToolDefinitions, getToolHandler } from "./tools.ts";
import { buildSystemPrompt } from "./system-prompt.ts";
import {
  logRequest,
  logToolCall,
  logOpenAIError,
  logValidationError,
  logResponse,
} from "./logger.ts";
import type {
  ChatRequest,
  ChatResponse,
  ToolEvent,
  OpenAIMessage,
  OpenAIToolCall,
} from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "gpt-4o-mini";
const MAX_TOOL_ROUNDS = 5;

function jsonResponse(body: ChatResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callOpenAI(
  messages: OpenAIMessage[],
  tools?: unknown[]
): Promise<any> {
  const body: Record<string, unknown> = { model: MODEL, messages };
  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${text}`);
  }

  return res.json();
}

async function executeToolCall(
  toolCall: OpenAIToolCall,
  userId: string,
  supabase: any
): Promise<{ result: string; event: ToolEvent }> {
  const start = Date.now();
  const name = toolCall.function.name;

  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(toolCall.function.arguments || "{}");
  } catch {
    const event: ToolEvent = {
      tool: name,
      input: {},
      success: false,
      message: "Invalid JSON arguments",
      durationMs: Date.now() - start,
    };
    logValidationError(userId, name, "Invalid JSON arguments");
    return {
      result: JSON.stringify({ success: false, error: "Invalid JSON arguments" }),
      event,
    };
  }

  const handler = getToolHandler(name);
  if (!handler) {
    const event: ToolEvent = {
      tool: name,
      input: args,
      success: false,
      message: `Unknown tool: ${name}`,
      durationMs: Date.now() - start,
    };
    logToolCall(userId, name, false, event.durationMs, event.message);
    return {
      result: JSON.stringify({ success: false, error: `Unknown tool: ${name}` }),
      event,
    };
  }

  try {
    const toolResult = await handler.execute(args, userId, supabase);
    const durationMs = Date.now() - start;

    const event: ToolEvent = {
      tool: name,
      input: args,
      success: toolResult.success,
      message: toolResult.message || toolResult.error,
      durationMs,
    };

    logToolCall(userId, name, toolResult.success, durationMs, toolResult.error);

    return { result: JSON.stringify(toolResult), event };
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const event: ToolEvent = {
      tool: name,
      input: args,
      success: false,
      message: err.message,
      durationMs,
    };
    logToolCall(userId, name, false, durationMs, err.message);
    return {
      result: JSON.stringify({ success: false, error: err.message }),
      event,
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const requestStart = Date.now();

  try {
    if (!OPENAI_API_KEY) {
      return errorResponse("OpenAI API key not configured", 500);
    }

    const body: ChatRequest = await req.json();
    const { message, page, pageContext, conversationHistory = [] } = body;

    if (!message?.trim()) {
      return errorResponse("Message is required", 400);
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader! } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return errorResponse("User not authenticated", 401);
    }

    logRequest(user.id, page);

    const systemPrompt = buildSystemPrompt(page, pageContext);
    const tools = getToolDefinitions();

    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const toolEvents: ToolEvent[] = [];
    let round = 0;

    while (round < MAX_TOOL_ROUNDS) {
      const data = await callOpenAI(
        messages,
        round < MAX_TOOL_ROUNDS - 1 ? tools : undefined
      );

      const choice = data.choices?.[0];
      if (!choice) {
        logOpenAIError(user.id, "No choices in OpenAI response");
        return errorResponse("No response from AI", 502);
      }

      const assistantMsg = choice.message;

      if (
        choice.finish_reason === "tool_calls" ||
        (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0)
      ) {
        messages.push({
          role: "assistant",
          content: assistantMsg.content,
          tool_calls: assistantMsg.tool_calls,
        });

        const toolCalls: OpenAIToolCall[] = assistantMsg.tool_calls;

        for (const tc of toolCalls) {
          const { result, event } = await executeToolCall(
            tc,
            user.id,
            supabase
          );
          toolEvents.push(event);

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        }

        round++;
        continue;
      }

      const totalDuration = Date.now() - requestStart;
      logResponse(user.id, toolEvents.length, totalDuration);

      return jsonResponse({
        message: assistantMsg.content || "I wasn't able to generate a response.",
        toolEvents: toolEvents.length > 0 ? toolEvents : undefined,
      });
    }

    logOpenAIError(user.id, `Max tool rounds (${MAX_TOOL_ROUNDS}) exceeded`);

    const lastAssistant = messages
      .filter((m) => m.role === "assistant" && m.content)
      .pop();

    return jsonResponse({
      message:
        lastAssistant?.content ||
        "I've gathered the information but reached my processing limit. Please try a more specific question.",
      toolEvents: toolEvents.length > 0 ? toolEvents : undefined,
    });
  } catch (err: any) {
    console.error("Assistant error:", err);

    if (err.message?.includes("OpenAI API error")) {
      logOpenAIError("unknown", err.message);
      return errorResponse("AI service temporarily unavailable", 502);
    }

    return errorResponse(err.message || "Internal server error", 500);
  }
});

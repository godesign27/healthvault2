# HealthVault OpenAI Integration

## Architecture Overview

The HealthVault AI Assistant uses the OpenAI Chat Completions API with function calling to provide a context-aware, tool-equipped assistant that can read and write user health data through validated backend tools.

### Request Flow

```
Frontend (AIAssistantPanel)
  |
  |-- sendChatMessage({ message, page, pageContext, conversationHistory })
  |
  v
Edge Function (ai-health-assistant)
  |
  |-- 1. Authenticate user via JWT
  |-- 2. Build system prompt (role + safety + page context)
  |-- 3. Load tool definitions (11 tools)
  |-- 4. Call OpenAI Chat Completions with tools
  |-- 5. If tool_calls returned:
  |       |-- Parse tool name + arguments
  |       |-- Execute tool handler against Supabase
  |       |-- Return tool result to OpenAI
  |       |-- Loop (up to 5 rounds)
  |-- 6. Return final assistant message + toolEvents
  |
  v
Frontend receives ChatResponse { message, toolEvents?, error? }
```

## Edge Function Structure

```
supabase/functions/ai-health-assistant/
  index.ts          -- Main orchestration: auth, tool loop, response
  tools.ts          -- 11 tool handlers with OpenAI function schemas
  system-prompt.ts  -- System prompt composition with page context
  types.ts          -- Shared TypeScript interfaces
  logger.ts         -- Structured JSON logging
```

## Frontend Client

```
src/lib/openai/
  client.ts    -- sendChatMessage() fetches the edge function
  context.ts   -- buildPageContext() packages UI state for the prompt
  types.ts     -- ChatRequest, ChatResponse, ToolEvent, ConversationMessage
  index.ts     -- Barrel exports
```

## How Page Context Is Passed

1. The frontend calls `buildPageContext(currentPage, overrides?)` to package relevant metadata.
2. This is sent as `pageContext` in the ChatRequest body.
3. The edge function's `buildSystemPrompt(page, pageContext)` appends page-specific instructions and metadata to the system prompt.
4. The model uses this context to stay relevant to the user's current screen.

Supported pages: dashboard, medical-forms, health-records, insurance, medical-profile, care, network, vitals.

## How Tool Execution Works

1. OpenAI returns `tool_calls` in the assistant message when it wants to call a tool.
2. For each tool call, the orchestrator:
   - Parses the JSON arguments
   - Looks up the handler from `TOOL_HANDLERS`
   - Executes the handler with `(args, userId, supabaseClient)`
   - Serializes the `ToolResult` back as a `tool` message
3. The conversation (with tool results appended) is sent back to OpenAI.
4. This loops up to `MAX_TOOL_ROUNDS` (5) times.
5. On the final round, tools are omitted to force a text response.

## How Tool Results Are Returned

Tool results follow a consistent shape:

```typescript
interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

The frontend also receives `toolEvents` for observability:

```typescript
interface ToolEvent {
  tool: string;
  input: Record<string, unknown>;
  success: boolean;
  message?: string;
  durationMs: number;
}
```

## Model Configuration

- Model: `gpt-4o-mini`
- Tool choice: `auto`
- Max tool rounds: 5

## Authentication

- The frontend sends the Supabase session JWT as a Bearer token.
- The edge function verifies the token via `supabase.auth.getUser()`.
- All tool handlers receive the authenticated `userId` for scoped queries.

## What Still Needs to Be Done for Realtime Voice

See `realtime-readiness.md` for the full breakdown. Key gaps:
- WebSocket connection to OpenAI Realtime API
- Streaming tool execution (same handlers, different transport)
- Audio input/output pipeline integration
- Session management for persistent voice conversations

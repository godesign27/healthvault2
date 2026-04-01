# HealthVault Realtime Voice Readiness

This document describes what is already reusable for the Talk button voice feature and what still needs to be built.

## Current Voice Infrastructure

### Already Built
- **Audio capture** (`src/lib/audio/capture.ts`): MediaRecorder wrapper with MIME detection, volume analysis via AnalyserNode, pause/resume.
- **Audio processing** (`src/lib/audio/processing.ts`): WAV encoder (16kHz mono), duration detection, formatting utilities.
- **Transcription endpoint** (`supabase/functions/transcribe-audio`): Whisper-based speech-to-text via OpenAI SDK.
- **TTS endpoint** (`supabase/functions/elevenlabs-tts`): ElevenLabs text-to-speech returning audio/mpeg.
- **VoiceAssistant component** (`src/components/VoiceAssistant.tsx`): State machine (idle → listening → processing → responding), audio recording, transcription call. Response generation is currently a stub.
- **VoiceInteraction component** (`src/components/VoiceInteraction.tsx`): TTS playback with progress, play/pause/replay controls.
- **Page context for voice** (`src/lib/voice/context-messages.ts`): Page-aware greeting messages.

### Already Reusable for Realtime

| Component | Reusable? | Notes |
|---|---|---|
| Tool handlers (11 tools) | Yes | Same handlers, same Supabase queries. Transport-agnostic. |
| Tool definitions (OpenAI schemas) | Yes | Same JSON schemas work for Realtime API function calling. |
| System prompt builder | Yes | Same prompt composition. May need shorter prompts for voice. |
| Page context builder | Yes | Same context injection. |
| Structured logger | Yes | Same logging hooks. |
| Auth pattern (JWT verification) | Partial | Realtime sessions may need a different auth handshake. |
| Audio capture | Yes | Can feed audio chunks to Realtime WebSocket instead of recording full blob. |

## What Needs to Be Built for Realtime

### 1. WebSocket Connection Manager
- Establish and maintain a WebSocket connection to the OpenAI Realtime API.
- Handle connection lifecycle: open, message, error, close, reconnect.
- Manage session configuration (model, voice, tools, instructions).

### 2. Realtime Session Endpoint
- A new edge function or enhancement to `ai-health-assistant` that:
  - Creates an ephemeral OpenAI Realtime session token
  - Returns the token to the frontend for direct WebSocket connection
  - Alternatively, proxies the WebSocket through the edge function

### 3. Streaming Audio Pipeline
- Replace the current record-then-send pattern with streaming audio chunks.
- Send audio deltas to the Realtime API as they're captured.
- Receive audio response deltas and play them incrementally.
- Handle voice activity detection (VAD) events from the API.

### 4. Realtime Tool Execution
- When the Realtime API sends a `response.function_call_arguments.done` event:
  - Parse the tool name and arguments
  - Execute the same tool handler (from `tools.ts`)
  - Send the result back via `conversation.item.create` with role `tool`
- The tool handlers are identical; only the transport layer differs.

### 5. Voice-Optimized Prompt Variant
- Shorter system prompt for voice (conversation rules #24-26).
- Reduce list outputs to counts and highlights.
- Add confirmation echo for mutations.

### 6. Session State Management
- Track conversation items for multi-turn voice sessions.
- Handle interruptions (user speaks while assistant is responding).
- Manage audio playback queue.

## Architecture Comparison

### Typed Chat (Current)
```
Frontend → HTTP POST → Edge Function → OpenAI Chat Completions → Tool Loop → HTTP Response
```

### Realtime Voice (Future)
```
Frontend → WebSocket → OpenAI Realtime API ← → Edge Function (tool execution via function calls)
```

Or with server-side proxy:
```
Frontend → WebSocket → Edge Function → OpenAI Realtime API
                                     → Tool execution (same handlers)
                                     → Audio relay
```

## Estimated Effort Breakdown

### Can reuse as-is
- All 11 tool handlers and definitions
- System prompt builder (with voice variant)
- Page context builder
- Structured logger
- Audio capture infrastructure

### Needs new implementation
- WebSocket connection manager
- Realtime session token endpoint
- Streaming audio pipeline (input + output)
- Realtime event handler (function calls, audio deltas, VAD)
- Voice-specific UI state management
- Interruption handling

## Integration Points

The key design decision preserved by the current architecture: **tool execution is transport-agnostic**. The `ToolHandler` interface accepts `(args, userId, supabaseClient)` and returns `ToolResult`. Whether this is called from an HTTP tool loop or a WebSocket event handler, the execution is identical.

This means adding Realtime support requires building the transport layer only, not reimplementing any business logic.

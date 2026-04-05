# HealthVault

HealthVault is a patient-centered health information platform with an embedded AI assistant. Users manage medical forms, health records, insurance, care providers, pharmacies, medications, and medical profiles through a modern web interface. The AI assistant actively guides users through health tasks -- it is a context-aware orchestration system, not a passive chatbot.

## Product Areas

| Area | Description |
|------|-------------|
| **Dashboard** | Overview of health status, recent activity, next-best-action suggestions |
| **Medical Forms** | Complete, save, and share medical questionnaires (FHIR-backed) |
| **Health Records** | View, filter, search, summarize, and request lab results, imaging, pathology, and specialist reports |
| **Insurance** | Manage coverages, search providers/plans, set primary, verify benefits |
| **Care Network** | Save and search doctors, specialists, and pharmacies; add providers; set preferred pharmacy |
| **Medical Profile** | Conditions, medications, allergies, immunizations, profile completion tracking |
| **Care Management** | Care team relationships, care timeline, health overview, medication refill checks |
| **Current Health / Vitals** | Track vital signs and health metrics (planned) |

## AI Assistant Architecture

```
Frontend (React)           Edge Function (Deno)           OpenAI
  |                              |                          |
  |--- ChatRequest ------------>|                          |
  |                              |--- system prompt ------->|
  |                              |--- 26 tool definitions ->|
  |                              |--- user message -------->|
  |                              |                          |
  |                              |<-- tool call request ----|
  |                              |                          |
  |                              |--- execute tool (DB) --->|
  |                              |--- tool result --------->|
  |                              |    (loop up to 5 rounds) |
  |                              |                          |
  |                              |<-- assistant response ---|
  |<-- ChatResponse ------------|                          |
```

**OpenAI** handles reasoning and tool selection. It never touches the database directly.

**HealthVault backend** (Supabase edge function) is the source of truth. It authenticates users, validates tool inputs, executes database queries, and returns results.

**Frontend** sends the user message with page context, receives the assistant response, and renders it.

## Tooling Structure

### Backend Tool Handlers (26 tools)

`src/lib/ai-tools/` -- Zod-validated handlers organized by domain:

| File | Tools |
|------|-------|
| `medical-history.ts` | getMedicalHistory |
| `forms.ts` | getIncompleteForms, openForm, saveFormAnswers, shareForm |
| `records.ts` | getHealthRecords, getHealthRecordRequests, summarizeRecord, requestHealthRecord, deleteHealthRecordRequest |
| `insurance.ts` | searchInsuranceProvider, getUserCoverages, setPrimaryInsurance, verifyInsurance |
| `network.ts` | searchInNetworkProviders, searchPharmacies, addProvider, setPreferredPharmacy |
| `medications.ts` | getMedications, summarizeMedication, checkRefillStatus |
| `care.ts` | getCareTeam, getCareTimeline, getCareOverview |
| `profile.ts` | getMedicalProfile, updateMedicalProfile |
| `registry.ts` | Central registry, Zod-to-JSON-Schema converter, `executeTool()` |
| `types.ts` | Shared types (`ToolResult`, `ToolDefinition`) |

### Edge Function (Server-Side Orchestration)

`supabase/functions/ai-health-assistant/`:
- `index.ts` -- Main orchestration with multi-turn tool execution loop (max 5 rounds)
- `tools.ts` -- 26 tool definitions with OpenAI function schemas and server-side handlers
- `system-prompt.ts` -- Context-aware system prompt with per-page behavior models
- `types.ts` -- Shared types for the edge function
- `logger.ts` -- Structured JSON logging (request, tool calls, errors, responses)

### Frontend Client

`src/lib/openai/`:
- `client.ts` -- `sendChatMessage()` function
- `context.ts` -- `buildPageContext()` page context builder with `PageId` types
- `types.ts` -- `ChatRequest`, `ChatResponse`, `ToolEvent`, `ConversationMessage`

## Documentation Map

All assistant documentation lives in `docs/ai-assistant/`:

| Document | Purpose |
|----------|---------|
| `assistant-system.md` | Assistant role, capabilities, restrictions, safety rules |
| `conversation-rules.md` | 26 rules governing response style, data integrity, confirmations, medical safety |
| `product-map.md` | Maps product areas to tools, typical tasks, and assistant behavior |
| `task-flows.md` | Step-by-step flows for key user tasks |
| `assistant-flows.md` | 10 detailed assistant-driven workflow definitions |
| `assistant-scripts.md` | Tone guidelines and example scripts per page |
| `page-context-prompts.md` | Page-to-behavior mapping with context signals |
| `tools-registry.md` | Complete reference of all 26 tools with inputs/outputs |
| `tool-contracts.md` | Formal input/output contracts for each tool |
| `openai-integration.md` | How the OpenAI orchestration works end-to-end |
| `tool-exposure-map.md` | Maps each OpenAI tool name to its backend handler |
| `realtime-readiness.md` | What is reusable for voice and what still needs building |

Root governance: `AGENT_INSTRUCTIONS.md`

## Development Principles

1. **Backend is source of truth.** All data reads and writes go through backend tool handlers.
2. **Do not duplicate logic.** The edge function and frontend registry serve different contexts but follow the same contracts.
3. **Prefer evolution over replacement.** Extend existing files rather than creating parallel systems.
4. **Never fake success.** Tool results must reflect actual database outcomes.
5. **Validate inputs.** Zod schemas in the frontend; JSON parsing in the edge function.
6. **Keep responses concise.** 1-3 sentences for simple answers. No filler.
7. **Require confirmation for mutations.** Sharing, adding providers, setting primary insurance, updating profiles.
8. **Medical safety.** Summaries must be factual. No diagnoses, treatment recommendations, or clinical interpretations.
9. **Be proactive.** The assistant guides users forward -- it does not wait passively.

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth, Storage, RLS)
- **AI:** OpenAI Chat Completions API (gpt-4o-mini) with function calling
- **Voice (planned):** OpenAI Whisper (transcription), ElevenLabs (TTS), OpenAI Realtime API
- **Validation:** Zod
- **Icons:** Lucide React

## Next Planned Milestones

- Full page/screen context ingestion for richer assistant awareness
- Frontend assistant wiring improvements (tool event rendering, action callbacks, drawer triggers)
- Realtime Talk button integration using the existing tool handler layer
- Admin monitoring, logging dashboard, and usage analytics
- Conversation persistence
- External provider directory search (NPI registry)
- Lab result interpretation with safety guardrails

# Agent Instructions

This document governs how Bolt, Claude, or any AI coding agent should work on the HealthVault codebase. Follow these rules strictly.

---

## 1. Mission

HealthVault is a healthcare product. Work must prioritize:

- **Safety** -- never fake medical data, tool results, or action confirmations
- **Consistency** -- reuse existing patterns, naming, and architecture
- **Modularity** -- small, focused files with clear responsibilities
- **Traceability** -- every tool call is logged, every mutation is validated
- **Non-drifting implementation** -- do not invent parallel systems when one already exists

---

## 2. Core Working Rules

### Before writing any code:
1. Audit the existing codebase for relevant files, patterns, and conventions
2. Identify what already exists that can be reused or extended
3. Read neighboring files to understand code style, imports, and naming

### While writing code:
4. Prefer evolving existing files over creating duplicates
5. Do not invent missing integrations -- if an external API is not connected, document it as a placeholder
6. Do not invent success states -- tool results must reflect real backend outcomes
7. Do not bypass the backend tool layer -- all data operations go through `src/lib/ai-tools/` or the edge function tool handlers
8. Do not move sensitive logic client-side -- API keys, service role keys, and mutation logic stay server-side
9. Do not write monolithic files when modular structure exists -- split at clear boundaries
10. Do not break existing working UI behavior -- test after changes

---

## 3. Assistant-Specific Rules

These rules govern the AI assistant integration specifically:

1. **All real actions must go through backend tools.** The OpenAI model selects tools; the backend executes them. Never let the model write directly to the database.
2. **All tool inputs must be validated.** Use Zod schemas in the frontend registry. Parse and check arguments in the edge function.
3. **User-facing responses must be concise.** 1-3 sentences for simple answers. Short paragraphs for explanations. No filler phrases.
4. **Mutations require confirmation.** Sharing forms, adding providers, setting primary insurance, updating profiles, and requesting records all block unless `confirmed: true`.
5. **Medical summaries must be non-diagnostic.** Factual descriptions only. No treatment recommendations, diagnoses, or clinical interpretations.
6. **Page context must influence behavior.** The assistant adjusts its suggestions and tool usage based on which page the user is viewing. See `system-prompt.ts` for the behavior model.
7. **Never claim a tool succeeded unless the backend confirms it.** If a tool returns `success: false`, report the failure honestly.
8. **Be proactive, not passive.** The assistant is a health co-pilot that guides users forward. On empty states, initiate flows. On partial data, suggest completion. On dashboards, identify the next best action.
9. **Conversation history is passed from the frontend.** Do not implement server-side conversation persistence unless explicitly requested.

---

## 4. Documentation Rules

1. **Update docs when architecture changes.** If you add a tool, update `tool-contracts.md`, `tools-registry.md`, and `tool-exposure-map.md`.
2. **Keep tool names consistent.** The same tool name must appear in: the frontend registry, the edge function, the OpenAI function definition, and the documentation.
3. **Document placeholders honestly.** If a tool uses mock data or a stub, say so in the contract.
4. **Document real vs partial vs planned.** Each tool contract should state its implementation status clearly.
5. **Do not create unnecessary documentation files.** Only create docs when they serve a real purpose.

### Key documentation files:
- `docs/ai-assistant/assistant-system.md` -- assistant role and rules
- `docs/ai-assistant/conversation-rules.md` -- conversation rules
- `docs/ai-assistant/product-map.md` -- product areas and tool mapping
- `docs/ai-assistant/assistant-flows.md` -- 10 assistant-driven workflows
- `docs/ai-assistant/assistant-scripts.md` -- tone and example scripts
- `docs/ai-assistant/page-context-prompts.md` -- page-to-behavior mapping
- `docs/ai-assistant/tools-registry.md` -- complete tool reference (24 tools)
- `docs/ai-assistant/tool-contracts.md` -- formal tool contracts
- `docs/ai-assistant/openai-integration.md` -- orchestration architecture
- `docs/ai-assistant/tool-exposure-map.md` -- tool name mapping and status
- `docs/ai-assistant/realtime-readiness.md` -- voice readiness assessment

---

## 5. Implementation Order

When working on a feature or change, follow this order:

1. **Inspect** -- read existing code, understand patterns, find reusable pieces
2. **Plan** -- identify what needs to change and what can stay
3. **Backend/services** -- implement or update tool handlers and database queries
4. **Orchestration** -- update edge function tool definitions, system prompts, or execution logic
5. **Deploy** -- deploy edge function after changes
6. **Frontend wiring** -- update the client, components, or UI that calls the backend
7. **Documentation** -- update contracts, maps, and guides to reflect changes
8. **Verify** -- run the build, check for type errors, confirm existing behavior is preserved

---

## 6. Code Quality Rules

- **TypeScript-first** -- no `any` unless interfacing with untyped external code
- **Typed contracts** -- define interfaces for all request/response shapes
- **Zod for validation** -- use Zod schemas for tool inputs in the frontend registry
- **Modular files** -- each file has one clear responsibility, under ~200-300 lines
- **Clean naming** -- match existing conventions (`camelCase` for functions, `PascalCase` for types/interfaces)
- **Safe error handling** -- catch errors, return structured results, never swallow failures silently
- **No unnecessary abstraction** -- three similar lines are better than a premature helper
- **No dead code** -- remove unused imports, functions, and files
- **No secrets in client code** -- API keys stay in environment variables, accessed server-side only

---

## 7. HealthVault Product Context

The AI assistant helps users across 7 domains with 24 backend tools:

| Domain | Tools |
|--------|-------|
| Medical forms | getMedicalHistory, getIncompleteForms, openForm, saveFormAnswers, shareForm |
| Health records | getHealthRecords, summarizeRecord, requestHealthRecord |
| Insurance | searchInsuranceProvider, getUserCoverages, setPrimaryInsurance, verifyInsurance |
| Care network | searchInNetworkProviders, searchPharmacies, addProvider, setPreferredPharmacy |
| Medications | getMedications, summarizeMedication, checkRefillStatus |
| Care management | getCareTeam, getCareTimeline, getCareOverview |
| Profile | getMedicalProfile, updateMedicalProfile |

### Current state:
- **Typed chat** -- fully wired. Frontend sends messages via `sendChatMessage()`, edge function orchestrates with OpenAI, executes tools, returns response.
- **Voice** -- audio capture and transcription infrastructure exists. Realtime API integration is not yet implemented. The tool handler layer is transport-agnostic and ready to reuse.
- **Backend tools** -- 24 tools with real Supabase queries. All tools are registered in both the frontend registry and the edge function.

### Architecture layers:
```
src/lib/ai-tools/          -- Frontend tool registry (Zod schemas, handlers, client-side Supabase)
supabase/functions/         -- Edge functions (server-side orchestration, service role Supabase)
src/lib/openai/             -- Frontend client for calling the assistant endpoint
docs/ai-assistant/          -- Governance and reference documentation
```

---

## 8. Future Flow Authoring

When full screen inventories, user narratives, or task specifications are provided:

1. Use them to shape assistant scripts and guided task flows in `docs/ai-assistant/assistant-flows.md`
2. Add page-specific context to `supabase/functions/ai-health-assistant/system-prompt.ts`
3. Create or update tool definitions if new capabilities are needed
4. Wire frontend interaction logic (action callbacks, drawer triggers, navigation) through the existing `AIAssistantPanel` callback system
5. Keep the assistant behavior aligned with `conversation-rules.md` and `assistant-scripts.md`

Do not invent user narratives or task flows. Use only what is provided or can be derived from the existing product.

---

## 9. What Not to Do

- Do not create a second chat endpoint or orchestration layer
- Do not call OpenAI directly from frontend code
- Do not store API keys in files committed to version control
- Do not add npm packages without checking if the existing stack covers the need
- Do not refactor working code unless the change is directly required by the current task
- Do not add comments, docstrings, or type annotations to code you did not change
- Do not create README files for subdirectories unless explicitly requested
- Do not build the assistant as a passive chatbot -- it must actively guide users

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const drafts = new Map<string, any>();

const systemPrompt = `You are the Health Vault AI Health Assistant. Your job is to help the user add an allergy safely and efficiently.

Interview rules:
- Ask one question at a time, in plain English.
- Keep messages short; avoid paragraphs.
- Fields to collect:
  1) allergy.allergen (required — e.g. Penicillin, Peanuts, Latex)
  2) allergy.reaction (e.g. hives, anaphylaxis, optional)
  3) allergy.severity: "Mild" | "Moderate" | "Severe" (optional)
  4) allergy.diagnosedOn (YYYY-MM-DD, optional)
  5) allergy.notes (optional)

Workflow:
1) Ask for allergen first (required). If empty, re-ask politely.
2) Ask what reaction they experience (skip allowed).
3) Ask for severity (show choices: Mild, Moderate, Severe, skip allowed).
4) Ask for diagnosed date (YYYY-MM-DD) or allow skip.
5) Ask for any notes (skip allowed).
6) After each field, call tool "save_allergy_partial" to persist the draft.
7) Summarize the collected data and ask for confirmation to save.
8) If confirmed, call tool "commit_allergy".
9) If not confirmed, edit the specified field and re-summarize.
10) Never give medical advice.

Output style:
- Friendly, concise, safety-first.`;

const tools = [
  {
    type: "function",
    function: {
      name: "save_allergy_partial",
      description: "Save or update a draft allergy for the current session.",
      parameters: {
        type: "object",
        properties: {
          allergen: { type: "string", description: "Allergen name (e.g. Penicillin, Peanuts)" },
          reaction: { type: "string", description: "Reaction experienced" },
          severity: { type: "string", enum: ["Mild", "Moderate", "Severe"] },
          diagnosedOn: { type: "string", description: "Date diagnosed YYYY-MM-DD" },
          notes: { type: "string" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "commit_allergy",
      description: "Validate the draft and persist it to the database.",
      parameters: {
        type: "object",
        properties: { confirm: { type: "boolean" } },
        required: ["confirm"],
        additionalProperties: false
      }
    }
  }
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { sessionId, messages } = await req.json();
    if (!sessionId) throw new Error('Session ID is required');

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        tools,
        tool_choice: 'auto'
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI error:', error);
      throw new Error('Failed to get response from OpenAI');
    }

    const data = await openaiResponse.json();
    const choice = data.choices[0];
    const message = choice.message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      if (functionName === 'save_allergy_partial') {
        const currentDraft = drafts.get(sessionId) || {};
        const updatedDraft = { ...currentDraft, ...args };
        drafts.set(sessionId, updatedDraft);

        return new Response(
          JSON.stringify({ toolResult: { ok: true, draft: updatedDraft }, toolCallId: toolCall.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (functionName === 'commit_allergy') {
        const draft = drafts.get(sessionId) || {};

        if (!draft.allergen) {
          return new Response(
            JSON.stringify({
              toolResult: { ok: false, error: { fieldErrors: { allergen: ['Allergen is required'] } } },
              toolCallId: toolCall.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const authHeader = req.headers.get('Authorization');
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          global: { headers: { Authorization: authHeader! } }
        });

        const { data: { user } } = await supabase.auth.getUser(authHeader?.split(' ')[1] || '');
        if (!user) throw new Error('User not authenticated');

        const allergy = {
          user_id: user.id,
          allergen: draft.allergen,
          reaction: draft.reaction || null,
          severity: draft.severity || null,
          diagnosed_on: draft.diagnosedOn || null,
          notes: draft.notes || null,
        };

        const { data: record, error } = await supabase
          .from('allergies')
          .insert(allergy)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          return new Response(
            JSON.stringify({
              toolResult: { ok: false, error: { message: 'Failed to save allergy to database' } },
              toolCallId: toolCall.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        drafts.delete(sessionId);
        return new Response(
          JSON.stringify({ toolResult: { ok: true, record }, toolCallId: toolCall.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ message: { role: message.role, content: message.content } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

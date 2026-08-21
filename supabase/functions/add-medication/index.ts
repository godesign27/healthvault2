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

const systemPrompt = `You are the Health Vault AI Health Assistant. Your job is to help the user add a medication safely and efficiently.

Interview rules:
- Ask one question at a time, in plain English.
- Keep messages short; avoid paragraphs.
- Validate answers implicitly; if unclear, ask a brief follow-up.
- Fields to collect:
  1) medication.name (required)
  2) medication.dosage (e.g. "10mg", optional)
  3) medication.frequency (e.g. "Once daily", optional)
  4) medication.prescribedBy (prescribing physician, optional)
  5) medication.startDate (YYYY-MM-DD, optional)
  6) medication.notes (optional)

Workflow:
1) Ask for medication name first (required). If empty, re-ask politely.
2) Ask about dosage (skip allowed).
3) Ask about frequency (skip allowed).
4) Ask for prescribing physician (skip allowed).
5) Ask for start date (YYYY-MM-DD) or allow skip.
6) Ask for any notes (skip allowed).
7) After each field, call tool "save_medication_partial" to persist the draft.
8) Summarize the collected data and ask for confirmation to save.
9) If confirmed, call tool "commit_medication".
10) If not confirmed, edit the specified field and re-summarize.
11) Never give medical advice or a diagnosis.

Output style:
- Friendly, concise, safety-first.
- When listing choices, keep them on one line.`;

const tools = [
  {
    type: "function",
    function: {
      name: "save_medication_partial",
      description: "Save or update a draft medication for the current session.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Medication name" },
          dosage: { type: "string", description: "Dosage (e.g. 10mg)" },
          frequency: { type: "string", description: "How often to take it" },
          prescribedBy: { type: "string", description: "Prescribing physician name" },
          startDate: { type: "string", description: "Start date YYYY-MM-DD" },
          notes: { type: "string" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "commit_medication",
      description: "Validate the draft via schema check and persist it.",
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

      if (functionName === 'save_medication_partial') {
        const currentDraft = drafts.get(sessionId) || {};
        const updatedDraft = { ...currentDraft, ...args };
        drafts.set(sessionId, updatedDraft);

        return new Response(
          JSON.stringify({ toolResult: { ok: true, draft: updatedDraft }, toolCallId: toolCall.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (functionName === 'commit_medication') {
        const draft = drafts.get(sessionId) || {};

        if (!draft.name) {
          return new Response(
            JSON.stringify({
              toolResult: { ok: false, error: { fieldErrors: { name: ['Medication name is required'] } } },
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

        const medication = {
          user_id: user.id,
          name: draft.name,
          dosage: draft.dosage || null,
          frequency: draft.frequency || null,
          prescribed_by: draft.prescribedBy || null,
          start_date: draft.startDate || null,
          notes: draft.notes || null,
        };

        const { data: record, error } = await supabase
          .from('medications')
          .insert(medication)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          return new Response(
            JSON.stringify({
              toolResult: { ok: false, error: { message: 'Failed to save medication to database' } },
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

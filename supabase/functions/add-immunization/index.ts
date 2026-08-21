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

const systemPrompt = `You are the Health Vault AI Health Assistant. Your job is to help the user record an immunization/vaccination safely and efficiently.

Interview rules:
- Ask one question at a time, in plain English.
- Keep messages short; avoid paragraphs.
- Fields to collect:
  1) immunization.vaccine (required — e.g. Influenza, COVID-19 Moderna, Tdap)
  2) immunization.administeredOn (YYYY-MM-DD, optional)
  3) immunization.provider (clinic or doctor who gave it, optional)
  4) immunization.lotNumber (optional)
  5) immunization.nextDose (YYYY-MM-DD for booster, optional)
  6) immunization.notes (optional)

Workflow:
1) Ask for vaccine name first (required). If empty, re-ask politely.
2) Ask when it was administered (YYYY-MM-DD) or allow skip.
3) Ask for provider/clinic (skip allowed).
4) Ask for lot number (skip allowed).
5) Ask for next dose date (booster, skip allowed).
6) Ask for any notes (skip allowed).
7) After each field, call tool "save_immunization_partial" to persist the draft.
8) Summarize the collected data and ask for confirmation to save.
9) If confirmed, call tool "commit_immunization".
10) If not confirmed, edit the specified field and re-summarize.
11) Never give medical advice.

Output style:
- Friendly, concise, safety-first.`;

const tools = [
  {
    type: "function",
    function: {
      name: "save_immunization_partial",
      description: "Save or update a draft immunization for the current session.",
      parameters: {
        type: "object",
        properties: {
          vaccine: { type: "string", description: "Vaccine name (e.g. Influenza, COVID-19)" },
          administeredOn: { type: "string", description: "Date administered YYYY-MM-DD" },
          provider: { type: "string", description: "Provider or clinic name" },
          lotNumber: { type: "string", description: "Vaccine lot number" },
          nextDose: { type: "string", description: "Next booster date YYYY-MM-DD" },
          notes: { type: "string" }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "commit_immunization",
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

      if (functionName === 'save_immunization_partial') {
        const currentDraft = drafts.get(sessionId) || {};
        const updatedDraft = { ...currentDraft, ...args };
        drafts.set(sessionId, updatedDraft);

        return new Response(
          JSON.stringify({ toolResult: { ok: true, draft: updatedDraft }, toolCallId: toolCall.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (functionName === 'commit_immunization') {
        const draft = drafts.get(sessionId) || {};

        if (!draft.vaccine) {
          return new Response(
            JSON.stringify({
              toolResult: { ok: false, error: { fieldErrors: { vaccine: ['Vaccine name is required'] } } },
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

        const immunization = {
          user_id: user.id,
          vaccine: draft.vaccine,
          administered_on: draft.administeredOn || null,
          provider: draft.provider || null,
          lot_number: draft.lotNumber || null,
          next_dose: draft.nextDose || null,
          notes: draft.notes || null,
        };

        const { data: record, error } = await supabase
          .from('immunizations')
          .insert(immunization)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          return new Response(
            JSON.stringify({
              toolResult: { ok: false, error: { message: 'Failed to save immunization to database' } },
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

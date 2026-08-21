import { sendChatMessage } from "../../lib/openai/client";

interface AssistantRequestBody {
  currentPage?: string;
  userMessage?: string;
  context?: Record<string, unknown>;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json() as AssistantRequestBody;

    if (!body.userMessage?.trim()) {
      return Response.json(
        { success: false, error: "Message is required" },
        { status: 400 },
      );
    }

    const result = await sendChatMessage({
      message: body.userMessage,
      page: body.currentPage,
      pageContext: body.context,
    });

    return Response.json({
      success: true,
      message: result.message,
      toolEvents: result.toolEvents,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

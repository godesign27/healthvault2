import { getIncompleteForms } from "../tools/getIncompleteForms";

export const assistantToolDefinitions = [
  {
    type: "function" as const,
    name: "getIncompleteForms",
    description: "Get incomplete medical forms for a user",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string" },
      },
      required: ["userId"],
    },
  },
];

export const assistantToolHandlers: Record<
  string,
  (args: Record<string, unknown>) => Promise<unknown>
> = {
  getIncompleteForms,
};

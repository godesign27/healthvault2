import { z } from "zod";
import { resolveProviderRecordConnection as resolve } from "../provider-record-connection/resolveProviderRecordConnection";

export const resolveProviderRecordConnectionInputSchema = z.object({
  userId: z.string().min(1),
  providerName: z.string().optional(),
  providerOrganizationId: z.string().optional(),
  careNetworkProviderId: z.string().optional(),
});

export async function resolveProviderRecordConnection(input: unknown) {
  const parsed = resolveProviderRecordConnectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  return resolve(parsed.data);
}

import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const saveProviderToNetworkInputSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1, "Provider name is required"),
  specialty: z.string().optional(),
  clinic: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  providerType: z.string().optional(),
  relationship: z.enum(["Primary", "Specialist", "Dental", "Vision", "Therapy", "Other"]).optional(),
  inNetwork: z.boolean().optional(),
  insuranceId: z.string().optional(),
});

export async function saveProviderToNetwork(input: unknown) {
  const parsed = saveProviderToNetworkInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      userId, name, specialty, clinic, phone, email,
      address, relationship, inNetwork,
    } = parsed.data;

    const effectiveRelationship = relationship
      || (parsed.data.providerType === "primary_care" ? "Primary" : undefined)
      || (parsed.data.providerType === "specialist" ? "Specialist" : undefined)
      || undefined;

    const { data, error } = await supabase
      .from("providers")
      .insert({
        user_id: userId,
        name,
        specialty: specialty || null,
        clinic: clinic || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        relationship: effectiveRelationship || null,
        in_network: inNetwork ?? null,
        connection_source: "Manual",
      })
      .select("id, name, specialty, relationship")
      .single();

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    return {
      success: true,
      data: {
        saved: true,
        provider: {
          id: data.id,
          name: data.name,
          specialty: data.specialty,
          relationship: data.relationship,
        },
        networkEntryId: data.id,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

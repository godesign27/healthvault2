import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";
import {
  mapOrganizationRow,
  organizationSearchFilter,
} from "../network/provider-organizations";

/**
 * Queries the `provider_organizations` directory table (seeded health systems).
 * When a real provider directory integration is available (e.g. CMS NPPES,
 * Carequality), extend this to query that source.
 */

export const searchProviderOrganizationsInputSchema = z.object({
  query: z.string().min(1),
});

export type SearchProviderOrganizationsInput = z.infer<
  typeof searchProviderOrganizationsInputSchema
>;

export async function searchProviderOrganizations(input: unknown) {
  const parsed = searchProviderOrganizationsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { query } = parsed.data;

    const { data: orgs, error } = await supabase
      .from("provider_organizations")
      .select("*")
      .or(organizationSearchFilter(query))
      .order("name", { ascending: true })
      .limit(20);

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    const organizations = (orgs || []).map(mapOrganizationRow);

    if (organizations.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          organizations: [],
          message: `No provider organizations found matching "${query}". The user can still submit a manual records request.`,
        },
      };
    }

    return {
      success: true,
      data: {
        total: organizations.length,
        organizations,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

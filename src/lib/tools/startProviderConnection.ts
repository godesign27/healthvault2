import { z } from 'zod';
import { startFhirOAuth } from '../network/fhir-oauth-api';
import { createSupabaseServerClient } from '../supabase/server';

export const startProviderConnectionInputSchema = z.object({
  userId: z.string().min(1),
  providerOrganizationId: z.string().min(1),
});

export type StartProviderConnectionInput = z.infer<
  typeof startProviderConnectionInputSchema
>;

export async function startProviderConnection(input: unknown) {
  const parsed = startProviderConnectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input: ' + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { providerOrganizationId } = parsed.data;

    const { data: org, error: orgError } = await supabase
      .from('provider_organizations')
      .select('*')
      .eq('id', providerOrganizationId)
      .maybeSingle();

    if (orgError) {
      return { success: false, error: `Database error: ${orgError.message}` };
    }

    if (!org) {
      return { success: false, error: 'Provider organization not found.' };
    }

    if (!org.supports_direct_connection) {
      return {
        success: true,
        data: {
          strategy: 'direct_provider_connection',
          status: 'not_configured',
          launchUrl: null,
          message: `${org.name} does not yet support direct digital connection. You can submit a manual records request instead.`,
        },
      };
    }

    if (!org.fhir_endpoint_url || !org.authorization_endpoint || !org.token_endpoint) {
      return {
        success: true,
        data: {
          strategy: 'direct_provider_connection',
          status: 'not_configured',
          launchUrl: null,
          message: `${org.name} supports direct connection but FHIR OAuth endpoints are not configured yet.`,
        },
      };
    }

    const oauth = await startFhirOAuth({
      providerOrganizationId,
      connectionMethod: 'direct_provider_connection',
    });

    return {
      success: true,
      data: {
        strategy: 'direct_provider_connection' as const,
        status: oauth.status,
        connectionId: oauth.connectionId,
        launchUrl: oauth.launchUrl,
        message: oauth.message ||
          `Authorize access to ${org.name} to import your records.`,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('FHIR_CLIENT_ID')) {
      return {
        success: true,
        data: {
          strategy: 'direct_provider_connection',
          status: 'not_configured',
          launchUrl: null,
          message: 'FHIR OAuth is not configured on the server yet. Set FHIR_CLIENT_ID in Supabase secrets.',
        },
      };
    }
    return { success: false, error: message };
  }
}

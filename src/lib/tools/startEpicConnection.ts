import { z } from 'zod';
import { startFhirOAuth } from '../network/fhir-oauth-api';
import { createSupabaseServerClient } from '../supabase/server';

export const startEpicConnectionInputSchema = z.object({
  userId: z.string().min(1),
  providerOrganizationId: z.string().min(1),
});

export type StartEpicConnectionInput = z.infer<
  typeof startEpicConnectionInputSchema
>;

export async function startEpicConnection(input: unknown) {
  const parsed = startEpicConnectionInputSchema.safeParse(input);
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

    if (!org.supports_epic_connection) {
      return {
        success: true,
        data: {
          strategy: 'epic_connection',
          status: 'not_supported',
          launchUrl: null,
          message: `${org.name} does not support connection through an Epic/MyChart-compatible portal.`,
        },
      };
    }

    if (!org.fhir_endpoint_url || !org.authorization_endpoint || !org.token_endpoint) {
      return {
        success: true,
        data: {
          strategy: 'epic_connection',
          status: 'not_configured',
          launchUrl: null,
          message: `${org.name} Epic OAuth endpoints are not configured yet.`,
        },
      };
    }

    const oauth = await startFhirOAuth({
      providerOrganizationId,
      connectionMethod: 'epic_connection',
    });

    return {
      success: true,
      data: {
        strategy: 'epic_connection' as const,
        status: oauth.status,
        connectionId: oauth.connectionId,
        launchUrl: oauth.launchUrl,
        message: oauth.message ||
          `Authorize ${org.portalBrand || 'patient portal'} access for ${org.name}.`,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('FHIR_CLIENT_ID')) {
      return {
        success: true,
        data: {
          strategy: 'epic_connection',
          status: 'not_configured',
          launchUrl: null,
          message: 'Epic OAuth is not configured on the server yet. Set FHIR_CLIENT_ID in Supabase secrets.',
        },
      };
    }
    return { success: false, error: message };
  }
}

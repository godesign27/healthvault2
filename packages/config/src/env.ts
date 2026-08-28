import { z } from "zod";

// Validates environment variables for Supabase Edge Functions and local dev.
// Call envSchema.parse(Deno.env.toObject()) in edge functions, or
// envSchema.parse(process.env) in Node tooling.

export const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),

  // OpenAI (AI assistant)
  OPENAI_API_KEY: z.string().startsWith("sk-").optional(),

  // EHR integration (Keragon webhook)
  KERAGON_WEBHOOK_URL: z.string().url().optional(),

  // FHIR direct connection (SMART on FHIR pilot)
  FHIR_BASE_URL: z.string().url().optional(),
  FHIR_CLIENT_ID: z.string().optional(),
  FHIR_CLIENT_SECRET: z.string().optional(),
  FHIR_REDIRECT_URI: z.string().url().optional(),

  // MCP integrations (feature flags)
  GMAIL_MCP_ENABLED: z.coerce.boolean().default(false),
  HEALTHEX_MCP_ENABLED: z.coerce.boolean().default(false),

  // App
  APP_URL: z.string().url().default("https://healthvault.me"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

// Client-side env (VITE_ prefix, no secrets)
export const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(20),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function validateClientEnv(env: Record<string, string | undefined>): ClientEnv {
  const result = clientEnvSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing required environment variables: ${missing}`);
  }
  return result.data;
}

import { z } from "zod";

const serverConfigSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(8787),
  MCP_PUBLIC_URL: z.string().url().optional(),
});

export type ServerConfig = Omit<z.infer<typeof serverConfigSchema>, "MCP_PUBLIC_URL"> & {
  MCP_PUBLIC_URL: string;
};

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  const parsed = serverConfigSchema.parse(environment);
  return {
    ...parsed,
    MCP_PUBLIC_URL: parsed.MCP_PUBLIC_URL ?? `http://localhost:${parsed.PORT}`,
  };
}

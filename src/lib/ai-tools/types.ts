import { z } from 'zod';

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function toolSuccess<T>(data: T, message?: string): ToolResult<T> {
  return { success: true, data, message };
}

export function toolError(error: string): ToolResult<never> {
  return { success: false, error };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodType;
  handler: (input: unknown, userId: string) => Promise<ToolResult>;
  requiresAuth: boolean;
  confirmationRequired: boolean;
}

export function getUserId(authUserId: string | null | undefined): string {
  return authUserId || DEMO_USER_ID;
}

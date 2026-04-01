export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  event: string;
  userId?: string;
  tool?: string;
  durationMs?: number;
  error?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

function emit(entry: LogEntry) {
  const line = JSON.stringify(entry);
  if (entry.level === 'error') {
    console.error(line);
  } else if (entry.level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function logRequest(userId: string, page?: string) {
  emit({
    level: 'info',
    event: 'assistant_request',
    userId,
    meta: { page },
    timestamp: new Date().toISOString(),
  });
}

export function logToolCall(
  userId: string,
  tool: string,
  success: boolean,
  durationMs: number,
  error?: string
) {
  emit({
    level: success ? 'info' : 'warn',
    event: 'tool_execution',
    userId,
    tool,
    durationMs,
    error,
    timestamp: new Date().toISOString(),
  });
}

export function logOpenAIError(userId: string, error: string) {
  emit({
    level: 'error',
    event: 'openai_error',
    userId,
    error,
    timestamp: new Date().toISOString(),
  });
}

export function logValidationError(userId: string, tool: string, error: string) {
  emit({
    level: 'warn',
    event: 'validation_error',
    userId,
    tool,
    error,
    timestamp: new Date().toISOString(),
  });
}

export function logResponse(userId: string, toolCount: number, durationMs: number) {
  emit({
    level: 'info',
    event: 'assistant_response',
    userId,
    durationMs,
    meta: { toolCallsExecuted: toolCount },
    timestamp: new Date().toISOString(),
  });
}

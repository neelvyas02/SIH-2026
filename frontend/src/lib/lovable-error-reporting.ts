export function reportLovableError(error: unknown, context?: Record<string, any>) {
  console.error("[Error Report]:", error, context);
}

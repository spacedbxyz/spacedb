import { z } from "zod";

export const pingOutputSchema = z.object({
  ok: z.literal(true),
  ts: z.number().int(),
});
export type PingOutput = z.infer<typeof pingOutputSchema>;

export const healthStatusSchema = z.enum(["ok", "error", "shutting_down"]);
export type HealthStatus = z.infer<typeof healthStatusSchema>;

export const healthCheckOutputSchema = z.object({
  status: healthStatusSchema,
  info: z.record(z.string(), z.unknown()).optional(),
  error: z.record(z.string(), z.unknown()).optional(),
  details: z.record(z.string(), z.unknown()),
});
export type HealthCheckOutput = z.infer<typeof healthCheckOutputSchema>;

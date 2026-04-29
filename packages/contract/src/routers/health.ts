import { oc } from "@orpc/contract";
import { z } from "zod";

const checkResultSchema = z.object({
  status: z.enum(["ok", "error", "shutting_down"]),
  info: z.record(z.string(), z.any()).optional(),
  error: z.record(z.string(), z.any()).optional(),
  details: z.record(z.string(), z.any()),
});

export const healthContract = {
  ping: oc
    .route({
      method: "GET",
      path: "/health/ping",
      summary: "Ping",
      tags: ["health"],
    })
    .output(
      z.object({
        ok: z.literal(true),
        ts: z.number().int(),
        correlationId: z.string().uuid(),
      }),
    ),
  liveness: oc
    .route({
      method: "GET",
      path: "/health/liveness",
      summary: "Liveness probe",
      tags: ["health"],
    })
    .output(checkResultSchema),
  readiness: oc
    .route({
      method: "GET",
      path: "/health/readiness",
      summary: "Readiness probe",
      tags: ["health"],
    })
    .output(checkResultSchema),
  check: oc
    .route({
      method: "GET",
      path: "/health/check",
      summary: "Aggregate health check",
      tags: ["health"],
    })
    .output(checkResultSchema),
};

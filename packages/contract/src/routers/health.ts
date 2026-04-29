import { oc } from "../builder.ts";
import {
  healthCheckOutputSchema,
  pingOutputSchema,
} from "../schemas/health.ts";

export const healthContract = {
  ping: oc
    .route({
      method: "GET",
      path: "/health/ping",
      summary: "Liveness ping with server timestamp",
      tags: ["Health"],
      operationId: "healthPing",
    })
    .output(pingOutputSchema),

  liveness: oc
    .route({
      method: "GET",
      path: "/health/liveness",
      summary: "Liveness probe",
      description: "Returns ok as long as the process is running.",
      tags: ["Health"],
      operationId: "healthLiveness",
    })
    .output(healthCheckOutputSchema),

  readiness: oc
    .route({
      method: "GET",
      path: "/health/readiness",
      summary: "Readiness probe",
      description:
        "Verifies downstream dependencies (database, disk) are reachable.",
      tags: ["Health"],
      operationId: "healthReadiness",
    })
    .output(healthCheckOutputSchema),
} as const;
export type HealthContract = typeof healthContract;

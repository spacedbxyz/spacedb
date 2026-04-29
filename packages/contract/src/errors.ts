import { z } from "zod";

export const errorMap = {
  UNAUTHORIZED: { message: "Unauthorized" },
  FORBIDDEN: { message: "Forbidden" },
  NOT_FOUND: { message: "Not found" },
  CONFLICT: { message: "Conflict" },
  VALIDATION: {
    message: "Validation failed",
    data: z.object({ issues: z.array(z.unknown()) }),
  },
} as const;

export type ErrorMap = typeof errorMap;

import { z } from "zod";

export const validationIssueSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
  code: z.string().optional(),
});
export type ValidationIssue = z.infer<typeof validationIssueSchema>;

export const validationErrorDataSchema = z.object({
  issues: z.array(validationIssueSchema),
});
export type ValidationErrorData = z.infer<typeof validationErrorDataSchema>;

export const errorMap = {
  BAD_REQUEST: { message: "Bad request" },
  UNAUTHORIZED: { message: "Unauthorized" },
  FORBIDDEN: { message: "Forbidden" },
  NOT_FOUND: { message: "Not found" },
  CONFLICT: { message: "Conflict" },
  VALIDATION: {
    message: "Validation failed",
    data: validationErrorDataSchema,
  },
  RATE_LIMITED: { message: "Too many requests" },
  INTERNAL_SERVER_ERROR: { message: "Internal server error" },
} as const;
export type ErrorMap = typeof errorMap;
export type ErrorCode = keyof ErrorMap;

import type {
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";

import type { contract } from "./contract.ts";

export { oc } from "./builder.ts";
export { contract, type Contract } from "./contract.ts";
export {
  errorMap,
  validationErrorDataSchema,
  validationIssueSchema,
  type ErrorCode,
  type ErrorMap,
  type ValidationErrorData,
  type ValidationIssue,
} from "./errors.ts";

export { authContract, type AuthContract } from "./routers/auth.ts";
export { healthContract, type HealthContract } from "./routers/health.ts";
export { usersContract, type UsersContract } from "./routers/users.ts";

export {
  loginInputSchema,
  registerInputSchema,
  sessionOutputSchema,
  type LoginInput,
  type RegisterInput,
  type SessionOutput,
} from "./schemas/auth.ts";
export {
  healthCheckOutputSchema,
  healthStatusSchema,
  pingOutputSchema,
  type HealthCheckOutput,
  type HealthStatus,
  type PingOutput,
} from "./schemas/health.ts";
export {
  userCreateInputSchema,
  userDisplayNameSchema,
  userEmailSchema,
  userIdSchema,
  userListOutputSchema,
  userPasswordSchema,
  userPublicSchema,
  userRoleSchema,
  userUpdateInputSchema,
  type UserCreateInput,
  type UserId,
  type UserListOutput,
  type UserPublic,
  type UserRole,
  type UserUpdateInput,
} from "./schemas/user.ts";

export type { ContractRouterClient } from "@orpc/contract";

export type ContractInputs = InferContractRouterInputs<typeof contract>;
export type ContractOutputs = InferContractRouterOutputs<typeof contract>;

import { authContract } from "./routers/auth.ts";
import { healthContract } from "./routers/health.ts";
import { usersContract } from "./routers/users.ts";

export const contract = {
  health: healthContract,
  users: usersContract,
  auth: authContract,
} as const;

export type Contract = typeof contract;

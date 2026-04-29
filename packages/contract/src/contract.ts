import { healthContract } from "./routers/health.js";

export const contract = {
  health: healthContract,
};

export type Contract = typeof contract;

import type {
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";

import type { contract } from "./contract.js";

export { contract, type Contract } from "./contract.js";
export { errorMap, type ErrorMap } from "./errors.js";
export { healthContract } from "./routers/health.js";
export type { ContractRouterClient } from "@orpc/contract";

export type ContractInputs = InferContractRouterInputs<typeof contract>;
export type ContractOutputs = InferContractRouterOutputs<typeof contract>;

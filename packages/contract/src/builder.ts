import { oc as ocBase } from "@orpc/contract";

import { errorMap } from "./errors.ts";

export const oc = ocBase.errors(errorMap);

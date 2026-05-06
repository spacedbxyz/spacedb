import { describe, expect, it } from "vitest";

import { contract } from "./contract.ts";

interface ProcedureLike {
  "~orpc": {
    route?: {
      method?: string;
      path?: string;
      operationId?: string;
    };
  };
}

const isProcedure = (value: unknown): value is ProcedureLike =>
  typeof value === "object" && value !== null && "~orpc" in value;

const flatten = (router: unknown): ProcedureLike[] => {
  const out: ProcedureLike[] = [];
  if (!router || typeof router !== "object") return out;
  for (const value of Object.values(router as Record<string, unknown>)) {
    if (isProcedure(value)) {
      out.push(value);
    } else if (value && typeof value === "object") {
      out.push(...flatten(value));
    }
  }
  return out;
};

describe("contract", () => {
  const procedures = flatten(contract);

  it("has procedures", () => {
    expect(procedures.length).toBeGreaterThan(0);
  });

  it("every procedure declares a method, path, and unique operationId", () => {
    const ids: string[] = [];
    for (const proc of procedures) {
      const route = proc["~orpc"].route;
      expect(route?.method).toMatch(/^(GET|POST|PATCH|PUT|DELETE)$/);
      expect(route?.path).toMatch(/^\//);
      expect(route?.operationId).toBeTruthy();
      if (route?.operationId) ids.push(route.operationId);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});

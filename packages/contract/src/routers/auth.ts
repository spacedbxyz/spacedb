import { z } from "zod";

import { oc } from "../builder.ts";
import {
  loginInputSchema,
  registerInputSchema,
  sessionOutputSchema,
} from "../schemas/auth.ts";
import { userPublicSchema } from "../schemas/user.ts";

export const authContract = {
  register: oc
    .route({
      method: "POST",
      path: "/auth/register",
      summary: "Register a new user account",
      description:
        "Creates a user, issues an access token (JWT) and a rotating refresh token (httpOnly cookie).",
      tags: ["Auth"],
      operationId: "authRegister",
    })
    .input(registerInputSchema)
    .output(sessionOutputSchema),

  login: oc
    .route({
      method: "POST",
      path: "/auth/login",
      summary: "Authenticate with email and password",
      description:
        "Verifies credentials, issues an access token (JWT) and a rotating refresh token (httpOnly cookie).",
      tags: ["Auth"],
      operationId: "authLogin",
    })
    .input(loginInputSchema)
    .output(sessionOutputSchema),

  refresh: oc
    .route({
      method: "POST",
      path: "/auth/refresh",
      summary: "Refresh the access token",
      description:
        "Reads the refresh token from the httpOnly cookie, rotates it, and returns a new access token. Reuse of a revoked token revokes the entire token family.",
      tags: ["Auth"],
      operationId: "authRefresh",
    })
    .output(sessionOutputSchema),

  logout: oc
    .route({
      method: "POST",
      path: "/auth/logout",
      summary: "Sign out the current session",
      description: "Revokes the refresh token and clears the cookie.",
      tags: ["Auth"],
      operationId: "authLogout",
    })
    .output(z.object({ ok: z.literal(true) })),

  me: oc
    .route({
      method: "GET",
      path: "/auth/me",
      summary: "Get the currently authenticated user",
      tags: ["Auth"],
      operationId: "authMe",
    })
    .output(userPublicSchema),
} as const;
export type AuthContract = typeof authContract;

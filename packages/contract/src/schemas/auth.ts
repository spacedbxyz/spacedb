import { z } from "zod";

import {
  userDisplayNameSchema,
  userEmailSchema,
  userPasswordSchema,
  userPublicSchema,
} from "./user.ts";

export const loginInputSchema = z.object({
  email: userEmailSchema,
  password: z.string().min(1).max(256),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z.object({
  email: userEmailSchema,
  password: userPasswordSchema,
  displayName: userDisplayNameSchema,
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const sessionOutputSchema = z.object({
  user: userPublicSchema,
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});
export type SessionOutput = z.infer<typeof sessionOutputSchema>;

import { z } from "zod";

const isoDateSchema = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString() : v),
  z.iso.datetime(),
);

export const userRoleSchema = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userIdSchema = z.uuid();
export type UserId = z.infer<typeof userIdSchema>;

export const userEmailSchema = z.email().toLowerCase();
export const userDisplayNameSchema = z.string().min(1).max(120);
export const userPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(256, "Password must be at most 256 characters");

export const userPublicSchema = z.object({
  id: userIdSchema,
  email: z.email(),
  displayName: userDisplayNameSchema,
  role: userRoleSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type UserPublic = z.infer<typeof userPublicSchema>;

export const userCreateInputSchema = z.object({
  email: userEmailSchema,
  displayName: userDisplayNameSchema,
  password: userPasswordSchema,
  role: userRoleSchema.optional(),
});
export type UserCreateInput = z.infer<typeof userCreateInputSchema>;

export const userUpdateInputSchema = z.object({
  email: userEmailSchema.optional(),
  displayName: userDisplayNameSchema.optional(),
  password: userPasswordSchema.optional(),
  role: userRoleSchema.optional(),
});
export type UserUpdateInput = z.infer<typeof userUpdateInputSchema>;

export const userListOutputSchema = z.object({
  items: z.array(userPublicSchema),
  nextCursor: z.string().min(1).max(512).nullable(),
});
export type UserListOutput = z.infer<typeof userListOutputSchema>;

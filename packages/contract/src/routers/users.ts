import { z } from "zod";

import { oc } from "../builder.ts";
import {
  userCreateInputSchema,
  userIdSchema,
  userListOutputSchema,
  userPublicSchema,
  userUpdateInputSchema,
} from "../schemas/user.ts";

const userIdParamSchema = z.object({ id: userIdSchema });

const paginationInputSchema = z.object({
  cursor: z.string().min(1).max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const usersContract = {
  list: oc
    .route({
      method: "GET",
      path: "/users",
      summary: "List users",
      description: "Cursor-paginated list of users. Admin only.",
      tags: ["Users"],
      operationId: "usersList",
    })
    .input(paginationInputSchema)
    .output(userListOutputSchema),

  get: oc
    .route({
      method: "GET",
      path: "/users/{id}",
      summary: "Get a user by id",
      tags: ["Users"],
      operationId: "usersGet",
    })
    .input(userIdParamSchema)
    .output(userPublicSchema),

  create: oc
    .route({
      method: "POST",
      path: "/users",
      summary: "Create a user",
      description: "Admin-only user provisioning.",
      tags: ["Users"],
      operationId: "usersCreate",
    })
    .input(userCreateInputSchema)
    .output(userPublicSchema),

  update: oc
    .route({
      method: "PATCH",
      path: "/users/{id}",
      summary: "Update a user",
      description: "Partial update; only provided fields are changed.",
      tags: ["Users"],
      operationId: "usersUpdate",
    })
    .input(userIdParamSchema.extend({ patch: userUpdateInputSchema }))
    .output(userPublicSchema),

  remove: oc
    .route({
      method: "DELETE",
      path: "/users/{id}",
      summary: "Delete a user",
      tags: ["Users"],
      operationId: "usersRemove",
    })
    .input(userIdParamSchema)
    .output(z.object({ ok: z.literal(true) })),
} as const;
export type UsersContract = typeof usersContract;

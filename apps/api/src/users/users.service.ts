import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { ORPCError } from '@orpc/server';
import { desc, eq, sql } from 'drizzle-orm';

import type { UserRole } from '@spacedb/contract';

import type { Database } from '../database/database.module';
import { type User, users } from '../database/schema';

const isUniqueViolation = (e: unknown): boolean =>
  typeof e === 'object' &&
  e !== null &&
  'code' in e &&
  (e as { code: string }).code === '23505';

type Cursor = { createdAt: string; id: string };

const encodeCursor = (row: { createdAt: Date; id: string }): string =>
  Buffer.from(
    JSON.stringify({ createdAt: row.createdAt.toISOString(), id: row.id }),
    'utf8',
  ).toString('base64url');

const decodeCursor = (cursor: string): Cursor =>
  JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Cursor;

@Injectable()
export class UsersService {
  constructor(
    private readonly txHost: TransactionHost<
      TransactionalAdapterDrizzleOrm<Database>
    >,
  ) {}

  async create(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    role?: UserRole;
  }): Promise<User> {
    try {
      const [row] = await this.txHost.tx
        .insert(users)
        .values({ ...input, email: input.email.toLowerCase() })
        .returning();
      return row;
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw new ORPCError('CONFLICT', {
          message: 'Email already registered',
        });
      }
      throw e;
    }
  }

  findById(id: string): Promise<User | undefined> {
    return this.txHost.tx.query.users.findFirst({ where: eq(users.id, id) });
  }

  findByEmail(email: string): Promise<User | undefined> {
    return this.txHost.tx.query.users.findFirst({
      where: eq(sql`lower(${users.email})`, email.toLowerCase()),
    });
  }

  async list({
    limit,
    cursor,
  }: {
    limit: number;
    cursor?: string;
  }): Promise<{ items: User[]; nextCursor: string | null }> {
    const decoded = cursor ? decodeCursor(cursor) : null;
    const where = decoded
      ? sql`(${users.createdAt}, ${users.id}) < (${decoded.createdAt}, ${decoded.id})`
      : undefined;
    const rows = await this.txHost.tx
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(limit + 1);
    const items = rows.slice(0, limit);
    const last = items[items.length - 1];
    const nextCursor = rows.length > limit && last ? encodeCursor(last) : null;
    return { items, nextCursor };
  }

  async update(
    id: string,
    patch: Partial<{
      email: string;
      displayName: string;
      role: UserRole;
      passwordHash: string;
    }>,
  ): Promise<User> {
    const values: Record<string, unknown> = { ...patch, updatedAt: new Date() };
    if (typeof values.email === 'string')
      values.email = values.email.toLowerCase();
    let row: User | undefined;
    try {
      [row] = await this.txHost.tx
        .update(users)
        .set(values)
        .where(eq(users.id, id))
        .returning();
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw new ORPCError('CONFLICT', {
          message: 'Email already registered',
        });
      }
      throw e;
    }
    if (!row) throw new ORPCError('NOT_FOUND', { message: 'User not found' });
    return row;
  }

  async remove(id: string): Promise<void> {
    const [row] = await this.txHost.tx
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    if (!row) throw new ORPCError('NOT_FOUND', { message: 'User not found' });
  }
}

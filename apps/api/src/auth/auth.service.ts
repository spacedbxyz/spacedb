import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

import { Injectable } from '@nestjs/common';
import { ConfigService, type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { ORPCError, os } from '@orpc/server';
import type { CookieOptions, Response } from 'express';
import { and, eq, isNull, lt } from 'drizzle-orm';

import type authConfig from '../config/auth.config';
import type { Database } from '../database/database.module';
import { refreshTokens } from '../database/schema';
import { type User, users } from '../database/schema';

import type { UserRole } from '@spacedb/contract';

import type { IssuedTokens, Principal } from './auth.types';

type Env = { auth: ConfigType<typeof authConfig> };

export const REFRESH_COOKIE_NAME = 'spacedb_refresh';
export const REFRESH_COOKIE_PATH = '/api/auth/refresh';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_SALT_LENGTH = 16;
const REFRESH_TOKEN_BYTES = 32;

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const sha256 = (input: string): string =>
  createHash('sha256').update(input).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly txHost: TransactionHost<
      TransactionalAdapterDrizzleOrm<Database>
    >,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async hashPassword(plaintext: string): Promise<string> {
    const salt = randomBytes(SCRYPT_SALT_LENGTH);
    const derived = await scryptAsync(plaintext, salt, SCRYPT_KEY_LENGTH);
    return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
  }

  async verifyPassword(plaintext: string, stored: string): Promise<boolean> {
    const [scheme, saltB64, hashB64] = stored.split('$');
    if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
    const salt = Buffer.from(saltB64, 'base64url');
    const expected = Buffer.from(hashB64, 'base64url');
    const derived = await scryptAsync(plaintext, salt, expected.length);
    return (
      derived.length === expected.length && timingSafeEqual(derived, expected)
    );
  }

  @Transactional()
  async register(input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<{ user: User; tokens: IssuedTokens }> {
    const email = input.email.toLowerCase();
    const existing = await this.txHost.tx.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true },
    });
    if (existing) {
      throw new ORPCError('CONFLICT', { message: 'Email already registered' });
    }
    const passwordHash = await this.hashPassword(input.password);
    const [user] = await this.txHost.tx
      .insert(users)
      .values({ email, passwordHash, displayName: input.displayName })
      .returning();
    const tokens = await this.issueTokens(user, randomUUID());
    return { user, tokens };
  }

  @Transactional()
  async login(input: {
    email: string;
    password: string;
  }): Promise<{ user: User; tokens: IssuedTokens }> {
    const found = await this.txHost.tx.query.users.findFirst({
      where: eq(users.email, input.email.toLowerCase()),
    });
    const ok =
      found && (await this.verifyPassword(input.password, found.passwordHash));
    if (!found || !ok) {
      if (!found) await this.hashPassword(input.password);
      throw new ORPCError('UNAUTHORIZED', { message: 'Invalid credentials' });
    }
    const [user] = await this.txHost.tx
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, found.id))
      .returning();
    const tokens = await this.issueTokens(user, randomUUID());
    return { user, tokens };
  }

  @Transactional()
  async refresh(
    plaintext: string,
  ): Promise<{ user: User; tokens: IssuedTokens }> {
    const tokenHash = sha256(plaintext);
    const stored = await this.txHost.tx.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
    });
    if (!stored)
      throw new ORPCError('UNAUTHORIZED', { message: 'Invalid refresh token' });
    if (stored.expiresAt < new Date())
      throw new ORPCError('UNAUTHORIZED', { message: 'Refresh token expired' });
    if (stored.revokedAt) {
      await this.txHost.tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokens.familyId, stored.familyId),
            isNull(refreshTokens.revokedAt),
          ),
        );
      throw new ORPCError('UNAUTHORIZED', { message: 'Refresh token reused' });
    }
    const user = await this.txHost.tx.query.users.findFirst({
      where: eq(users.id, stored.userId),
    });
    if (!user)
      throw new ORPCError('UNAUTHORIZED', { message: 'User no longer exists' });
    const tokens = await this.issueTokens(user, stored.familyId);
    await this.txHost.tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, stored.id));
    return { user, tokens };
  }

  async logout(plaintext: string | undefined): Promise<void> {
    if (!plaintext) return;
    await this.txHost.tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.tokenHash, sha256(plaintext)),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  async verifyAccessToken(token: string): Promise<Principal> {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        role: UserRole;
      }>(token);
      return { id: payload.sub, role: payload.role };
    } catch {
      throw new ORPCError('UNAUTHORIZED', { message: 'Invalid access token' });
    }
  }

  async purgeExpired(): Promise<void> {
    await this.txHost.tx
      .delete(refreshTokens)
      .where(lt(refreshTokens.expiresAt, new Date()));
  }

  setRefreshCookie(
    res: Response,
    plaintext: string,
    maxAgeSeconds: number,
  ): void {
    res.cookie(REFRESH_COOKIE_NAME, plaintext, {
      ...this.cookieOptions(),
      maxAge: maxAgeSeconds * 1000,
    });
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
  }

  readonly requireAuth = os
    .errors({ UNAUTHORIZED: { message: 'Unauthorized' } })
    .middleware(async ({ context, next, errors }) => {
      const req = (
        context as {
          request?: { headers: Record<string, string | string[] | undefined> };
        }
      ).request;
      const raw = req?.headers?.authorization;
      const header = Array.isArray(raw) ? raw[0] : raw;
      if (!header || !header.startsWith('Bearer ')) {
        throw errors.UNAUTHORIZED({ message: 'Missing access token' });
      }
      const principal = await this.verifyAccessToken(
        header.slice('Bearer '.length),
      );
      return next({ context: { currentUser: principal } });
    });

  requireRole(required: UserRole) {
    return os
      .$context<{ currentUser: Principal }>()
      .errors({ FORBIDDEN: { message: 'Forbidden' } })
      .middleware(({ context, next, errors }) => {
        if (context.currentUser.role !== required) {
          throw errors.FORBIDDEN({ message: 'Insufficient role' });
        }
        return next({ context });
      });
  }

  private cookieOptions(): CookieOptions {
    const cfg = this.config.get('auth', { infer: true });
    return {
      httpOnly: true,
      secure: cfg.cookieSecure,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      ...(cfg.cookieDomain ? { domain: cfg.cookieDomain } : {}),
    };
  }

  private async issueTokens(
    user: User,
    familyId: string,
  ): Promise<IssuedTokens> {
    const cfg = this.config.get('auth', { infer: true });
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { expiresIn: cfg.jwtAccessExpirySeconds },
    );
    const refreshPlaintext =
      randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    await this.txHost.tx.insert(refreshTokens).values({
      familyId,
      userId: user.id,
      tokenHash: sha256(refreshPlaintext),
      expiresAt: new Date(Date.now() + cfg.jwtRefreshExpirySeconds * 1000),
    });
    return {
      accessToken,
      accessExpiresIn: cfg.jwtAccessExpirySeconds,
      refreshPlaintext,
      refreshExpiresIn: cfg.jwtRefreshExpirySeconds,
    };
  }
}

import { Controller } from '@nestjs/common';
import { Implement, implement, ORPCError } from '@orpc/nest';

import { contract } from '@spacedb/contract';

import { UsersService } from '../users/users.service';

import { AuthService, REFRESH_COOKIE_NAME } from './auth.service';
import type { IssuedTokens } from './auth.types';
import type { User } from '../database/schema';

@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  private respond(
    res: import('express').Response,
    user: User,
    tokens: IssuedTokens,
  ) {
    this.auth.setRefreshCookie(
      res,
      tokens.refreshPlaintext,
      tokens.refreshExpiresIn,
    );
    return {
      user,
      accessToken: tokens.accessToken,
      expiresIn: tokens.accessExpiresIn,
    };
  }

  @Implement(contract.auth.register)
  register() {
    return implement(contract.auth.register).handler(
      async ({ context, input }) => {
        const { user, tokens } = await this.auth.register(input);
        return this.respond(context.request.res!, user, tokens);
      },
    );
  }

  @Implement(contract.auth.login)
  login() {
    return implement(contract.auth.login).handler(
      async ({ context, input }) => {
        const { user, tokens } = await this.auth.login(input);
        return this.respond(context.request.res!, user, tokens);
      },
    );
  }

  @Implement(contract.auth.refresh)
  refresh() {
    return implement(contract.auth.refresh).handler(async ({ context }) => {
      const cookies = (context.request as { cookies?: Record<string, string> })
        .cookies;
      const plaintext = cookies?.[REFRESH_COOKIE_NAME];
      if (!plaintext) {
        throw new ORPCError('UNAUTHORIZED', {
          message: 'Missing refresh token',
        });
      }
      try {
        const { user, tokens } = await this.auth.refresh(plaintext);
        return this.respond(context.request.res!, user, tokens);
      } catch (e) {
        this.auth.clearRefreshCookie(context.request.res!);
        throw e;
      }
    });
  }

  @Implement(contract.auth.logout)
  logout() {
    return implement(contract.auth.logout).handler(async ({ context }) => {
      const cookies = (context.request as { cookies?: Record<string, string> })
        .cookies;
      await this.auth.logout(cookies?.[REFRESH_COOKIE_NAME]);
      this.auth.clearRefreshCookie(context.request.res!);
      return { ok: true as const };
    });
  }

  @Implement(contract.auth.me)
  me() {
    return implement(contract.auth.me)
      .use(this.auth.requireAuth)
      .handler(async ({ context, errors }) => {
        const row = await this.users.findById(context.currentUser.id);
        if (!row) throw errors.NOT_FOUND({ message: 'User not found' });
        return row;
      });
  }
}

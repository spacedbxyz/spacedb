import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';

import { contract } from '@spacedb/contract';

import { AuthService } from '../auth/auth.service';

import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}

  @Implement(contract.users.list)
  list() {
    return implement(contract.users.list)
      .use(this.auth.requireAuth)
      .use(this.auth.requireRole('admin'))
      .handler(({ input }) => this.users.list(input));
  }

  @Implement(contract.users.get)
  get() {
    return implement(contract.users.get)
      .use(this.auth.requireAuth)
      .use(this.auth.requireRole('admin'))
      .handler(async ({ input, errors }) => {
        const row = await this.users.findById(input.id);
        if (!row) throw errors.NOT_FOUND({ message: 'User not found' });
        return row;
      });
  }

  @Implement(contract.users.create)
  create() {
    return implement(contract.users.create)
      .use(this.auth.requireAuth)
      .use(this.auth.requireRole('admin'))
      .handler(async ({ input }) => {
        const passwordHash = await this.auth.hashPassword(input.password);
        return this.users.create({
          email: input.email,
          displayName: input.displayName,
          role: input.role,
          passwordHash,
        });
      });
  }

  @Implement(contract.users.update)
  update() {
    return implement(contract.users.update)
      .use(this.auth.requireAuth)
      .use(this.auth.requireRole('admin'))
      .handler(async ({ input }) => {
        const { password, ...rest } = input.patch;
        const patch: Parameters<UsersService['update']>[1] = { ...rest };
        if (password)
          patch.passwordHash = await this.auth.hashPassword(password);
        return this.users.update(input.id, patch);
      });
  }

  @Implement(contract.users.remove)
  remove() {
    return implement(contract.users.remove)
      .use(this.auth.requireAuth)
      .use(this.auth.requireRole('admin'))
      .handler(async ({ input }) => {
        await this.users.remove(input.id);
        return { ok: true as const };
      });
  }
}

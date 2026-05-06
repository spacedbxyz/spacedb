import { eq } from 'drizzle-orm';
import request from 'supertest';

import { users } from '../src/database/schema';

import { bearerHeader, registerUser } from './setup/auth-helpers';
import { createTestApp, type TestApp } from './setup/test-app';

describe('Users (e2e)', () => {
  let ctx: TestApp;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  const seedAdmin = async () => {
    await registerUser(ctx.http, {
      email: 'admin@x.com',
      password: 'longenoughpw',
      displayName: 'Admin',
    });
    await ctx.db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, 'admin@x.com'));
    const res = await request(ctx.http)
      .post('/auth/login')
      .send({ email: 'admin@x.com', password: 'longenoughpw' })
      .expect(200);
    return { bearer: (res.body as { accessToken: string }).accessToken };
  };

  it('blocks unauthenticated and non-admin access to /users', async () => {
    await request(ctx.http).get('/users').expect(401);

    const reg = await registerUser(ctx.http, {
      email: 'plain@x.com',
      password: 'longenoughpw',
      displayName: 'Plain',
    });
    await request(ctx.http)
      .get('/users')
      .set(bearerHeader(reg.bearer))
      .expect(403);
  });

  it('admin can CRUD a user', async () => {
    const admin = await seedAdmin();
    const created = await request(ctx.http)
      .post('/users')
      .set(bearerHeader(admin.bearer))
      .send({
        email: 'new@x.com',
        password: 'longenoughpw',
        displayName: 'New',
      })
      .expect(200);
    const id = (created.body as { id: string }).id;

    await request(ctx.http)
      .get(`/users/${id}`)
      .set(bearerHeader(admin.bearer))
      .expect(200);

    await request(ctx.http)
      .patch(`/users/${id}`)
      .set(bearerHeader(admin.bearer))
      .send({ patch: { displayName: 'Renamed' } })
      .expect(200);

    await request(ctx.http)
      .delete(`/users/${id}`)
      .set(bearerHeader(admin.bearer))
      .expect(200);

    await request(ctx.http)
      .get(`/users/${id}`)
      .set(bearerHeader(admin.bearer))
      .expect(404);
  });

  it('admin can paginate the user list without duplicates', async () => {
    const admin = await seedAdmin();
    for (let i = 0; i < 14; i++) {
      await registerUser(ctx.http, {
        email: `u${String(i).padStart(2, '0')}@x.com`,
        password: 'longenoughpw',
        displayName: `u${i}`,
      });
    }

    const seen = new Set<string>();
    let cursor: string | null = null;
    do {
      const res = await request(ctx.http)
        .get('/users')
        .query({ limit: 5, ...(cursor ? { cursor } : {}) })
        .set(bearerHeader(admin.bearer))
        .expect(200);
      const body = res.body as {
        items: { id: string }[];
        nextCursor: string | null;
      };
      for (const item of body.items) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
      cursor = body.nextCursor;
    } while (cursor);

    expect(seen.size).toBe(15);
  });
});
